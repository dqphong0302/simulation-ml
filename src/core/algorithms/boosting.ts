import type { Sample } from './dataset';

export interface Stump { feature: number; threshold: number; left: number; right: number }
export interface BoostModel { bias: number; rate: number; trees: Stump[] }
export const sigmoid = (z: number) => 1 / (1 + Math.exp(-Math.max(-40, Math.min(40, z))));
const leaf = (t: Stump, x: number[]) => x[t.feature] <= t.threshold ? t.left : t.right;

/** Least-squares stump fitted to negative logistic-loss gradients, not class labels.
 * Fixed gradient step per stage; no Newton leaf update (unlike sklearn's classifier).
 */
export function fitBoosting(train: Sample[], rounds = 30, rate = .2): BoostModel {
  if (!train.length || !train[0].x.length || !Number.isFinite(rate) || rate <= 0 || rate > 1 ||
      !Number.isInteger(rounds) || rounds < 0 || rounds > 100 ||
      train.some(s => s.x.length !== train[0].x.length || s.x.some(x => !Number.isFinite(x)) || ![0, 1].includes(s.y)))
    throw new Error('Boosting cần bảng hữu hạn, nhãn 0/1, 0–100 cây và learning rate trong (0,1].');
  const p = Math.max(1e-6, Math.min(1 - 1e-6, train.reduce((a, s) => a + s.y, 0) / train.length));
  const model: BoostModel = { bias: Math.log(p / (1 - p)), rate, trees: [] };
  const scores = train.map(() => model.bias);
  const orders = train[0].x.map((_, j) => train.map((s, i) => ({ x: s.x[j], i })).sort((a, b) => a.x - b.x));
  for (let m = 0; m < rounds; m++) {
    const r = train.map((s, i) => s.y - sigmoid(scores[i]));
    const total = r.reduce((a, b) => a + b, 0), square = r.reduce((a, b) => a + b * b, 0);
    let best: Stump = { feature: 0, threshold: Infinity, left: total / r.length, right: total / r.length };
    let bestError = square - total * total / r.length;
    orders.forEach((order, feature) => {
      let sum = 0;
      for (let k = 0; k < order.length - 1; k++) {
        sum += r[order[k].i];
        if (order[k].x === order[k + 1].x) continue;
        const n = k + 1, rest = r.length - n;
        const error = square - sum * sum / n - (total - sum) ** 2 / rest;
        if (error < bestError - 1e-12) {
          bestError = error;
          best = { feature, threshold: order[k].x / 2 + order[k + 1].x / 2, left: sum / n, right: (total - sum) / rest };
        }
      }
    });
    model.trees.push(best);
    scores.forEach((z, i) => { scores[i] = z + rate * leaf(best, train[i].x); });
  }
  return model;
}
export function boostScore(model: BoostModel, x: number[], stages = model.trees.length) {
  return model.bias + model.rate * model.trees.slice(0, stages).reduce((a, t) => a + leaf(t, x), 0);
}
export const boostProba = (model: BoostModel, x: number[], stages = model.trees.length) => sigmoid(boostScore(model, x, stages));
export const logLoss = (set: Sample[], predict: (x: number[]) => number) => set.length ? -set.reduce((a, s) => {
  const p = Math.max(1e-12, Math.min(1 - 1e-12, predict(s.x)));
  return a + (s.y ? Math.log(p) : Math.log1p(-p));
}, 0) / set.length : null;
