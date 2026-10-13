export interface UrlCheck { ok: boolean; reason?: string; url?: string }

/** Chỉ HTTPS (hoặc http cho localhost), không thông tin đăng nhập, không query/hash chứa bí mật. */
export function checkEndpoint(raw: string): UrlCheck {
  let u: URL;
  try { u = new URL(raw.trim()); } catch { return { ok: false, reason: 'URL không hợp lệ.' }; }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname);
  if (u.protocol !== 'https:' && !(u.protocol === 'http:' && local)) return { ok: false, reason: 'Chỉ chấp nhận HTTPS (http chỉ cho localhost).' };
  if (u.username || u.password) return { ok: false, reason: 'URL không được chứa tên đăng nhập/mật khẩu.' };
  if (u.search) return { ok: false, reason: 'URL không được chứa query (không đặt key trong URL).' };
  if (u.hash) return { ok: false, reason: 'URL không được chứa fragment.' };
  return { ok: true, url: u.toString().replace(/\/+$/, '') };
}

export function redact(text: string, key: string): string {
  let out = text.replace(/Bearer\s+[A-Za-z0-9._\-]+/g, 'Bearer ***');
  if (key) out = out.split(key).join('***');
  return out;
}
