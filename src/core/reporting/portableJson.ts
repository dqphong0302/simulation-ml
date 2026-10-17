export const PORTABLE_JSON_BYTES = 1_000_000;
const bytes = (raw: string) => new TextEncoder().encode(raw).byteLength;
export function checkPortableSize(raw: string) {
  if (raw.length > PORTABLE_JSON_BYTES || bytes(raw) > PORTABLE_JSON_BYTES) throw new Error('Tệp vượt giới hạn 1 MB (UTF-8).');
}
/** Prefer readable JSON, but never export a backup that our own importer must reject. */
export function portableJson(value: unknown): string {
  const compact = JSON.stringify(value);
  if (compact === undefined) throw new Error('Nội dung không phải JSON.');
  checkPortableSize(compact);
  const pretty = JSON.stringify(value, null, 2);
  return bytes(pretty) <= PORTABLE_JSON_BYTES ? pretty : compact;
}
