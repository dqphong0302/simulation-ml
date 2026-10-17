import { MAX_SESSIONS, type TeachingSession } from './session';

/** Optimistic conflict detection for a stale draft opened in another tab. No silent overwrite. */
export function mergeSession(latest: TeachingSession[], draft: TeachingSession, baseline: string) {
  const current = latest.find(session => session.id === draft.id);
  if (baseline && (!current || JSON.stringify(current) !== baseline)) throw new Error('Bản lưu đã thay đổi ở tab khác. Tải giáo án đang sửa để giữ bản nháp, rồi mở lại bản mới nhất trước khi sửa tiếp.');
  if (!current && latest.length >= MAX_SESSIONS) throw new Error('Đã có 30 buổi; sao lưu và dùng một bản đã lưu để sửa, hoặc nhập bản sao gọn hơn trên trình duyệt khác.');
  return [...latest.filter(session => session.id !== draft.id), draft];
}
