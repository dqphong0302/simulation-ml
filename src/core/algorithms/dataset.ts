import { gaussian, makeRng, shuffle } from './rng';

export type Label = 0 | 1;
export interface Sample { x: number[]; y: Label }
export interface Dataset {
  featureNames: string[];
  classNames: [string, string];
  samples: Sample[];
}
export interface Split { train: Sample[]; val: Sample[]; test: Sample[] }

/**
 * Dữ liệu mô phỏng hai biến có thang đo rất khác nhau (giống glucose và BMI).
 * Đây là dữ liệu tổng hợp phục vụ học tập, không phải dữ liệu bệnh nhân.
 */
export function makeSyntheticDataset(n: number, seed: number): Dataset {
  const rng = makeRng(seed);
  const samples: Sample[] = [];
  for (let i = 0; i < n; i++) {
    const y: Label = rng() < 0.5 ? 0 : 1;
    const x = y === 0
      ? [95 + 15 * gaussian(rng), 25 + 4 * gaussian(rng)]
      : [128 + 20 * gaussian(rng), 31 + 5 * gaussian(rng)];
    samples.push({ x, y });
  }
  return {
    featureNames: ['Glucose (mg/dL)', 'BMI (kg/m²)'],
    classNames: ['Nhóm xanh', 'Nhóm cam'],
    samples,
  };
}

/** Chia ngẫu nhiên có seed, giữ tỷ lệ nhãn xấp xỉ trong từng phần (stratified). */
export function splitDataset(samples: Sample[], ratios: [number, number, number], seed: number): Split {
  const rng = makeRng(seed);
  const total = ratios[0] + ratios[1] + ratios[2];
  const out: Split = { train: [], val: [], test: [] };
  for (const label of [0, 1] as const) {
    const group = shuffle(samples.filter((s) => s.y === label), rng);
    const nTrain = Math.round((group.length * ratios[0]) / total);
    const nVal = Math.round((group.length * ratios[1]) / total);
    out.train.push(...group.slice(0, nTrain));
    out.val.push(...group.slice(nTrain, nTrain + nVal));
    out.test.push(...group.slice(nTrain + nVal));
  }
  return { train: shuffle(out.train, rng), val: shuffle(out.val, rng), test: shuffle(out.test, rng) };
}

export interface Scaler { mean: number[]; std: number[] }

/** Chỉ fit trên tập train để tránh rò rỉ dữ liệu. */
export function fitScaler(train: Sample[]): Scaler {
  const d = train[0]?.x.length ?? 0;
  const mean = new Array<number>(d).fill(0);
  const std = new Array<number>(d).fill(1);
  if (train.length === 0) return { mean, std };
  for (let j = 0; j < d; j++) {
    mean[j] = train.reduce((s, r) => s + r.x[j], 0) / train.length;
    const v = train.reduce((s, r) => s + (r.x[j] - mean[j]) ** 2, 0) / train.length;
    std[j] = Math.sqrt(v) || 1;
  }
  return { mean, std };
}

export function applyScaler(x: number[], sc: Scaler): number[] {
  return x.map((v, j) => (v - sc.mean[j]) / sc.std[j]);
}

export function scaleSamples(samples: Sample[], sc: Scaler): Sample[] {
  return samples.map((s) => ({ x: applyScaler(s.x, sc), y: s.y }));
}

/** Hai vòng tròn đồng tâm: không tách được bằng đường thẳng, dùng để thấy vai trò lớp ẩn. */
export function makeCircles(n: number, seed: number, noise = 0.12): Dataset {
  const rng = makeRng(seed);
  const samples: Sample[] = [];
  for (let i = 0; i < n; i++) {
    const y: Label = i % 2 === 0 ? 0 : 1;
    const r = (y === 0 ? 0.4 : 1) + noise * gaussian(rng), a = rng() * 2 * Math.PI;
    samples.push({ x: [r * Math.cos(a), r * Math.sin(a)], y });
  }
  return { featureNames: ['x1', 'x2'], classNames: ['Lớp 0', 'Lớp 1'], samples };
}

export interface Stats { n: number; missing: number; mean: number | null; std: number | null; min: number | null; max: number | null; median: number | null }
export function describe(values: (number | null)[]): Stats {
  const v = values.filter((x): x is number => x !== null && Number.isFinite(x)).sort((a, b) => a - b);
  if (v.length === 0) return { n: values.length, missing: values.length, mean: null, std: null, min: null, max: null, median: null };
  const mean = v.reduce((s, x) => s + x, 0) / v.length;
  const std = Math.sqrt(v.reduce((s, x) => s + (x - mean) ** 2, 0) / v.length);
  const mid = Math.floor(v.length / 2);
  return { n: values.length, missing: values.length - v.length, mean, std, min: v[0], max: v[v.length - 1], median: v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2 };
}

export function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  const pos = (sorted.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export function pearson(a: number[], b: number[]): number | null {
  const n = a.length;
  if (n < 2) return null;
  const ma = a.reduce((s, x) => s + x, 0) / n, mb = b.reduce((s, x) => s + x, 0) / n;
  let sab = 0, saa = 0, sbb = 0;
  for (let i = 0; i < n; i++) { sab += (a[i] - ma) * (b[i] - mb); saa += (a[i] - ma) ** 2; sbb += (b[i] - mb) ** 2; }
  return saa === 0 || sbb === 0 ? null : sab / Math.sqrt(saa * sbb);
}

export function histogram(values: number[], lo: number, hi: number, bins: number): { center: number; count: number }[] {
  const w = (hi - lo) / bins || 1;
  const out = Array.from({ length: bins }, (_, i) => ({ center: lo + (i + 0.5) * w, count: 0 }));
  values.forEach((x) => { const i = Math.min(bins - 1, Math.max(0, Math.floor((x - lo) / w))); out[i].count++; });
  return out;
}
