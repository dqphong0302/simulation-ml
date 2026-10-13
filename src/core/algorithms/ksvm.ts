import type { Label, Sample } from './dataset';
import { makeRng } from './rng';

export type Kernel = { type: 'linear' } | { type: 'rbf'; gamma: number } | { type: 'poly'; degree: number; coef0: number };

export function kfun(k: Kernel, a: number[], b: number[]): number {
  if (k.type === 'linear') return a.reduce((s, v, i) => s + v * b[i], 0);
  if (k.type === 'poly') return (a.reduce((s, v, i) => s + v * b[i], 0) + k.coef0) ** k.degree;
  let d = 0;
  for (let i = 0; i < a.length; i++) d += (a[i] - b[i]) ** 2;
  return Math.exp(-k.gamma * d);
}

export interface KSvm { kernel: Kernel; sv: number[][]; coef: number[]; b: number; nSv: number; iters: number }

/**
 * SMO rút gọn (Platt): tối ưu bài toán đối ngẫu với ràng buộc 0 ≤ α ≤ C. Nhãn được đổi sang ±1.
 * Phù hợp dữ liệu nhỏ (vài trăm mẫu); không dùng cho dữ liệu lớn.
 */
export function trainKSvm(train: Sample[], kernel: Kernel, C: number, seed: number, tol = 1e-3, maxPasses = 8, maxIter = 20000): KSvm {
  const n = train.length, X = train.map((s) => s.x), y = train.map((s) => (s.y === 1 ? 1 : -1));
  const K = X.map((a) => X.map((b) => kfun(kernel, a, b)));
  const alpha = new Array<number>(n).fill(0);
  let b = 0, passes = 0, iters = 0;
  const rng = makeRng(seed);
  const f = (i: number) => { let s = b; for (let j = 0; j < n; j++) if (alpha[j] > 0) s += alpha[j] * y[j] * K[j][i]; return s; };
  while (passes < maxPasses && iters < maxIter) {
    let changed = 0;
    for (let i = 0; i < n; i++) {
      iters++;
      const Ei = f(i) - y[i];
      if ((y[i] * Ei < -tol && alpha[i] < C) || (y[i] * Ei > tol && alpha[i] > 0)) {
        let j = Math.floor(rng() * (n - 1)); if (j >= i) j++;
        const Ej = f(j) - y[j];
        const ai = alpha[i], aj = alpha[j];
        const L = y[i] !== y[j] ? Math.max(0, aj - ai) : Math.max(0, ai + aj - C);
        const H = y[i] !== y[j] ? Math.min(C, C + aj - ai) : Math.min(C, ai + aj);
        if (L >= H) continue;
        const eta = 2 * K[i][j] - K[i][i] - K[j][j];
        if (eta >= 0) continue;
        let ajn = aj - (y[j] * (Ei - Ej)) / eta;
        ajn = Math.min(H, Math.max(L, ajn));
        if (Math.abs(ajn - aj) < 1e-5) continue;
        const ain = ai + y[i] * y[j] * (aj - ajn);
        const b1 = b - Ei - y[i] * (ain - ai) * K[i][i] - y[j] * (ajn - aj) * K[i][j];
        const b2 = b - Ej - y[i] * (ain - ai) * K[i][j] - y[j] * (ajn - aj) * K[j][j];
        b = ain > 0 && ain < C ? b1 : ajn > 0 && ajn < C ? b2 : (b1 + b2) / 2;
        alpha[i] = ain; alpha[j] = ajn; changed++;
      }
    }
    passes = changed === 0 ? passes + 1 : 0;
  }
  const idx = alpha.map((a, i) => (a > 1e-8 ? i : -1)).filter((i) => i >= 0);
  return { kernel, sv: idx.map((i) => X[i]), coef: idx.map((i) => alpha[i] * y[i]), b, nSv: idx.length, iters };
}

export const ksvmScore = (m: KSvm, x: number[]): number => m.sv.reduce((s, v, i) => s + m.coef[i] * kfun(m.kernel, v, x), m.b);
export const ksvmPredict = (m: KSvm, x: number[]): Label => (ksvmScore(m, x) >= 0 ? 1 : 0);
