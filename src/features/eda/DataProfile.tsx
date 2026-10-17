import { useMemo, useState } from 'react';
import { describe, pearson, quantile } from '../../core/algorithms/dataset';
import { isBlank, toNumber, zeroGap, type ColumnInfo, type FreeTable } from '../../core/datasets/freecsv';
import { download } from '../../core/reporting/files';
import type { TableData } from '../../core/types';
import { Table } from '../../app/ui';

/** Thống kê mô tả cho một bảng CSV bất kỳ: tổng quan, cảnh báo, thống kê, phân bố, hộp, phân tán, tương quan. Chỉ mô tả, không fit mô hình. */
export const PALETTE = ['#2563eb', '#dc6a0b', '#0f9a6c', '#9333ea', '#c0392b', '#0b5cab', '#b2530a', '#c0392b', '#475467', '#0f9a6c', '#9333ea', '#0f9a6c'];
const cc = (k: number) => PALETTE[((k % PALETTE.length) + PALETTE.length) % PALETTE.length];

interface NumProfile { kind: 'numeric'; v: number[]; mean: number | null; std: number | null; min: number | null; q1: number; median: number | null; q3: number; max: number | null; skew: number | null; zeros: number; outliers: number; zeroGap: number | null }
interface CatProfile { kind: 'categorical'; top: [string, number][] }
export type Profile = (NumProfile | CatProfile) & { info: ColumnInfo; values: string[] };

export const g = (v: number | null | undefined, d = 2) => (v === null || v === undefined || !Number.isFinite(v) ? '–' : Math.abs(v) >= 1e5 || (v !== 0 && Math.abs(v) < 1e-3) ? v.toExponential(2) : v.toFixed(d));
const csvCell = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

export function profile(t: FreeTable, cols: ColumnInfo[]): Profile[] {
  return cols.map((info, j) => {
    const values = t.cells.map((r) => r[j]);
    if (info.kind === 'numeric') {
      const v = values.map((c) => toNumber(c, info.decimal));
      const ok = v.filter((x) => !Number.isNaN(x)).sort((a, b) => a - b);
      const s = describe(ok);
      const q1 = quantile(ok, 0.25), q3 = quantile(ok, 0.75), iqr = q3 - q1;
      // Moment skewness g1 uses population moments, independently of sample SD.
      const momentSd = s.mean !== null ? Math.sqrt(ok.reduce((a, x) => a + (x - s.mean!) ** 2, 0) / ok.length) : 0;
      const skew = momentSd > 0 && s.mean !== null ? ok.reduce((a, x) => a + ((x - s.mean!) / momentSd) ** 3, 0) / ok.length : null;
      return { kind: 'numeric', info, values, v, mean: s.mean, std: s.std, min: s.min, q1, median: s.median, q3, max: s.max, skew,
        zeros: ok.length - ok.filter((x) => x !== 0).length, outliers: ok.filter((x) => x < q1 - 1.5 * iqr || x > q3 + 1.5 * iqr).length, zeroGap: zeroGap(v) };
    }
    const freq = new Map<string, number>();
    values.forEach((c) => { if (!isBlank(c)) freq.set(c, (freq.get(c) ?? 0) + 1); });
    return { kind: 'categorical', info, values, top: [...freq.entries()].sort((a, b) => b[1] - a[1]) };
  });
}

/** Tỷ số tương quan η²: phần phương sai của biến số giải thích được bởi nhóm (0–1). */
function eta2(v: number[], groups: string[]): number | null {
  const pairs = v.map((x, i) => [x, groups[i]] as const).filter(([x, gr]) => !Number.isNaN(x) && !isBlank(gr));
  if (pairs.length < 3) return null;
  const m = pairs.reduce((s, p) => s + p[0], 0) / pairs.length;
  const by = new Map<string, number[]>();
  pairs.forEach(([x, gr]) => { const a = by.get(gr) ?? []; a.push(x); by.set(gr, a); });
  const sst = pairs.reduce((s, p) => s + (p[0] - m) ** 2, 0);
  const ssb = [...by.values()].reduce((s, a) => { const mg = a.reduce((x, y) => x + y, 0) / a.length; return s + a.length * (mg - m) ** 2; }, 0);
  return sst ? ssb / sst : null;
}

export function DataProfile({ table, cols, target, fileName }: { table: FreeTable; cols: ColumnInfo[]; target: string; fileName: string }) {
  const P = useMemo(() => profile(table, cols), [table, cols]);
  const [byTarget, setByTarget] = useState(true);
  const [focus, setFocus] = useState<string | null>(null);
  const n = table.cells.length;
  const tP = P.find((p) => p.info.name === target);
  // Cột đích ít giá trị → coi như nhóm (tô màu, so sánh theo nhóm); cột số nhiều giá trị → đo tương quan.
  const classMode = !!tP && tP.info.unique <= 12;
  const classes = classMode ? (tP!.kind === 'categorical' ? tP!.top.map((x) => x[0]) : tP!.info.levels) : [];
  const classIdx = useMemo(() => (classMode ? tP!.values.map((v) => classes.indexOf(v.trim())) : null), [classMode, tP, classes]); // eslint-disable-line react-hooks/exhaustive-deps
  const classOf = (i: number) => classIdx?.[i] ?? -1;

  const overview = useMemo(() => {
    const missingCells = P.reduce((s, p) => s + p.info.missing, 0);
    const seen = new Set<string>(); let dup = 0;
    table.cells.forEach((r) => { const k = r.join('\u0001'); if (seen.has(k)) dup++; else seen.add(k); });
    return { missingCells, dup, num: P.filter((p) => p.kind === 'numeric').length };
  }, [P, table]);

  const nums = useMemo(() => P.filter((p): p is Profile & NumProfile => p.kind === 'numeric'), [P]);
  const corr = useMemo(() => {
    const C = nums.slice(0, 20);
    return C.map((a) => C.map((b) => { const ok = a.v.map((x, i) => [x, b.v[i]]).filter(([x, y]) => !Number.isNaN(x) && !Number.isNaN(y)); return pearson(ok.map((p) => p[0]), ok.map((p) => p[1])); }));
  }, [nums]);

  const assoc = useMemo(() => {
    if (!tP) return [];
    return P.filter((p) => p !== tP).map((p) => {
      if (p.kind === 'numeric' && tP.kind === 'numeric' && !classMode) {
        const ok = p.v.map((x, i) => [x, (tP as NumProfile).v[i]]).filter(([x, y]) => !Number.isNaN(x) && !Number.isNaN(y));
        const r = pearson(ok.map((q) => q[0]), ok.map((q) => q[1]));
        return { name: p.info.name, how: 'Pearson r', val: r, abs: Math.abs(r ?? 0) };
      }
      if (p.kind === 'numeric') { const e = eta2(p.v, tP.values); return { name: p.info.name, how: 'η² theo nhóm đích', val: e, abs: e ?? 0 }; }
      if (tP.kind === 'numeric') { const e = eta2((tP as NumProfile).v, p.values); return { name: p.info.name, how: 'η² của đích theo nhóm', val: e, abs: e ?? 0 }; }
      return { name: p.info.name, how: '—', val: null, abs: -1 };
    }).filter((a) => a.abs >= 0).sort((a, b) => b.abs - a.abs);
  }, [P, tP, classMode]);

  const warnings = useMemo(() => {
    const w: string[] = [];
    if (overview.dup) w.push(`${overview.dup} dòng trùng lặp hoàn toàn — bản sao rơi vào cả train và test sẽ làm điểm đánh giá đẹp giả.`);
    P.forEach((p) => {
      const nm = p.info.name, miss = p.info.missing / n;
      if (miss > 0.2) w.push(`“${nm}” thiếu ${(miss * 100).toFixed(0)}% — cân nhắc bỏ cột hoặc kiểm tra cách điền.`);
      if (p.info.unique <= 1) w.push(`“${nm}” chỉ có một giá trị — không mang thông tin.`);
      if (p.info.role === 'id') w.push(`“${nm}” giống mã định danh (ID/họ tên) — không phải số đo, tự động loại khỏi mô hình.`);
      if (p.info.role === 'date') w.push(`“${nm}” là ngày tháng — không dùng trực tiếp làm biến; cần tách thành tuổi, khoảng thời gian… nếu muốn dùng.`);
      if (p.info.role === 'text') w.push(`“${nm}” có ${p.info.unique} giá trị chữ khác nhau — quá nhiều để mã hóa, tự động loại khỏi mô hình.`);
      if (p.info.units.length > 1) w.push(`“${nm}” có nhiều đơn vị (${p.info.units.slice(0, 4).join(', ')}) — cần quy đổi về một đơn vị trước khi so sánh.`);
      else if (p.info.units.length === 1) w.push(`“${nm}”: đã bỏ đơn vị “${p.info.units[0]}” khi đọc số.`);
      if (p.info.missingTokens) w.push(`“${nm}”: ${p.info.missingTokens} ô ghi mã thiếu (“-”, “không rõ”, “N/A”…) — được coi là thiếu.`);
      if (p.info.coerced) w.push(`“${nm}”: ${p.info.coerced} ô không đọc được thành số (ví dụ: ${p.info.coercedExamples.map((x) => `“${x}”`).join(', ')}) — được coi là thiếu, hãy kiểm tra.`);
      if (p.kind === 'numeric') {
        if (p.zeroGap !== null) w.push(`“${nm}” có ${p.zeros} giá trị 0 nhưng không có giá trị nào giữa 0 và ${g(p.zeroGap)} — 0 có thể là mã hóa cho “thiếu”.`);
        if (p.skew !== null && Math.abs(p.skew) > 2) w.push(`“${nm}” có |skew| > 2 (g1 = ${p.skew.toFixed(1)}) — xem histogram và giá trị cực đoan; log chỉ phù hợp miền giá trị và mục tiêu nhất định.`);
        if (p.outliers > n * 0.05) w.push(`“${nm}” có ${p.outliers} giá trị ngoài 1,5·IQR (${((p.outliers / n) * 100).toFixed(0)}%).`);
      }
    });
    nums.slice(0, 20).forEach((a, i) => nums.slice(0, 20).forEach((b, j) => { const r = corr[i]?.[j]; if (j > i && r !== null && r !== undefined && Math.abs(r) > 0.9) w.push(`“${a.info.name}” và “${b.info.name}” tương quan rất cao (r = ${r.toFixed(2)}).`); }));
    if (classMode && tP) {
      const counts = classes.map((_, k) => tP.values.filter((_, i) => classOf(i) === k).length);
      const mx = Math.max(...counts), mn = Math.min(...counts);
      if (mn < mx * 0.25) w.push(`Cột “${target}” mất cân bằng: nhóm ít nhất chỉ bằng ${((mn / mx) * 100).toFixed(0)}% nhóm nhiều nhất.`);
    }
    return w;
  }, [P, n, overview, nums, corr, classMode, tP, target]); // eslint-disable-line react-hooks/exhaustive-deps

  const statCols = ['Cột', 'Kiểu', 'Thiếu', 'Khác nhau', 'Trung bình', 'SD mẫu (n−1)', 'Min', 'Q1', 'Median', 'Q3', 'Max', 'Skew (g1)', 'Ngoại lai (IQR)', 'Giá trị phổ biến'];
  const statRows = P.map((p) => p.kind === 'numeric'
    ? [p.info.name + (p.info.name === target ? ' (đích)' : ''), p.info.role === 'id' ? 'số (ID)' : p.info.units[0] ? `số (${p.info.units[0]})` : 'số', String(p.info.missing), String(p.info.unique), g(p.mean), g(p.std), g(p.min), g(p.q1), g(p.median), g(p.q3), g(p.max), g(p.skew), String(p.outliers), '']
    : [p.info.name + (p.info.name === target ? ' (đích)' : ''), ({ id: 'ID', date: 'ngày', text: 'văn bản', constant: 'hằng số', feature: 'phân loại' } as const)[p.info.role], String(p.info.missing), String(p.info.unique), '', '', '', '', '', '', '', '', '', p.top.slice(0, 3).map(([v, c]) => `${v} (${c})`).join(', ')]);

  // Thống kê theo nhóm của cột đích: trung bình (độ lệch chuẩn) từng biến số.
  const byClass: TableData | null = classMode && tP ? {
    columns: ['Biến', ...classes.map((c) => `${target} = ${c}`)],
    rows: nums.filter((p) => p !== tP).map((p) => [p.info.name, ...classes.map((_, k) => {
      const v = p.v.filter((x, i) => !Number.isNaN(x) && classOf(i) === k); const s = describe(v);
      return `${g(s.mean)} (${g(s.std)})`;
    })]),
  } : null;

  const exportCsv = () => {
    const lines = [statCols, ...statRows].map((r) => r.map(csvCell).join(','));
    if (byClass) lines.push('', `Trung bình (độ lệch chuẩn) theo ${target}`, ...[byClass.columns, ...byClass.rows].map((r) => r.map(csvCell).join(',')));
    lines.push('', 'Cảnh báo', ...warnings.map(csvCell));
    download(new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' }), `thong_ke_mo_ta_${fileName.replace(/\.[^.]+$/, '')}.csv`);
  };

  // Biểu đồ phân tán mặc định: cặp biến (không tính cột đích) có |r| lớn nhất.
  const best = useMemo(() => {
    let b: [number, number] = [0, Math.min(1, nums.length - 1)], bv = -1;
    corr.forEach((row, i) => row.forEach((r, j) => { if (j > i && r !== null && nums[i] !== tP && nums[j] !== tP && Math.abs(r) > bv) { bv = Math.abs(r); b = [i, j]; } }));
    return b;
  }, [corr, nums, tP]);
  const [pick, setPick] = useState<[number, number] | null>(null);
  const [sx, sy] = pick ?? best;
  const setSx = (v: number) => setPick([v, sy]), setSy = (v: number) => setPick([sx, v]);
  const shown = focus ? P.filter((p) => p.info.name === focus) : P.slice(0, 24);
  return (
    <section className="profile">
      <div className="profile-head">
        <h3>Tổng quan — {fileName}</h3>
        <div className="row">
          <button className="btn sm" onClick={exportCsv}>⬇ Tải bảng thống kê (.csv)</button>
        </div>
      </div>
      <div className="kpis">
        <div className="kpi"><span>Số dòng</span><b>{n.toLocaleString('vi-VN')}</b></div>
        <div className="kpi"><span>Số cột</span><b>{P.length}</b><small>{overview.num} số · {P.length - overview.num} chữ</small></div>
        <div className="kpi"><span>Ô thiếu</span><b>{((overview.missingCells / (n * P.length)) * 100).toFixed(1)}%</b><small>{overview.missingCells} ô</small></div>
        <div className="kpi"><span>Dòng trùng lặp</span><b>{overview.dup}</b></div>
        {tP && <div className="kpi"><span>Cột đích</span><b className="kpi-text">{target}</b><small>{classMode ? `${classes.length} nhóm` : 'số liên tục'}</small></div>}
      </div>

      {warnings.length > 0 ? <div className="warn-list"><strong>Cần chú ý ({warnings.length})</strong><ul>{warnings.slice(0, 12).map((w) => <li key={w}>{w}</li>)}</ul></div>
        : <p className="ok">Không phát hiện vấn đề rõ ràng (thiếu, trùng, ID, lệch mạnh, tương quan quá cao).</p>}

      <h3>1. Thống kê từng cột</h3>
      <Table data={{ columns: statCols, rows: statRows }} />
      <p className="muted">Mean/SD dùng các giá trị hợp lệ; SD mẫu chia cho n hợp lệ − 1, không xác định khi n &lt; 2. Skew là moment g1, không hiệu chỉnh mẫu nhỏ. Xem histogram cùng mean/median trước khi kết luận hình dạng. Ngoài [Q1 − 1,5·IQR; Q3 + 1,5·IQR] chỉ là cờ thống kê, không tự là lỗi hay bệnh.</p>

      {classMode && tP && <>
        <h3>2. Phân bố cột đích “{target}”</h3>
        <div className="bars">{classes.map((c, k) => { const cnt = tP.values.filter((_, i) => classOf(i) === k).length; return (
          <div key={c} className="bar-row"><span>{c}</span><i style={{ width: `${(cnt / n) * 100}%`, background: cc(k) }} /><b>{cnt} · {((cnt / n) * 100).toFixed(0)}%</b></div>); })}</div>
        {byClass && byClass.rows.length > 0 && <Table caption={`Trung bình (SD mẫu) từng biến theo nhóm “${target}”`} data={byClass} />}
      </>}

      <div className="profile-head">
        <h3>{classMode ? 3 : 2}. Phân bố {focus ? `“${focus}”` : 'từng cột (histogram / tần suất)'}</h3>
        <div className="row">
          {classMode && <label className="check"><input type="checkbox" checked={byTarget} onChange={(e) => setByTarget(e.target.checked)} /> Tô theo “{target}”</label>}
          <select value={focus ?? ''} onChange={(e) => setFocus(e.target.value || null)} aria-label="Chọn cột để phóng to">
            <option value="">Tất cả{P.length > 24 ? ' (24 cột đầu)' : ''}</option>
            {P.map((p) => <option key={p.info.name} value={p.info.name}>{p.info.name}</option>)}
          </select>
        </div>
      </div>
      {classMode && byTarget && <div className="legend">{classes.map((c, k) => <span key={c}><i style={{ background: cc(k) }} />{target} = {c}</span>)}</div>}
      <div className={focus ? 'minis big' : 'minis'}>
        {shown.map((p) => <Mini key={p.info.name} p={p} big={!!focus} classOf={classMode && byTarget && p !== tP ? classOf : null} nC={classes.length} onClick={() => setFocus(focus ? null : p.info.name)} />)}
      </div>

      {nums.length > 0 && <>
        <h3>{classMode ? 4 : 3}. Biểu đồ hộp (boxplot)</h3>
        <p className="muted">Hộp: Q1 → Q3 (50% dữ liệu giữa), vạch trong hộp: median, râu: tới giá trị xa nhất trong 1,5·IQR, chấm: ngoại lai. Mỗi biến có thang riêng.</p>
        <div className="boxes">{nums.filter((p) => p !== tP).slice(0, 24).map((p) => <BoxPlot key={p.info.name} p={p} groups={classMode && byTarget && p !== tP ? { classOf, classes } : null} />)}</div>
      </>}

      {nums.length >= 2 && <>
        <div className="profile-head">
          <h3>{classMode ? 5 : 4}. Quan hệ hai biến (biểu đồ phân tán)</h3>
          <div className="row">
            <label className="axis-pick"><span>X</span><select value={sx} onChange={(e) => setSx(Number(e.target.value))}>{nums.map((p, i) => <option key={p.info.name} value={i}>{p.info.name}</option>)}</select></label>
            <label className="axis-pick"><span>Y</span><select value={sy} onChange={(e) => setSy(Number(e.target.value))}>{nums.map((p, i) => <option key={p.info.name} value={i}>{p.info.name}</option>)}</select></label>
          </div>
        </div>
        <ScatterXY a={nums[Math.min(sx, nums.length - 1)]} b={nums[Math.min(sy, nums.length - 1)]} classOf={classMode && byTarget ? classOf : null} />

        <h3>{classMode ? 6 : 5}. Tương quan Pearson giữa các biến số{nums.length > 20 ? ' (20 cột đầu)' : ''}</h3>
        <div className="tbl-wrap"><table className="tbl heat corr">
          <thead><tr><th />{nums.slice(0, 20).map((c) => <th key={c.info.name} title={c.info.name}>{c.info.name}</th>)}</tr></thead>
          <tbody>{nums.slice(0, 20).map((a, i) => <tr key={a.info.name}><th>{a.info.name}</th>{corr[i].map((r, j) => (
            <td key={j} title={`${a.info.name} – ${nums[j].info.name}: ${g(r, 3)}`} onClick={() => setPick([i, j])} style={{ cursor: 'pointer', background: r === null ? undefined : `color-mix(in srgb, ${r > 0 ? '#2563eb' : '#c0392b'} ${Math.round(Math.abs(r) * 70)}%, white)`, color: r !== null && Math.abs(r) > 0.6 ? '#fff' : undefined }}>{g(r)}</td>
          ))}</tr>)}</tbody>
        </table></div>
        <p className="muted">Xanh = cùng chiều, đỏ = ngược chiều; càng đậm càng mạnh. Bấm một ô để xem biểu đồ phân tán của cặp đó. Tương quan chỉ đo quan hệ tuyến tính, không phải nhân quả.</p>
      </>}

      {assoc.length > 0 && <>
        <h3>{nums.length >= 2 ? (classMode ? 7 : 6) : 3}. Biến nào liên hệ nhiều nhất với “{target}”?</h3>
        <div className="bars">{assoc.slice(0, 15).map((a) => (
          <div key={a.name} className="bar-row" title={a.how}><span>{a.name}</span><i style={{ width: `${Math.min(1, a.abs) * 100}%`, background: a.val !== null && a.val < 0 ? '#c0392b' : undefined }} /><b>{g(a.val, 2)}</b></div>
        ))}</div>
        <p className="muted">{classMode ? 'η² = tỷ lệ phương sai của biến được giải thích bởi nhóm (0 = không khác nhau giữa các nhóm, 1 = tách hoàn toàn).' : 'Hệ số Pearson r với cột đích.'} Đây là liên hệ từng biến riêng lẻ.</p>
      </>}

      <details className="box">
        <summary>Xem trước {Math.min(10, n)} dòng đầu</summary>
        <Table data={{ columns: table.names, rows: table.cells.slice(0, 10) }} />
      </details>
    </section>
  );
}

function Mini({ p, big, classOf, nC, onClick }: { p: Profile; big: boolean; classOf: ((i: number) => number) | null; nC: number; onClick: () => void }) {
  const W = big ? 640 : 220, H = big ? 260 : 110, M = { l: 6, r: 6, t: 6, b: big ? 30 : 20 };
  let bars: { label: string; parts: number[] }[] = [], axis: [string, string] = ['', ''];
  if (p.kind === 'numeric') {
    const B = big ? 30 : 16, lo = p.min ?? 0, hi = p.max ?? 1, w = (hi - lo) / B || 1;
    bars = Array.from({ length: B }, (_, b) => ({ label: `${g(lo + b * w)} – ${g(lo + (b + 1) * w)}`, parts: new Array<number>(Math.max(1, classOf ? nC : 1)).fill(0) }));
    p.v.forEach((x, i) => { if (Number.isNaN(x)) return; const b = Math.min(B - 1, Math.floor((x - lo) / w)); const k = classOf ? classOf(i) : 0; if (k >= 0) bars[b].parts[k]++; });
    axis = [g(lo), g(hi)];
  } else {
    const top = p.top.slice(0, big ? 20 : 8);
    bars = top.map(([v]) => ({ label: v, parts: new Array<number>(Math.max(1, classOf ? nC : 1)).fill(0) }));
    p.values.forEach((v, i) => { const b = top.findIndex((x) => x[0] === v); if (b < 0) return; const k = classOf ? classOf(i) : 0; if (k >= 0) bars[b].parts[k]++; });
    axis = [p.top.length > top.length ? `${top.length}/${p.top.length} mức phổ biến` : `${p.top.length} mức`, ''];
  }
  const mx = Math.max(1, ...bars.map((b) => b.parts.reduce((a, c) => a + c, 0)));
  const bw = (W - M.l - M.r) / Math.max(1, bars.length);
  return (
    <button className="mini-card" onClick={onClick} title={big ? 'Bấm để quay lại tất cả' : 'Bấm để phóng to'}>
      <span className="mini-title">{p.info.name} <small>{p.kind === 'numeric' ? `μ ${g(p.mean)} · median ${g(p.median)} · σ ${g(p.std)}` : `${p.info.unique} mức`}{p.info.missing ? ` · thiếu ${p.info.missing}` : ''}</small></span>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Phân bố ${p.info.name}`}>
        {bars.map((b, i) => { let y = H - M.b; return <g key={i}><title>{`${b.label}: ${b.parts.reduce((a, c) => a + c, 0)}`}</title>{b.parts.map((c, k) => {
          const h = (c / mx) * (H - M.t - M.b); y -= h;
          return <rect key={k} x={M.l + i * bw + 0.6} y={y} width={Math.max(1, bw - 1.2)} height={h} fill={classOf ? cc(k) : '#0ea5c6'} opacity={0.85} />;
        })}{p.kind === 'categorical' && big && <text x={M.l + i * bw + bw / 2} y={H - 10} fontSize="10" textAnchor="middle" fill="#475467">{b.label.slice(0, 10)}</text>}</g>; })}
        {p.kind === 'numeric' && p.mean !== null && p.median !== null && p.max !== p.min && (() => {
          const X = (v: number) => M.l + ((v - (p.min ?? 0)) / ((p.max ?? 1) - (p.min ?? 0))) * (W - M.l - M.r);
          return <g strokeWidth="1.5"><line x1={X(p.mean)} x2={X(p.mean)} y1={M.t} y2={H - M.b} stroke="#c0392b" strokeDasharray="4 3" /><line x1={X(p.median)} x2={X(p.median)} y1={M.t} y2={H - M.b} stroke="#0f1729" /></g>;
        })()}
        <line x1={M.l} x2={W - M.r} y1={H - M.b} y2={H - M.b} stroke="#9ca3af" />
        <text x={M.l} y={H - 5} fontSize="10" fill="#6b7689">{axis[0]}</text>
        <text x={W - M.r} y={H - 5} fontSize="10" textAnchor="end" fill="#6b7689">{axis[1]}</text>
      </svg>
      {p.kind === 'numeric' && <span className="mini-key"><i className="k-med" />median <i className="k-mean" />trung bình</span>}
    </button>
  );
}

function BoxPlot({ p, groups }: { p: Profile & NumProfile; groups: { classOf: (i: number) => number; classes: string[] } | null }) {
  const sets = groups ? groups.classes.map((c, k) => ({ name: c, k, v: p.v.filter((x, i) => !Number.isNaN(x) && groups.classOf(i) === k) })) : [{ name: 'tất cả', k: -1, v: p.v.filter((x) => !Number.isNaN(x)) }];
  const lo = p.min ?? 0, hi = p.max ?? 1, W = 260, rowH = 22, H = sets.length * rowH + 22;
  const X = (v: number) => 8 + ((v - lo) / (hi - lo || 1)) * (W - 16);
  return (
    <figure className="box-card">
      <figcaption className="mini-title">{p.info.name}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Biểu đồ hộp ${p.info.name}`}>
        {sets.map((s, r) => {
          const v = s.v.slice().sort((a, b) => a - b); if (!v.length) return null;
          const q1 = quantile(v, 0.25), q3 = quantile(v, 0.75), md = quantile(v, 0.5), iqr = q3 - q1;
          const wl = v.find((x) => x >= q1 - 1.5 * iqr) ?? v[0], wh = [...v].reverse().find((x) => x <= q3 + 1.5 * iqr) ?? v[v.length - 1];
          const out = v.filter((x) => x < wl || x > wh);
          const y = 6 + r * rowH + rowH / 2, col = s.k >= 0 ? cc(s.k) : '#0ea5c6';
          return <g key={s.name}><title>{`${s.name}: Q1 ${g(q1)}, median ${g(md)}, Q3 ${g(q3)}, ${out.length} ngoại lai`}</title>
            <line x1={X(wl)} x2={X(wh)} y1={y} y2={y} stroke="#6b7689" />
            <line x1={X(wl)} x2={X(wl)} y1={y - 5} y2={y + 5} stroke="#6b7689" /><line x1={X(wh)} x2={X(wh)} y1={y - 5} y2={y + 5} stroke="#6b7689" />
            <rect x={X(q1)} y={y - 7} width={Math.max(1, X(q3) - X(q1))} height={14} fill={col} opacity={0.3} stroke={col} />
            <line x1={X(md)} x2={X(md)} y1={y - 7} y2={y + 7} stroke="#0f1729" strokeWidth="2" />
            {out.slice(0, 80).map((o, j) => <circle key={j} cx={X(o)} cy={y} r={1.8} fill={col} opacity={0.7} />)}
          </g>;
        })}
        <text x={8} y={H - 3} fontSize="10" fill="#6b7689">{g(lo)}</text>
        <text x={W - 8} y={H - 3} fontSize="10" textAnchor="end" fill="#6b7689">{g(hi)}</text>
      </svg>
    </figure>
  );
}

function ScatterXY({ a, b, classOf }: { a: Profile & NumProfile; b: Profile & NumProfile; classOf: ((i: number) => number) | null }) {
  const W = 640, H = 380, M = { l: 56, r: 14, t: 12, b: 42 };
  let idx = a.v.map((_, i) => i).filter((i) => !Number.isNaN(a.v[i]) && !Number.isNaN(b.v[i]));
  if (idx.length > 2500) { const st = idx.length / 2500; idx = Array.from({ length: 2500 }, (_, k) => idx[Math.floor(k * st)]); }
  const xs = idx.map((i) => a.v[i]), ys = idx.map((i) => b.v[i]);
  const pad = (lo: number, hi: number): [number, number] => { const p = (hi - lo) * 0.05 || 1; return [lo - p, hi + p]; };
  const rx = pad(Math.min(...xs), Math.max(...xs)), ry = pad(Math.min(...ys), Math.max(...ys));
  const X = (v: number) => M.l + ((v - rx[0]) / (rx[1] - rx[0])) * (W - M.l - M.r);
  const Y = (v: number) => H - M.b - ((v - ry[0]) / (ry[1] - ry[0])) * (H - M.t - M.b);
  const r = pearson(xs, ys);
  // Đường hồi quy tuyến tính đơn giản để thấy xu hướng.
  const mx = xs.reduce((s, v) => s + v, 0) / xs.length, my = ys.reduce((s, v) => s + v, 0) / ys.length;
  const sxx = xs.reduce((s, v) => s + (v - mx) ** 2, 0), slope = sxx ? xs.reduce((s, v, i) => s + (v - mx) * (ys[i] - my), 0) / sxx : 0;
  return (
    <figure className="chart">
      <div role="img" aria-label={`Biểu đồ phân tán ${a.info.name} theo ${b.info.name}, r = ${g(r)}`}>
        <svg viewBox={`0 0 ${W} ${H}`}>
          <rect width={W} height={H} fill="#fff" />
          {[0, 1, 2, 3, 4].map((k) => { const xv = rx[0] + ((rx[1] - rx[0]) * k) / 4, yv = ry[0] + ((ry[1] - ry[0]) * k) / 4; return <g key={k} fontSize="11" fill="#475467">
            <line x1={X(xv)} x2={X(xv)} y1={M.t} y2={H - M.b} stroke="#eef0f3" /><line x1={M.l} x2={W - M.r} y1={Y(yv)} y2={Y(yv)} stroke="#eef0f3" />
            <text x={X(xv)} y={H - M.b + 16} textAnchor="middle">{g(xv, 1)}</text><text x={M.l - 6} y={Y(yv) + 4} textAnchor="end">{g(yv, 1)}</text></g>; })}
          <rect x={M.l} y={M.t} width={W - M.l - M.r} height={H - M.t - M.b} fill="none" stroke="#9ca3af" />
          {idx.map((i, k) => <circle key={k} cx={X(xs[k])} cy={Y(ys[k])} r={3.2} fill={classOf ? cc(classOf(i)) : '#0ea5c6'} opacity={0.6} />)}
          <line x1={X(rx[0])} y1={Y(my + slope * (rx[0] - mx))} x2={X(rx[1])} y2={Y(my + slope * (rx[1] - mx))} stroke="#0f1729" strokeDasharray="6 4" strokeWidth="1.5" />
          <text x={(M.l + W - M.r) / 2} y={H - 8} textAnchor="middle" fontSize="12.5" fontWeight="600" fill="#0f1729">{a.info.name}</text>
          <text transform={`translate(15 ${(M.t + H - M.b) / 2}) rotate(-90)`} textAnchor="middle" fontSize="12.5" fontWeight="600" fill="#0f1729">{b.info.name}</text>
          <text x={W - M.r - 8} y={M.t + 18} textAnchor="end" fontSize="13" fontWeight="700" fill="#0f1729">r = {g(r)}</text>
        </svg>
      </div>
      <figcaption className="muted">{idx.length} điểm. Đường đứt: xu hướng tuyến tính. |r| gần 1: quan hệ tuyến tính mạnh; gần 0: không có quan hệ tuyến tính (có thể vẫn có quan hệ cong).</figcaption>
    </figure>
  );
}
