import { describe, quantile } from './dataset';

export type DemoScale = 'none' | 'zscore' | 'minmax';
export type DemoImpute = 'mean' | 'median' | 'drop';

/** Teaching-only transform: fit on the supplied train, retain all-missing columns as null. */
export function preprocessDemo(train: (number | null)[][], impute: DemoImpute, clip: boolean, scale: DemoScale) {
  const width = train[0]?.length ?? 0;
  const fitted = Array.from({ length: width }, (_, j) => {
    const values = train.map(r => r[j]).filter((v): v is number => v !== null && Number.isFinite(v)).sort((a, b) => a - b);
    const s = describe(values), q1 = quantile(values, .25), q3 = quantile(values, .75);
    return { fill: impute === 'mean' ? s.mean : s.median, lo: q1 - 1.5 * (q3 - q1), hi: q3 + 1.5 * (q3 - q1) };
  });
  const valid = (v: number | null) => v !== null && Number.isFinite(v);
  const retainedIndices = train.flatMap((r, i) => impute !== 'drop' || r.every(valid) ? [i] : []);
  const retained = retainedIndices.map(i => train[i]);
  const rows = retained.map(r => r.map((v, j) => {
    const value = valid(v) ? v : fitted[j].fill;
    return value === null ? null : clip ? Math.min(fitted[j].hi, Math.max(fitted[j].lo, value)) : value;
  }));
  const scaling = fitted.map((_, j) => {
    const v = rows.map(r => r[j]).filter((x): x is number => x !== null);
    const mean = v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0;
    const sd = v.length ? Math.sqrt(v.reduce((s, x) => s + (x - mean) ** 2, 0) / v.length) : 0;
    const min = v.length ? Math.min(...v) : 0, max = v.length ? Math.max(...v) : 0;
    return { mean, sd, min, max };
  });
  const scaled = rows.map(r => r.map((x, j) => {
    if (x === null || scale === 'none') return x;
    const p = scaling[j];
    return scale === 'zscore' ? (x - p.mean) / (p.sd || 1) : (x - p.min) / (p.max - p.min || 1);
  }));
  return { rows, scaled, fitted, scaling, retainedIndices, emptyColumns: fitted.flatMap((p, j) => p.fill === null ? [j] : []) };
}
