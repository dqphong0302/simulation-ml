import { useSyncExternalStore } from 'react';
import type { ChatProfile } from '../providers/chat';
import { PERSIST_KEY, PROFILES_KEY, profilesWithoutKeys, restoreProfiles, type Profiles } from './profiles';

/** Key chỉ nằm trong biến module (bộ nhớ phiên); không bao giờ qua storage, export hay serialize. */
type Session = Profiles;
const base: ChatProfile = { label: 'Cấu hình A', baseUrl: '', model: '', apiKey: '', temperature: 0.7, topP: 1, maxTokens: 512, stream: true };
let session: Session = { chatA: { ...base }, chatB: { ...base, label: 'Cấu hình B' }, embed: { baseUrl: '', model: '', apiKey: '' } };
const subs = new Set<() => void>();
export const getSessionSnapshot = (): Session => session;
const notify = () => subs.forEach(f => f());

/** Chỉ endpoint/model/tham số được nhớ cục bộ (nếu người học bật), tuyệt đối không có key. */
export function loadProfilesWithoutKeys(): void {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) return;
    session = restoreProfiles(raw, session);
    notify();
  } catch { /* bỏ qua */ }
}
function saveNoKeys(): void {
  try {
    if (localStorage.getItem(PERSIST_KEY) !== '1') return;
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profilesWithoutKeys(session)));
  } catch { /* bỏ qua */ }
}

export function setSession<K extends keyof Session>(k: K, v: Session[K]): void {
  const old = session[k];
  const next = { ...v };
  // Đổi endpoint thì không mang key cũ sang.
  if (old.baseUrl !== next.baseUrl && next.apiKey === old.apiKey) next.apiKey = '';
  session = { ...session, [k]: next };
  saveNoKeys();
  notify();
}
export function clearKeys(): void {
  session = { chatA: { ...session.chatA, apiKey: '' }, chatB: { ...session.chatB, apiKey: '' }, embed: { ...session.embed, apiKey: '' } };
  notify();
}
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
export const useSession = (): Session => useSyncExternalStore(subscribe, getSessionSnapshot);
