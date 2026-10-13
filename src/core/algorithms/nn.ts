import { gaussian, makeRng } from './rng';

export type Act = 'tanh' | 'relu' | 'linear' | 'sigmoid';
const f = (a: Act, z: number) => (a === 'tanh' ? Math.tanh(z) : a === 'relu' ? Math.max(0, z) : a === 'sigmoid' ? 1 / (1 + Math.exp(-z)) : z);
const df = (a: Act, y: number, z: number) => (a === 'tanh' ? 1 - y * y : a === 'relu' ? (z > 0 ? 1 : 0) : a === 'sigmoid' ? y * (1 - y) : 1);

/** Lớp kết nối đầy đủ có lan truyền ngược; gradient cộng dồn cho tới khi gọi step(). */
export class Dense {
  W: number[][]; b: number[]; gW: number[][]; gb: number[];
  private x: number[] = []; private z: number[] = []; private y: number[] = [];
  constructor(public nIn: number, public nOut: number, public act: Act, rng: () => number) {
    const s = Math.sqrt(2 / (nIn + nOut));
    this.W = Array.from({ length: nOut }, () => Array.from({ length: nIn }, () => gaussian(rng) * s));
    this.b = new Array<number>(nOut).fill(0);
    this.gW = this.W.map((r) => r.map(() => 0)); this.gb = this.b.map(() => 0);
  }
  forward(x: number[]): number[] {
    this.x = x;
    this.z = this.W.map((row, j) => row.reduce((s, w, i) => s + w * x[i], this.b[j]));
    this.y = this.z.map((v) => f(this.act, v));
    return this.y;
  }
  /** dout = ∂L/∂y; trả về ∂L/∂x. Phải gọi ngay sau forward của cùng mẫu. */
  backward(dout: number[]): number[] {
    const dz = dout.map((d, j) => d * df(this.act, this.y[j], this.z[j]));
    const dx = new Array<number>(this.nIn).fill(0);
    dz.forEach((d, j) => { this.gb[j] += d; for (let i = 0; i < this.nIn; i++) { this.gW[j][i] += d * this.x[i]; dx[i] += d * this.W[j][i]; } });
    return dx;
  }
  step(lr: number, n: number): void {
    for (let j = 0; j < this.nOut; j++) {
      this.b[j] -= (lr * this.gb[j]) / n; this.gb[j] = 0;
      for (let i = 0; i < this.nIn; i++) { this.W[j][i] -= (lr * this.gW[j][i]) / n; this.gW[j][i] = 0; }
    }
  }
  zero(): void { this.gb.fill(0); this.gW.forEach((r) => r.fill(0)); }
}

// ---------- VAE nhỏ: x(d) → h → (μ, logσ²)(k) → z → h → x̂(d) ----------
export class Vae {
  enc: Dense; mu: Dense; lv: Dense; dec1: Dense; dec2: Dense; rng: () => number;
  constructor(public d: number, public k: number, hidden: number, seed: number) {
    this.rng = makeRng(seed);
    this.enc = new Dense(d, hidden, 'tanh', this.rng); this.mu = new Dense(hidden, k, 'linear', this.rng); this.lv = new Dense(hidden, k, 'linear', this.rng);
    this.dec1 = new Dense(k, hidden, 'tanh', this.rng); this.dec2 = new Dense(hidden, d, 'linear', this.rng);
  }
  /** Một epoch batch: loss = MSE tái dựng + beta·KL. Trả { recon, kl }. */
  epoch(X: number[][], lr: number, beta: number): { recon: number; kl: number } {
    let recon = 0, kl = 0;
    for (const x of X) {
      const h = this.enc.forward(x), mu = this.mu.forward(h), lv = this.lv.forward(h);
      const eps = mu.map(() => gaussian(this.rng));
      const z = mu.map((m, i) => m + Math.exp(0.5 * lv[i]) * eps[i]); // reparameterization
      const xh = this.dec2.forward(this.dec1.forward(z));
      recon += xh.reduce((s, v, i) => s + (v - x[i]) ** 2, 0) / this.d;
      kl += mu.reduce((s, m, i) => s + -0.5 * (1 + lv[i] - m * m - Math.exp(lv[i])), 0);
      const dz = this.dec1.backward(this.dec2.backward(xh.map((v, i) => (2 * (v - x[i])) / this.d)));
      const dmu = dz.map((g, i) => g + beta * mu[i]);
      const dlv = dz.map((g, i) => g * 0.5 * Math.exp(0.5 * lv[i]) * eps[i] + beta * -0.5 * (1 - Math.exp(lv[i])));
      const dhMu = this.mu.backward(dmu), dhLv = this.lv.backward(dlv);
      this.enc.backward(dhMu.map((v, i) => v + dhLv[i]));
    }
    [this.enc, this.mu, this.lv, this.dec1, this.dec2].forEach((l) => l.step(lr, X.length));
    return { recon: recon / X.length, kl: kl / X.length };
  }
  encode(x: number[]): { mu: number[]; lv: number[] } { const h = this.enc.forward(x); return { mu: this.mu.forward(h), lv: this.lv.forward(h) }; }
  decode(z: number[]): number[] { return this.dec2.forward(this.dec1.forward(z)); }
  sample(n: number): number[][] { return Array.from({ length: n }, () => this.decode(Array.from({ length: this.k }, () => gaussian(this.rng)))); }
}

// ---------- GAN 1 chiều ----------
export class Gan1d {
  G: Dense[]; D: Dense[]; rng: () => number;
  constructor(hidden: number, seed: number) {
    this.rng = makeRng(seed);
    this.G = [new Dense(1, hidden, 'tanh', this.rng), new Dense(hidden, 1, 'linear', this.rng)];
    this.D = [new Dense(1, hidden, 'tanh', this.rng), new Dense(hidden, 1, 'sigmoid', this.rng)];
  }
  gen(z: number): number { return this.G[1].forward(this.G[0].forward([z]))[0]; }
  disc(x: number): number { return this.D[1].forward(this.D[0].forward([x]))[0]; }
  /** Một bước: cập nhật D trên batch thật/giả rồi cập nhật G (loss không bão hòa: −log D(G(z))). */
  step(real: number[], lrD: number, lrG: number): { dLoss: number; gLoss: number } {
    const n = real.length, eps = 1e-8;
    let dLoss = 0;
    for (const x of real) { const p = this.disc(x); dLoss -= Math.log(p + eps); this.D[0].backward(this.D[1].backward([-1 / (p + eps)])); }
    for (let i = 0; i < n; i++) { const g = this.gen(gaussian(this.rng)); const p = this.disc(g); dLoss -= Math.log(1 - p + eps); this.D[0].backward(this.D[1].backward([1 / (1 - p + eps)])); }
    this.D.forEach((l) => l.step(lrD, 2 * n));
    let gLoss = 0;
    for (let i = 0; i < n; i++) {
      const g = this.gen(gaussian(this.rng)); const p = this.disc(g); gLoss -= Math.log(p + eps);
      const dx = this.D[0].backward(this.D[1].backward([-1 / (p + eps)]));
      this.G[0].backward(this.G[1].backward(dx));
    }
    this.D.forEach((l) => l.zero()); // gradient D từ bước G bị bỏ, chỉ cập nhật G
    this.G.forEach((l) => l.step(lrG, n));
    return { dLoss: dLoss / (2 * n), gLoss: gLoss / n };
  }
}
