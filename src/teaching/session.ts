import { resourceById, STATION_GROUPS } from './catalog';
import { GUIDES } from '../learning/guides';
import { checkPortableSize } from '../core/reporting/portableJson';

export const SESSION_KEY = 'sml.teaching.sessions.v1';
export const MAX_SESSIONS = 30;
export interface Activity { id: string; title: string; minutes: number; resourceId: string; task: string; evidence: string; teacherNote: string }
export interface TeachingSession { id: string; title: string; groupId: string; outcomes: string; groupSize: number; activities: Activity[] }
export interface SessionBackup { version: 1; sessions: TeachingSession[] }
const text = (value: unknown, max: number) => typeof value === 'string' && value.length <= max;
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const validId = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value);

/** Strict, atomic import: never execute imported HTML, URLs, scripts or resource ids. */
export function parseBackup(raw: string): SessionBackup {
  checkPortableSize(raw);
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error('Bản sao không phải JSON hợp lệ.'); }
  if (!record(value) || value.version !== 1 || !Array.isArray(value.sessions) || !value.sessions.length || value.sessions.length > MAX_SESSIONS)
    throw new Error('Cần bản sao phiên bản 1, chứa 1–30 buổi học.');
  const ids = new Set<string>();
  const sessions = value.sessions.map((s): TeachingSession => {
    if (!record(s) || !validId(s.id) || ids.has(s.id) || !text(s.title, 160) || !(s.title as string).trim() ||
      !STATION_GROUPS.some(g => g.id === s.groupId) || !text(s.outcomes, 4000) || !(s.outcomes as string).trim() ||
      !Number.isInteger(s.groupSize) || (s.groupSize as number) < 1 || (s.groupSize as number) > 12 ||
      !Array.isArray(s.activities) || !s.activities.length || s.activities.length > 12)
      throw new Error('Buổi học không hợp lệ: kiểm tra tên, nhóm, sĩ số nhóm (1–12), hoặc số hoạt động (1–12).');
    ids.add(s.id);
    const activityIds = new Set<string>();
    const activities = s.activities.map((a): Activity => {
      if (!record(a) || !validId(a.id) || activityIds.has(a.id) || !text(a.title, 160) || !(a.title as string).trim() ||
        !Number.isInteger(a.minutes) || (a.minutes as number) < 1 || (a.minutes as number) > 180 ||
        typeof a.resourceId !== 'string' || !resourceById(a.resourceId) ||
        !text(a.task, 4000) || !(a.task as string).trim() || !text(a.evidence, 4000) || !(a.evidence as string).trim() || !text(a.teacherNote, 4000))
        throw new Error('Hoạt động cần tên, nhiệm vụ, sản phẩm, thời gian 1–180 phút và học liệu có trong trạm.');
      activityIds.add(a.id);
      return { id: a.id, title: a.title as string, minutes: a.minutes as number, resourceId: a.resourceId, task: a.task as string, evidence: a.evidence as string, teacherNote: a.teacherNote as string };
    });
    return { id: s.id, title: s.title as string, groupId: s.groupId as string, outcomes: s.outcomes as string, groupSize: s.groupSize as number, activities };
  });
  return { version: 1, sessions };
}
export function makeSession(groupId = 'data', id: string = crypto.randomUUID()): TeachingSession {
  const group = STATION_GROUPS.find(g => g.id === groupId) ?? STATION_GROUPS[2];
  const resourceId = defaultResourceId(group.id);
  return makeResourceSession(resourceId, id);
}
export function defaultResourceId(groupId: string) {
  const group = STATION_GROUPS.find(g => g.id === groupId) ?? STATION_GROUPS[2];
  return group.resourceIds.find(id => !['DATASETS', 'LEARNING', 'PROJECT'].includes(id)) ?? group.resourceIds[0];
}
export function makeResourceSession(resourceId: string, id: string = crypto.randomUUID(), experimentOverride?: readonly string[]): TeachingSession {
  const group = STATION_GROUPS.find(g => g.resourceIds.includes(resourceId));
  if (!group) throw new Error('Học liệu chưa có trong một nhóm của trạm.');
  const resource = resourceById(resourceId)!;
  const extras: Record<string, readonly string[]> = {
    LEARNING: ['Chọn một thử thách ở Góc tò mò; dự đoán đáp án trước khi chọn.', 'Thử ba câu hỏi về dữ liệu, AI và Python. Chọn một đáp án và đọc phản hồi.', 'Ghi một dự đoán ban đầu và điều khiến bạn thay đổi cách nghĩ.', 'Giải thích một điều vừa học cho bạn cùng nhóm; chọn một bài muốn học tiếp.'],
    DATASETS: ['Dự đoán: một tệp có nhiều sheet thì bảng nào mới là dữ liệu cần phân tích?', 'Dùng tệp mẫu do giảng viên cung cấp, không dùng hồ sơ người thật. Mở Nhập dữ liệu, chọn sheet (nếu có), xem tên cột và dòng đầu; chưa bấm áp dụng trước khi kiểm tra.', 'Ghi số dòng/cột, đơn vị quan sát, cột số/chữ/nhãn và giới hạn đang áp dụng. Nếu lấy mẫu, ghi cả số dòng gốc và số dòng dùng.', 'Sau khi xác nhận và bấm Dùng dữ liệu này, mở EDA. Giải thích vì sao nhận được tệp chưa đồng nghĩa mọi mô hình đều phù hợp với bảng.'],
    PYTHON: [
    'Dự đoán kết quả của print(sum([10, 15, 15, 20])). Các số là phút ôn bài giả lập.',
    'Tải notebook Python buổi 1 và mở trên Colab. Thêm một code cell mới dưới phần danh sách:\nphut = [10, 15, 15, 20]\nprint(sum(phut))\nChạy cell, rồi chỉ thay một số trong danh sách và chạy lại.',
    'Ghi code trước/sau, đầu ra và điều bạn đã đổi. Nếu gặp lỗi, ghi nguyên thông báo trước khi sửa.',
    'Giải thích vì sao kết quả thay đổi; chỉ ra tên biến, giá trị và thao tác. Không đưa dữ liệu người thật vào notebook.',
    ],
  };
  const guide = GUIDES[resourceId];
  const experiment = experimentOverride ?? guide?.experiment ?? extras[resourceId];
  if (!experiment || experiment.length !== 4) throw new Error('Học liệu cần đủ bốn bước hướng dẫn trước khi tạo buổi học.');
  const discussionNote = guide ? guide.questions.map(q => `${q.prompt}\nGợi ý: ${q.options[q.answer]}. ${q.explanation}`).join('\n\n') : 'Yêu cầu người học giải thích thao tác bằng lời của mình, không chỉ đọc đầu ra.';
  return { id, title: `Buổi thực hành · ${resource.title.split(':')[0]}`, groupId: group.id, outcomes: resource.outcome, groupSize: 4, activities: [
    { id: 'warmup', title: 'Dự đoán trước khi thử', minutes: 5, resourceId, task: experiment[0], evidence: 'Một câu dự đoán và lý do.', teacherNote: 'Cho phép câu trả lời sai; chưa công bố kết quả trước khi nhóm thử.' },
    { id: 'explore', title: 'Thử và ghi bằng chứng', minutes: 25, resourceId, task: `${experiment[1]}\n${experiment[2]}`, evidence: 'Ghi rõ đầu vào, điều đã thay đổi, kết quả và một ảnh chụp/đoạn code phù hợp.', teacherNote: 'Nhắc dùng dữ liệu mẫu. Với so sánh mô hình, không thay đồng thời cách chia tập và tham số rồi quy kết nguyên nhân.' },
    { id: 'share', title: 'Giải thích & phản biện', minutes: 10, resourceId, task: `${experiment[3]}\nNhóm khác đặt một câu hỏi về bằng chứng hoặc giới hạn.`, evidence: 'Một kết luận có bằng chứng và một giới hạn.', teacherNote: `${discussionNote}\nKhông chuyển kết quả lab thành khuyến cáo điều trị.` },
    { id: 'exit', title: 'Phiếu ra về', minutes: 5, resourceId, task: 'Mỗi người viết: điều đã hiểu, điều còn băn khoăn và một việc muốn thử tiếp.', evidence: 'Ba câu ngắn; không ghi tên hoặc thông tin bệnh nhân vào trạm.', teacherNote: 'Đánh giá mức hiểu bằng lập luận, không chỉ điểm số đẹp.' },
  ] };
}
export const totalMinutes = (session: TeachingSession) => session.activities.reduce((total, a) => total + a.minutes, 0);
// Literal Markdown text: imported/user content cannot inject links/images in exports.
export const literalMarkdown = (value: string) => value.replace(/\\/g, '\\\\').replace(/([`*_{}[\]()<>!#|])/g, '\\$1');
const literal = literalMarkdown;
export function sessionMarkdown(session: TeachingSession, audience: 'teacher' | 'student', origin: string) {
  const url = new URL(origin);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Địa chỉ trạm phải dùng HTTP hoặc HTTPS.');
  const base = url.origin;
  const link = (id: string) => `${base}/${resourceById(id)!.href}`;
  return `# ${literal(session.title)}\n\n${audience === 'teacher' ? 'Giáo án giảng viên' : 'Phiếu thực hành nhóm'} · ${totalMinutes(session)} phút · ${session.groupSize} người/nhóm (gợi ý)\n\n` +
    `## Mục tiêu\n${literal(session.outcomes)}\n\n## Tổ chức nhóm\nPhân vai linh hoạt: thao tác, quan sát/ghi chép, phản biện, trình bày; nhóm ít người có thể kiêm vai. Luân phiên vai ở hoạt động tiếp theo.\n\n` +
    '## Chuẩn bị & an toàn\nDùng dữ liệu mẫu hoặc được phép; không nhập tên, mã sinh viên hay hồ sơ bệnh nhân vào trạm. Liên kết trỏ tới địa chỉ xuất phiếu; nếu đó là localhost, người học cần máy đang phục vụ ứng dụng hoặc một địa chỉ triển khai truy cập được.\n\n' +
    session.activities.map((a, i) => `## ${i + 1}. ${literal(a.title)} · ${a.minutes} phút\n\nHọc liệu: [${literal(resourceById(a.resourceId)!.title)}](${link(a.resourceId)})\n\nĐiều kiện: ${literal(resourceById(a.resourceId)!.requirement)}\n\nNhiệm vụ: ${literal(a.task)}\n\nSản phẩm: ${literal(a.evidence)}\n\n` +
      (audience === 'teacher' ? `Ghi chú riêng giảng viên: ${literal(a.teacherNote)}\n\n` : 'Ghi chép nhóm:\n\n- Dự đoán:\n- Kết quả quan sát:\n- Giải thích:\n- Giới hạn / câu hỏi:\n\n')).join('') +
    '## Tiêu chí thảo luận\n- Nêu đúng dữ liệu/đầu vào và điều kiện thử.\n- Có bằng chứng phù hợp với kết luận.\n- Chỉ ra điều chưa chứng minh được.\n- Mỗi thành viên giải thích được ít nhất một điều.\n\nPhiếu này không tự thu bài, chấm điểm hoặc đồng bộ tiến độ.\n';
}
