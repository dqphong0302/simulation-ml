import { gaussian, makeRng } from './rng';

export interface Ae { We: number[][]; be: number[]; Wd: number[][]; bd: number[] } // We: k×d, Wd: d×k

export function initAe(d: number, k: number, seed: number): Ae {
  const r = makeRng(seed), g = (n: number, m: number) => Array.from({ length: n }, () => Array.from({ length: m }, () => gaussian(r) * 0.5));
  return { We: g(k, d), be: new Array<number>(k).fill(0), Wd: g(d, k), bd: new Array<number>(d).fill(0) };
}
export const encode = (m: Ae, x: number[]): number[] => m.We.map((row, j) => Math.tanh(row.reduce((s, w, i) => s + w * x[i], m.be[j])));
export const decode = (m: Ae, h: number[]): number[] => m.Wd.map((row, i) => row.reduce((s, w, j) => s + w * h[j], m.bd[i]));

/** Một epoch gradient descent toàn batch, loss MSE tái dựng; trả MSE trung bình. */
export function trainAeEpoch(m: Ae, X: number[][], lr: number): number {
  const d = m.Wd.length, k = m.We.length, n = X.length;
  const gWe = m.We.map((r) => r.map(() => 0)), gbe = m.be.map(() => 0), gWd = m.Wd.map((r) => r.map(() => 0)), gbd = m.bd.map(() => 0);
  let loss = 0;
  for (const x of X) {
    const h = encode(m, x), y = decode(m, h);
    const dy = y.map((v, i) => (2 * (v - x[i])) / d);
    loss += y.reduce((s, v, i) => s + (v - x[i]) ** 2, 0) / d;
    for (let i = 0; i < d; i++) { gbd[i] += dy[i]; for (let j = 0; j < k; j++) gWd[i][j] += dy[i] * h[j]; }
    for (let j = 0; j < k; j++) {
      const dh = m.Wd.reduce((s, row, i) => s + row[j] * dy[i], 0) * (1 - h[j] * h[j]);
      gbe[j] += dh; for (let i = 0; i < d; i++) gWe[j][i] += dh * x[i];
    }
  }
  for (let j = 0; j < k; j++) { m.be[j] -= (lr * gbe[j]) / n; for (let i = 0; i < d; i++) m.We[j][i] -= (lr * gWe[j][i]) / n; }
  for (let i = 0; i < d; i++) { m.bd[i] -= (lr * gbd[i]) / n; for (let j = 0; j < k; j++) m.Wd[i][j] -= (lr * gWd[i][j]) / n; }
  return loss / n;
}

/** Diffusion thuận: x_t = √ᾱ_t·x0 + √(1−ᾱ_t)·ε, với lịch β tuyến tính. Chỉ là quá trình thêm nhiễu (không có mô hình khử nhiễu). */
export function alphaBar(t: number, T: number, b0 = 1e-4, b1 = 0.02): number {
  let a = 1;
  for (let s = 1; s <= t; s++) a *= 1 - (b0 + ((b1 - b0) * (s - 1)) / Math.max(1, T - 1));
  return a;
}
export function noisify(x0: number[], t: number, T: number, seed: number): number[] {
  const r = makeRng(seed), ab = alphaBar(t, T);
  return x0.map((v) => Math.sqrt(ab) * v + Math.sqrt(1 - ab) * gaussian(r));
}
