import { checkEndpoint } from '../security/url';
import { ProviderError, explainFailure } from './chat';

export interface EmbedProfile { baseUrl: string; model: string; apiKey: string }

export async function embed(p: EmbedProfile, inputs: string[], signal: AbortSignal): Promise<number[][]> {
  const c = checkEndpoint(p.baseUrl);
  if (!c.ok) throw new ProviderError('config', c.reason!);
  if (!p.apiKey || !p.model.trim()) throw new ProviderError('config', 'Cần nhập key và model embedding.');
  let res: Response;
  try {
    res = await fetch(`${c.url}/embeddings`, {
      method: 'POST', redirect: 'error', signal, credentials: 'omit', referrerPolicy: 'no-referrer',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p.apiKey}` },
      body: JSON.stringify({ model: p.model, input: inputs }),
    });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw new ProviderError('abort', 'Đã hủy.');
    throw new ProviderError('network', 'Lỗi mạng chung (mạng, TLS, CORS hoặc endpoint).');
  }
  if (!res.ok) throw new ProviderError('http', explainFailure(res.status, await res.text().catch(() => ''), p.apiKey), res.status);
  const j = await res.json();
  const data = j.data as { embedding: number[]; index?: number }[] | undefined;
  if (!Array.isArray(data) || data.length !== inputs.length) throw new ProviderError('format', 'Phản hồi embedding không khớp số đoạn gửi.');
  return data.slice().sort((a, b) => (a.index ?? 0) - (b.index ?? 0)).map((d) => d.embedding);
}
