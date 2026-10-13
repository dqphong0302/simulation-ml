/// <reference lib="webworker" />
import { MiniGpt, buildVocab, type GptConfig } from '../core/algorithms/minigpt';

export type GptIn =
  | { type: 'init'; lines: string[]; cfg: GptConfig }
  | { type: 'train'; steps: number; id: number }
  | { type: 'generate'; prompt: string; n: number; temperature: number; seed: number; id: number }
  | { type: 'attention'; text: string; id: number };
export type GptOut =
  | { type: 'ready'; vocab: number; params: number; windows: number }
  | { type: 'trained'; id: number; losses: number[] }
  | { type: 'generated'; id: number; result: ReturnType<MiniGpt['generate']> }
  | { type: 'attention'; id: number; result: ReturnType<MiniGpt['attention']> };

let model: MiniGpt | null = null;
let data: { x: number[]; y: number[] }[] = [];
const post = (m: GptOut) => (self as unknown as Worker).postMessage(m);

self.onmessage = (e: MessageEvent<GptIn>) => {
  const m = e.data;
  if (m.type === 'init') {
    model = new MiniGpt(buildVocab(m.lines), m.cfg);
    data = model.windows(m.lines);
    post({ type: 'ready', vocab: model.vocab.itos.length, params: model.nParams(), windows: data.length });
    return;
  }
  if (!model) return;
  if (m.type === 'train') { const losses: number[] = []; for (let i = 0; i < m.steps; i++) losses.push(model.step(data)); post({ type: 'trained', id: m.id, losses }); }
  if (m.type === 'generate') post({ type: 'generated', id: m.id, result: model.generate(m.prompt, m.n, m.temperature, m.seed) });
  if (m.type === 'attention') post({ type: 'attention', id: m.id, result: model.attention(m.text) });
};
