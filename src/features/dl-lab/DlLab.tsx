import { useEffect, useMemo, useRef, useState } from 'react';
import { makeCircles, fitScaler, scaleSamples, splitDataset } from '../../core/algorithms/dataset';
import type { LabData } from '../ml-lab/useData';
import { act, forward, initMlp, predictProba, type Activation } from '../../core/algorithms/mlp';
import type { MlpOut } from '../../workers/mlp.worker';
import { evaluate, fmt } from '../../core/algorithms/metrics';
import { Chart, Field, Table } from '../../app/ui';

const MAX_EPOCHS = 3000;
const G = 28;

function NeuronDemo() {
  const [x, setX] = useState([0.8, -0.4]);
  const [w, setW] = useState([1.2, -0.7]);
  const [b, setB] = useState(0.1);
  const [a, setA] = useState<Activation>('sigmoid');
  const z = w[0] * x[0] + w[1] * x[1] + b;
  const num = (v: number, f: (n: number) => void) => <input type="number" step={0.1} value={v} onChange={(e) => f(Number(e.target.value) || 0)} style={{ width: 70 }} />;
  return (
    <div className="box">
      <h3>1. Một neuron</h3>
      <div className="row">x₁ {num(x[0], (v) => setX([v, x[1]]))} x₂ {num(x[1], (v) => setX([x[0], v]))} w₁ {num(w[0], (v) => setW([v, w[1]]))} w₂ {num(w[1], (v) => setW([w[0], v]))} bias {num(b, setB)}
        <select aria-label="Hàm kích hoạt" value={a} onChange={(e) => setA(e.target.value as Activation)}><option>sigmoid</option><option>tanh</option><option>relu</option></select></div>
      <p className="node">z = {w[0]}·{x[0]} + {w[1]}·{x[1]} + {b} = {z.toFixed(4)} → {a}(z) = <b>{act(a, z).toFixed(4)}</b></p>
    </div>
  );
}

export function DlLab({ d }: { d: LabData }) {
  const [dataset, setDataset] = useState<'circles' | 'tabular'>('circles');
  const [seed, setSeed] = useState(7);
  const [hidden, setHidden] = useState(6);
  const [layers, setLayers] = useState(1);
  const [activation, setActivation] = useState<Activation>('tanh');
  const [lr, setLr] = useState(0.5);
  const [, bump] = useState(0);
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0);

  const data = useMemo(() => {
    if (dataset === 'tabular') return { train: d.scaled.train, val: d.scaled.val, raw: d.split.train, sc: d.scaler };
    const ds = makeCircles(200, seed);
    const sp = splitDataset(ds.samples, [6, 2, 2], seed);
    const sc = fitScaler(sp.train);
    return { train: scaleSamples(sp.train, sc), val: scaleSamples(sp.val, sc), raw: sp.train, sc };
  }, [dataset, seed, d]);
  const nIn = data.train[0].x.length;

  const sizes = useMemo(() => [nIn, ...Array<number>(layers).fill(hidden), 1], [nIn, hidden, layers]);
  // Huấn luyện chạy trong Web Worker để giao diện không bị đơ; model nhận về sau mỗi lô epoch.
  const model = useRef(initMlp(sizes, activation, seed));
  const hist = useRef<{ tr: number[]; va: number[] }>({ tr: [], va: [] });
  const worker = useRef<Worker | null>(null);
  const busy = useRef(false);
  const gen = useRef(0); // đổi mỗi lần reset để bỏ qua kết quả cũ
  const reset = () => {
    gen.current++; busy.current = false;
    model.current = initMlp(sizes, activation, seed); hist.current = { tr: [], va: [] };
    worker.current?.postMessage({ type: 'init', sizes, hidden: activation, seed, train: data.train, val: data.val });
    setRunning(false); setTick((t) => t + 1);
  };
  useEffect(() => {
    const w = new Worker(new URL('../../workers/mlp.worker.ts', import.meta.url), { type: 'module' });
    w.onmessage = (e: MessageEvent<MlpOut>) => {
      if (e.data.id !== gen.current) return;
      busy.current = false;
      model.current = e.data.model;
      hist.current.tr.push(...e.data.tr); hist.current.va.push(...e.data.va);
      bump((v) => v + 1);
    };
    worker.current = w;
    w.postMessage({ type: 'init', sizes, hidden: activation, seed, train: data.train, val: data.val });
    return () => { w.terminate(); worker.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(reset, [sizes, activation, seed, dataset, data]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = (n: number) => {
    const left = MAX_EPOCHS - hist.current.tr.length;
    if (busy.current || left <= 0 || !worker.current) return;
    busy.current = true;
    worker.current.postMessage({ type: 'train', epochs: Math.min(n, left), lr, id: gen.current });
  };
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => { if (hist.current.tr.length >= MAX_EPOCHS) setRunning(false); else run(10); }, 50);
    return () => clearInterval(id);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const epochs = hist.current.tr.length;
  const m = model.current;
  const yVal = data.val.map((s) => s.y);
  const metrics = evaluate(yVal, data.val.map((s) => (predictProba(m, s.x) >= 0.5 ? 1 : 0)));
  const trMetrics = evaluate(data.train.map((s) => s.y), data.train.map((s) => (predictProba(m, s.x) >= 0.5 ? 1 : 0)));
  const every = Math.max(1, Math.floor(epochs / 40));
  const curve = (arr: number[]) => arr.map((v, i) => [i + 1, v] as [number, number]).filter(([i]) => i % every === 0 || i === arr.length);
  const lossChart = { title: 'MLP: loss theo epoch', xLabel: 'Epoch', yLabel: 'Cross-entropy', series: [{ name: 'Train', points: curve(hist.current.tr) }, { name: 'Validation', points: curve(hist.current.va) }] };
  const status = epochs === 0 ? 'Chưa huấn luyện' : hist.current.tr[epochs - 1] < 0.1 ? 'Loss thấp' : (hist.current.tr[epochs - 2] ?? Infinity) - hist.current.tr[epochs - 1] < 1e-5 ? 'Đã chững lại' : 'Đang giảm';
  const table = { columns: ['Chỉ số', 'Train', 'Validation'], rows: [
    ['Epoch đã chạy', String(epochs), String(epochs)],
    ['Loss', fmt(hist.current.tr[epochs - 1] ?? null, 4), fmt(hist.current.va[epochs - 1] ?? null, 4)],
    ['Accuracy', fmt(trMetrics.accuracy), fmt(metrics.accuracy)], ['Trạng thái', status, '']] };

  // Bản đồ quyết định lấy mẫu trên lưới (không phải toàn bộ ranh giới nhiều chiều).
  const xs = data.raw.map((s) => s.x[0]), ys = data.raw.map((s) => s.x[1]);
  const bx = [Math.min(...xs), Math.max(...xs)], by = [Math.min(...ys), Math.max(...ys)];
  const cells = useMemo(() => {
    const out: { x: number; y: number; p: number }[] = [];
    if (nIn !== 2) return out;
    for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
      const rx = bx[0] + ((i + 0.5) / G) * (bx[1] - bx[0]), ry = by[0] + ((j + 0.5) / G) * (by[1] - by[0]);
      out.push({ x: i, y: j, p: predictProba(m, [(rx - data.sc.mean[0]) / data.sc.std[0], (ry - data.sc.mean[1]) / data.sc.std[1]]) });
    }
    return out;
  }, [epochs, data, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const S = 360, cs = S / G;
  const px = (v: number) => ((v - bx[0]) / (bx[1] - bx[0])) * S, py = (v: number) => S - ((v - by[0]) / (by[1] - by[0])) * S;
  const f = forward(m, data.train[0].x);

  return (
    <div className="lab">
      <section className="controls">
        <div className="box">
          <Field label="Dữ liệu"><select value={dataset} onChange={(e) => setDataset(e.target.value as 'circles' | 'tabular')}>
            <option value="circles">Hai vòng tròn (phi tuyến)</option><option value="tabular">Dữ liệu bảng đang chọn ở trên ({d.source === 'diabetes' ? 'Pima diabetes' : d.source === 'custom' ? 'CSV của bạn' : 'mô phỏng'})</option></select></Field>
          {dataset === 'tabular' && d.panel}
          <Field label="Seed (vòng tròn)"><input type="number" value={seed} onChange={(e) => setSeed(Math.max(0, Math.floor(Number(e.target.value) || 0)))} /></Field>
        </div>
        <div className="box">
          <Field label={`Số lớp ẩn = ${layers}`}><input type="range" min={0} max={3} value={layers} onChange={(e) => setLayers(Number(e.target.value))} /></Field>
          <Field label={`Neuron mỗi lớp ẩn = ${hidden}`}><input type="range" min={2} max={16} value={hidden} onChange={(e) => setHidden(Number(e.target.value))} /></Field>
          <Field label="Hàm kích hoạt lớp ẩn"><select value={activation} onChange={(e) => setActivation(e.target.value as Activation)}><option>tanh</option><option>relu</option><option>sigmoid</option></select></Field>
          <Field label={`Learning rate = ${lr}`}><input type="range" min={0.01} max={3} step={0.01} value={lr} onChange={(e) => setLr(Number(e.target.value))} /></Field>
          <div className="row">
            <button onClick={() => run(1)}>1 epoch</button><button onClick={() => run(50)}>+50</button>
            <button className="primary" onClick={() => setRunning(!running)} aria-pressed={running}>{running ? 'Dừng' : 'Chạy'}</button>
            <button onClick={reset}>Đặt lại</button>
          </div>
          <p className="muted">Mạng {sizes.join('–')}; tối đa {MAX_EPOCHS} epoch. Lớp ra sigmoid. Với 0 lớp ẩn mô hình chỉ là logistic regression.</p>
        </div>
      </section>
      <section className="main">
        <NeuronDemo />
        <h3>2. Huấn luyện mạng nhỏ (backpropagation tự cài đặt)</h3>
        {nIn === 2 ? <svg viewBox={`0 0 ${S} ${S}`} className="scatter" role="img" aria-label="Bản đồ xác suất dự đoán của mạng trên lưới 2 chiều" style={{ maxWidth: 380, cursor: 'default' }}>
          {cells.map((c) => <rect key={`${c.x}-${c.y}`} x={c.x * cs} y={S - (c.y + 1) * cs} width={cs + 0.5} height={cs + 0.5} fill={c.p >= 0.5 ? '#dc6a0b' : '#2563eb'} opacity={0.15 + 0.35 * Math.abs(c.p - 0.5) * 2} />)}
          {data.raw.map((s, i) => s.y === 0
            ? <circle key={i} cx={px(s.x[0])} cy={py(s.x[1])} r={3.5} fill="#2563eb" stroke="#fff" strokeWidth=".5" />
            : <polygon key={i} points={`${px(s.x[0])},${py(s.x[1]) - 4.5} ${px(s.x[0]) - 4},${py(s.x[1]) + 3.5} ${px(s.x[0]) + 4},${py(s.x[1]) + 3.5}`} fill="#dc6a0b" stroke="#fff" strokeWidth=".5" />)}
        </svg> : <p className="muted">Bản đồ quyết định chỉ vẽ được khi mạng có đúng 2 biến đầu vào (hiện {nIn} biến). Hãy xem loss và accuracy.</p>}
        <p className="muted">Nền: vùng dự đoán (xanh = lớp 0, cam = lớp 1) trên lưới của hai biến. Tròn = lớp 0, tam giác = lớp 1 (train). Đây là kết quả của lần huấn luyện thật.</p>
        <Table data={table} />
        <Chart spec={lossChart} />
        <p className="muted">Mẫu train đầu tiên, lớp ra: p = {f.a[f.a.length - 1][0].toFixed(4)}. Train giảm mà validation tăng là dấu hiệu overfitting.</p>
      </section>
    </div>
  );
}
