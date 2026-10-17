import { afterEach, describe, expect, it, vi } from 'vitest';
import { chat, type ChatProfile } from '../src/core/providers/chat';
import { embed } from '../src/core/providers/embed';

const profile: ChatProfile = { label: 'Test', baseUrl: 'https://example.test/v1', model: 'test', apiKey: 'test-key', temperature: 0.7, topP: 1, maxTokens: 100, stream: true };
const signal = () => new AbortController().signal;
const streamResponse = (parts: string[]) => new Response(new ReadableStream({ start(controller) {
  parts.forEach(part => controller.enqueue(new TextEncoder().encode(part))); controller.close();
} }), { headers: { 'Content-Type': 'text/event-stream' } });
afterEach(() => vi.unstubAllGlobals());

describe('Chat Completions transport', () => {
  it('keeps the final SSE event at EOF, even without a trailing newline', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(streamResponse(['data: {"choices":[{"delta":{"content":"Xin "}}]}\n\n', 'data: {"choices":[{"delta":{"content":"chào"}}]}'])));
    const delta = vi.fn();
    expect((await chat(profile, [], delta, signal())).text).toBe('Xin chào');
    expect(delta.mock.calls.flat().join('')).toBe('Xin chào');
  });
  it('supports CRLF split across chunks and stops at DONE', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(streamResponse(['data: {"choices":[{"delta":{"content":"A"}}]}\r', '\n\r\ndata: [DONE]\r\n\r\n', 'data: {"choices":[{"delta":{"content":"B"}}]}\n\n'])));
    expect((await chat(profile, [], () => {}, signal())).text).toBe('A');
  });
  it('reports provider error envelopes rather than a successful empty answer', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(streamResponse(['data: {"error":{"message":"failed test-key"}}\n\n'])));
    await expect(chat(profile, [], () => {}, signal())).rejects.toMatchObject({ kind: 'format' });
  });
  it('validates non-streaming data and redacts HTTP errors', async () => {
    const request = vi.fn().mockResolvedValueOnce(Response.json({ choices: [{ message: { content: 'ok' } }], usage: { total_tokens: 2 } }))
      .mockResolvedValueOnce(new Response('test-key denied', { status: 401 }));
    vi.stubGlobal('fetch', request);
    expect(await chat({ ...profile, stream: false }, [], () => {}, signal())).toMatchObject({ text: 'ok', usage: { total: 2 } });
    await expect(chat(profile, [], () => {}, signal())).rejects.toMatchObject({ kind: 'http', status: 401, message: expect.not.stringContaining('test-key') });
    expect(request.mock.calls[0][1]).toMatchObject({ redirect: 'error', credentials: 'omit', referrerPolicy: 'no-referrer' });
  });
  it('decodes UTF-8 split inside a multibyte character', async () => {
    const bytes = new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Y khoa 🩺"}}]}\n\n');
    const body = new ReadableStream<Uint8Array>({ start(controller) { for (const byte of bytes) controller.enqueue(new Uint8Array([byte])); controller.close(); } });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body)));
    expect((await chat(profile, [], () => {}, signal())).text).toBe('Y khoa 🩺');
  });
  it('keeps a typed cancellation error during body streaming', async () => {
    const body = new ReadableStream<Uint8Array>({ start(controller) { controller.error(new DOMException('Aborted', 'AbortError')); } });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body)));
    await expect(chat(profile, [], () => {}, signal())).rejects.toMatchObject({ kind: 'abort' });
  });
});

describe('Embedding response contract', () => {
  it('restores input order using a complete unique index set', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ data: [{ index: 1, embedding: [0, 1] }, { index: 0, embedding: [1, 0] }] })));
    expect(await embed(profile, ['a', 'b'], signal())).toEqual([[1, 0], [0, 1]]);
  });
  it.each([
    { data: [{ index: 0, embedding: [1] }, { index: 0, embedding: [2] }] },
    { data: [{ index: 0, embedding: [1] }, { index: 2, embedding: [2] }] },
    { data: [{ index: 0, embedding: [1] }, { index: 1, embedding: [2, 3] }] },
    { data: [{ index: 0, embedding: [] }, { index: 1, embedding: [] }] },
    { data: [{ index: 0, embedding: ['1'] }, { index: 1, embedding: [2] }] },
    { data: [null, null] },
  ])('rejects invalid vectors/indexes: %j', async data => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(data)));
    await expect(embed(profile, ['a', 'b'], signal())).rejects.toMatchObject({ kind: 'format' });
  });
  it('maps malformed JSON to a typed format error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not-json')));
    await expect(embed(profile, ['a'], signal())).rejects.toMatchObject({ kind: 'format' });
  });
});
