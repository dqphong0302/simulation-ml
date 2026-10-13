import type { Label } from './dataset';

export interface Confusion { tp: number; fp: number; tn: number; fn: number }
export interface Metrics {
  confusion: Confusion;
  accuracy: number | null;
  precision: number | null;
  recall: number | null;
  specificity: number | null;
  f1: number | null;
}

const div = (a: number, b: number): number | null => (b === 0 ? null : a / b);

/** Lớp dương là nhãn 1. Mẫu số bằng 0 trả về null thay vì số giả. */
export function confusion(yTrue: Label[], yPred: Label[]): Confusion {
  const c = { tp: 0, fp: 0, tn: 0, fn: 0 };
  yTrue.forEach((t, i) => {
    const p = yPred[i];
    if (t === 1 && p === 1) c.tp++;
    else if (t === 0 && p === 1) c.fp++;
    else if (t === 0 && p === 0) c.tn++;
    else c.fn++;
  });
  return c;
}

export function metricsFrom(c: Confusion): Metrics {
  const precision = div(c.tp, c.tp + c.fp);
  const recall = div(c.tp, c.tp + c.fn);
  const f1 = precision === null || recall === null || precision + recall === 0
    ? null : (2 * precision * recall) / (precision + recall);
  return {
    confusion: c,
    accuracy: div(c.tp + c.tn, c.tp + c.tn + c.fp + c.fn),
    precision, recall,
    specificity: div(c.tn, c.tn + c.fp),
    f1,
  };
}

export function evaluate(yTrue: Label[], yPred: Label[]): Metrics {
  return metricsFrom(confusion(yTrue, yPred));
}

export interface RocPoint { threshold: number; fpr: number; tpr: number }

/** ROC từ điểm số liên tục. Trả về null nếu chỉ có một lớp (không xác định). */
export function roc(yTrue: Label[], scores: number[]): { points: RocPoint[]; auc: number } | null {
  const pos = yTrue.filter((y) => y === 1).length;
  const neg = yTrue.length - pos;
  if (pos === 0 || neg === 0) return null;
  const thresholds = Array.from(new Set(scores)).sort((a, b) => b - a);
  const points: RocPoint[] = [{ threshold: Infinity, fpr: 0, tpr: 0 }];
  for (const th of thresholds) {
    let tp = 0, fp = 0;
    scores.forEach((s, i) => {
      if (s >= th) { if (yTrue[i] === 1) tp++; else fp++; }
    });
    points.push({ threshold: th, fpr: fp / neg, tpr: tp / pos });
  }
  let auc = 0;
  for (let i = 1; i < points.length; i++) {
    auc += ((points[i].fpr - points[i - 1].fpr) * (points[i].tpr + points[i - 1].tpr)) / 2;
  }
  return { points, auc };
}

export const fmt = (v: number | null, digits = 3): string => (v === null ? 'n/a' : v.toFixed(digits));
