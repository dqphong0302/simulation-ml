import { makeRng, gaussian } from './rng';
import type { Sample } from './dataset';

export type Activation = 'sigmoid' | 'tanh' | 'relu';
export const act = (a: Activation, z: number): number =>
  a === 'sigmoid' ? 1 / (1 + Math.exp(-z)) : a === 'tanh' ? Math.tanh(z) : Math.max(0, z);
/** Đạo hàm theo đầu ra đã tính (a = f(z)). */
export const dact = (a: Activation, out: number, z: number): number =>
  a === 'sigmoid' ? out * (1 - out) : a === 'tanh' ? 1 - out * out : z > 0 ? 1 : 0;

export interface Mlp {
  sizes: number[];
  hidden: Activation;
  W: number[][][]; // W[l][j][i]
  b: number[][];
}

export function initMlp(sizes: number[], hidden: Activation, seed: number): Mlp {
  const rng = makeRng(seed);
  const W: number[][][] = [], b: number[][] = [];
  for (let l = 1; l < sizes.length; l++) {
    const scale = Math.sqrt(2 / (sizes[l - 1] + sizes[l]));
    W.push(Array.from({ length: sizes[l] }, () => Array.from({ length: sizes[l - 1] }, () => gaussian(rng) * scale)));
    b.push(new Array<number>(sizes[l]).fill(0));
  }
  return { sizes, hidden, W, b };
}

export interface Forward { z: number[][]; a: number[][] }

/** Lan truyền tiến; lớp ra luôn là sigmoid (phân loại nhị phân). */
export function forward(m: Mlp, x: number[]): Forward {
  const a: number[][] = [x], z: number[][] = [[]];
  for (let l = 0; l < m.W.length; l++) {
    const zl = m.W[l].map((row, j) => row.reduce((s, w, i) => s + w * a[l][i], m.b[l][j]));
    const last = l === m.W.length - 1;
    z.push(zl);
    a.push(zl.map((v) => act(last ? 'sigmoid' : m.hidden, v)));
  }
  return { z, a };
}

export const predictProba = (m: Mlp, x: number[]): number => forward(m, x).a[m.W.length][0];

/** Một epoch gradient descent toàn batch với backpropagation; trả loss cross-entropy trung bình. */
export function trainEpoch(m: Mlp, data: Sample[], lr: number): number {
  const L = m.W.length;
  const gW = m.W.map((w) => w.map((r) => r.map(() => 0)));
  const gb = m.b.map((b) => b.map(() => 0));
  let loss = 0;
  for (const s of data) {
    const f = forward(m, s.x);
    const p = f.a[L][0];
    loss -= s.y * Math.log(p + 1e-12) + (1 - s.y) * Math.log(1 - p + 1e-12);
    let delta = [p - s.y]; // sigmoid + cross-entropy
    for (let l = L - 1; l >= 0; l--) {
      delta.forEach((d, j) => {
        gb[l][j] += d;
        for (let i = 0; i < m.W[l][j].length; i++) gW[l][j][i] += d * f.a[l][i];
      });
      if (l > 0) {
        delta = f.a[l].map((out, i) => dact(m.hidden, out, f.z[l][i]) * delta.reduce((sum, d, j) => sum + d * m.W[l][j][i], 0));
      }
    }
  }
  const n = data.length || 1;
  for (let l = 0; l < L; l++) {
    for (let j = 0; j < m.W[l].length; j++) {
      m.b[l][j] -= (lr * gb[l][j]) / n;
      for (let i = 0; i < m.W[l][j].length; i++) m.W[l][j][i] -= (lr * gW[l][j][i]) / n;
    }
  }
  return loss / n;
}

export function meanLoss(m: Mlp, data: Sample[]): number {
  if (!data.length) return 0;
  return data.reduce((s, r) => { const p = predictProba(m, r.x); return s - (r.y * Math.log(p + 1e-12) + (1 - r.y) * Math.log(1 - p + 1e-12)); }, 0) / data.length;
}
