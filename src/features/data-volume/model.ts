import { gaussian, makeRng } from '../../core/algorithms/rng';
import { buildTree, treeProba, type TreeNode } from '../../core/algorithms/tree';
import { logisticProba, trainLogistic } from '../../core/algorithms/logistic';
import type { Sample } from '../../core/algorithms/dataset';

/**
 * Mô hình cho mô phỏng "dữ liệu đổ vào ít hay nhiều".
 * Mỗi bài được gán một họ bài toán; với mỗi cỡ mẫu N ta fit lại mô hình
 * trên N mẫu đầu tiên của một luồng dữ liệu tổng hợp có seed, rồi đo trên
 * một tập kiểm tra cố định. Mọi số liệu chỉ để minh họa.
 */

export type Family = 'classify' | 'regress' | 'density' | 'cluster' | 'pca' | 'stats' | 'retrieve';
export type Learner = 'knn' | 'knn1' | 'tree' | 'forest' | 'logistic' | 'poly';
export type V3 = [number, number, number];
/** y: nhãn (classify), giá trị đích (regress), cụm/chủ đề thật (cluster, retrieve). */
export interface Pt { x: V3; y: number }

export interface Cfg { family: Family; learners: Learner[]; model: string; data: string }

const C = (family: Family, model: string, data: string, learners: Learner[] = []): Cfg => ({ family, learners, model, data });
const CLS = 'Hai nhóm bệnh nhân giả lập theo 2 chỉ số; ranh giới thật là một đường cong.';
const GEN = 'Mẫu sinh ra từ một phân phối thật có 3 cụm; mô hình phải học lại phân phối đó.';
export const LESSON_CFG: Record<string, Cfg> = {
  EDA: C('stats', 'Ước lượng mean, độ lệch chuẩn và histogram', 'Glucose giả lập (đã chuẩn hóa) cùng 2 chỉ số tương quan.'),
  DATA: C('stats', 'Median/mean dùng để điền thiếu và chuẩn hóa', 'Chỉ số giả lập; thống kê fit trên train càng ít mẫu càng dao động.'),
  KNN: C('classify', 'KNN, k = 5', CLS, ['knn']),
  TREE: C('classify', 'Decision Tree, độ sâu 6', CLS, ['tree']),
  LOGREG: C('classify', 'Logistic Regression (ranh giới thẳng)', CLS, ['logistic']),
  COMPARE: C('classify', 'So sánh Logistic · KNN · Tree trên cùng luồng dữ liệu', CLS, ['logistic', 'knn', 'tree']),
  TEACHABLE: C('classify', 'Bộ phân loại trên đặc trưng ảnh (minh họa: 1 láng giềng gần nhất)', 'Mỗi chấm là một ảnh đã được MobileNet nén thành đặc trưng (giả lập 2 chiều).', ['knn1']),
  LINREG: C('regress', 'Hồi quy tuyến tính bình phương tối thiểu', 'y = 1,4·x₁ + 0,6·x₂ + nhiễu; mặt phẳng thật là đường đứt.'),
  KMEANS: C('cluster', 'K-means, k = 3', '3 cụm thật trong không gian 3 biến.'),
  PCA: C('pca', 'PCA trên ma trận hiệp phương sai mẫu', 'Đám mây 3 biến tương quan; trục chính thật là đường đứt.'),
  FOREST: C('classify', 'Random Forest 15 cây so với 1 cây', CLS, ['forest', 'tree']),
  SVM: C('classify', 'Ranh giới cong kiểu kernel (minh họa: đặc trưng đa thức bậc 3)', CLS, ['poly', 'logistic']),
  MLP: C('classify', 'Mạng linh hoạt (minh họa: đặc trưng đa thức) so với tuyến tính', CLS, ['poly', 'logistic']),
  CNN: C('classify', 'Mô hình nhiều tham số (minh họa: ghi nhớ 1 láng giềng)', 'Ảnh giả lập đã nén thành 2 đặc trưng.', ['knn1', 'knn']),
  ATTN: C('classify', 'Mô hình nhiều tham số (minh họa: ghi nhớ 1 láng giềng)', 'Câu giả lập đã nén thành 2 đặc trưng.', ['knn1', 'knn']),
  GPT: C('density', 'Ước lượng phân phối (minh họa: KDE)', 'Như kho văn bản: mô hình ngôn ngữ học phân phối từ mẫu đã thấy.'),
  AE: C('density', 'Ước lượng phân phối (minh họa: KDE)', GEN),
  VAE: C('density', 'Ước lượng phân phối (minh họa: KDE)', GEN),
  GAN: C('density', 'Ước lượng phân phối (minh họa: KDE)', GEN),
  DIFF: C('density', 'Ước lượng phân phối (minh họa: KDE)', GEN),
  GENCON: C('density', 'Ước lượng phân phối token (minh họa: KDE)', 'Mỗi chấm là một embedding token giả lập.'),
  GENAI: C('retrieve', 'Tìm ngữ cảnh gần nhất theo cosine', 'Mỗi chấm là một đoạn tài liệu trong không gian embedding (6 chủ đề).'),
  RAG: C('retrieve', 'Truy hồi top-3 theo cosine', 'Mỗi chấm là một đoạn tài liệu trong không gian embedding (6 chủ đề).'),
};

export const LEARNER_NAME: Record<Learner, string> = { knn: 'KNN k=5', knn1: '1-NN', tree: 'Tree', forest: 'Forest', logistic: 'Logistic', poly: 'Đa thức' };

export const MAX_N = 1200;
const N_TEST = 400;
/** Các mốc cỡ mẫu, cách đều theo log từ 8 tới 1200. */
export const LEVELS: number[] = (() => {
  const out: number[] = [];
  for (let i = 0; i < 28; i++) { const v = Math.round(8 * (MAX_N / 8) ** (i / 27)); if (!out.includes(v)) out.push(v); }
  return out;
})();
export const G = 36; // độ phân giải lưới cho bản đồ vùng và mặt 3D

/* ---------- Sinh dữ liệu ---------- */
const sig = (z: number) => 1 / (1 + Math.exp(-z));
const pClass = (a: number, b: number) => sig(6 * (b - .55 * Math.sin(2.5 * a)));
const MIX: { c: [number, number]; s: number; w: number }[] = [{ c: [-.45, -.35], s: .22, w: .4 }, { c: [.42, .28], s: .25, w: .4 }, { c: [-.3, .55], s: .14, w: .2 }];
export const trueDensity = (a: number, b: number) => MIX.reduce((s, m) => s + m.w * Math.exp(-((a - m.c[0]) ** 2 + (b - m.c[1]) ** 2) / (2 * m.s * m.s)) / (2 * Math.PI * m.s * m.s), 0);
export const CENTERS: V3[] = [[-.5, -.4, .3], [.45, -.2, -.35], [0, .5, .1]];
const PCA_SD: V3 = [.5, .24, .1];
const rot = (() => { const a = .6, b = -.35, ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
  return [[ca * cb, -sa, ca * sb], [sa * cb, ca, sa * sb], [-sb, 0, cb]] as V3[]; })();
export const TRUE_AXES: V3[] = [0, 1, 2].map(j => [rot[0][j], rot[1][j], rot[2][j]] as V3);
export const TOPICS: V3[] = (() => { const r = makeRng(77); return Array.from({ length: 6 }, () => norm([gaussian(r), gaussian(r), gaussian(r)])); })();
export const STAT_MU = .1, STAT_SD = .32;
export const REG_W: V3 = [0, 1.4, .6]; // b, w1, w2
const REG_NOISE = .35;

function norm(v: V3): V3 { const l = Math.hypot(...v) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
const clampU = (x: number) => Math.max(-1, Math.min(1, x));

function draw(family: Family, r: () => number): Pt {
  const u = () => r() * 2 - 1;
  switch (family) {
    case 'classify': { const a = u(), b = u(); return { x: [a, b, 0], y: r() < pClass(a, b) ? 1 : 0 }; }
    case 'regress': { const a = u(), b = u(); return { x: [a, b, 0], y: REG_W[0] + REG_W[1] * a + REG_W[2] * b + gaussian(r) * REG_NOISE }; }
    case 'density': { let q = r(), m = MIX[0]; for (const k of MIX) { if (q < k.w) { m = k; break; } q -= k.w; }
      return { x: [m.c[0] + gaussian(r) * m.s, m.c[1] + gaussian(r) * m.s, 0], y: MIX.indexOf(m) }; }
    case 'cluster': { const k = Math.floor(r() * 3), c = CENTERS[k]; return { x: [c[0] + gaussian(r) * .17, c[1] + gaussian(r) * .17, c[2] + gaussian(r) * .17], y: k }; }
    case 'pca': { const z = PCA_SD.map(s => gaussian(r) * s); return { x: [0, 1, 2].map(i => rot[i][0] * z[0] + rot[i][1] * z[1] + rot[i][2] * z[2]) as V3, y: 0 }; }
    case 'stats': { const a = STAT_MU + gaussian(r) * STAT_SD, b = .7 * (a - STAT_MU) + gaussian(r) * .2, c = -.4 * (a - STAT_MU) + gaussian(r) * .25;
      return { x: [clampU(a), clampU(b), clampU(c)], y: 0 }; }
    case 'retrieve': { const k = Math.floor(r() * 6), t = TOPICS[k];
      return { x: norm([t[0] + gaussian(r) * .45, t[1] + gaussian(r) * .45, t[2] + gaussian(r) * .45]), y: k }; }
  }
}

export interface Pool { train: Pt[]; test: Pt[] }
/** Luồng dữ liệu: N mẫu đầu tiên là dữ liệu đã "đổ vào". Tập kiểm tra cố định, không phụ thuộc seed. */
export function makePool(family: Family, seed: number): Pool {
  const r = makeRng(seed * 7919 + 13), rt = makeRng(424242);
  return { train: Array.from({ length: MAX_N }, () => draw(family, r)), test: Array.from({ length: N_TEST }, () => draw(family, rt)) };
}

/* ---------- Mô hình ---------- */
type Prob = (a: number, b: number) => number;
const toSamples = (ps: Pt[]): Sample[] => ps.map(p => ({ x: [p.x[0], p.x[1]], y: p.y ? 1 : 0 }));
const polyF = (a: number, b: number) => [a, b, a * a, b * b, a * b, a * a * a, b * b * b, a * a * b, a * b * b];

function knnFit(tr: Pt[], k: number): Prob {
  const n = tr.length, kk = Math.min(k, n), ax = new Float64Array(n), bx = new Float64Array(n), ys = new Float64Array(n);
  tr.forEach((p, i) => { ax[i] = p.x[0]; bx[i] = p.x[1]; ys[i] = p.y; });
  const bd = new Float64Array(kk), by = new Float64Array(kk);
  return (a, b) => {
    bd.fill(Infinity);
    for (let i = 0; i < n; i++) {
      const d = (ax[i] - a) ** 2 + (bx[i] - b) ** 2;
      if (d >= bd[kk - 1]) continue;
      let j = kk - 1;
      while (j > 0 && bd[j - 1] > d) { bd[j] = bd[j - 1]; by[j] = by[j - 1]; j--; }
      bd[j] = d; by[j] = ys[i];
    }
    let s = 0; for (let j = 0; j < kk; j++) s += by[j];
    return s / kk;
  };
}

export function fitClassifier(tr: Pt[], learner: Learner, seed: number): Prob {
  if (learner === 'knn') return knnFit(tr, 5);
  if (learner === 'knn1') return knnFit(tr, 1);
  const S = toSamples(tr);
  if (learner === 'tree') { const t = buildTree(S, 6, 'gini', 2); return (a, b) => treeProba(t, [a, b]); }
  if (learner === 'forest') {
    const r = makeRng(seed + 5), trees: TreeNode[] = [];
    for (let t = 0; t < 15; t++) trees.push(buildTree(S.map(() => S[Math.floor(r() * S.length)]), 6, 'gini', 2, 0, { rng: r, mtry: 1 }));
    return (a, b) => trees.reduce((s, t) => s + treeProba(t, [a, b]), 0) / trees.length;
  }
  if (learner === 'poly') { const m = trainLogistic(S.map(s => ({ x: polyF(s.x[0], s.x[1]), y: s.y })), 1.5, 220); return (a, b) => logisticProba(m, polyF(a, b)); }
  const m = trainLogistic(S, 1, 200);
  return (a, b) => logisticProba(m, [a, b]);
}

/** Bình phương tối thiểu y ~ b + w1·x1 + w2·x2 qua phương trình chuẩn (có ridge rất nhỏ để ổn định khi N bé). */
export function fitPlane(tr: Pt[]): V3 {
  const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], z = [0, 0, 0];
  for (const p of tr) { const f = [1, p.x[0], p.x[1]]; for (let i = 0; i < 3; i++) { z[i] += f[i] * p.y; for (let j = 0; j < 3; j++) A[i][j] += f[i] * f[j]; } }
  for (let i = 0; i < 3; i++) A[i][i] += 1e-3;
  return solve3(A, z);
}
function solve3(A: number[][], z: number[]): V3 {
  const M = A.map((r, i) => [...r, z[i]]);
  for (let c = 0; c < 3; c++) {
    let p = c; for (let r = c + 1; r < 3; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < 3; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k < 4; k++) M[r][k] -= f * M[c][k]; }
  }
  return [M[0][3] / M[0][0], M[1][3] / M[1][1], M[2][3] / M[2][2]];
}

export function kdeFit(tr: Pt[]): (a: number, b: number) => number {
  const n = tr.length, sd = Math.sqrt((variance(tr.map(p => p.x[0])) + variance(tr.map(p => p.x[1]))) / 2) || .3;
  const h = Math.max(.04, 1.06 * sd * n ** (-1 / 6)), k = 1 / (2 * Math.PI * h * h * n), inv = 1 / (2 * h * h);
  return (a, b) => { let s = 0; for (const p of tr) s += Math.exp(-((p.x[0] - a) ** 2 + (p.x[1] - b) ** 2) * inv); return s * k; };
}

/** K-means++ chạy 5 lần khởi tạo, giữ nghiệm có inertia nhỏ nhất (như n_init của scikit-learn). */
export function kmeans(tr: Pt[], seed: number): { cent: V3[]; assign: Uint8Array } {
  const r = makeRng(seed + 3);
  let best: { cent: V3[]; assign: Uint8Array; inertia: number } | null = null;
  for (let run = 0; run < 5; run++) { const k = kmeansOnce(tr, r); if (!best || k.inertia < best.inertia) best = k; }
  return best!;
}
function kmeansOnce(tr: Pt[], r: () => number): { cent: V3[]; assign: Uint8Array; inertia: number } {
  const cent: V3[] = [tr[Math.floor(r() * tr.length)].x];
  const d2 = (a: V3, b: V3) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  while (cent.length < 3) { // k-means++
    const w = tr.map(p => Math.min(...cent.map(c => d2(p.x, c)))), tot = w.reduce((a, b) => a + b, 0);
    let q = r() * tot, i = 0; while (i < tr.length - 1 && q > w[i]) { q -= w[i]; i++; }
    cent.push(tr[i].x);
  }
  const assign = new Uint8Array(tr.length);
  for (let it = 0; it < 25; it++) {
    tr.forEach((p, i) => { let b = 0; for (let k = 1; k < 3; k++) if (d2(p.x, cent[k]) < d2(p.x, cent[b])) b = k; assign[i] = b; });
    for (let k = 0; k < 3; k++) { const m = tr.filter((_, i) => assign[i] === k); if (m.length) cent[k] = [0, 1, 2].map(j => mean(m.map(p => p.x[j]))) as V3; }
  }
  return { cent, assign, inertia: tr.reduce((s, p, i) => s + d2(p.x, cent[assign[i]]), 0) };
}
/** Sai số tâm cụm: ghép tâm ước lượng với tâm thật theo hoán vị tốt nhất. */
export function centroidError(cent: V3[]): number {
  const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  return Math.min(...perms.map(pm => pm.reduce((s, j, i) => s + Math.hypot(cent[i][0] - CENTERS[j][0], cent[i][1] - CENTERS[j][1], cent[i][2] - CENTERS[j][2]), 0) / 3));
}

export function pcaFit(tr: Pt[]): { axes: V3[]; vars: number[]; mu: V3 } {
  const mu = [0, 1, 2].map(j => mean(tr.map(p => p.x[j]))) as V3, S = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (const p of tr) for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) S[i][j] += (p.x[i] - mu[i]) * (p.x[j] - mu[j]) / Math.max(1, tr.length - 1);
  const axes: V3[] = [], vars: number[] = [];
  const M = S.map(r => [...r]);
  for (let k = 0; k < 3; k++) { // lặp lũy thừa + khử dần
    let v: V3 = norm([1, .5 + k, .25 - k]);
    for (let it = 0; it < 60; it++) v = norm([0, 1, 2].map(i => M[i][0] * v[0] + M[i][1] * v[1] + M[i][2] * v[2]) as V3);
    const lam = [0, 1, 2].reduce((s, i) => s + v[i] * (M[i][0] * v[0] + M[i][1] * v[1] + M[i][2] * v[2]), 0);
    axes.push(v); vars.push(Math.max(0, lam));
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) M[i][j] -= lam * v[i] * v[j];
  }
  return { axes, vars, mu };
}
export const angleDeg = (a: V3, b: V3) => Math.acos(Math.min(1, Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))) * 180 / Math.PI;

export const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
export const variance = (a: number[]) => { const m = mean(a); return a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, a.length - 1); };
const cos = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export function topK(tr: Pt[], q: V3, k: number): number[] {
  return tr.map((p, i) => [cos(p.x, q), i] as const).sort((a, b) => b[0] - a[0]).slice(0, k).map(x => x[1]);
}

/* ---------- Chỉ số theo cỡ mẫu ---------- */
export interface Metric { label: string; better: 'up' | 'down'; kind: 'train' | 'test' | 'ref'; fmt: (v: number) => string; color: number; /** false: chỉ hiện ở thẻ số, không vẽ trên đường học (khác thang đo). */ chart?: false }
const pct = (v: number) => `${(v * 100).toFixed(1).replace('.', ',')}%`;
const dec = (d: number) => (v: number) => v.toFixed(d).replace('.', ',');

export function metricsFor(cfg: Cfg): Metric[] {
  switch (cfg.family) {
    case 'classify': return [{ label: `Train · ${LEARNER_NAME[cfg.learners[0]]}`, better: 'up', kind: 'train', fmt: pct, color: 0 },
      ...cfg.learners.map((l, i): Metric => ({ label: `Test · ${LEARNER_NAME[l]}`, better: 'up', kind: 'test', fmt: pct, color: i + 1 }))];
    case 'regress': return [{ label: 'RMSE train', better: 'down', kind: 'train', fmt: dec(3), color: 0 }, { label: 'RMSE test', better: 'down', kind: 'test', fmt: dec(3), color: 1 },
      { label: 'Nhiễu không thể giảm', better: 'down', kind: 'ref', fmt: dec(3), color: 3 }];
    case 'density': return [{ label: 'Log-likelihood train', better: 'up', kind: 'train', fmt: dec(2), color: 0 }, { label: 'Log-likelihood test', better: 'up', kind: 'test', fmt: dec(2), color: 1 },
      { label: 'Phân phối thật (trần)', better: 'up', kind: 'ref', fmt: dec(2), color: 3 }];
    case 'cluster': return [{ label: 'Sai số tâm cụm', better: 'down', kind: 'test', fmt: dec(3), color: 1 }];
    case 'pca': return [{ label: 'Lệch trục PC1 (độ)', better: 'down', kind: 'test', fmt: v => `${v.toFixed(1).replace('.', ',')}°`, color: 1 },
      { label: '% phương sai PC1', better: 'up', kind: 'train', fmt: pct, color: 0, chart: false }];
    case 'stats': return [{ label: '|mean ước lượng − mean thật|', better: 'down', kind: 'test', fmt: dec(3), color: 1 },
      { label: 'Kỳ vọng lý thuyết σ·√(2/π)/√N', better: 'down', kind: 'ref', fmt: dec(3), color: 3 }];
    case 'retrieve': return [{ label: 'Độ tương đồng top-1', better: 'up', kind: 'test', fmt: dec(3), color: 1 }, { label: 'Câu hỏi có đoạn khớp (cos > 0,97)', better: 'up', kind: 'test', fmt: pct, color: 2 }];
  }
}

/** Dữ liệu để vẽ một khung hình ở cỡ mẫu N. */
export interface View {
  grid?: Float32Array; gridMax?: number; // xác suất / mật độ trên lưới G×G trong [-1,1]²
  plane?: V3; ghosts?: V3[];
  cent?: V3[]; assign?: Uint8Array;
  axes?: V3[]; vars?: number[]; mu?: V3; ghostAxes?: V3[];
  mean?: number; sd?: number;
  query?: V3; top?: number[];
}

const gridOf = (f: (a: number, b: number) => number) => {
  const g = new Float32Array(G * G);
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) g[j * G + i] = f(-1 + 2 * (i + .5) / G, -1 + 2 * (j + .5) / G);
  return g;
};
export const QUERY: V3 = norm([.4, .75, .3]);

/** Đánh giá một cỡ mẫu: trả về giá trị các chỉ số (theo metricsFor) và, nếu cần, dữ liệu vẽ. */
export function evaluate(cfg: Cfg, pool: Pool, n: number, seed: number, withView: boolean): { values: number[]; view?: View } {
  const tr = pool.train.slice(0, n), te = pool.test;
  switch (cfg.family) {
    case 'classify': {
      const fits = cfg.learners.map(l => fitClassifier(tr, l, seed));
      const acc = (f: Prob, set: Pt[]) => set.reduce((s, p) => s + ((f(p.x[0], p.x[1]) >= .5 ? 1 : 0) === p.y ? 1 : 0), 0) / set.length;
      return { values: [acc(fits[0], tr), ...fits.map(f => acc(f, te))], view: withView ? { grid: gridOf(fits[0]) } : undefined };
    }
    case 'regress': {
      const w = fitPlane(tr), pr = (p: Pt) => w[0] + w[1] * p.x[0] + w[2] * p.x[1];
      const rmse = (set: Pt[]) => Math.sqrt(mean(set.map(p => (p.y - pr(p)) ** 2)));
      return { values: [rmse(tr), rmse(te), REG_NOISE], view: withView ? { plane: w } : undefined };
    }
    case 'density': {
      const f = kdeFit(tr), ll = (set: Pt[]) => mean(set.map(p => Math.log(Math.max(1e-4, f(p.x[0], p.x[1])))));
      const ref = mean(te.map(p => Math.log(trueDensity(p.x[0], p.x[1]))));
      if (!withView) return { values: [ll(tr), ll(te), ref] };
      const grid = gridOf(f); let gridMax = 0; grid.forEach(v => { gridMax = Math.max(gridMax, v); });
      return { values: [ll(tr), ll(te), ref], view: { grid, gridMax } };
    }
    case 'cluster': {
      const { cent, assign } = kmeans(tr, seed);
      return { values: [centroidError(cent)], view: withView ? { cent, assign } : undefined };
    }
    case 'pca': {
      const { axes, vars, mu } = pcaFit(tr), tot = vars.reduce((a, b) => a + b, 0) || 1;
      return { values: [angleDeg(axes[0], TRUE_AXES[0]), vars[0] / tot], view: withView ? { axes, vars, mu } : undefined };
    }
    case 'stats': {
      const xs = tr.map(p => p.x[0]), m = mean(xs), sd = Math.sqrt(variance(xs));
      return { values: [Math.abs(m - STAT_MU), STAT_SD * Math.sqrt(2 / Math.PI) / Math.sqrt(n)], view: withView ? { mean: m, sd } : undefined };
    }
    case 'retrieve': {
      const best = te.slice(0, 120).map(q => Math.max(...tr.map(p => cos(p.x, q.x))));
      return { values: [mean(best), best.filter(b => b > .97).length / best.length], view: withView ? { query: QUERY, top: topK(tr, QUERY, 3) } : undefined };
    }
  }
}

/** Đường thẳng/trục của các lần lấy mẫu khác cùng cỡ N: cho thấy ít dữ liệu thì kết quả dao động mạnh. */
export function ghostsFor(cfg: Cfg, n: number, seeds: number[]): Pick<View, 'ghosts' | 'ghostAxes'> {
  if (cfg.family === 'regress') return { ghosts: seeds.map(s => fitPlane(makePool('regress', s).train.slice(0, n))) };
  if (cfg.family === 'pca') return { ghostAxes: seeds.map(s => pcaFit(makePool('pca', s).train.slice(0, n)).axes[0]) };
  return {};
}

/** Nhãn mức dữ liệu cho phần nhận xét. */
export function regime(n: number): 0 | 1 | 2 { return n < 60 ? 0 : n < 300 ? 1 : 2; }
