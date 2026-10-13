import type { Label, Sample } from './dataset';

export type Criterion = 'gini' | 'entropy';
export interface TreeNode {
  n: number;
  counts: [number, number];
  impurity: number;
  feature?: number;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
}

export function impurity(counts: [number, number], criterion: Criterion): number {
  const n = counts[0] + counts[1];
  if (n === 0) return 0;
  const p = [counts[0] / n, counts[1] / n];
  if (criterion === 'gini') return 1 - p[0] ** 2 - p[1] ** 2;
  return -p.reduce((s, v) => (v > 0 ? s + v * Math.log2(v) : s), 0);
}

const countOf = (rows: Sample[]): [number, number] => {
  const c: [number, number] = [0, 0];
  rows.forEach((r) => c[r.y]++);
  return c;
};

export interface TreeOpts { rng?: () => number; mtry?: number }

export function buildTree(rows: Sample[], maxDepth: number, criterion: Criterion, minSamples = 2, depth = 0, opts: TreeOpts = {}): TreeNode {
  const counts = countOf(rows);
  const node: TreeNode = { n: rows.length, counts, impurity: impurity(counts, criterion) };
  if (depth >= maxDepth || rows.length < minSamples || node.impurity === 0) return node;

  let best: { f: number; t: number; score: number } | null = null;
  const d = rows[0].x.length;
  let feats = Array.from({ length: d }, (_, i) => i);
  if (opts.rng && opts.mtry && opts.mtry < d) feats = feats.map((f) => [opts.rng!(), f] as const).sort((a, b) => a[0] - b[0]).slice(0, opts.mtry).map((x) => x[1]);
  for (const f of feats) {
    const sorted = rows.slice().sort((a, b) => a.x[f] - b.x[f]);
    const left: [number, number] = [0, 0];
    const right = counts.slice() as [number, number];
    for (let i = 0; i < sorted.length - 1; i++) {
      left[sorted[i].y]++;
      right[sorted[i].y]--;
      if (sorted[i].x[f] === sorted[i + 1].x[f]) continue;
      const nl = i + 1, nr = sorted.length - nl;
      const score = (nl * impurity(left, criterion) + nr * impurity(right, criterion)) / sorted.length;
      if (!best || score < best.score) best = { f, t: (sorted[i].x[f] + sorted[i + 1].x[f]) / 2, score };
    }
  }
  // Không có điểm chia nào làm giảm tạp chất thì dừng.
  if (!best || best.score >= node.impurity - 1e-12) return node;
  node.feature = best.f;
  node.threshold = best.t;
  node.left = buildTree(rows.filter((r) => r.x[best!.f] <= best!.t), maxDepth, criterion, minSamples, depth + 1, opts);
  node.right = buildTree(rows.filter((r) => r.x[best!.f] > best!.t), maxDepth, criterion, minSamples, depth + 1, opts);
  return node;
}

export function leafFor(node: TreeNode, x: number[]): { leaf: TreeNode; path: TreeNode[] } {
  const path = [node];
  let cur = node;
  while (cur.left && cur.right && cur.feature !== undefined && cur.threshold !== undefined) {
    cur = x[cur.feature] <= cur.threshold ? cur.left : cur.right;
    path.push(cur);
  }
  return { leaf: cur, path };
}

export function treeProba(node: TreeNode, x: number[]): number {
  const { leaf } = leafFor(node, x);
  return leaf.n === 0 ? 0.5 : leaf.counts[1] / leaf.n;
}

export function treePredict(node: TreeNode, x: number[]): Label {
  const { leaf } = leafFor(node, x);
  return leaf.counts[1] > leaf.counts[0] ? 1 : 0;
}

export function treeDepth(node: TreeNode): number {
  return node.left && node.right ? 1 + Math.max(treeDepth(node.left), treeDepth(node.right)) : 0;
}
