import { expect, it } from 'vitest';
import { evaluate, roc } from '../src/core/algorithms/metrics';

it('F1 is zero, not undefined, when false positives/negatives exist without true positives', () => {
  expect(evaluate([0, 1], [1, 0]).f1).toBe(0);
  expect(evaluate([0, 1], [0, 0]).f1).toBe(0);
  expect(evaluate([0, 0], [1, 1]).f1).toBe(0);
  expect(evaluate([0, 0], [0, 0]).f1).toBeNull();
});
it('rejects mismatched/non-finite evaluation input instead of silently assigning confusion counts', () => {
  expect(() => evaluate([0, 1], [1])).toThrow();
  expect(() => roc([0, 1], [0.2])).toThrow();
  expect(() => roc([0, 1], [NaN, 1])).toThrow();
});
it('ROC handles tied scores as a single threshold and preserves chance AUC', () => {
  expect(roc([0, 1, 0, 1], [0.5, 0.5, 0.5, 0.5])?.auc).toBe(0.5);
  expect(roc([], [])).toBeNull();
});
it('optimized AUC equals pairwise ranking, including ties', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const labels = Array.from({ length: 25 }, (_, i) => (i % 2 ? 1 : 0) as 0 | 1);
    const scores = labels.map((_, i) => ((i * seed * 17 + seed) % 13) / 13);
    const positives = scores.filter((_, i) => labels[i] === 1), negatives = scores.filter((_, i) => labels[i] === 0);
    const pairwise = positives.reduce((sum, p) => sum + negatives.reduce((n, q) => n + (p > q ? 1 : p === q ? 0.5 : 0), 0), 0) / (positives.length * negatives.length);
    expect(roc(labels, scores)?.auc).toBeCloseTo(pairwise, 12);
  }
});
