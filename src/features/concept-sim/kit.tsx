import type { CSSProperties, ReactNode } from 'react';
import { gaussian, makeRng } from '../../core/algorithms/rng';

/** Một khung hình: bước s, tiến độ p ∈ [0,1] trong bước, e là p đã làm mượt, t giây đã chạy, v là giá trị thanh trượt. */
export type Frame = { s: number; p: number; e: number; t: number; v: number };

export type Scene = {
  /** [nhãn ngắn, giải thích] cho từng bước. */
  steps: [string, string][];
  param?: { label: string; min: number; max: number; step: number; value: number; fmt?: (v: number) => string };
  /** Câu hỏi dự đoán cho chế độ thực hành. */
  predict: string;
  draw: (f: Frame) => ReactNode;
};

export const W = 360, H = 220;
export const C = {
  a: 'var(--chart-1)', b: 'var(--chart-2)', c: 'var(--chart-3)', d: 'var(--chart-4)',
  ink: 'var(--text)', ink2: 'var(--text-2)', mute: 'var(--text-3)', line: 'var(--border-strong)',
  soft: 'var(--surface-3)', surf: 'var(--surface)', brand: 'var(--brand)', bad: 'var(--danger)', ok: 'var(--ok)',
};
export const CLASS = [C.a, C.b, C.c, C.d];

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const ease = (t: number) => { const x = clamp(t); return x < .5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2; };
/** Tiến độ trễ dần cho phần tử thứ i trong n: tạo hiệu ứng xuất hiện nối tiếp. */
export const stagger = (p: number, i: number, n: number, span = .5) => ease((p - (i / Math.max(1, n)) * (1 - span)) / span);
export const at = (f: Frame, step: number) => (f.s > step ? 1 : f.s < step ? 0 : f.e);
export const fmt = (x: number, d = 2) => x.toFixed(d).replace('.', ',');

export type P = { x: number; y: number; c: number };
export function blobs(seed: number, spec: [number, number, number, number, number][]): P[] {
  const r = makeRng(seed), out: P[] = [];
  spec.forEach(([cx, cy, sd, n, c]) => { for (let i = 0; i < n; i++) out.push({ x: cx + gaussian(r) * sd, y: cy + gaussian(r) * sd, c }); });
  return out;
}

const fill = (c: string, o = 1): CSSProperties => ({ fill: c, opacity: o });
export const Dot = ({ x, y, r = 4, c = C.a, o = 1, ring }: { x: number; y: number; r?: number; c?: string; o?: number; ring?: string }) =>
  <circle cx={x} cy={y} r={Math.max(0, r)} style={{ ...fill(c, o), stroke: ring ?? 'var(--surface)', strokeWidth: ring ? 2 : 1 }} />;
export const Ln = ({ x1, y1, x2, y2, c = C.line, w = 1.5, o = 1, dash }: { x1: number; y1: number; x2: number; y2: number; c?: string; w?: number; o?: number; dash?: string }) =>
  <line x1={x1} y1={y1} x2={x2} y2={y2} style={{ stroke: c, strokeWidth: w, opacity: o, strokeDasharray: dash }} />;
export const Bx = ({ x, y, w, h, c = C.soft, o = 1, r = 4, stroke }: { x: number; y: number; w: number; h: number; c?: string; o?: number; r?: number; stroke?: string }) =>
  <rect x={x} y={y} width={Math.max(0, w)} height={Math.max(0, h)} rx={r} style={{ ...fill(c, o), stroke, strokeWidth: stroke ? 1.2 : 0 }} />;
export const Tx = ({ x, y, children, c = C.ink2, s = 11, a = 'middle', w = 500, o = 1 }: { x: number; y: number; children: ReactNode; c?: string; s?: number; a?: 'start' | 'middle' | 'end'; w?: number; o?: number }) =>
  <text x={x} y={y} textAnchor={a} style={{ fill: c, fontSize: s, fontWeight: w, opacity: o, fontFamily: 'var(--font)' }}>{children}</text>;
export const Path = ({ d, c = C.a, w = 2, o = 1, f = 'none', dash, len }: { d: string; c?: string; w?: number; o?: number; f?: string; dash?: string; len?: number }) =>
  <path d={d} pathLength={len === undefined ? undefined : 1} style={{ stroke: c, strokeWidth: w, opacity: o, fill: f, strokeDasharray: len === undefined ? dash : 1, strokeDashoffset: len === undefined ? undefined : 1 - clamp(len), strokeLinecap: 'round', strokeLinejoin: 'round' }} />;
export const Axes = ({ x0 = 30, y0 = 190, x1 = 340, y1 = 20, o = 1 }: { x0?: number; y0?: number; x1?: number; y1?: number; o?: number }) =>
  <g style={{ opacity: o }}><Ln x1={x0} y1={y0} x2={x1} y2={y0} /><Ln x1={x0} y1={y0} x2={x0} y2={y1} /></g>;
export const poly = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');
export const softmax = (z: number[], T = 1) => { const m = Math.max(...z), e = z.map(x => Math.exp((x - m) / T)), s = e.reduce((a, b) => a + b, 0); return e.map(x => x / s); };
