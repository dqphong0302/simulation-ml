import { useMemo, useState } from 'react';
import { describe, histogram, pearson, quantile, type Stats } from '../../core/algorithms/dataset';
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
  const [clip, setClip] = useState(true);
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

  const cleaned = useMemo(() => {
    const cols = base.names.map((_, j) => base.rows.map((r) => r[j]));
    // Mọi phép fit (trung bình, trung vị, ngưỡng IQR) chỉ dùng tập train.
    const fitted = cols.map((c) => {
      const v = c.filter((x): x is number => x !== null).sort((a, b) => a - b);
      const q1 = quantile(v, 0.25), q3 = quantile(v, 0.75), iqr = q3 - q1, st = describe(v);
      return { fill: impute === 'mean' ? st.mean ?? 0 : st.median ?? 0, lo: q1 - 1.5 * iqr, hi: q3 + 1.5 * iqr };
    });
    let rows = base.rows.map((r, i) => ({ x: r, y: base.y[i] }));
    if (impute === 'drop') rows = rows.filter((r) => r.x.every((v) => v !== null));
    return rows.map((r) => ({ y: r.y, x: r.x.map((v, j) => { const val = v ?? fitted[j].fill; return clip ? Math.min(fitted[j].hi, Math.max(fitted[j].lo, val)) : val; }) }));
  }, [base, impute, clip]);

  const statRow = (name: string, s: Stats) => [name, String(s.n), String(s.missing), fmt(s.mean, 2), fmt(s.std, 2), fmt(s.min, 2), fmt(s.median, 2), fmt(s.max, 2)];
  const states = d.source === 'synthetic' ? ['gốc (sạch)', 'sau làm bẩn', 'sau tiền xử lý'] : ['dữ liệu đọc được', 'sau tiền xử lý'];
  const table = { columns: ['Biến — trạng thái', 'n', 'Thiếu', 'Trung bình', 'Độ lệch chuẩn', 'Min', 'Median', 'Max'],
    rows: base.names.flatMap((n, j) => [
      ...(base.clean ? [statRow(`${n} — ${states[0]}`, describe(base.clean.map((r) => r[j])))] : []),
      statRow(`${n} — ${base.clean ? states[1] : states[0]}`, describe(base.rows.map((r) => r[j]))),
      statRow(`${n} — ${states[states.length - 1]}`, describe(cleaned.map((r) => r.x[j]))),
    ]) };

  const colVals = (rows: Cell[][], j: number) => rows.map((r) => r[j]).filter((v): v is number => v !== null);
  const all = colVals(base.rows, feat);
  const lo = Math.min(...all), hi = Math.max(...all);
  const hist = (label: number) => histogram(colVals(base.rows.filter((_, i) => base.y[i] === label), feat), lo, hi, 12).map((b) => [Number(b.center.toFixed(1)), b.count] as [number, number]);
  const chart = { title: `Phân bố ${base.names[feat]} theo nhóm (tập train, giá trị đọc được)`, xLabel: base.names[feat], yLabel: 'Số mẫu',
    series: [{ name: d.ds.classNames[0], points: hist(0) }, { name: d.ds.classNames[1], points: hist(1) }] };
  const pos = base.y.filter((y) => y === 1).length;
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
        </div>
        <div className="box"><Field label="Biến xem phân bố"><select value={feat} onChange={(e) => setFeat(Number(e.target.value))}>
          {base.names.map((n, i) => <option key={n} value={i}>{n}</option>)}</select></Field></div>
      </section>
      <section className="main">
        <p>Tập train: {base.n} mẫu. Tỷ lệ nhãn: {d.ds.classNames[1]} {(100 * pos / base.n).toFixed(1)}% · {d.ds.classNames[0]} {(100 - 100 * pos / base.n).toFixed(1)}%.
          {pos / base.n < 0.4 && ' Dữ liệu lệch nhãn nên accuracy một mình có thể gây hiểu lầm; hãy xem recall và precision.'}</p>
        <Chart spec={chart} />
        <h3>So sánh trước/sau tiền xử lý</h3>
        <Table data={table} />
        <Table caption="Tương quan Pearson giữa từng biến và nhãn (bỏ qua ô thiếu; chỉ mô tả, không kết luận nhân quả)" data={{ columns: ['Biến', 'r với nhãn'], rows: corr }} />
        <p className="muted">Xóa dòng thiếu làm giảm n và có thể lệch nhóm; điền trung bình bị kéo bởi giá trị bất thường, median ít bị ảnh hưởng hơn. Giá trị điền và ngưỡng IQR chỉ tính từ train để không rò rỉ sang validation/test.</p>
      </section>
    </div>
  );
}
