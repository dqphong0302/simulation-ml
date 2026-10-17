import { checkEndpoint, redact } from '../security/url';
import { ProviderError, responseFailure } from './errors';
import { readSseData } from './sse';
export { ProviderError } from './errors';

export interface ChatProfile { label: string; baseUrl: string; model: string; apiKey: string; temperature: number; topP: number; maxTokens: number; stream: boolean }
export interface Msg { role: 'system' | 'user' | 'assistant'; content: string }
export interface ChatResult { text: string; ms: number; usage?: { prompt?: number; completion?: number; total?: number } }

export function chatUrl(base: string): string {
  const c = checkEndpoint(base);
  if (!c.ok) throw new ProviderError('config', c.reason!);
  return `${c.url}/chat/completions`;
}

export function buildPayload(p: ChatProfile, messages: Msg[]) {
  return { model: p.model, messages, temperature: p.temperature, top_p: p.topP, max_tokens: p.maxTokens, stream: p.stream };
}

/** Bản xem trước payload (đã che key) trước khi gửi. */
export function previewRequest(p: ChatProfile, messages: Msg[]): string {
  let url = '(URL chưa hợp lệ)';
  try { url = chatUrl(p.baseUrl); } catch { /* giữ thông báo */ }
  return redact(`POST ${url}\nAuthorization: Bearer ${p.apiKey ? '***' : '(chưa nhập key)'}\nContent-Type: application/json\n\n${JSON.stringify(buildPayload(p, messages), null, 2)}`, p.apiKey);
}

export function explainFailure(status: number | undefined, body: string, key: string): string {
  const b = redact(body, key).slice(0, 300);
  if (status === 401 || status === 403) return `Máy chủ từ chối (${status}): kiểm tra key và quyền. ${b}`;
  if (status === 404) return `Không tìm thấy (404): kiểm tra base URL và tên model. ${b}`;
  if (status === 429) return `Vượt hạn mức (429): chờ rồi thử lại hoặc kiểm tra quota. ${b}`;
  return `Lỗi HTTP ${status}. ${b}`;
}

/** Gửi một yêu cầu; không tự retry, không theo redirect sang đích khác, không dùng no-cors. */
export async function chat(p: ChatProfile, messages: Msg[], onDelta: (t: string) => void, signal: AbortSignal): Promise<ChatResult> {
  const url = chatUrl(p.baseUrl);
  if (!p.apiKey) throw new ProviderError('config', 'Chưa nhập API key.');
  if (!p.model.trim()) throw new ProviderError('config', 'Chưa nhập tên model.');
  const t0 = performance.now();
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST', redirect: 'error', signal, credentials: 'omit', referrerPolicy: 'no-referrer',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p.apiKey}` },
      body: JSON.stringify(buildPayload(p, messages)),
    });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw new ProviderError('abort', 'Đã dừng yêu cầu. Nhà cung cấp có thể vẫn tính phí phần đã xử lý.');
    throw new ProviderError('network', 'Lỗi mạng chung. Có thể do mạng, TLS, CORS hoặc endpoint sai; trình duyệt không cho biết chính xác nguyên nhân. Hãy kiểm tra các mục này, đừng kết luận chắc chắn là sai key.');
  }
  if (!res.ok) throw new ProviderError('http', explainFailure(res.status, await res.text().catch(() => ''), p.apiKey), res.status);

  let text = '';
  let usage: ChatResult['usage'];
  const readUsage = (u: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined) => {
    if (u) usage = { prompt: u.prompt_tokens, completion: u.completion_tokens, total: u.total_tokens };
  };
  try {
    if (p.stream && res.body) {
      let received = false;
      for await (const data of readSseData(res.body)) {
        if (data.trim() === '[DONE]') break;
        const j = JSON.parse(data);
        if (!j || typeof j !== 'object' || j.error || !Array.isArray(j.choices)) throw new ProviderError('format', 'Luồng không đúng định dạng Chat Completions.');
        received = true;
        const d = j.choices[0]?.delta?.content;
        if (d !== undefined && d !== null && typeof d !== 'string') throw new ProviderError('format', 'Nội dung streaming không phải văn bản.');
        if (typeof d === 'string') { text += d; onDelta(d); }
        readUsage(j.usage);
      }
      if (!received) throw new ProviderError('format', 'Luồng không có phản hồi Chat Completions.');
    } else {
      const j = await res.json();
      text = j.choices?.[0]?.message?.content;
      if (typeof text !== 'string') throw new ProviderError('format', 'Phản hồi không đúng định dạng Chat Completions.');
      readUsage(j.usage);
      onDelta(text);
    }
  } catch (e) {
    throw responseFailure(e);
  }
  return { text, ms: Math.round(performance.now() - t0), usage };
}
