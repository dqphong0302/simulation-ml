import { literalMarkdown as literal, parseBackup, type Activity, type TeachingSession } from './session';
import { checkPortableSize } from '../core/reporting/portableJson';

export type PublicActivity = Omit<Activity, 'teacherNote'>;
export interface StudentPacket { kind: 'sml-student-handout'; version: 1; session: Omit<TeachingSession, 'activities'> & { activities: PublicActivity[] } }
export interface StudentWork { kind: 'sml-student-work'; version: 1; packet: StudentPacket; notes: string[]; reflection: string }
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const json = (raw: string): unknown => {
  checkPortableSize(raw);
  try { return JSON.parse(raw); } catch { throw new Error('Tệp không phải JSON hợp lệ.'); }
};
export function toStudentPacket(session: TeachingSession): StudentPacket {
  const clean = parseBackup(JSON.stringify({ version: 1, sessions: [session] })).sessions[0];
  return { kind: 'sml-student-handout', version: 1, session: { ...clean, activities: clean.activities.map(a => ({ id: a.id, title: a.title, minutes: a.minutes, resourceId: a.resourceId, task: a.task, evidence: a.evidence })) } };
}
export function parseStudentPacket(raw: string): StudentPacket {
  const value = json(raw);
  if (!record(value) || value.kind !== 'sml-student-handout' || value.version !== 1 || !record(value.session) || !Array.isArray(value.session.activities))
    throw new Error('Cần phiếu tương tác dành cho sinh viên; không dùng bản sao giáo án giảng viên.');
  const activities = value.session.activities.map(a => {
    if (!record(a) || Object.hasOwn(a, 'teacherNote')) throw new Error('Phiếu có trường ghi chú riêng giảng viên; hãy xuất lại đúng phiếu sinh viên.');
    return { ...a, teacherNote: '' };
  });
  const session = parseBackup(JSON.stringify({ version: 1, sessions: [{ ...value.session, activities }] })).sessions[0];
  return toStudentPacket(session);
}
export function makeStudentWork(packet: StudentPacket, notes: string[], reflection: string): StudentWork {
  return parseStudentWork(JSON.stringify({ kind: 'sml-student-work', version: 1, packet, notes, reflection }));
}
export function parseStudentWork(raw: string): StudentWork {
  const value = json(raw);
  if (!record(value) || value.kind !== 'sml-student-work' || value.version !== 1) throw new Error('Cần tệp bài thực hành sinh viên phiên bản 1.');
  const packet = parseStudentPacket(JSON.stringify(value.packet));
  if (!Array.isArray(value.notes) || value.notes.length !== packet.session.activities.length ||
    value.notes.some(note => typeof note !== 'string' || note.length > 4000) || typeof value.reflection !== 'string' || value.reflection.length > 4000)
    throw new Error('Ghi chép cần đúng số hoạt động; mỗi phần tối đa 4.000 ký tự.');
  return { kind: 'sml-student-work', version: 1, packet, notes: value.notes as string[], reflection: value.reflection };
}
export function studentWorkMarkdown(work: StudentWork) {
  const clean = makeStudentWork(work.packet, work.notes, work.reflection);
  return `# ${literal(clean.packet.session.title)}\n\nBài thực hành nhóm · Không nhập định danh cá nhân\n\n## Mục tiêu\n${literal(clean.packet.session.outcomes)}\n\n` +
    clean.packet.session.activities.map((a, i) => `## ${i + 1}. ${literal(a.title)}\n\nNhiệm vụ: ${literal(a.task)}\n\nSản phẩm mong đợi: ${literal(a.evidence)}\n\nGhi chép / bằng chứng của nhóm:\n${literal(clean.notes[i]) || '(Chưa ghi)'}\n\n`).join('') +
    `## Tự nhận xét & câu hỏi tiếp theo\n${literal(clean.reflection) || '(Chưa ghi)'}\n\nĐây là bản xuất ghi chép, không tự nộp bài, chấm điểm hay xác nhận hoàn thành môn học.\n`;
}
