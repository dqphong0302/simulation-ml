import type { Label, Sample } from './dataset';
import { makeRng } from './rng';
import { buildTree, treeProba, type TreeNode } from './tree';

const dist2 = (a: number[], b: number[]) => a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0);

// ---------- K-means ----------
export interface KmeansState { centers: number[][]; assign: number[]; inertia: number; moved: number }

/** Khởi tạo k-means++ có seed. */
export function kmeansInit(X: number[][], k: number, seed: number): number[][] {
  const rng = makeRng(seed);
  const centers = [X[Math.floor(rng() * X.length)]];
  while (centers.length < k) {
    const d = X.map((x) => Math.min(...centers.map((c) => dist2(x, c))));
    const total = d.reduce((a, b) => a + b, 0);
    if (total === 0) { centers.push(X[Math.floor(rng() * X.length)]); continue; }
    let r = rng() * total, i = 0;
    while (i < d.length - 1 && r >= d[i]) { r -= d[i]; i++; }
    centers.push(X[i]);
  }
  return centers.map((c) => c.slice());
}

/** Một vòng Lloyd: gán cụm rồi cập nhật tâm. Cụm rỗng giữ nguyên tâm cũ. */
export function kmeansStep(X: number[][], centers: number[][], prev?: number[]): KmeansState {
  const assign = X.map((x) => { let b = 0, bd = Infinity; centers.forEach((c, j) => { const d = dist2(x, c); if (d < bd) { bd = d; b = j; } }); return b; });
  const next = centers.map((c, j) => {
    const mem = X.filter((_, i) => assign[i] === j);
    return mem.length ? c.map((_, d) => mem.reduce((s, m) => s + m[d], 0) / mem.length) : c;
  });
  const inertia = X.reduce((s, x, i) => s + dist2(x, next[assign[i]]), 0);
  return { centers: next, assign, inertia, moved: prev ? assign.filter((a, i) => a !== prev[i]).length : X.length };
}

export function kmeans(X: number[][], k: number, seed: number, maxIter = 100): KmeansState {
  let centers = kmeansInit(X, k, seed), st = kmeansStep(X, centers);
  for (let i = 0; i < maxIter; i++) { centers = st.centers; const n = kmeansStep(X, centers, st.assign); st = n; if (n.moved === 0) break; }
  return st;
}

// ---------- PCA ----------
export interface Pca { mean: number[]; components: number[][]; variance: number[]; ratio: number[] }

/** PCA bằng Jacobi trên ma trận hiệp phương sai (đối xứng). Dữ liệu nên được chuẩn hóa trước. */
export function pca(X: number[][]): Pca {
  const n = X.length, d = X[0].length;
  const mean = Array.from({ length: d }, (_, j) => X.reduce((s, r) => s + r[j], 0) / n);
  const C = Array.from({ length: d }, (_, a) => Array.from({ length: d }, (_, b) => X.reduce((s, r) => s + (r[a] - mean[a]) * (r[b] - mean[b]), 0) / Math.max(1, n - 1)));
  const A = C.map((r) => r.slice());
  const V: number[][] = Array.from({ length: d }, (_, i) => Array.from({ length: d }, (_, j) => (i === j ? 1 : 0)));
  for (let sweep = 0; sweep < 100; sweep++) {
    let off = 0;
    for (let p = 0; p < d; p++) for (let q = p + 1; q < d; q++) off += A[p][q] ** 2;
    if (off < 1e-20) break;
    for (let p = 0; p < d; p++) for (let q = p + 1; q < d; q++) {
      if (Math.abs(A[p][q]) < 1e-15) continue;
      const th = (A[q][q] - A[p][p]) / (2 * A[p][q]);
      const t = (th >= 0 ? 1 : -1) / (Math.abs(th) + Math.sqrt(th * th + 1));
      const c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < d; k++) { const akp = A[k][p], akq = A[k][q]; A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq; }
      for (let k = 0; k < d; k++) { const apk = A[p][k], aqk = A[q][k]; A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk; }
      for (let k = 0; k < d; k++) { const vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq; }
    }
  }
  const order = Array.from({ length: d }, (_, i) => i).sort((a, b) => A[b][b] - A[a][a]);
  const variance = order.map((i) => Math.max(0, A[i][i]));
  const total = variance.reduce((a, b) => a + b, 0) || 1;
  return { mean, components: order.map((i) => V.map((r) => r[i])), variance, ratio: variance.map((v) => v / total) };
}
export const pcaProject = (m: Pca, x: number[], k: number): number[] => m.components.slice(0, k).map((c) => c.reduce((s, v, j) => s + v * (x[j] - m.mean[j]), 0));

// ---------- Hồi quy tuyến tính ----------
export interface LinReg { slope: number; intercept: number }
export function fitLine(x: number[], y: number[]): LinReg {
  const n = x.length, mx = x.reduce((a, b) => a + b, 0) / n, my = y.reduce((a, b) => a + b, 0) / n;
  const sxx = x.reduce((s, v) => s + (v - mx) ** 2, 0);
  if (sxx === 0) return { slope: 0, intercept: my };
  const slope = x.reduce((s, v, i) => s + (v - mx) * (y[i] - my), 0) / sxx;
  return { slope, intercept: my - slope * mx };
}
export function regMetrics(m: LinReg, x: number[], y: number[]): { mse: number; rmse: number; r2: number | null } {
  const pred = x.map((v) => m.slope * v + m.intercept), my = y.reduce((a, b) => a + b, 0) / y.length;
  const sse = y.reduce((s, v, i) => s + (v - pred[i]) ** 2, 0), sst = y.reduce((s, v) => s + (v - my) ** 2, 0);
  return { mse: sse / y.length, rmse: Math.sqrt(sse / y.length), r2: sst === 0 ? null : 1 - sse / sst };
}

// ---------- Random Forest ----------
export interface Forest { trees: TreeNode[] }
/** Bagging + chọn ngẫu nhiên mtry biến ở mỗi điểm chia; bỏ phiếu bằng xác suất trung bình. */
export function trainForest(train: Sample[], nTrees: number, maxDepth: number, seed: number): Forest {
  const rng = makeRng(seed), d = train[0].x.length, mtry = Math.max(1, Math.round(Math.sqrt(d)));
  const trees: TreeNode[] = [];
  for (let t = 0; t < nTrees; t++) {
    const boot = Array.from({ length: train.length }, () => train[Math.floor(rng() * train.length)]);
    trees.push(buildTree(boot, maxDepth, 'gini', 2, 0, { rng, mtry }));
  }
  return { trees };
}
export const forestProba = (f: Forest, x: number[]): number => f.trees.reduce((s, t) => s + treeProba(t, x), 0) / f.trees.length;
export const forestPredict = (f: Forest, x: number[]): Label => (forestProba(f, x) >= 0.5 ? 1 : 0);

// ---------- SVM tuyến tính (hinge loss + L2, subgradient descent) ----------
export interface Svm { w: number[]; b: number }
export function trainSvm(train: Sample[], C: number, epochs: number, lr = 0.01): Svm {
  const d = train[0].x.length, w = new Array<number>(d).fill(0);
  let b = 0;
  const n = train.length;
  for (let e = 0; e < epochs; e++) {
    const gw = w.map((v) => v / n); // đạo hàm của ½‖w‖² chia đều theo mẫu
    let gb = 0;
    for (const s of train) {
      const t = s.y === 1 ? 1 : -1;
      if (t * (w.reduce((a, v, j) => a + v * s.x[j], b)) < 1) { for (let j = 0; j < d; j++) gw[j] -= (C * t * s.x[j]); gb -= C * t; }
    }
    for (let j = 0; j < d; j++) w[j] -= (lr * gw[j]) / 1;
    b -= (lr * gb) / 1;
  }
  return { w, b };
}
export const svmScore = (m: Svm, x: number[]): number => m.w.reduce((a, v, j) => a + v * x[j], m.b);
export const svmPredict = (m: Svm, x: number[]): Label => (svmScore(m, x) >= 0 ? 1 : 0);
