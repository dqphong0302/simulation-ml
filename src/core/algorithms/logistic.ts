import type { Label, Sample } from './dataset';

export interface LogisticModel { w: number[]; b: number; lossHistory: number[] }

export const sigmoid = (z: number): number => (z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z)));

export function logisticProba(m: Pick<LogisticModel, 'w' | 'b'>, x: number[]): number {
  return sigmoid(m.w.reduce((s, wi, i) => s + wi * x[i], m.b));
}

/** Gradient descent toàn batch trên cross-entropy. Dữ liệu nên được chuẩn hóa trước. */
export function trainLogistic(train: Sample[], lr: number, epochs: number): LogisticModel {
  const d = train[0]?.x.length ?? 0;
  const w = new Array<number>(d).fill(0);
  let b = 0;
  const lossHistory: number[] = [];
  const n = train.length;
  if (n === 0) return { w, b, lossHistory };
  const eps = 1e-12;
  for (let e = 0; e < epochs; e++) {
    const gw = new Array<number>(d).fill(0);
    let gb = 0, loss = 0;
    for (const s of train) {
      const p = logisticProba({ w, b }, s.x);
      const err = p - s.y;
      for (let j = 0; j < d; j++) gw[j] += err * s.x[j];
      gb += err;
      loss -= s.y * Math.log(p + eps) + (1 - s.y) * Math.log(1 - p + eps);
    }
    for (let j = 0; j < d; j++) w[j] -= (lr * gw[j]) / n;
    b -= (lr * gb) / n;
    lossHistory.push(loss / n);
  }
  return { w, b, lossHistory };
}

export const classify = (p: number, threshold: number): Label => (p >= threshold ? 1 : 0);
