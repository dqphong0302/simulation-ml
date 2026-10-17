import { useEffect, useMemo, useRef, useState } from 'react';
import { IMAGES } from '../../core/algorithms/conv';
import { alphaBar, decode, encode, initAe, noisify, trainAeEpoch } from '../../core/algorithms/autoencoder';
import { Chart, Field, Table } from '../../app/ui';
import type { LabData } from '../ml-lab/useData';
import { Plot } from '../ml-lab/ExtraLabs';
import { Heat } from './CnnLab';

export function AutoencoderLab({ d }: { d: LabData }) {
  const X = useMemo(() => d.scaled.train.map((s) => [s.x[0], s.x[1]]), [d]);
  const [lr, setLr] = useState(0.2);
  const [, bump] = useState(0);
  const [running, setRunning] = useState(false);
  const model = useRef(initAe(2, 1, d.seed));
  const hist = useRef<number[]>([]);
  const reset = () => { model.current = initAe(2, 1, d.seed); hist.current = []; setRunning(false); bump((v) => v + 1); };
  useEffect(reset, [d]); // eslint-disable-line react-hooks/exhaustive-deps
  const run = (n: number) => { for (let i = 0; i < n && hist.current.length < 3000; i++) hist.current.push(trainAeEpoch(model.current, X, lr)); bump((v) => v + 1); };
  useEffect(() => { if (!running) return; const id = setInterval(() => { run(20); if (hist.current.length >= 3000) setRunning(false); }, 50); return () => clearInterval(id); }); // eslint-disable-line react-hooks/exhaustive-deps
  const rec = X.map((x) => decode(model.current, encode(model.current, x)));
  const valX = d.scaled.val.map((s) => [s.x[0], s.x[1]]);
  const mse = (A: number[][]) => A.reduce((s, x) => { const r = decode(model.current, encode(model.current, x)); return s + ((r[0] - x[0]) ** 2 + (r[1] - x[1]) ** 2) / 2; }, 0) / A.length;
  const every = Math.max(1, Math.floor(hist.current.length / 40));
  const chart = { title: 'Autoencoder: lỗi tái dựng (MSE) theo epoch', xLabel: 'Epoch', yLabel: 'MSE (train)', series: [{ name: 'MSE', points: hist.current.map((v, i) => [i + 1, v] as [number, number]).filter(([i]) => i % every === 0 || i === hist.current.length) }] };
  const table = { columns: ['Chỉ số', 'Giá trị'], rows: [['Epoch', String(hist.current.length)], ['MSE train', hist.current.length ? mse(X).toFixed(4) : 'n/a'], ['MSE validation', hist.current.length ? mse(valX).toFixed(4) : 'n/a'], ['Kích thước bottleneck', '1 (nén 2 → 1 → 2)']] };
  return (
    <div className="lab">
      <section className="controls">{d.panel}
        <div className="box"><Field label={`Learning rate = ${lr}`}><input type="range" min={0.01} max={1} step={0.01} value={lr} onChange={(e) => setLr(Number(e.target.value))} /></Field>
          <div className="row"><button onClick={() => run(1)}>1 epoch</button><button onClick={() => run(100)}>+100</button><button className="primary" aria-pressed={running} onClick={() => setRunning(!running)}>{running ? 'Dừng' : 'Chạy'}</button><button onClick={reset}>Đặt lại</button></div></div></section>
      <section className="main">
        <p className="badge">Huấn luyện thật trên dữ liệu nhỏ</p>
        <p>Autoencoder nén 2 biến thành 1 số (bottleneck) rồi dựng lại. Tròn = điểm gốc (chuẩn hóa); tam giác = điểm sau tái dựng. Các điểm tái dựng nằm trên một đường cong vì latent chỉ có 1 chiều. Lỗi lớn có thể do nén mất thông tin, chưa học đủ hoặc dữ liệu khác phân phối; không tự xác nhận có bệnh.</p>
        <Plot pts={[...X, ...rec]} groups={[...X.map(() => 0), ...rec.map(() => 1)]} xl={`${d.ds.featureNames[0]} (chuẩn hóa)`} yl={`${d.ds.featureNames[1]} (chuẩn hóa)`} />
        <Table data={table} /><Chart spec={chart} />
        <p className="muted">VAE và GAN cũng đã có trong khoá: xem bài VAE (latent là một phân phối) và bài GAN (sinh đối kháng) ở nhóm Deep Learning.</p>
      </section>
    </div>
  );
}

export function DiffusionLab() {
  const T = 100;
  const [t, setT] = useState(30);
  const [seed, setSeed] = useState(1);
  const x0 = IMAGES['Chữ T'];
  const flat = x0.flat().map((v) => v * 2 - 1); // đưa về [-1, 1]
  const xt = noisify(flat, t, T, seed);
  const grid = Array.from({ length: 8 }, (_, y) => xt.slice(y * 8, y * 8 + 8).map((v) => Number(v.toFixed(2))));
  const ab = alphaBar(t, T);
  const pts = [0, 10, 25, 50, 75, 100].map((s) => [s, alphaBar(s, T)] as [number, number]);
  const chart = { title: 'Diffusion thuận: tín hiệu còn lại ᾱ(t)', xLabel: 'Bước t', yLabel: 'ᾱ(t)', series: [{ name: 'ᾱ(t)', points: pts }] };
  const table = { columns: ['Đại lượng', 'Giá trị'], rows: [['t / T', `${t} / ${T}`], ['ᾱ(t)', ab.toFixed(4)], ['Hệ số tín hiệu √ᾱ', Math.sqrt(ab).toFixed(4)], ['Hệ số nhiễu √(1−ᾱ)', Math.sqrt(1 - ab).toFixed(4)]] };
  return (
    <div className="lab">
      <section className="controls"><div className="box"><Field label={`Bước t = ${t}`}><input type="range" min={0} max={T} value={t} onChange={(e) => setT(Number(e.target.value))} /></Field>
        <Field label="Seed nhiễu"><input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value) || 0)} /></Field></div></section>
      <section className="main">
        <p className="badge">Mô phỏng nguyên lý — chỉ quá trình thêm nhiễu (thuận)</p>
        <div className="row" style={{ alignItems: 'flex-start', gap: 24 }}><Heat g={x0.map((r) => r.map((v) => v * 2 - 1))} label="Ảnh gốc x₀ (−1/+1)" /><Heat g={grid} label={`Ảnh nhiễu x_t, t = ${t}`} /></div>
        <p>Công thức: <code>x_t = √ᾱ_t · x₀ + √(1−ᾱ_t) · ε</code>, ε ~ N(0, 1). Khi t tăng, tín hiệu giảm và nhiễu tăng cho tới khi gần như chỉ còn nhiễu. Mô hình diffusion thật học cách đảo ngược quá trình này; trang này không có mô hình khử nhiễu và không sinh ảnh mới.</p>
        <Table data={table} /><Chart spec={chart} />
      </section>
    </div>
  );
}

import { Gan1d, Vae } from '../../core/algorithms/nn';
import { gaussian, makeRng } from '../../core/algorithms/rng';
import { histogram } from '../../core/algorithms/dataset';
import { inspectColumns, parseFreeCsv, toNumber, type FreeTable } from '../../core/datasets/freecsv';

export function VaeLab({ d }: { d: LabData }) {
  const X = useMemo(() => d.scaled.train.map((s) => [s.x[0], s.x[1]]), [d]);
  const [lr, setLr] = useState(0.05);
  const [beta, setBeta] = useState(0.1);
  const [, bump] = useState(0);
  const [running, setRunning] = useState(false);
  const vae = useRef(new Vae(2, 1, 8, d.seed));
  const hist = useRef<{ recon: number; kl: number }[]>([]);
  const reset = () => { vae.current = new Vae(2, 1, 8, d.seed); hist.current = []; setRunning(false); bump((v) => v + 1); };
  useEffect(reset, [d]); // eslint-disable-line react-hooks/exhaustive-deps
  const run = (n: number) => { for (let i = 0; i < n && hist.current.length < 2000; i++) hist.current.push(vae.current.epoch(X, lr, beta)); bump((v) => v + 1); };
  useEffect(() => { if (!running) return; const id = setInterval(() => { run(10); if (hist.current.length >= 2000) setRunning(false); }, 60); return () => clearInterval(id); }); // eslint-disable-line react-hooks/exhaustive-deps
  const gen = useMemo(() => (hist.current.length ? vae.current.sample(150) : []), [hist.current.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const every = Math.max(1, Math.floor(hist.current.length / 40));
  const ser = (k: 'recon' | 'kl', name: string) => ({ name, points: hist.current.map((h, i) => [i + 1, h[k]] as [number, number]).filter(([i]) => i % every === 0 || i === hist.current.length) });
  const chart = { title: 'VAE: thành phần của loss theo epoch', xLabel: 'Epoch', yLabel: 'Giá trị (train)', series: [ser('recon', 'Tái dựng (MSE)'), ser('kl', 'KL')] };
  const last = hist.current[hist.current.length - 1];
  const table = { columns: ['Chỉ số', 'Giá trị'], rows: [['Epoch', String(hist.current.length)], ['MSE tái dựng', last ? last.recon.toFixed(4) : 'n/a'], ['KL', last ? last.kl.toFixed(4) : 'n/a'], ['β (trọng số KL)', String(beta)]] };
  return (
    <div className="lab">
      <section className="controls">{d.panel}
        <div className="box"><Field label={`Learning rate = ${lr}`}><input type="range" min={0.005} max={0.2} step={0.005} value={lr} onChange={(e) => setLr(Number(e.target.value))} /></Field>
          <Field label={`β (KL) = ${beta}`}><input type="range" min={0} max={2} step={0.05} value={beta} onChange={(e) => setBeta(Number(e.target.value))} /></Field>
          <div className="row"><button onClick={() => run(1)}>1 epoch</button><button onClick={() => run(100)}>+100</button><button className="primary" aria-pressed={running} onClick={() => setRunning(!running)}>{running ? 'Dừng' : 'Chạy'}</button><button onClick={reset}>Đặt lại</button></div></div></section>
      <section className="main">
        <p className="badge">Huấn luyện thật trên dữ liệu nhỏ — VAE với latent 1 chiều</p>
        <p>VAE mã hóa mỗi điểm thành phân phối N(μ, σ²) trên latent z, lấy mẫu z bằng reparameterization rồi giải mã. Loss = tái dựng + β·KL(q(z|x) ‖ N(0,1)). Tròn = dữ liệu tham chiếu; tam giác = điểm <b>mới sinh</b> bằng cách lấy z ~ N(0,1) rồi giải mã. β tăng trọng số KL, có thể đánh đổi với tái dựng; không bảo đảm chất lượng sinh hoặc từng metric thay đổi đơn điệu.</p>
        <Plot pts={[...X, ...gen]} groups={[...X.map(() => 0), ...gen.map(() => 1)]} xl={`${d.ds.featureNames[0]} (chuẩn hóa)`} yl={`${d.ds.featureNames[1]} (chuẩn hóa)`} />
        <Table data={table} /><Chart spec={chart} />
        <p className="muted">Mô hình rất nhỏ trên 2 biến; mẫu sinh nằm gần một đường cong vì latent chỉ có 1 chiều. Đây là minh họa nguyên lý, không phải mô hình sinh ảnh/văn bản.</p>
      </section>
    </div>
  );
}

type Real = 'one' | 'two' | 'csv';
const realSampler = (kind: Real, rng: () => number) => () => (kind === 'one' ? 3 + 0.5 * gaussian(rng) : (rng() < 0.5 ? 1 : 4) + 0.4 * gaussian(rng));

// CSV riêng của bài GAN, giữ trong phiên khi chuyển tab.
let ganCsv: { name: string; table: FreeTable; col: string } | null = null;

export function GanLab() {
  const [csv, setCsvState] = useState(ganCsv);
  const setCsv = (c: typeof ganCsv) => { ganCsv = c; setCsvState(c); };
  const [csvErr, setCsvErr] = useState<string | null>(null);
  const [kind, setKind] = useState<Real>(ganCsv ? 'csv' : 'one');
  const numCols = useMemo(() => (csv ? inspectColumns(csv.table).filter((c) => c.kind === 'numeric').map((c) => c.name) : []), [csv]);
  // Cột CSV được đưa về cùng thang với ví dụ (trung bình 2,5; độ lệch chuẩn 1,2) để mạng nhỏ học được; bảng thống kê ghi cả đơn vị gốc.
  const csvData = useMemo(() => {
    if (!csv) return null;
    const j = csv.table.names.indexOf(csv.col);
    const dec = inspectColumns(csv.table).find((c) => c.name === csv.col)?.decimal;
    const v = csv.table.cells.map((r) => toNumber(r[j], dec)).filter((x) => Number.isFinite(x));
    if (v.length < 10) return null;
    const m = v.reduce((a, b) => a + b, 0) / v.length, sd = Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length) || 1;
    return { m, sd, z: v.map((x) => 2.5 + 1.2 * ((x - m) / sd)) };
  }, [csv]);
  const upload = (f: File | undefined) => {
    if (!f) return;
    f.text().then((t) => {
      try {
        const table = parseFreeCsv(t);
        const nums = inspectColumns(table).filter((c) => c.kind === 'numeric');
        if (!nums.length) throw new Error('CSV cần ít nhất một cột số.');
        setCsv({ name: f.name, table, col: nums[0].name }); setKind('csv'); setCsvErr(null);
      } catch (e) { setCsvErr((e as Error).message); }
    }, () => setCsvErr('Không đọc được tệp.'));
  };
  const sampler = (k: Real, r: () => number) => (k === 'csv' && csvData ? () => csvData.z[Math.floor(r() * csvData.z.length)] : realSampler(k === 'csv' ? 'one' : k, r));
  const [seed, setSeed] = useState(1);
  const [lr, setLr] = useState(0.05);
  const [, bump] = useState(0);
  const [running, setRunning] = useState(false);
  const gan = useRef(new Gan1d(8, seed));
  const rng = useRef(makeRng(seed + 1));
  const log = useRef<{ d: number; g: number }[]>([]);
  const reset = () => { gan.current = new Gan1d(8, seed); rng.current = makeRng(seed + 1); log.current = []; setRunning(false); bump((v) => v + 1); };
  useEffect(reset, [kind, seed, csvData]); // eslint-disable-line react-hooks/exhaustive-deps
  const run = (n: number) => { const s = sampler(kind, rng.current); for (let i = 0; i < n && log.current.length < 6000; i++) { const r = gan.current.step(Array.from({ length: 32 }, s), lr, lr); log.current.push({ d: r.dLoss, g: r.gLoss }); } bump((v) => v + 1); };
  useEffect(() => { if (!running) return; const id = setInterval(() => { run(25); if (log.current.length >= 6000) setRunning(false); }, 60); return () => clearInterval(id); }); // eslint-disable-line react-hooks/exhaustive-deps
  const real = useMemo(() => { const s = sampler(kind, makeRng(99)); return Array.from({ length: 1000 }, s); }, [kind, csvData]); // eslint-disable-line react-hooks/exhaustive-deps
  const fake = log.current.length ? (() => { const r = makeRng(77); return Array.from({ length: 1000 }, () => gan.current.gen(gaussian(r))); })() : [];
  const lo = -2, hi = 7, bins = 28;
  const h = (a: number[]) => histogram(a, lo, hi, bins).map((b) => [Number(b.center.toFixed(2)), b.count / (a.length * ((hi - lo) / bins))] as [number, number]);
  const chart = { title: 'GAN 1D: mật độ dữ liệu thật và dữ liệu sinh', xLabel: 'Giá trị x', yLabel: 'Mật độ (ước lượng histogram)', series: [{ name: 'Dữ liệu thật', points: h(real) }, ...(fake.length ? [{ name: 'Generator', points: h(fake) }] : [])] };
  const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / (a.length || 1), sd = (a: number[]) => Math.sqrt(mean(a.map((v) => (v - mean(a)) ** 2)));
  const lastL = log.current[log.current.length - 1];
  const table = { columns: ['Chỉ số', 'Dữ liệu thật', 'Generator'], rows: [['Trung bình', mean(real).toFixed(3), fake.length ? mean(fake).toFixed(3) : 'n/a'], ['Độ lệch chuẩn', sd(real).toFixed(3), fake.length ? sd(fake).toFixed(3) : 'n/a'], ['Số bước huấn luyện', '', String(log.current.length)], ['Loss D / G (bước cuối)', '', lastL ? `${lastL.d.toFixed(3)} / ${lastL.g.toFixed(3)}` : 'n/a']] };
  return (
    <div className="lab">
      <section className="controls">
        <div className="box"><Field label="Phân phối thật"><select value={kind} onChange={(e) => setKind(e.target.value as Real)}><option value="one">Một đỉnh N(3; 0,5)</option><option value="two">Hai đỉnh (1 và 4)</option>{csv && <option value="csv">Cột CSV: {csv.name}</option>}</select></Field>
          <div className="row tight"><label className="btn sm file-btn">⬆ Tải CSV cho bài này<input type="file" accept=".csv,.tsv,.txt,text/csv" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} /></label>{csv && <button className="btn sm" onClick={() => { setCsv(null); setKind('one'); }}>Bỏ CSV</button>}</div>
          {csvErr && <p className="warn" role="alert">{csvErr}</p>}
          {kind === 'csv' && csv && <Field label="Cột làm dữ liệu thật"><select value={csv.col} onChange={(e) => setCsv({ ...csv, col: e.target.value })}>{numCols.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>}
          {kind === 'csv' && csvData && <p className="muted">Cột “{csv!.col}” (trung bình {csvData.m.toPrecision(4)}, độ lệch chuẩn {csvData.sd.toPrecision(4)}) được đổi thang thành 2,5 + 1,2·z để mạng nhỏ học được.</p>}
          <Field label="Seed"><input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value) || 0)} /></Field>
          <Field label={`Learning rate = ${lr}`}><input type="range" min={0.005} max={0.2} step={0.005} value={lr} onChange={(e) => setLr(Number(e.target.value))} /></Field>
          <div className="row"><button onClick={() => run(25)}>+25 bước</button><button className="primary" aria-pressed={running} onClick={() => setRunning(!running)}>{running ? 'Dừng' : 'Chạy'}</button><button onClick={reset}>Đặt lại</button></div></div></section>
      <section className="main">
        <p className="badge">Huấn luyện thật trên dữ liệu 1 chiều</p>
        <p>Generator biến nhiễu z thành số x; Discriminator cố phân biệt x thật và x giả. Hai mạng luyện luân phiên: D học tách thật/giả, G học đánh lừa D. Khi G học tốt, đường “Generator” trùng đường “Dữ liệu thật”.</p>
        <Chart spec={chart} /><Table data={table} />
        <p className="muted">GAN huấn luyện không ổn định: với hai đỉnh, G có thể chỉ bắt được một đỉnh (mode collapse). Thử đổi seed và learning rate để quan sát. Ví dụ chỉ minh họa nguyên lý trên dữ liệu 1 chiều.</p>
      </section>
    </div>
  );
}
