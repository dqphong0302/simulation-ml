import type { Label, Sample } from './dataset';
import { knnPredict } from './knn';
import { logisticProba, trainLogistic } from './logistic';
import { evaluate } from './metrics';
import { initMlp, predictProba, trainEpoch } from './mlp';
import { buildTree, treeProba } from './tree';

export interface CompareInput { train: Sample[]; val: Sample[]; test: Sample[]; seed: number }
export interface CompareEntry { name: string; setting: string; val: number[]; test: number[] }

/**
 * Huấn luyện bốn mô hình trên cùng dữ liệu đã chuẩn hóa; siêu tham số của KNN và Decision Tree chọn bằng validation.
 * Trả điểm số (xác suất lớp 1) trên validation và test để giao diện tính chỉ số, không gửi hàm qua Worker.
 */
export function runCompare({ train, val, test, seed }: CompareInput): CompareEntry[] {
  const acc = (score: (x: number[]) => number) => evaluate(val.map((s) => s.y), val.map((s) => (score(s.x) >= 0.5 ? 1 : 0) as Label)).accuracy ?? 0;
  const knnScore = (k: number) => (x: number[]) => { const r = knnPredict(train, x, k); return r.votes[1] / (r.votes[0] + r.votes[1]); };
  let bestK = 1, bk = -1;
  for (const k of [1, 3, 5, 7, 9, 11, 15]) { const a = acc(knnScore(k)); if (a > bk) { bestK = k; bk = a; } }
  let bestD = 1, bd = -1;
  for (const md of [1, 2, 3, 4, 5, 6]) { const t = buildTree(train, md, 'gini'); const a = acc((x) => treeProba(t, x)); if (a > bd) { bestD = md; bd = a; } }
  const tree = buildTree(train, bestD, 'gini');
  const lg = trainLogistic(train, 0.3, 300);
  const mlp = initMlp([train[0].x.length, 8, 1], 'tanh', seed);
  for (let e = 0; e < 400; e++) trainEpoch(mlp, train, 0.3);
  const models: [string, string, (x: number[]) => number][] = [
    ['KNN', `k = ${bestK} (chọn theo validation)`, knnScore(bestK)],
    ['Decision Tree', `độ sâu ≤ ${bestD} (chọn theo validation)`, (x) => treeProba(tree, x)],
    ['Logistic Regression', 'lr 0.3, 300 epoch', (x) => logisticProba(lg, x)],
    ['MLP 8 neuron', 'tanh, lr 0.3, 400 epoch', (x) => predictProba(mlp, x)],
  ];
  return models.map(([name, setting, f]) => ({ name, setting, val: val.map((s) => f(s.x)), test: test.map((s) => f(s.x)) }));
}
