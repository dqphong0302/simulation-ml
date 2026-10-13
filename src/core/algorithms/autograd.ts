import { gaussian } from './rng';

/** Ma trận có autograd (đủ cho một khối Transformer nhỏ). Dữ liệu lưu theo hàng. */
export class T {
  grad: Float64Array;
  _back: () => void = () => {};
  constructor(public data: Float64Array, public rows: number, public cols: number, public parents: T[] = []) { this.grad = new Float64Array(data.length); }
  static zeros(r: number, c: number) { return new T(new Float64Array(r * c), r, c); }
  static randn(r: number, c: number, rng: () => number, scale: number) { const t = T.zeros(r, c); for (let i = 0; i < t.data.length; i++) t.data[i] = gaussian(rng) * scale; return t; }
  at(i: number, j: number) { return this.data[i * this.cols + j]; }
  backward(): void {
    const order: T[] = [], seen = new Set<T>();
    const visit = (t: T) => { if (seen.has(t)) return; seen.add(t); t.parents.forEach(visit); order.push(t); };
    visit(this);
    this.grad.fill(1);
    for (let i = order.length - 1; i >= 0; i--) order[i]._back();
  }
}

export function matmul(a: T, b: T): T {
  const { rows: n, cols: k } = a, m = b.cols, out = T.zeros(n, m); out.parents = [a, b];
  for (let i = 0; i < n; i++) for (let p = 0; p < k; p++) { const av = a.data[i * k + p]; if (av === 0) continue; for (let j = 0; j < m; j++) out.data[i * m + j] += av * b.data[p * m + j]; }
  out._back = () => {
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const g = out.grad[i * m + j]; if (g === 0) continue; for (let p = 0; p < k; p++) { a.grad[i * k + p] += g * b.data[p * m + j]; b.grad[p * m + j] += g * a.data[i * k + p]; } }
  };
  return out;
}

/** a · bᵀ */
export function matmulT(a: T, b: T): T {
  const n = a.rows, k = a.cols, m = b.rows, out = T.zeros(n, m); out.parents = [a, b];
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { let s = 0; for (let p = 0; p < k; p++) s += a.data[i * k + p] * b.data[j * k + p]; out.data[i * m + j] = s; }
  out._back = () => {
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const g = out.grad[i * m + j]; if (g === 0) continue; for (let p = 0; p < k; p++) { a.grad[i * k + p] += g * b.data[j * k + p]; b.grad[j * k + p] += g * a.data[i * k + p]; } }
  };
  return out;
}

export function add(a: T, b: T): T {
  const out = new T(a.data.map((v, i) => v + b.data[i]), a.rows, a.cols, [a, b]);
  out._back = () => { for (let i = 0; i < out.grad.length; i++) { a.grad[i] += out.grad[i]; b.grad[i] += out.grad[i]; } };
  return out;
}

/** Cộng bias 1×c vào mọi hàng. */
export function addRow(a: T, b: T): T {
  const c = a.cols, out = new T(a.data.map((v, i) => v + b.data[i % c]), a.rows, c, [a, b]);
  out._back = () => { for (let i = 0; i < out.grad.length; i++) { a.grad[i] += out.grad[i]; b.grad[i % c] += out.grad[i]; } };
  return out;
}

export function relu(a: T): T {
  const out = new T(a.data.map((v) => (v > 0 ? v : 0)), a.rows, a.cols, [a]);
  out._back = () => { for (let i = 0; i < out.grad.length; i++) if (a.data[i] > 0) a.grad[i] += out.grad[i]; };
  return out;
}

export function scale(a: T, k: number): T {
  const out = new T(a.data.map((v) => v * k), a.rows, a.cols, [a]);
  out._back = () => { for (let i = 0; i < out.grad.length; i++) a.grad[i] += k * out.grad[i]; };
  return out;
}

/** Lấy các hàng theo chỉ số (embedding lookup). */
export function gather(E: T, ids: number[]): T {
  const c = E.cols, out = T.zeros(ids.length, c); out.parents = [E];
  ids.forEach((id, r) => { for (let j = 0; j < c; j++) out.data[r * c + j] = E.data[id * c + j]; });
  out._back = () => { ids.forEach((id, r) => { for (let j = 0; j < c; j++) E.grad[id * c + j] += out.grad[r * c + j]; }); };
  return out;
}

/** Softmax theo hàng; causal che j > i. */
export function softmaxRows(a: T, causal: boolean): T {
  const { rows: n, cols: m } = a, out = T.zeros(n, m); out.parents = [a];
  for (let i = 0; i < n; i++) {
    let mx = -Infinity;
    for (let j = 0; j < m; j++) if (!(causal && j > i)) mx = Math.max(mx, a.data[i * m + j]);
    let s = 0;
    for (let j = 0; j < m; j++) { const e = causal && j > i ? 0 : Math.exp(a.data[i * m + j] - mx); out.data[i * m + j] = e; s += e; }
    for (let j = 0; j < m; j++) out.data[i * m + j] /= s;
  }
  out._back = () => {
    for (let i = 0; i < n; i++) {
      let dot = 0;
      for (let j = 0; j < m; j++) dot += out.grad[i * m + j] * out.data[i * m + j];
      for (let j = 0; j < m; j++) a.grad[i * m + j] += out.data[i * m + j] * (out.grad[i * m + j] - dot);
    }
  };
  return out;
}

/** Cross-entropy trung bình giữa logits (n×V) và nhãn đích; trả T 1×1. */
export function crossEntropy(logits: T, targets: number[]): T {
  const { rows: n, cols: V } = logits, probs = new Float64Array(n * V);
  let loss = 0;
  for (let i = 0; i < n; i++) {
    let mx = -Infinity; for (let j = 0; j < V; j++) mx = Math.max(mx, logits.data[i * V + j]);
    let s = 0; for (let j = 0; j < V; j++) { probs[i * V + j] = Math.exp(logits.data[i * V + j] - mx); s += probs[i * V + j]; }
    for (let j = 0; j < V; j++) probs[i * V + j] /= s;
    loss -= Math.log(probs[i * V + targets[i]] + 1e-12);
  }
  const out = new T(new Float64Array([loss / n]), 1, 1, [logits]);
  out._back = () => { const g = out.grad[0] / n; for (let i = 0; i < n; i++) for (let j = 0; j < V; j++) logits.grad[i * V + j] += g * (probs[i * V + j] - (j === targets[i] ? 1 : 0)); };
  return out;
}

/** Adam cho danh sách tham số. */
export class Adam {
  m: Float64Array[]; v: Float64Array[]; t = 0;
  constructor(public params: T[], public lr = 0.01, public b1 = 0.9, public b2 = 0.999) { this.m = params.map((p) => new Float64Array(p.data.length)); this.v = params.map((p) => new Float64Array(p.data.length)); }
  step(): void {
    this.t++;
    this.params.forEach((p, k) => {
      for (let i = 0; i < p.data.length; i++) {
        const g = p.grad[i];
        this.m[k][i] = this.b1 * this.m[k][i] + (1 - this.b1) * g;
        this.v[k][i] = this.b2 * this.v[k][i] + (1 - this.b2) * g * g;
        const mh = this.m[k][i] / (1 - this.b1 ** this.t), vh = this.v[k][i] / (1 - this.b2 ** this.t);
        p.data[i] -= (this.lr * mh) / (Math.sqrt(vh) + 1e-8);
      }
      p.grad.fill(0);
    });
  }
}
