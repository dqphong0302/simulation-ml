/// <reference lib="webworker" />
import { initMlp, meanLoss, trainEpoch, type Activation, type Mlp } from '../core/algorithms/mlp';
import type { Sample } from '../core/algorithms/dataset';

export type MlpIn =
  | { type: 'init'; sizes: number[]; hidden: Activation; seed: number; train: Sample[]; val: Sample[] }
  | { type: 'train'; epochs: number; lr: number; id: number };
export type MlpOut = { type: 'progress'; id: number; tr: number[]; va: number[]; model: Mlp };

let model: Mlp | null = null;
let train: Sample[] = [], val: Sample[] = [];

self.onmessage = (e: MessageEvent<MlpIn>) => {
  const m = e.data;
  if (m.type === 'init') { model = initMlp(m.sizes, m.hidden, m.seed); train = m.train; val = m.val; return; }
  if (!model) return;
  const tr: number[] = [], va: number[] = [];
  for (let i = 0; i < m.epochs; i++) { tr.push(trainEpoch(model, train, m.lr)); va.push(meanLoss(model, val)); }
  (self as unknown as Worker).postMessage({ type: 'progress', id: m.id, tr, va, model } satisfies MlpOut);
};
