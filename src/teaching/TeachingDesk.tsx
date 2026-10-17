import { useState } from 'react';
import { useUnsavedChanges } from '../app/useUnsavedChanges';
import { download } from '../core/reporting/files';
import { portableJson } from '../core/reporting/portableJson';
import { mergeSession } from './mergeSession';
import { RESOURCES, STATION_GROUPS } from './catalog';
import { ActivityRunner } from './ActivityRunner';
import { defaultResourceId, MAX_SESSIONS, parseBackup, SESSION_KEY, sessionMarkdown, totalMinutes, type Activity, type TeachingSession } from './session';
import { toStudentPacket } from './studentPacket';
import { useResourceTemplate } from './useResourceTemplate';

function readSaved() { const raw = localStorage.getItem(SESSION_KEY); return raw === null ? [] : parseBackup(raw).sessions; }
function initialSaved() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw === null) return { sessions: [], error: '', brokenRaw: null };
    try { return { sessions: parseBackup(raw).sessions, error: '', brokenRaw: null }; }
    catch { return { sessions: [], error: 'Không đọc được bản lưu. Trạm giữ nguyên bản cũ; tải bản thô trước khi chọn khôi phục bằng tệp sao lưu.', brokenRaw: raw }; }
  } catch { return { sessions: [], error: 'Không đọc được bộ nhớ trình duyệt. Có thể soạn và tải giáo án, nhưng cần kiểm tra quyền lưu trữ để lưu trên máy.', brokenRaw: null }; }
}

export function TeachingDesk({ groupId, topic }: { groupId: string | null; topic: string | null }) {
  const createTemplate = useResourceTemplate();
  const requestedGroup = STATION_GROUPS.find(g => g.resourceIds.includes(topic ?? ''))?.id ?? (STATION_GROUPS.some(g => g.id === groupId) ? groupId! : 'data');
  const [initial] = useState(initialSaved);
  const [saved, setSaved] = useState(initial.sessions);
  const [brokenRaw, setBrokenRaw] = useState(initial.brokenRaw);
  const [rawExported, setRawExported] = useState(false), [allowRecovery, setAllowRecovery] = useState(false);
  const [template, setTemplate] = useState(requestedGroup);
  const [templateTopic, setTemplateTopic] = useState(topic && STATION_GROUPS.find(g => g.id === requestedGroup)?.resourceIds.includes(topic) ? topic : defaultResourceId(requestedGroup));
  const [draft, setDraft] = useState(() => createTemplate(templateTopic));
  const [baseline, setBaseline] = useState('');
  const [error, setError] = useState(initial.error), [status, setStatus] = useState('');
  const [presenting, setPresenting] = useState(false);
  const dirty = JSON.stringify(draft) !== baseline;
  useUnsavedChanges(dirty, 'Giáo án đang sửa chưa được lưu. Rời bàn giảng viên và bỏ các sửa đổi này?');
  const patch = (change: Partial<TeachingSession>) => { setDraft(prev => ({ ...prev, ...change })); setStatus(''); };
  const patchActivity = (index: number, change: Partial<Activity>) => patch({ activities: draft.activities.map((a, i) => i === index ? { ...a, ...change } : a) });
  const validDraft = () => parseBackup(JSON.stringify({ version: 1, sessions: [draft] })).sessions[0];
  const mayReplace = () => !dirty || window.confirm('Giáo án đang sửa chưa được lưu. Chuyển sang bản khác và bỏ các sửa đổi này?');
  const persist = (sessions: TeachingSession[]) => {
    const checked = parseBackup(JSON.stringify({ version: 1, sessions }));
    localStorage.setItem(SESSION_KEY, JSON.stringify(checked)); setSaved(checked.sessions);
  };
  const save = () => {
    try {
      const checked = validDraft(), latest = readSaved();
      setSaved(latest);
      persist(mergeSession(latest, checked, baseline)); setBaseline(JSON.stringify(checked));
      setError(''); setStatus('Đã lưu trên trình duyệt này. Hãy tải bản sao để mang sang thiết bị khác.');
    } catch (e) { setError(`Chưa lưu; bản trên trình duyệt không bị ghi đè. ${e instanceof Error ? e.message : 'Kiểm tra quyền lưu trữ.'}`); }
  };
  const load = (id: string) => {
    if (!mayReplace()) return;
    try {
      const latest = readSaved(), selected = latest.find(session => session.id === id);
      if (!selected) throw new Error('Buổi này không còn trong bản lưu. Bản nháp đang sửa được giữ nguyên.');
      setSaved(latest); setDraft(selected); setBaseline(JSON.stringify(selected)); setError(''); setStatus('Đã mở bản lưu mới nhất.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Không đọc được bản lưu.'); }
  };
  const exportPlan = (audience: 'teacher' | 'student') => {
    try { download(new Blob([sessionMarkdown(validDraft(), audience, location.origin)], { type: 'text/markdown;charset=utf-8' }), `${audience === 'teacher' ? 'giao-an' : 'phieu-nhom'}-${draft.id}.md`); setError(''); setStatus('Đã tạo tệp Markdown từ bản đang sửa. Mở bằng trình soạn thảo văn bản; không tự gửi cho sinh viên.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không tạo được tệp.'); }
  };
  const importBackup = async (input: HTMLInputElement) => {
    const file = input.files?.[0]; if (!file) return;
    try {
      if (file.size > 1_000_000) throw new Error('Tệp vượt 1 MB.');
      const incoming = parseBackup(await file.text()).sessions;
      let latest: TeachingSession[];
      let recovering = false;
      try { latest = readSaved(); } catch {
        if (!allowRecovery || !rawExported || brokenRaw === null || localStorage.getItem(SESSION_KEY) !== brokenRaw)
          throw new Error('Bản lưu đang lỗi hoặc đã thay đổi. Cần tải bản thô và đồng ý khôi phục; chưa ghi đè dữ liệu.');
        latest = [];
        recovering = true;
      }
      if (incoming.length + latest.length > MAX_SESSIONS) throw new Error('Sau nhập sẽ vượt 30 buổi. Chưa thay đổi bản lưu.');
      // Always copy under fresh IDs: even an import of our own backup cannot overwrite originals.
      persist([...latest, ...incoming.map(s => ({ ...s, id: crypto.randomUUID() }))]);
      setBrokenRaw(null); setAllowRecovery(false);
      setError(''); setStatus(`Đã thêm ${incoming.length} bản sao. ${recovering ? 'Bản lỗi đã được thay sau khi tải bản thô; có thể kiểm tra lại từ tệp vừa tải.' : 'Bản cũ được giữ nguyên.'} Giáo án đang sửa không thay đổi.`);
    } catch (e) { setError(`Chưa nhập; bản cũ được giữ nguyên. ${e instanceof Error ? e.message : 'Không đọc được tệp.'}`); }
    finally { input.value = ''; }
  };
  return <div className="teaching-desk">
    <header className="library-intro"><p className="eyebrow">Trạm Tin học Y khoa · Dành cho giảng viên</p><h1>Bàn giảng viên</h1>
      <p>Soạn hoạt động, mở học liệu và xuất phiếu thực hành. Không cần tài khoản; không nhập tên sinh viên, mã lớp định danh cá nhân hoặc thông tin bệnh nhân.</p><a id="desk-to-station" href="#/station">← Về các nhóm học tập</a></header>
    {error && <p className="teaching-error" role="alert">{error}</p>}
    {brokenRaw !== null && <aside className="teaching-panel" aria-label="Khôi phục bản lưu lỗi"><h2>Giữ bản cũ trước khi khôi phục</h2>
      <p>Tải bản lưu thô để có thể kiểm tra lại. Sau đó, nếu đã có bản sao JSON hợp lệ, cho phép thay bản lỗi rồi nhập tệp ở bên dưới.</p>
      <button id="teaching-export-raw" className="btn" onClick={() => { download(new Blob([brokenRaw], { type: 'text/plain;charset=utf-8' }), 'ban-luu-giao-an-can-khoi-phuc.txt'); setRawExported(true); }}>Tải nguyên bản lưu thô</button>
      <label className="teaching-recovery" htmlFor="teaching-allow-recovery"><input id="teaching-allow-recovery" type="checkbox" disabled={!rawExported} checked={allowRecovery} onChange={e => setAllowRecovery(e.target.checked)} />Tôi đã giữ bản thô; cho phép thay bản lỗi khi nhập bản sao hợp lệ.</label>
    </aside>}
    <p role="status" className="teaching-status">{status}</p>
    {presenting ? <ActivityRunner session={draft} onClose={() => setPresenting(false)} /> : <>
      <section className="teaching-panel" aria-labelledby="teaching-library-title"><h2 id="teaching-library-title">Buổi học trên máy này</h2>
        <div className="teaching-actions"><label htmlFor="teaching-template">Nhóm cho buổi mới<select id="teaching-template" value={template} onChange={e => { setTemplate(e.target.value); setTemplateTopic(defaultResourceId(e.target.value)); }}>{STATION_GROUPS.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}</select></label>
          <label htmlFor="teaching-template-topic">Học liệu cho mẫu mới<select id="teaching-template-topic" value={templateTopic} onChange={e => setTemplateTopic(e.target.value)}>{STATION_GROUPS.find(g => g.id === template)!.resourceIds.map(id => <option key={id} value={id}>{RESOURCES.find(r => r.id === id)!.title}</option>)}</select></label>
          <button id="teaching-new" className="btn" onClick={() => { if (mayReplace()) { setDraft(createTemplate(templateTopic)); setBaseline(''); setStatus('Đã tạo bản nháp mới theo học liệu đã chọn; chưa lưu.'); } }}>Tạo buổi mới từ mẫu 45 phút</button>
          <button id="teaching-backup" className="btn" disabled={!saved.length} onClick={() => {
            try { const latest = readSaved(); if (!latest.length) throw new Error('Chưa có buổi đã lưu.'); download(new Blob([portableJson({ version: 1, sessions: latest })], { type: 'application/json' }), 'ban-sao-giao-an.json'); setStatus('Bản sao chỉ chứa giáo án đã lưu; không gồm sửa đổi chưa lưu.'); setError(''); }
            catch (e) { setError(e instanceof Error ? e.message : 'Không đọc được bản lưu.'); }
          }}>Sao lưu các buổi đã lưu</button>
          <label className="teaching-import" htmlFor="teaching-import">Nhập bản sao JSON (thêm bản mới)<input id="teaching-import" type="file" accept=".json,application/json" onChange={e => { void importBackup(e.currentTarget); }} /></label></div>
        {saved.length ? <ul className="teaching-saved">{saved.map(session => <li key={session.id}><button id={`teaching-load-${session.id}`} className="btn" onClick={() => load(session.id)}>{session.title} · {totalMinutes(session)} phút</button></li>)}</ul> : <p>Chưa có buổi đã lưu. Bản mẫu bên dưới là điểm bắt đầu, thầy/cô có thể sửa toàn bộ nhiệm vụ.</p>}
        <p className="lesson-level">Lưu cục bộ, không tự đồng bộ hay thu bài. Tệp sao lưu có cả ghi chú giảng viên; chỉ chia sẻ phiếu sinh viên nếu không muốn lộ ghi chú.</p>
      </section>
      <section className="teaching-panel" aria-labelledby="teaching-edit-title"><header className="teaching-panel-head"><h2 id="teaching-edit-title">Giáo án đang sửa</h2><span>{dirty ? 'Chưa lưu sửa đổi' : 'Khớp bản đã lưu'} · {totalMinutes(draft)} phút</span></header>
        <label htmlFor="teaching-title">Tên buổi học<input id="teaching-title" maxLength={160} value={draft.title} onChange={e => patch({ title: e.target.value })} /></label>
        <label htmlFor="teaching-outcomes">Mục tiêu quan sát được<textarea id="teaching-outcomes" maxLength={4000} value={draft.outcomes} onChange={e => patch({ outcomes: e.target.value })} /></label>
        <label htmlFor="teaching-group-size">Số người/nhóm gợi ý (không phân danh sách sinh viên)<input id="teaching-group-size" type="number" min="1" max="12" value={draft.groupSize} onChange={e => patch({ groupSize: +e.target.value })} /></label>
        <p>Phân vai linh hoạt: thao tác · quan sát/ghi chép · phản biện · trình bày. Luân phiên vai; nhóm ít người có thể kiêm vai.</p>
        <p className="lesson-level">Mẫu mới dùng hướng dẫn của đúng học liệu và thích ứng với bảng đang nhập nếu phù hợp. Chỉ đổi học liệu trong một hoạt động không tự sửa nhiệm vụ hay ghi chú cũ; hãy rà lại hoặc tạo buổi mới theo đúng mẫu ở trên.</p>
        <ol className="teaching-activities">{draft.activities.map((activity, i) => <li key={activity.id}>
          <header><h3>Hoạt động {i + 1}</h3><div className="teaching-actions">
            <button id={`teaching-up-${i}`} className="btn" disabled={i === 0} aria-label={`Đưa hoạt động ${i + 1} lên`} onClick={() => { const activities = [...draft.activities]; [activities[i - 1], activities[i]] = [activities[i], activities[i - 1]]; patch({ activities }); }}>↑</button>
            <button id={`teaching-down-${i}`} className="btn" disabled={i === draft.activities.length - 1} aria-label={`Đưa hoạt động ${i + 1} xuống`} onClick={() => { const activities = [...draft.activities]; [activities[i + 1], activities[i]] = [activities[i], activities[i + 1]]; patch({ activities }); }}>↓</button>
            <button id={`teaching-remove-${i}`} className="btn" disabled={draft.activities.length === 1} onClick={() => patch({ activities: draft.activities.filter((_, index) => index !== i) })}>Bỏ hoạt động {i + 1}</button></div></header>
          <div className="teaching-fields"><label htmlFor={`activity-title-${i}`}>Tên hoạt động<input id={`activity-title-${i}`} maxLength={160} value={activity.title} onChange={e => patchActivity(i, { title: e.target.value })} /></label>
            <label htmlFor={`activity-minutes-${i}`}>Phút (1–180)<input id={`activity-minutes-${i}`} type="number" min="1" max="180" value={activity.minutes} onChange={e => patchActivity(i, { minutes: +e.target.value })} /></label></div>
          <label htmlFor={`activity-resource-${i}`}>Học liệu thực hành<select id={`activity-resource-${i}`} value={activity.resourceId} onChange={e => patchActivity(i, { resourceId: e.target.value })}>{RESOURCES.map(resource => <option key={resource.id} value={resource.id}>{resource.title}</option>)}</select></label>
          <label htmlFor={`activity-task-${i}`}>Nhiệm vụ cho nhóm<textarea id={`activity-task-${i}`} maxLength={4000} value={activity.task} onChange={e => patchActivity(i, { task: e.target.value })} /></label>
          <label htmlFor={`activity-evidence-${i}`}>Sản phẩm / bằng chứng cần có<textarea id={`activity-evidence-${i}`} maxLength={4000} value={activity.evidence} onChange={e => patchActivity(i, { evidence: e.target.value })} /></label>
          <details><summary>Ghi chú riêng giảng viên (không đưa vào phiếu sinh viên)</summary><label htmlFor={`activity-note-${i}`}>Gợi ý dẫn dắt / đáp án<textarea id={`activity-note-${i}`} maxLength={4000} value={activity.teacherNote} onChange={e => patchActivity(i, { teacherNote: e.target.value })} /></label></details>
        </li>)}</ol>
        <button id="teaching-add" className="btn" disabled={draft.activities.length >= 12} onClick={() => patch({ activities: [...draft.activities, { id: crypto.randomUUID(), title: 'Hoạt động mới', minutes: 5, resourceId: draft.activities[0].resourceId, task: '', evidence: '', teacherNote: '' }] })}>+ Thêm hoạt động (tối đa 12)</button>
        <div className="teaching-actions teaching-save-actions"><button id="teaching-save" className="btn primary" onClick={save}>Lưu giáo án trên máy này</button>
          <button id="teaching-present" className="btn" onClick={() => { try { validDraft(); setError(''); setPresenting(true); } catch (e) { setError(e instanceof Error ? e.message : 'Kiểm tra giáo án.'); } }}>Dẫn buổi học</button>
          <button id="teaching-export-teacher" className="btn" onClick={() => exportPlan('teacher')}>Tải giáo án giảng viên</button>
          <button id="teaching-export-student" className="btn" onClick={() => exportPlan('student')}>Tải phiếu sinh viên</button></div>
        <div className="teaching-actions"><button id="teaching-export-interactive" className="btn primary" onClick={() => {
          try { const packet = toStudentPacket(validDraft()); download(new Blob([portableJson(packet)], { type: 'application/json' }), `phieu-tuong-tac-${packet.session.id}.json`); setError(''); setStatus('Đã tạo phiếu tương tác không kèm ghi chú riêng. Gửi tệp cho sinh viên bằng kênh của lớp; sinh viên nhập tệp tại Xưởng thực hành.'); }
          catch (e) { setError(e instanceof Error ? e.message : 'Không tạo được phiếu tương tác.'); }
        }}>Tải phiếu tương tác cho sinh viên (JSON)</button><a id="teaching-open-workshop" className="btn" href="#/workshop" target="_blank" rel="noreferrer">Mở Xưởng để nhập phiếu ↗</a></div>
        <p className="lesson-level">Tệp Markdown tải từ bản đang sửa, không cần lưu trước. Link localhost chỉ dùng được trên máy đang chạy ứng dụng; khi chia sẻ lớp cần địa chỉ triển khai truy cập được.</p>
      </section>
    </>}
  </div>;
}
