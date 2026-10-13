import { gaussian, makeRng } from './rng';

export type Mat = number[][];
export const matmul = (a: Mat, b: Mat): Mat => a.map((r) => b[0].map((_, j) => r.reduce((s, v, k) => s + v * b[k][j], 0)));
export const transpose = (a: Mat): Mat => a[0].map((_, j) => a.map((r) => r[j]));

export function softmaxRow(row: number[]): number[] {
  const m = Math.max(...row.filter((v) => Number.isFinite(v)));
  const e = row.map((v) => (Number.isFinite(v) ? Math.exp(v - m) : 0));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}

export interface AttentionResult { Q: Mat; K: Mat; V: Mat; scores: Mat; weights: Mat; out: Mat }

/** Scaled dot-product attention: softmax(QKᵀ/√d)V. `causal` che các token tương lai. */
export function attention(X: Mat, Wq: Mat, Wk: Mat, Wv: Mat, causal: boolean): AttentionResult {
  const Q = matmul(X, Wq), K = matmul(X, Wk), V = matmul(X, Wv);
  const d = Q[0].length;
  const scores = matmul(Q, transpose(K)).map((r, i) => r.map((v, j) => (causal && j > i ? -Infinity : v / Math.sqrt(d))));
  const weights = scores.map(softmaxRow);
  return { Q, K, V, scores, weights, out: matmul(weights, V) };
}

/** Ma trận trọng số ngẫu nhiên có seed: mô hình đồ chơi CHƯA huấn luyện, chỉ minh họa phép tính. */
export function randomMat(rows: number, cols: number, seed: number): Mat {
  const rng = makeRng(seed);
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => gaussian(rng) * 0.8));
}
