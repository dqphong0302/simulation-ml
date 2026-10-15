import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { DATA_ACCEPT, EXPLORE_ROWS, sampleTable, validateDataFile } from '../core/datasets/importData';
import { inspectColumns, type FreeTable } from '../core/datasets/freecsv';
import { ColumnReport } from './ColumnReport';
import { setSessionData, useSessionData } from '../core/datasets/session';

interface Draft { table: FreeTable; sheets: string[]; sheet: string; notes: string[] }

/** Each operation owns its worker; cancellation terminates CPU work and stale replies. */
export function DataImport() {
  const id = useId();
  const active = useSessionData();
  const [file, setFile] = useState<File | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [sheet, setSheet] = useState('');
  const [delimiter, setDelimiter] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [count, setCount] = useState(2000);
  const [consent, setConsent] = useState(false);
  const worker = useRef<Worker | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const stop = () => { worker.current?.terminate(); worker.current = null; clearTimeout(timer.current); };
  useEffect(() => () => stop(), []);

  const read = (f: File, selectedSheet?: string, selectedDelimiter = delimiter) => {
    stop(); setBusy(false); setDraft(null); setError(''); setNotice(''); setConsent(false);
    setFile(f);
    try { validateDataFile(f); } catch (e) { setError((e as Error).message); return; }
    setFile(f); setBusy(true); setProgress(0);
    let w: Worker;
    try { w = new Worker(new URL('../workers/import.worker.ts', import.meta.url), { type: 'module' }); }
    catch { setBusy(false); setError('Trình duyệt không khởi tạo được bộ đọc nền. Hãy kiểm tra quyền Worker hoặc thử trình duyệt khác.'); return; }
    worker.current = w;
    const fail = (message: string) => { if (worker.current !== w) return; stop(); setBusy(false); setError(message); };
    timer.current = setTimeout(() => fail('Đọc tệp quá 60 giây. Đã dừng; hãy chia nhỏ tệp hoặc giảm số cột.'), 60_000);
    w.onerror = () => fail('Không khởi chạy được bộ đọc dữ liệu. Hãy tải lại trang hoặc thử tệp nhỏ hơn.');
    w.onmessage = ({ data }) => {
      if (worker.current !== w) return;
      if (data.type === 'progress') setProgress(data.pct);
      else if (data.type === 'sheets') { setSheets(data.sheets); setSheet(data.sheet); }
      else if (data.type === 'error') fail(data.error);
      else if (data.type === 'done') {
        setDraft(data); setSheets(data.sheets); setSheet(data.sheet);
        setCount(Math.min(2000, data.table.cells.length)); setBusy(false); stop();
      }
    };
    w.postMessage({ file: f, sheet: selectedSheet, delimiter: selectedDelimiter });
  };
  const choose = (f?: File) => {
    if (!f) return;
    setSheets([]); setSheet(''); setDelimiter(''); read(f, undefined, '');
  };
  const sampled = !!draft && count < draft.table.cells.length;
  // Báo cáo cột tính trên tối đa 5.000 dòng đầu để xem trước nhanh.
  const preview = useMemo(() => { if (!draft) return null; const t = { ...draft.table, cells: draft.table.cells.slice(0, 5000) }; return { t, cols: inspectColumns(t) }; }, [draft]);
  const apply = () => {
    if (!file || !draft || (sampled && !consent)) return;
    const table = sampleTable(draft.table, count);
    setSessionData({ name: file.name, table, originalRows: draft.table.cells.length, sampled, sheet: draft.sheet });
    setDraft(null); setFile(null); setSheets([]); setSheet('');
    setNotice(`Đã dùng ${table.cells.length.toLocaleString('vi')} dòng. Dữ liệu sẵn sàng ở các bài học trong phiên này.`);
  };
  return <section className="box data-import" aria-label="Nhập dữ liệu chung" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); choose(e.dataTransfer.files[0]); }}>
    <div className="row"><label className="btn primary file-btn" htmlFor={`${id}-file`}>Tải dữ liệu<input id={`${id}-file`} aria-label="Chọn file dữ liệu" type="file" accept={DATA_ACCEPT} onChange={e => { choose(e.target.files?.[0]); e.target.value = ''; }} /></label>
      {busy && <button id={`${id}-cancel`} className="btn" onClick={() => { stop(); setBusy(false); setNotice('Đã hủy đọc tệp. Dữ liệu đang dùng được giữ nguyên.'); }}>Hủy đọc</button>}
      {active && <span className="muted">Đang dùng: <b>{active.name}</b>{active.sheet ? ` · ${active.sheet}` : ''} · {active.table.cells.length.toLocaleString('vi')}/{active.originalRows.toLocaleString('vi')} dòng{active.sampled ? ' (mẫu, seed 42)' : ''}</span>}
    </div>
    <p className="muted">Kéo-thả hoặc chọn tệp. CSV/TSV/TXT UTF-8 ≤ 100 MiB; Excel/JSON ≤ 30 MiB. Tối đa 200.000 dòng, 200 cột, 2 triệu ô. Chỉ xử lý trên thiết bị; mất dữ liệu phiên khi tải lại trang.</p>
    {busy && <p role="status">Đang đọc {file?.name}… {progress}% <progress aria-label="Tiến độ đọc file" max={100} value={progress} /></p>}
    {error && <p className="warn" role="alert">{error}</p>}
    {notice && <p className="result" role="status">{notice}</p>}
    {file && !busy && <div className="row">
      {!!sheets.length && <label htmlFor={`${id}-sheet`}>Sheet <select id={`${id}-sheet`} aria-label="Chọn sheet" value={sheet} onChange={e => { setSheet(e.target.value); read(file, e.target.value); }}>{sheets.map(s => <option key={s}>{s}</option>)}</select></label>}
      {/\.(csv|tsv|txt)$/i.test(file.name) && <label htmlFor={`${id}-delimiter`}>Dấu phân cách <select id={`${id}-delimiter`} aria-label="Dấu phân cách" value={delimiter} onChange={e => { setDelimiter(e.target.value); read(file, undefined, e.target.value); }}><option value="">Tự nhận diện</option><option value=",">Dấu phẩy (,)</option><option value=";">Chấm phẩy (;)</option><option value={'\t'}>Tab</option><option value="|">Dấu |</option></select></label>}
    </div>}
    {draft && <div className="import-preview">
      <h3>Xem trước: {draft.table.cells.length.toLocaleString('vi')} dòng × {draft.table.names.length} cột</h3>
      {draft.notes.map(n => <p className="muted" key={n}>{n}</p>)}
      <p className="muted">10 dòng đầu; kiểm tra tiêu đề và dấu phân cách trước khi dùng.</p>
      <div className="import-table"><table className="tbl"><thead><tr>{draft.table.names.map(n => <th key={n}>{n}</th>)}</tr></thead><tbody>{draft.table.cells.slice(0, 10).map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} title={c}>{c.length > 120 ? `${c.slice(0, 120)}…` : c}</td>)}</tr>)}</tbody></table></div>
      {preview && <ColumnReport table={preview.t} cols={preview.cols} open />}
      <label htmlFor={`${id}-count`}>Số dòng dùng trong phiên <select id={`${id}-count`} aria-label="Số dòng sử dụng" value={count} onChange={e => { setCount(Number(e.target.value)); setConsent(false); }}>
        {[...new Set([Math.min(2000, draft.table.cells.length), Math.min(5000, draft.table.cells.length), Math.min(EXPLORE_ROWS, draft.table.cells.length)])].map(n => <option value={n} key={n}>{n.toLocaleString('vi')} dòng{n === draft.table.cells.length ? ' — toàn bộ' : ' — lấy mẫu ngẫu nhiên, seed 42'}</option>)}
      </select></label>
      <p className="muted">Khám phá tối đa 20.000 dòng; mô hình tối đa 2.000 dòng, 32 biến (Forest/SVM/Tree có giới hạn thấp hơn). Lấy mẫu có thể bỏ sót lớp hiếm; không phải kết quả trên toàn bộ tệp.</p>
      {sampled && <label className="check"><input id={`${id}-consent`} type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />Tôi đồng ý dùng {count.toLocaleString('vi')} / {draft.table.cells.length.toLocaleString('vi')} dòng; không dùng toàn bộ tệp.</label>}
      <button id={`${id}-apply`} className="btn primary" disabled={sampled && !consent} onClick={apply}>Dùng dữ liệu này</button>
    </div>}
  </section>;
}
