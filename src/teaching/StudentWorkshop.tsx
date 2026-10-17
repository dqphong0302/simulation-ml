import { useState } from 'react';
import { useUnsavedChanges } from '../app/useUnsavedChanges';
import { download } from '../core/reporting/files';
import { portableJson } from '../core/reporting/portableJson';
import { resourceById, STATION_GROUPS } from './catalog';
import { makeStudentWork, parseStudentPacket, parseStudentWork, studentWorkMarkdown, toStudentPacket, type StudentWork } from './studentPacket';
import { useResourceTemplate } from './useResourceTemplate';

export function StudentWorkshop({ topic }: { topic: string }) {
  const createTemplate = useResourceTemplate();
  const knownTopic = !!resourceById(topic);
  const [work, setWork] = useState<StudentWork>(() => {
    const packet = toStudentPacket(createTemplate(knownTopic ? topic : 'EDA', `topic-${knownTopic ? topic : 'EDA'}`));
    return makeStudentWork(packet, packet.session.activities.map(() => ''), '');
  });
  const [exported, setExported] = useState(() => JSON.stringify(work));
  const [error, setError] = useState(knownTopic ? '' : 'Mã học liệu trong đường dẫn không tồn tại. Đang mở mẫu EDA; chọn đúng học liệu từ trạm hoặc nhập phiếu giảng viên.');
  const [status, setStatus] = useState('');
  const [custom, setCustom] = useState(false);
  const dirty = JSON.stringify(work) !== exported;
  useUnsavedChanges(dirty, 'Có ghi chép chưa tải bản JSON. Rời xưởng và bỏ các sửa đổi này?');
  const session = work.packet.session;
  const hasNotes = work.notes.filter(note => note.trim()).length;
  const exportWork = (format: 'json' | 'md') => {
    try {
      const clean = makeStudentWork(work.packet, work.notes, work.reflection);
      const body = format === 'json' ? portableJson(clean) : studentWorkMarkdown(clean);
      download(new Blob([body], { type: format === 'json' ? 'application/json' : 'text/markdown;charset=utf-8' }), `bai-thuc-hanh-${session.id}.${format}`);
      if (format === 'json') setExported(JSON.stringify(clean));
      setStatus(format === 'json' ? 'Đã tạo tệp bản làm JSON. Giữ tệp này để mở lại và tiếp tục; chưa tự nộp cho giảng viên.' : 'Đã tạo báo cáo Markdown để đọc/chia sẻ. Muốn mở lại để sửa, tải thêm bản làm JSON.');
      setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Không xuất được bản làm.'); }
  };
  const importFile = async (input: HTMLInputElement) => {
    const file = input.files?.[0]; if (!file) return;
    try {
      if (file.size > 1_000_000) throw new Error('Tệp vượt giới hạn 1 MB.');
      const raw = await file.text();
      let parsed: unknown;
      try { parsed = JSON.parse(raw); } catch { throw new Error('Tệp không phải JSON hợp lệ.'); }
      const kind = parsed && typeof parsed === 'object' && 'kind' in parsed ? parsed.kind : '';
      const next = kind === 'sml-student-work' ? parseStudentWork(raw) : (() => { const packet = parseStudentPacket(raw); return makeStudentWork(packet, packet.session.activities.map(() => ''), ''); })();
      if (dirty && !window.confirm('Có ghi chép chưa tải bản JSON. Thay phiếu đang mở và bỏ các sửa đổi này?')) return;
      setWork(next); setExported(JSON.stringify(next)); setCustom(true); setError('');
      setStatus(kind === 'sml-student-work' ? 'Đã mở lại bản làm và ghi chép.' : 'Đã mở phiếu giảng viên. Chưa có ghi chép; dữ liệu thực hành không đi kèm tệp phiếu.');
    } catch (e) { setError(`Chưa nhập; phiếu và ghi chép đang mở được giữ nguyên. ${e instanceof Error ? e.message : 'Không đọc được tệp.'}`); }
    finally { input.value = ''; }
  };
  return <div className="student-workshop">
    <header className="library-intro"><p className="eyebrow">Trạm Tin học Y khoa · Làm việc theo nhóm</p><h1>Xưởng thực hành</h1>
      <p>Đọc nhiệm vụ → mở công cụ ở tab mới → ghi bằng chứng → tải bản làm. Không nhập tên, mã sinh viên hay thông tin bệnh nhân vào phần ghi chép.</p>
      <a id="workshop-to-station" href="#/station">← Về các nhóm học tập</a></header>
    <section className="teaching-panel" aria-labelledby="workshop-import-title"><h2 id="workshop-import-title">Mở phiếu hoặc bản làm đã tải</h2>
      <label htmlFor="workshop-import">Phiếu tương tác JSON từ giảng viên / bản làm JSON của bạn<input id="workshop-import" type="file" accept=".json,application/json" onChange={e => { void importFile(e.currentTarget); }} /></label>
      <p>Tệp giáo án giảng viên không phải phiếu sinh viên. Xưởng không chạy code, nhập dữ liệu lab hoặc gọi API từ tệp phiếu; bạn cần chủ động mở công cụ và chọn dữ liệu được phép.</p>
    </section>
    {error && <p role="alert" className="teaching-error">{error}</p>}
    <p role="status" className="teaching-status">{status}</p>
    <section className="teaching-panel" aria-labelledby="workshop-title"><p className="eyebrow">{STATION_GROUPS.find(g => g.id === session.groupId)?.title} · {custom ? 'Phiếu đã nhập' : 'Mẫu thực hành của học liệu'}</p>
      <h2 id="workshop-title">{session.title}</h2><p>{session.outcomes}</p>
      <p>Gợi ý {session.groupSize} người/nhóm. Luân phiên: thao tác, quan sát/ghi chép, phản biện và trình bày; có thể kiêm vai.</p>
      <p className="workshop-progress">Đã ghi {hasNotes}/{session.activities.length} hoạt động · {dirty ? 'Có sửa đổi chưa tải bản JSON' : 'Chưa có sửa đổi ngoài bản đang mở'}</p>
      <p className="lesson-level">Không tự lưu khi đóng trang; hãy tải bản làm JSON để tiếp tục lần sau. Ghi chép này tách riêng tiến độ bài học, không tự chấm điểm hoặc nộp bài.</p>
      <ol className="workshop-activities">{session.activities.map((activity, i) => <li key={activity.id}>
        <header><span className="eyebrow">Hoạt động {i + 1} · {activity.minutes} phút gợi ý</span><h3>{activity.title}</h3></header>
        <p className="workshop-task">{activity.task}</p><p><strong>Sản phẩm cần có: </strong>{activity.evidence}</p>
        <a id={`workshop-resource-${i}`} className="btn" href={resourceById(activity.resourceId)!.href} target="_blank" rel="noreferrer">Mở {resourceById(activity.resourceId)!.title} ↗</a>
        <p className="lesson-level">{resourceById(activity.resourceId)!.requirement}</p>
        <label htmlFor={`workshop-note-${i}`}>Ghi chép / bằng chứng của nhóm<textarea id={`workshop-note-${i}`} maxLength={4000} rows={4} value={work.notes[i]} placeholder="Dự đoán, thao tác đã đổi, kết quả quan sát và giải thích…"
          onChange={e => { setWork(prev => ({ ...prev, notes: prev.notes.map((note, index) => index === i ? e.target.value : note) })); setStatus(''); }} /></label>
      </li>)}</ol>
      <label htmlFor="workshop-reflection">Điều đã hiểu, giới hạn và câu hỏi muốn thử tiếp<textarea id="workshop-reflection" rows={3} maxLength={4000} value={work.reflection} onChange={e => { setWork(prev => ({ ...prev, reflection: e.target.value })); setStatus(''); }} /></label>
      <aside className="workshop-rubric"><h3>Tự rà soát trước khi thảo luận</h3><ul><li>Nêu rõ dữ liệu, đầu vào hoặc phiên bản code đã dùng.</li><li>Có bằng chứng cho kết luận, không chỉ nêu cảm giác.</li><li>Giải thích một điều chưa chứng minh được.</li><li>Mỗi thành viên giải thích được ít nhất một thao tác hoặc kết quả.</li></ul></aside>
      <div className="teaching-actions"><button id="workshop-export-json" className="btn primary" onClick={() => exportWork('json')}>Tải bản làm JSON để mở lại</button><button id="workshop-export-md" className="btn" onClick={() => exportWork('md')}>Tải báo cáo Markdown</button></div>
      <p>Giảng viên quyết định cách nhận bài ngoài trạm. Kiểm tra nội dung trước khi chia sẻ; trạm không tự kiểm duyệt thông tin bạn gõ.</p>
    </section>
  </div>;
}
