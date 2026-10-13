import { add, addRow, Adam, crossEntropy, gather, matmul, matmulT, relu, scale, softmaxRows, T } from './autograd';
import { makeRng } from './rng';

export const CORPUS = [
  'bệnh nhân uống thuốc đúng giờ .',
  'bác sĩ khám bệnh nhân mỗi sáng .',
  'điều dưỡng đo huyết áp cho bệnh nhân .',
  'bệnh nhân đo đường huyết mỗi sáng .',
  'bác sĩ kê đơn thuốc cho bệnh nhân .',
  'điều dưỡng nhắc bệnh nhân uống thuốc .',
  'bệnh nhân tái khám mỗi tháng .',
  'bác sĩ đọc kết quả xét nghiệm .',
  'điều dưỡng ghi kết quả đo huyết áp .',
  'bệnh nhân ăn ít đường mỗi ngày .',
];

export interface Vocab { itos: string[]; stoi: Map<string, number> }
export function buildVocab(lines: string[]): Vocab {
  const itos = ['<s>', ...Array.from(new Set(lines.flatMap((l) => l.split(/\s+/)))).sort()];
  return { itos, stoi: new Map(itos.map((s, i) => [s, i])) };
}
export const encode = (v: Vocab, text: string): number[] => text.trim().split(/\s+/).filter(Boolean).map((w) => v.stoi.get(w) ?? -1);

export interface GptConfig { ctx: number; d: number; ff: number; seed: number; lr: number }

/** Một khối Transformer decoder đơn đầu (không LayerNorm để gọn): embedding + vị trí → causal attention → FFN → logits. */
export class MiniGpt {
  E: T; P: T; Wq: T; Wk: T; Wv: T; Wo: T; W1: T; b1: T; W2: T; b2: T; Wout: T; bout: T;
  opt: Adam; rng: () => number;
  constructor(public vocab: Vocab, public cfg: GptConfig) {
    const r = (this.rng = makeRng(cfg.seed)), V = vocab.itos.length, { d, ff, ctx } = cfg;
    const s = (n: number) => 1 / Math.sqrt(n);
    this.E = T.randn(V, d, r, 0.5); this.P = T.randn(ctx, d, r, 0.2);
    this.Wq = T.randn(d, d, r, s(d)); this.Wk = T.randn(d, d, r, s(d)); this.Wv = T.randn(d, d, r, s(d)); this.Wo = T.randn(d, d, r, s(d));
    this.W1 = T.randn(d, ff, r, s(d)); this.b1 = T.zeros(1, ff); this.W2 = T.randn(ff, d, r, s(ff)); this.b2 = T.zeros(1, d);
    this.Wout = T.randn(d, V, r, s(d)); this.bout = T.zeros(1, V);
    this.opt = new Adam(this.params(), cfg.lr);
  }
  params(): T[] { return [this.E, this.P, this.Wq, this.Wk, this.Wv, this.Wo, this.W1, this.b1, this.W2, this.b2, this.Wout, this.bout]; }
  nParams(): number { return this.params().reduce((s, p) => s + p.data.length, 0); }

  forward(ids: number[]): { logits: T; attn: T } {
    const d = this.cfg.d;
    const x = add(gather(this.E, ids), gather(this.P, ids.map((_, i) => i)));
    const q = matmul(x, this.Wq), k = matmul(x, this.Wk), v = matmul(x, this.Wv);
    const attn = softmaxRows(scale(matmulT(q, k), 1 / Math.sqrt(d)), true);
    const h = add(x, matmul(matmul(attn, v), this.Wo));
    const f = add(h, addRow(matmul(relu(addRow(matmul(h, this.W1), this.b1)), this.W2), this.b2));
    return { logits: addRow(matmul(f, this.Wout), this.bout), attn };
  }

  /** Các cửa sổ (đầu vào, đích dịch 1 token) lấy từ từng câu, có token mở đầu <s>. */
  windows(lines: string[]): { x: number[]; y: number[] }[] {
    const out: { x: number[]; y: number[] }[] = [];
    for (const l of lines) {
      const ids = [0, ...encode(this.vocab, l)];
      for (let s = 0; s + 1 < ids.length; s++) {
        const x = ids.slice(s, s + this.cfg.ctx), y = ids.slice(s + 1, s + 1 + this.cfg.ctx);
        if (y.length === x.length && x.length > 0) out.push({ x, y });
        else if (y.length > 0) out.push({ x: x.slice(0, y.length), y });
        if (s + this.cfg.ctx >= ids.length - 1) break;
      }
    }
    return out;
  }

  /** Một bước Adam trên minibatch; trả loss trung bình. */
  step(batch: { x: number[]; y: number[] }[]): number {
    let total = 0;
    for (const b of batch) {
      const loss = crossEntropy(this.forward(b.x).logits, b.y);
      loss.backward();
      total += loss.data[0];
    }
    this.params().forEach((p) => { for (let i = 0; i < p.grad.length; i++) p.grad[i] /= batch.length; });
    this.opt.step();
    return total / batch.length;
  }

  evalLoss(data: { x: number[]; y: number[] }[]): number {
    return data.reduce((s, b) => s + crossEntropy(this.forward(b.x).logits, b.y).data[0], 0) / Math.max(1, data.length);
  }

  /** Sinh tiếp tối đa n token; trả các bước kèm top-5 xác suất. */
  generate(prompt: string, n: number, temperature: number, seed: number): { text: string; steps: { token: string; top: [string, number][] }[]; unknown: string[] } {
    const rng = makeRng(seed);
    const words = prompt.trim().split(/\s+/).filter(Boolean);
    const unknown = words.filter((w) => !this.vocab.stoi.has(w));
    let ids = [0, ...words.filter((w) => this.vocab.stoi.has(w)).map((w) => this.vocab.stoi.get(w)!)];
    const steps: { token: string; top: [string, number][] }[] = [];
    for (let s = 0; s < n; s++) {
      const ctx = ids.slice(-this.cfg.ctx);
      const { logits } = this.forward(ctx);
      const V = logits.cols, row = Array.from({ length: V }, (_, j) => logits.at(ctx.length - 1, j) / Math.max(temperature, 1e-3));
      const mx = Math.max(...row), e = row.map((v) => Math.exp(v - mx)), sum = e.reduce((a, b) => a + b, 0), p = e.map((v) => v / sum);
      p[0] = 0; const z = p.reduce((a, b) => a + b, 0); for (let j = 0; j < V; j++) p[j] /= z; // không sinh lại <s>
      let r = rng(), pick = 0; while (pick < V - 1 && r >= p[pick]) { r -= p[pick]; pick++; }
      const top = p.map((v, j) => [this.vocab.itos[j], v] as [string, number]).sort((a, b) => b[1] - a[1]).slice(0, 5);
      steps.push({ token: this.vocab.itos[pick], top });
      ids.push(pick);
      if (this.vocab.itos[pick] === '.') break;
    }
    return { text: [...words.filter((w) => this.vocab.stoi.has(w)), ...steps.map((s) => s.token)].join(' '), steps, unknown };
  }

  attention(text: string): { tokens: string[]; weights: number[][] } {
    const words = text.trim().split(/\s+/).filter((w) => this.vocab.stoi.has(w)).slice(-(this.cfg.ctx - 1));
    const ids = [0, ...words.map((w) => this.vocab.stoi.get(w)!)];
    const { attn } = this.forward(ids);
    return { tokens: ['<s>', ...words], weights: Array.from({ length: attn.rows }, (_, i) => Array.from({ length: attn.cols }, (_, j) => attn.at(i, j))) };
  }
}
