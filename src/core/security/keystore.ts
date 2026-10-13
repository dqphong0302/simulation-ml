import { useSyncExternalStore } from 'react';
import type { ChatProfile } from '../providers/chat';
import type { EmbedProfile } from '../providers/embed';

/** Key chỉ nằm trong biến module (bộ nhớ phiên); không bao giờ qua storage, export hay serialize. */
interface Session { chatA: ChatProfile; chatB: ChatProfile; embed: EmbedProfile }
const NOKEY = 'sml.profiles';
const base: ChatProfile = { label: 'Cấu hình A', baseUrl: '', model: '', apiKey: '', temperature: 0.7, topP: 1, maxTokens: 512, stream: true };
let session: Session = { chatA: { ...base }, chatB: { ...base, label: 'Cấu hình B' }, embed: { baseUrl: '', model: '', apiKey: '' } };
const subs = new Set<() => void>();

/** Chỉ endpoint/model/tham số được nhớ cục bộ (nếu người học bật), tuyệt đối không có key. */
export function loadProfilesWithoutKeys(): void {
  try {
    const raw = localStorage.getItem(NOKEY);
    if (!raw) return;
    const p = JSON.parse(raw);
    for (const k of ['chatA', 'chatB'] as const) if (p[k]) session[k] = { ...session[k], ...p[k], apiKey: '' };
    if (p.embed) session.embed = { ...session.embed, ...p.embed, apiKey: '' };
    session = { ...session };
  } catch { /* bỏ qua */ }
}
function saveNoKeys(): void {
  try {
    if (localStorage.getItem('sml.persist') !== '1') return;
    const strip = <T extends { apiKey: string }>(o: T) => ({ ...o, apiKey: '' });
    localStorage.setItem(NOKEY, JSON.stringify({ chatA: strip(session.chatA), chatB: strip(session.chatB), embed: strip(session.embed) }));
  } catch { /* bỏ qua */ }
}

export function setSession<K extends keyof Session>(k: K, v: Session[K]): void {
  const old = session[k] as { baseUrl: string };
  const next = v as { baseUrl: string; apiKey: string };
  // Đổi endpoint thì không mang key cũ sang.
  if (old.baseUrl !== next.baseUrl && next.apiKey === (old as unknown as { apiKey: string }).apiKey) next.apiKey = '';
  session = { ...session, [k]: v };
  saveNoKeys();
  subs.forEach((f) => f());
}
export function clearKeys(): void {
  session = { chatA: { ...session.chatA, apiKey: '' }, chatB: { ...session.chatB, apiKey: '' }, embed: { ...session.embed, apiKey: '' } };
  subs.forEach((f) => f());
}
export const useSession = (): Session => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => session);
