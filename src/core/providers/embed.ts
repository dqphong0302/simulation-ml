import { checkEndpoint } from '../security/url';
import { ProviderError, explainFailure } from './chat';
import { responseFailure } from './errors';

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
  try { return parseEmbeddings(await res.json(), inputs.length); }
  catch (e) { throw responseFailure(e); }
}

/** A unique index is required: array order alone cannot prove which text a vector belongs to. */
export function parseEmbeddings(value: unknown, count: number): number[][] {
  const fail = () => new ProviderError('format', 'Phản hồi embedding cần đủ chỉ số duy nhất và vector số hữu hạn, cùng số chiều.');
  if (!value || typeof value !== 'object' || !('data' in value) || !Array.isArray(value.data) || value.data.length !== count) throw fail();
  const ordered: number[][] = new Array(count);
  let dimensions: number | undefined;
  for (const row of value.data) {
    if (!row || typeof row !== 'object' || !Number.isInteger(row.index) || row.index < 0 || row.index >= count || ordered[row.index] ||
      !Array.isArray(row.embedding) || !row.embedding.length || row.embedding.some((n: unknown) => typeof n !== 'number' || !Number.isFinite(n))) throw fail();
    dimensions ??= row.embedding.length;
    if (row.embedding.length !== dimensions) throw fail();
    ordered[row.index] = row.embedding;
  }
  return ordered;
}
