/** Incremental SSE framing; network chunks need not align with lines or UTF-8 characters. */
export async function* readSseData(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let data: string[] = [];
  const line = (value: string): string | undefined => {
    if (value === '') {
      if (!data.length) return;
      const event = data.join('\n'); data = []; return event;
    }
    if (value.startsWith('data:')) data.push(value.slice(5).replace(/^ /, ''));
  };
  try {
    let done = false;
    while (!done) {
      const next = await reader.read();
      done = next.done;
      buffer += done ? decoder.decode() : decoder.decode(next.value, { stream: true });
      for (;;) {
        const end = buffer.search(/[\r\n]/);
        if (end < 0 || (!done && end === buffer.length - 1 && buffer[end] === '\r')) break;
        const event = line(buffer.slice(0, end));
        const separator = buffer[end] === '\r' && buffer[end + 1] === '\n' ? 2 : 1;
        buffer = buffer.slice(end + separator);
        if (event !== undefined) yield event;
      }
    }
    // Some compatible endpoints close directly after the last data line.
    if (buffer) line(buffer);
    if (data.length) yield data.join('\n');
  } finally {
    try { await reader.cancel(); } catch { /* disconnected/aborted stream */ }
    reader.releaseLock();
  }
}
