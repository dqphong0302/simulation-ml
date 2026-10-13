import { useMemo, useState } from 'react';
import { evaluate, fmt, roc } from '../../core/algorithms/metrics';
import { buildTree, treePredict, treeProba } from '../../core/algorithms/tree';
import { fitLine, forestPredict, forestProba, kmeans, kmeansInit, kmeansStep, pca, pcaProject, regMetrics, trainForest, type KmeansState } from '../../core/algorithms/ml_extra';
import { Chart, Field, Table } from '../../app/ui';
import type { LabData } from './useData';

const COL = ['#1f6feb', '#d9480f', '#2f9e44', '#9c36b5', '#b08800', '#0b7285'];
const W = 520, H = 360, M = 44;

export function Plot({ pts, groups, ring, lines, xl, yl, centers }: { pts: number[][]; groups: number[]; ring?: number[]; lines?: [number, number, number, number][]; xl: string; yl: string; centers?: number[][] }) {
  const xs = [...pts.map((p) => p[0]), ...(centers ?? []).map((c) => c[0])], ys = [...pts.map((p) => p[1]), ...(centers ?? []).map((c) => c[1])];
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const X = (v: number) => M + ((v - x0) / (x1 - x0 || 1)) * (W - M - 10), Y = (v: number) => H - M - ((v - y0) / (y1 - y0 || 1)) * (H - M - 10);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="scatter" style={{ cursor: 'default' }} role="img" aria-label={`Biểu đồ ${xl} theo ${yl}`}>
      <rect width={W} height={H} fill="var(--panel)" />
      <line x1={M} x2={M} y1={10} y2={H - M} stroke="currentColor" /><line x1={M} x2={W - 10} y1={H - M} y2={H - M} stroke="currentColor" />
      <text x={W / 2} y={H - 8} textAnchor="middle" fontSize="12" fill="currentColor">{xl}</text>
      <text transform={`translate(12 ${H / 2}) rotate(-90)`} textAnchor="middle" fontSize="12" fill="currentColor">{yl}</text>
      {(lines ?? []).map((l, i) => <line key={i} x1={X(l[0])} y1={Y(l[1])} x2={X(l[2])} y2={Y(l[3])} stroke="currentColor" strokeWidth="2" />)}
      {pts.map((p, i) => { const g = groups[i] % COL.length; const cx = X(p[0]), cy = Y(p[1]);
        return g % 2 === 0 ? <circle key={i} cx={cx} cy={cy} r="3.2" fill={COL[g]} opacity=".75" /> : <polygon key={i} points={`${cx},${cy - 4.5} ${cx - 4},${cy + 3.5} ${cx + 4},${cy + 3.5}`} fill={COL[g]} opacity=".75" />; })}
      {(centers ?? []).map((c, i) => <g key={i}><rect x={X(c[0]) - 7} y={Y(c[1]) - 7} width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" transform={`rotate(45 ${X(c[0])} ${Y(c[1])})`} /><text x={X(c[0]) + 10} y={Y(c[1]) - 8} fontSize="12" fontWeight="bold" fill="currentColor">C{i + 1}</text></g>)}
      {ring?.map((i) => <circle key={`r${i}`} cx={X(pts[i][0])} cy={Y(pts[i][1])} r="7" fill="none" stroke="currentColor" />)}
    </svg>
  );
}


export function KmeansLab({ d }: { d: LabData }) {
  const X = d.scaled.train.map((s) => s.x);
  const [k, setK] = useState(2);
  const [seed, setSeed] = useState(1);
  const [iter, setIter] = useState(0);
  const states = useMemo(() => {
    const out: KmeansState[] = []; let c = kmeansInit(X, k, seed), prev: number[] | undefined;
    for (let i = 0; i < 30; i++) { const s = kmeansStep(X, c, prev); out.push(s); if (s.moved === 0) break; c = s.centers; prev = s.assign; }
    return out;
  }, [X, k, seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const cur = states[Math.min(iter, states.length - 1)];
  const elbow = useMemo(() => [1, 2, 3, 4, 5, 6, 7, 8].map((kk) => [kk, kmeans(X, kk, seed).inertia] as [number, number]), [X, seed]);
  const chart = { title: 'K-means: inertia theo k (elbow)', xLabel: 'k', yLabel: 'Inertia (tổng bình phương khoảng cách)', series: [{ name: 'Inertia', points: elbow }] };
  const y = d.scaled.train.map((s) => s.y);
  const purity = [0, 1].map((lab) => { const idx = cur.assign.filter((_, i) => y[i] === lab); const cnt = Array.from({ length: k }, (_, j) => idx.filter((a) => a === j).length); return cnt.map(String).join(' / '); });
  const table = { columns: ['Chỉ số', 'Giá trị'], rows: [['k', String(k)], ['Số vòng lặp tới hội tụ', String(states.length)], ['Inertia cuối', fmt(states[states.length - 1].inertia, 2)], ...(d.source === 'custom' ? [] : [['Phân bố nhãn 0 theo cụm', purity[0]], ['Phân bố nhãn 1 theo cụm', purity[1]]])] };
  return (
    <div className="lab">
      <section className="controls">{d.panel}
        <div className="box"><Field label={`k = ${k}`}><input type="range" min={1} max={6} value={k} onChange={(e) => { setK(Number(e.target.value)); setIter(0); }} /></Field>
          <Field label="Seed khởi tạo (k-means++)"><input type="number" value={seed} onChange={(e) => { setSeed(Number(e.target.value) || 0); setIter(0); }} /></Field>
          <div className="row"><button disabled={iter === 0} onClick={() => setIter(iter - 1)}>Vòng trước</button><button disabled={iter >= states.length - 1} onClick={() => setIter(iter + 1)}>Vòng tiếp</button></div>
          <p className="muted">Vòng {Math.min(iter, states.length - 1) + 1}/{states.length}: {cur.moved} điểm đổi cụm; inertia {cur.inertia.toFixed(2)}. Dùng dữ liệu đã chuẩn hóa, không dùng nhãn.</p></div></section>
      <section className="main">
        <p className="badge">Học không giám sát — không dùng cột nhãn để phân cụm</p>
        <Plot pts={X} groups={cur.assign} centers={cur.centers} xl={`${d.ds.featureNames[0]} (chuẩn hóa)`} yl={`${d.ds.featureNames[1]} (chuẩn hóa)`} />
        <p className="muted">Mỗi vòng: gán điểm vào tâm gần nhất, rồi dời tâm về trung bình cụm. Kết quả phụ thuộc seed khởi tạo; cụm tìm được không nhất thiết trùng nhãn bệnh. Hình chỉ chiếu hai biến đầu.</p>
        <Table data={table} /><Chart spec={chart} />
      </section>
    </div>
  );
}

export function PcaLab({ d }: { d: LabData }) {
  const X = d.scaled.train.map((s) => s.x), y = d.scaled.train.map((s) => s.y);
  const m = useMemo(() => pca(X), [X]);
  const proj = X.map((x) => pcaProject(m, x, 2));
  const cum = m.ratio.reduce<number[]>((a, r) => [...a, (a[a.length - 1] ?? 0) + r], []);
  const table = { columns: ['Thành phần', 'Phương sai', 'Tỷ lệ', 'Tích lũy', 'Trọng số theo biến'], rows: m.components.map((c, i) => [`PC${i + 1}`, fmt(m.variance[i], 3), fmt(m.ratio[i], 3), fmt(cum[i], 3), c.map((v, j) => `${d.ds.featureNames[j].split(' ')[0]}: ${v.toFixed(2)}`).join('; ')]) };
  const chart = { title: 'PCA: phần phương sai giải thích', xLabel: 'Thành phần', yLabel: 'Tỷ lệ phương sai', series: [{ name: 'Từng thành phần', points: m.ratio.map((r, i) => [i + 1, r] as [number, number]) }, { name: 'Tích lũy', points: cum.map((r, i) => [i + 1, r] as [number, number]) }] };
  return (
    <div className="lab">
      <section className="controls">{d.panel}<div className="box"><p className="muted">PCA tìm các hướng có phương sai lớn nhất của dữ liệu đã chuẩn hóa (fit trên train). Thử bật thêm biến ở bảng trên để thấy ý nghĩa giảm chiều (cần ≥ 3 biến).</p></div></section>
      <section className="main">
        <p className="badge">Học không giám sát — {d.source === 'custom' ? 'dữ liệu riêng không cần nhãn' : 'nhãn chỉ dùng để tô màu'}</p>
        <Plot pts={proj} groups={y} xl={`PC1 (${(100 * m.ratio[0]).toFixed(1)}%)`} yl={`PC2 (${(100 * (m.ratio[1] ?? 0)).toFixed(1)}%)`} />
        <p className="muted">Hai thành phần đầu giữ {(100 * (cum[Math.min(1, cum.length - 1)])).toFixed(1)}% phương sai. Phương sai lớn chưa chắc hữu ích cho phân loại; PCA không dùng nhãn.</p>
        <Table data={table} /><Chart spec={chart} />
      </section>
    </div>
  );
}

export function RegressionLab({ d }: { d: LabData }) {
  const [xi, setXi] = useState(0);
  const [targetIndex, setTargetIndex] = useState(1);
  const names = d.ds.featureNames;
  const yi = targetIndex < names.length && targetIndex !== xi ? targetIndex : xi === 0 ? 1 : 0;
  const col = (set: { x: number[] }[], j: number) => set.map((s) => s.x[j]);
  const m = useMemo(() => fitLine(col(d.split.train, xi), col(d.split.train, yi)), [d, xi, yi]);
  const mt = regMetrics(m, col(d.split.train, xi), col(d.split.train, yi)), mv = regMetrics(m, col(d.split.val, xi), col(d.split.val, yi));
  const pts = d.split.train.map((s) => [s.x[xi], s.x[yi]]);
  const lx = pts.map((p) => p[0]), a = Math.min(...lx), b = Math.max(...lx);
  const table = { columns: ['Chỉ số', 'Train', 'Validation'], rows: [['MSE', fmt(mt.mse, 3), fmt(mv.mse, 3)], ['RMSE', fmt(mt.rmse, 3), fmt(mv.rmse, 3)], ['R²', fmt(mt.r2), fmt(mv.r2)]] };
  return (
    <div className="lab">
      <section className="controls">{d.panel}
        <div className="box"><Field label="Biến giải thích (x)"><select value={xi} onChange={(e) => setXi(Number(e.target.value))}>{names.map((n, i) => <option key={n} value={i}>{n}</option>)}</select></Field>
          <Field label="Biến cần dự đoán (y)"><select value={yi} onChange={e => setTargetIndex(Number(e.target.value))}>{names.map((n, i) => i !== xi && <option key={n} value={i}>{n}</option>)}</select></Field>
          <p className="muted">Biến phụ thuộc (y): {names[yi]}. Đường thẳng khớp bằng bình phương tối thiểu trên train.</p></div></section>
      <section className="main">
        <p className="badge">Hồi quy — dự đoán giá trị liên tục</p>
        <Plot pts={pts} groups={pts.map(() => 0)} lines={[[a, m.slope * a + m.intercept, b, m.slope * b + m.intercept]]} xl={names[xi]} yl={names[yi]} />
        <p>y = {m.slope.toFixed(3)}·x + {m.intercept.toFixed(2)}. Mỗi tăng 1 đơn vị x, y thay đổi trung bình {m.slope.toFixed(3)} đơn vị trong dữ liệu này. Đây là mối liên hệ thống kê, không phải quan hệ nhân quả. R² thấp nghĩa là x giải thích ít biến thiên của y.</p>
        <Table data={table} />
      </section>
    </div>
  );
}

export function ForestLab({ d }: { d: LabData }) {
  const [nTrees, setN] = useState(25);
  const [depth, setDepth] = useState(4);
  const rows = useMemo(() => {
    const yv = d.split.val.map((s) => s.y), tr = d.split.train;
    const tree = buildTree(tr, depth, 'gini');
    const forest = trainForest(tr, nTrees, depth, d.seed);
    const one = { p: d.split.val.map((s) => treeProba(tree, s.x)), l: d.split.val.map((s) => treePredict(tree, s.x)) };
    const many = { p: d.split.val.map((s) => forestProba(forest, s.x)), l: d.split.val.map((s) => forestPredict(forest, s.x)) };
    return ([['Một cây', one], [`Random Forest (${nTrees} cây)`, many]] as const).map(([n, r]) => ({ n, m: evaluate(yv, r.l), a: roc(yv, r.p)?.auc ?? null }));
  }, [d, nTrees, depth]);
  const table = { columns: ['Mô hình (validation)', 'Accuracy', 'Precision', 'Recall', 'F1', 'AUC'], rows: rows.map((r) => [r.n, fmt(r.m.accuracy), fmt(r.m.precision), fmt(r.m.recall), fmt(r.m.f1), fmt(r.a)]) };
  const sweep = useMemo(() => [1, 5, 10, 25, 50, 100].map((n) => { const f = trainForest(d.split.train, n, depth, d.seed); return [n, evaluate(d.split.val.map((s) => s.y), d.split.val.map((s) => forestPredict(f, s.x))).accuracy ?? 0] as [number, number]; }), [d, depth]);
  const chart = { title: 'Random Forest: accuracy validation theo số cây', xLabel: 'Số cây', yLabel: 'Accuracy', series: [{ name: 'Validation', points: sweep }] };
  return (
    <div className="lab">
      <section className="controls">{d.panel}
        <div className="box"><Field label={`Số cây = ${nTrees}`}><input type="range" min={1} max={100} value={nTrees} onChange={(e) => setN(Number(e.target.value))} /></Field>
          <Field label={`Độ sâu tối đa = ${depth}`}><input type="range" min={1} max={8} value={depth} onChange={(e) => setDepth(Number(e.target.value))} /></Field>
          <p className="muted">Mỗi cây học trên mẫu bootstrap và chỉ xét ngẫu nhiên √(số biến) biến ở mỗi điểm chia; kết quả lấy trung bình xác suất.</p></div></section>
      <section className="main">
        <Table data={table} /><Chart spec={chart} />
        <p className="muted">Rừng thường ổn định hơn một cây vì trung bình hóa làm giảm phương sai; không phải lúc nào cũng tốt hơn trên tập validation nhỏ. Hãy đổi seed để kiểm tra độ ổn định.</p>
      </section>
    </div>
  );
}

import { svmScore, trainSvm } from '../../core/algorithms/ml_extra';
import { ksvmScore, trainKSvm, type Kernel } from '../../core/algorithms/ksvm';
import { fitScaler, makeCircles, scaleSamples, splitDataset } from '../../core/algorithms/dataset';

type KName = 'linear-sgd' | 'linear' | 'rbf' | 'poly';
const G = 36;

export function SvmLab({ d }: { d: LabData }) {
  const [kname, setK] = useState<KName>('rbf');
  const [C, setC] = useState(1);
  const [gamma, setGamma] = useState(0.5);
  const [degree, setDegree] = useState(3);
  const [src, setSrc] = useState<'tab' | 'circles'>('tab');
  const data = useMemo(() => {
    if (src === 'tab') return { train: d.scaled.train, val: d.scaled.val, names: d.ds.featureNames.map((n) => `${n} (chuẩn hóa)`) };
    const ds = makeCircles(240, d.seed, 0.1), sp = splitDataset(ds.samples, [6, 2, 2], d.seed), sc = fitScaler(sp.train);
    return { train: scaleSamples(sp.train, sc), val: scaleSamples(sp.val, sc), names: ['x1 (chuẩn hóa)', 'x2 (chuẩn hóa)'] };
  }, [d, src]);
  const model = useMemo(() => {
    const t0 = performance.now();
    if (kname === 'linear-sgd') { const m = trainSvm(data.train, C, 300, 0.01); return { score: (x: number[]) => svmScore(m, x), nSv: null as number | null, ms: performance.now() - t0, w: m }; }
    const kernel: Kernel = kname === 'linear' ? { type: 'linear' } : kname === 'rbf' ? { type: 'rbf', gamma } : { type: 'poly', degree, coef0: 1 };
    const m = trainKSvm(data.train, kernel, C, d.seed);
    return { score: (x: number[]) => ksvmScore(m, x), nSv: m.nSv, ms: performance.now() - t0, w: null };
  }, [data, kname, C, gamma, degree, d.seed]);
  const ev = (set: typeof data.val) => evaluate(set.map((s) => s.y), set.map((s) => (model.score(s.x) >= 0 ? 1 : 0)));
  const tr = ev(data.train), va = ev(data.val);
  const aucV = roc(data.val.map((s) => s.y), data.val.map((s) => model.score(s.x)))?.auc ?? null;
  const table = { columns: ['Chỉ số', 'Train', 'Validation'], rows: [['Accuracy', fmt(tr.accuracy), fmt(va.accuracy)], ['Precision', fmt(tr.precision), fmt(va.precision)], ['Recall', fmt(tr.recall), fmt(va.recall)], ['F1', fmt(tr.f1), fmt(va.f1)], ['AUC (điểm quyết định)', '', fmt(aucV)], ['Số support vector', model.nSv === null ? 'n/a' : String(model.nSv), ''], ['Thời gian huấn luyện', `${model.ms.toFixed(0)} ms`, '']] };
  const two = data.train[0].x.length === 2;
  const pts = data.train.map((s) => [s.x[0], s.x[1]]);
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const bx = [Math.min(...xs), Math.max(...xs)], by = [Math.min(...ys), Math.max(...ys)];
  const cells = useMemo(() => {
    if (!two) return [];
    const out: { i: number; j: number; s: number }[] = [];
    for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) out.push({ i, j, s: model.score([bx[0] + ((i + 0.5) / G) * (bx[1] - bx[0]), by[0] + ((j + 0.5) / G) * (by[1] - by[0])]) });
    return out;
  }, [model, two]); // eslint-disable-line react-hooks/exhaustive-deps
  const S = 380, cs = S / G, px = (v: number) => ((v - bx[0]) / (bx[1] - bx[0])) * S, py = (v: number) => S - ((v - by[0]) / (by[1] - by[0])) * S;
  const kLabel = { 'linear-sgd': 'Tuyến tính (subgradient)', linear: 'Tuyến tính (SMO)', rbf: 'RBF (Gauss)', poly: 'Đa thức' }[kname];
  return (
    <div className="lab">
      <section className="controls">{src === 'tab' && d.panel}
        <div className="box"><strong>Mô hình</strong>
          <Field label="Dữ liệu"><select value={src} onChange={(e) => setSrc(e.target.value as 'tab' | 'circles')}><option value="tab">Bảng đang chọn ({d.source === 'diabetes' ? 'Pima' : d.source === 'custom' ? 'CSV của bạn' : 'mô phỏng'})</option><option value="circles">Hai vòng tròn (phi tuyến)</option></select></Field>
          <Field label="Kernel"><select value={kname} onChange={(e) => setK(e.target.value as KName)}><option value="rbf">RBF (Gauss)</option><option value="poly">Đa thức</option><option value="linear">Tuyến tính (SMO)</option><option value="linear-sgd">Tuyến tính (subgradient)</option></select></Field>
          <Field label={`C = ${C}`}><input type="range" min={0.05} max={20} step={0.05} value={C} onChange={(e) => setC(Number(e.target.value))} /></Field>
          {kname === 'rbf' && <Field label={`γ (gamma) = ${gamma}`}><input type="range" min={0.05} max={10} step={0.05} value={gamma} onChange={(e) => setGamma(Number(e.target.value))} /></Field>}
          {kname === 'poly' && <Field label={`Bậc = ${degree}`}><input type="range" min={2} max={5} value={degree} onChange={(e) => setDegree(Number(e.target.value))} /></Field>}
        </div></section>
      <section className="main">
        <p className="badge">Huấn luyện thật — SVM {kLabel}{kname !== 'linear-sgd' ? ', tối ưu bằng SMO' : ''}</p>
        {two ? (
          <svg viewBox={`0 0 ${S} ${S}`} className="scatter" style={{ maxWidth: 420, cursor: 'default' }} role="img" aria-label="Vùng quyết định của SVM trên hai biến">
            {cells.map((c) => <rect key={`${c.i}-${c.j}`} x={c.i * cs} y={S - (c.j + 1) * cs} width={cs + .5} height={cs + .5} fill={c.s >= 0 ? '#ea580c' : '#2563eb'} opacity={Math.min(0.45, 0.12 + Math.abs(c.s) * 0.15)} />)}
            {data.train.map((s, i) => s.y === 0
              ? <circle key={i} cx={px(s.x[0])} cy={py(s.x[1])} r={3} fill="#2563eb" stroke="#fff" strokeWidth=".5" />
              : <polygon key={i} points={`${px(s.x[0])},${py(s.x[1]) - 4} ${px(s.x[0]) - 3.5},${py(s.x[1]) + 3} ${px(s.x[0]) + 3.5},${py(s.x[1]) + 3}`} fill="#ea580c" stroke="#fff" strokeWidth=".5" />)}
          </svg>
        ) : <p className="muted">Chọn đúng 2 biến để xem vùng quyết định; với nhiều biến ranh giới không vẽ được trên 2D.</p>}
        <p className="muted">Nền: vùng mô hình dự đoán (xanh/cam), càng đậm càng xa ranh giới. Kernel cho phép ranh giới cong mà không cần tự tạo biến mới. γ lớn làm ranh giới uốn sát từng điểm (dễ overfitting); C lớn phạt nặng điểm sai. Trục: {data.names.join(' × ')}.</p>
        <Table data={table} />
      </section>
    </div>
  );
}
