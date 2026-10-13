import type { Label, Sample } from './dataset';

export interface Neighbor { index: number; distance: number; label: Label; x: number[] }
export interface KnnResult {
  neighbors: Neighbor[];
  votes: [number, number];
  label: Label;
  tieBroken: boolean;
}

export function euclid(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
}

/**
 * Bỏ phiếu k láng giềng gần nhất. Khi hòa phiếu (k chẵn) chọn nhãn của láng giềng gần nhất.
 * Nếu k lớn hơn số mẫu train thì dùng toàn bộ train.
 */
export function knnPredict(train: Sample[], q: number[], k: number): KnnResult {
  if (train.length === 0) throw new Error('Tập train rỗng');
  const kk = Math.max(1, Math.min(Math.floor(k), train.length));
  const neighbors = train
    .map((s, index) => ({ index, distance: euclid(s.x, q), label: s.y, x: s.x }))
    .sort((a, b) => a.distance - b.distance || a.index - b.index)
    .slice(0, kk);
  const votes: [number, number] = [0, 0];
  neighbors.forEach((n) => votes[n.label]++);
  const tie = votes[0] === votes[1];
  const label: Label = tie ? neighbors[0].label : votes[1] > votes[0] ? 1 : 0;
  return { neighbors, votes, label, tieBroken: tie };
}

export function knnPredictAll(train: Sample[], test: Sample[], k: number): Label[] {
  return test.map((s) => knnPredict(train, s.x, k).label);
}
