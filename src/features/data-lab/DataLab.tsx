import { useMemo, useState } from 'react';
import { describe, histogram, pearson, type Stats } from '../../core/algorithms/dataset';
import { preprocessDemo, type DemoScale } from '../../core/algorithms/preprocessDemo';
import { makeRng } from '../../core/algorithms/rng';
import { fmt } from '../../core/algorithms/metrics';
import { Chart, Field, Table } from '../../app/ui';
import type { LabData } from '../ml-lab/useData';

type Impute = 'mean' | 'median' | 'drop';
type Cell = number | null;

export function DataLab({ d }: { d: LabData }) {
  const [miss, setMiss] = useState(10);
  const [outl, setOutl] = useState(3);
  const [impute, setImpute] = useState<Impute>('median');
  const [clip, setClip] = useState(false);
  const [scale, setScale] = useState<DemoScale>('none');
  const [feat, setFeat] = useState(0);
  const [zeroAsMissing, setZeroAsMissing] = useState(true);

  // Bảng gốc của phần train. Với Pima: 0 không hợp lý sinh lý có thể là mã hóa "thiếu". Với dữ liệu mô phỏng: chèn nhiễu có seed.
  const base = useMemo(() => {
    if (d.source !== 'synthetic' && d.raw && d.trainRaw) {
      const zero = new Set(d.zeroCols.map((n) => d.raw!.names.indexOf(n)));
      const tr = d.trainRaw; // cùng cách chia với các phòng thí nghiệm khác
      return {
        names: d.raw.names.map(d.label),
        y: tr.map((s) => s.y),
        clean: null as Cell[][] | null,
        rows: tr.map((s) => s.x.map((v, j) => (Number.isNaN(v) || (zeroAsMissing && zero.has(j) && v === 0) ? null : v))),
        zeros: d.raw.names.map((_, j) => tr.filter((s) => s.x[j] === 0).length),
        n: tr.length,
      };
    }
    const rng = makeRng(d.seed + 99);
    const clean: Cell[][] = d.split.train.map((s) => s.x);
    return {
      names: d.ds.featureNames, y: d.split.train.map((s) => s.y), clean,
      rows: clean.map((r) => r.map((v, j) => (rng() < miss / 100 ? null : rng() < outl / 100 ? (v as number) * (j === 0 ? 3 : 2.5) : v))),
      zeros: d.ds.featureNames.map(() => 0), n: d.split.train.length,
    };
  }, [d, miss, outl, zeroAsMissing]);

  const processed = useMemo(() => preprocessDemo(base.rows, impute, clip, scale), [base, impute, clip, scale]);

  const statRow = (name: string, s: Stats) => [name, String(s.n), String(s.missing), fmt(s.mean, 2), fmt(s.std, 2), fmt(s.min, 2), fmt(s.median, 2), fmt(s.max, 2)];
  const states = d.source === 'synthetic' ? ['gốc (sạch)', 'sau làm bẩn', 'sau tiền xử lý'] : ['dữ liệu đọc được', 'sau tiền xử lý'];
  const table = { columns: ['Biến — trạng thái', 'Tổng dòng', 'Thiếu', 'Trung bình', 'SD mẫu (n−1)', 'Min', 'Median', 'Max'],
    rows: base.names.flatMap((n, j) => [
      ...(base.clean ? [statRow(`${n} — ${states[0]}`, describe(base.clean.map((r) => r[j])))] : []),
      statRow(`${n} — ${base.clean ? states[1] : states[0]}`, describe(base.rows.map((r) => r[j]))),
      statRow(`${n} — ${states[states.length - 1]}`, describe(processed.rows.map((r) => r[j]))),
      ...(scale === 'none' ? [] : [statRow(`${n} — ${scale === 'zscore' ? 'Z-score' : 'Min-Max'}`, describe(processed.scaled.map(r => r[j])))]),
    ]) };

  const colVals = (rows: Cell[][], j: number) => rows.map((r) => r[j]).filter((v): v is number => v !== null);
  const all = colVals(base.rows, feat);
  const lo = Math.min(...all), hi = Math.max(...all);
  const hist = (label: number) => histogram(colVals(base.rows.filter((_, i) => base.y[i] === label), feat), lo, hi, 12).map((b) => [Number(b.center.toFixed(1)), b.count] as [number, number]);
  const chart = { title: `Phân bố ${base.names[feat]} theo nhóm (tập train, giá trị đọc được)`, xLabel: base.names[feat], yLabel: 'Số mẫu',
    series: [{ name: d.ds.classNames[0], points: hist(0) }, { name: d.ds.classNames[1], points: hist(1) }] };
  const pos = base.y.filter((y) => y === 1).length;
  const keptPos = processed.retainedIndices.filter(i => base.y[i] === 1).length;
  const corr = base.names.map((n, j) => { const ok = base.rows.map((r, i) => [r[j], base.y[i]] as const).filter((p): p is [number, 0 | 1] => p[0] !== null); return [n, fmt(pearson(ok.map((p) => p[0]), ok.map((p) => p[1])), 3)]; });

  return (
    <div className="lab">
      <section className="controls">
        {d.panel}
        {d.source === 'synthetic' ? (
          <div className="box">
            <strong>Làm bẩn dữ liệu (để thực hành)</strong>
            <Field label={`Tỷ lệ thiếu giá trị = ${miss}%`}><input type="range" min={0} max={40} value={miss} onChange={(e) => setMiss(Number(e.target.value))} /></Field>
            <Field label={`Tỷ lệ bất thường = ${outl}%`}><input type="range" min={0} max={15} value={outl} onChange={(e) => setOutl(Number(e.target.value))} /></Field>
          </div>
        ) : (
          <div className="box"><label className="check"><input type="checkbox" checked={zeroAsMissing} onChange={(e) => setZeroAsMissing(e.target.checked)} /> {d.zeroCols.length ? `Coi 0 là thiếu ở ${d.zeroCols.map(d.label).join(', ')}` : 'Coi 0 là thiếu (không có cột nào nghi ngờ)'}</label>
            <p className="muted">Số giá trị bằng 0 theo biến (train): {base.names.map((n, j) => `${n}: ${base.zeros[j]}`).join('; ')}.</p></div>
        )}
        <div className="box">
          <strong>Tiền xử lý (fit trên train)</strong>
          <Field label="Xử lý giá trị thiếu"><select value={impute} onChange={(e) => setImpute(e.target.value as Impute)}>
            <option value="mean">Điền trung bình</option><option value="median">Điền median</option><option value="drop">Xóa dòng thiếu</option></select></Field>
          <label className="check"><input type="checkbox" checked={clip} onChange={(e) => setClip(e.target.checked)} /> Cắt bất thường theo IQR (1.5×)</label>
          <p className="muted">Không mặc định cắt: điểm ngoài IQR có thể là ca thật. Chỉ bật khi có lý do và kiểm tra ảnh hưởng.</p>
          <Field label="So sánh thang đo (minh họa trên train)"><select id="data-demo-scale" value={scale} onChange={e => setScale(e.target.value as DemoScale)}><option value="none">Thang gốc</option><option value="zscore">Z-score</option><option value="minmax">Min-Max</option></select></Field>
        </div>
        <div className="box"><Field label="Biến xem phân bố"><select value={feat} onChange={(e) => setFeat(Number(e.target.value))}>
          {base.names.map((n, i) => <option key={n} value={i}>{n}</option>)}</select></Field></div>
      </section>
      <section className="main">
        <p>Tập train: {base.n} mẫu. Tỷ lệ nhãn: {d.ds.classNames[1]} {(100 * pos / base.n).toFixed(1)}% · {d.ds.classNames[0]} {(100 - 100 * pos / base.n).toFixed(1)}%.
          {pos / base.n < 0.4 && ' Dữ liệu lệch nhãn nên accuracy một mình có thể gây hiểu lầm; hãy xem recall và precision.'}</p>
        <Chart spec={chart} />
        <h3>So sánh trước/sau tiền xử lý</h3>
        <p>Sau xử lý giữ {processed.rows.length}/{base.n} dòng. Tỷ lệ lớp {d.ds.classNames[1]}: {processed.rows.length ? `${(100 * keptPos / processed.rows.length).toFixed(1)}% (${keptPos}/${processed.rows.length})` : 'không xác định vì không còn dòng'}.</p>
        {processed.emptyColumns.length > 0 && <p role="alert">Không có giá trị train hợp lệ ở: {processed.emptyColumns.map(j => base.names[j]).join(', ')}. Không thể học giá trị điền; giữ thiếu, không tự thay bằng 0.</p>}
        <Table data={table} />
        <p className="muted">SD mô tả dùng n hợp lệ − 1; Z-score dùng SD mẫu số n như StandardScaler. Cột hằng biến thành 0; cột không có dữ liệu vẫn thiếu. Đây là minh họa, không thay đổi pipeline của các lab khác.</p>
        <Table caption="Tương quan Pearson giữa từng biến và nhãn (bỏ qua ô thiếu; chỉ mô tả, không kết luận nhân quả)" data={{ columns: ['Biến', 'r với nhãn'], rows: corr }} />
        <p className="muted">Xóa dòng thiếu làm giảm n và có thể lệch nhóm; điền trung bình bị kéo bởi giá trị bất thường, median ít bị ảnh hưởng hơn. Giá trị điền và ngưỡng IQR chỉ tính từ train để không rò rỉ sang validation/test.</p>
      </section>
    </div>
  );
}
