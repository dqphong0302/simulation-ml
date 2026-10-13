import { makeRng } from './rng';

export function softmax(logits: number[], temperature: number): number[] {
  const t = Math.max(temperature, 1e-6);
  const m = Math.max(...logits);
  const e = logits.map((l) => Math.exp((l - m) / t));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}

/** Giữ tập token nhỏ nhất có tổng xác suất ≥ p (nucleus), chuẩn hóa lại phần còn lại. */
export function topP(probs: number[], p: number): number[] {
  const order = probs.map((v, i) => [v, i] as const).sort((a, b) => b[0] - a[0]);
  const keep = new Set<number>();
  let acc = 0;
  for (const [v, i] of order) { keep.add(i); acc += v; if (acc >= p) break; }
  const out = probs.map((v, i) => (keep.has(i) ? v : 0));
  const s = out.reduce((a, b) => a + b, 0);
  return out.map((v) => v / s);
}

export function sample(probs: number[], n: number, seed: number): number[] {
  const rng = makeRng(seed);
  const counts = probs.map(() => 0);
  for (let i = 0; i < n; i++) {
    let r = rng(), j = 0;
    while (j < probs.length - 1 && r >= probs[j]) { r -= probs[j]; j++; }
    counts[j]++;
  }
  return counts;
}

/** Ước tính thô số token: không phải tokenizer thật của bất kỳ model nào. */
export function estimateTokens(text: string): { chars: number; words: number; approx: number } {
  const words = (text.match(/\S+/g) ?? []).length;
  return { chars: [...text].length, words, approx: Math.ceil([...text].length / 4) };
}
