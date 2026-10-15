import { useMemo, useState } from 'react';
import { Term } from '../../learning/Term';
import { buildTree, treeDepth, treePredict, type Criterion, type TreeNode } from '../../core/algorithms/tree';
import { evaluate, fmt } from '../../core/algorithms/metrics';
import { Chart, Field, Table } from '../../app/ui';
import type { LabData } from './useData';

const DEPTHS = [1, 2, 3, 4, 6, 8];

function NodeView({ node, names, depth = 0, side = '' }: { node: TreeNode; names: string[]; depth?: number; side?: string }) {
  const leaf = !node.left;
  return (
    <li>
      <span className="node">
        {side && <b>{side} </b>}
        {leaf ? `Lá: ${node.counts[1] > node.counts[0] ? 'Nhóm cam' : 'Nhóm xanh'}` : `${names[node.feature!]} ≤ ${node.threshold!.toFixed(2)}?`}
        {' '}(n={node.n}, xanh {node.counts[0]}/cam {node.counts[1]}, tạp chất {node.impurity.toFixed(3)})
      </span>
      {!leaf && <ul><NodeView node={node.left!} names={names} depth={depth + 1} side="Có →" /><NodeView node={node.right!} names={names} depth={depth + 1} side="Không →" /></ul>}
    </li>
  );
}

export function TreeLab({ d }: { d: LabData }) {
  const [criterion, setCriterion] = useState<Criterion>('gini');
  const [show, setShow] = useState(3);
  const rows = useMemo(() => DEPTHS.map((md) => {
    const t = buildTree(d.split.train, md, criterion);
    const acc = (set: typeof d.split.train) => evaluate(set.map((s) => s.y), set.map((s) => treePredict(t, s.x))).accuracy ?? 0;
    return { md, tree: t, real: treeDepth(t), tr: acc(d.split.train), va: acc(d.split.val) };
  }), [d, criterion]);
  const shown = rows.find((r) => r.md === show) ?? rows[0];
  const best = rows.reduce((a, b) => (b.va > a.va ? b : a));
  const table = { columns: ['Độ sâu tối đa', 'Độ sâu thực', 'Accuracy train', 'Accuracy validation', 'Chênh lệch'],
    rows: rows.map((r) => [String(r.md), String(r.real), fmt(r.tr), fmt(r.va), fmt(r.tr - r.va)]) };
  const chart = { title: `Decision Tree (${criterion}): accuracy theo độ sâu`, xLabel: 'Độ sâu tối đa', yLabel: 'Accuracy',
    series: [{ name: 'Train', points: rows.map((r) => [r.md, r.tr] as [number, number]) }, { name: 'Validation', points: rows.map((r) => [r.md, r.va] as [number, number]) }] };
  return (
    <div className="lab">
      <section className="controls">
        {d.panel}
        <div className="box">
          <Field label={<Term k="gini">Tiêu chí chia</Term>}>
            <select value={criterion} onChange={(e) => setCriterion(e.target.value as Criterion)}><option value="gini">Gini</option><option value="entropy">Entropy</option></select>
          </Field>
          <Field label={<Term k="độ sâu">Độ sâu hiển thị</Term>}>
            <select value={show} onChange={(e) => setShow(Number(e.target.value))}>{DEPTHS.map((x) => <option key={x}>{x}</option>)}</select>
          </Field>
        </div>
      </section>
      <section className="main">
        <h3>Cây ở độ sâu tối đa {shown.md}</h3>
        <ul className="tree"><NodeView node={shown.tree} names={d.ds.featureNames} /></ul>
        <h3>So sánh độ sâu</h3>
        <Table data={table} />
        <Chart spec={chart} />
        <p>Validation tốt nhất ở độ sâu <b>{best.md}</b>. Khi train tăng mà validation không tăng (hoặc giảm), cây đang học thuộc nhiễu — overfitting. Cây này dùng dữ liệu chưa chuẩn hóa vì không phụ thuộc thang đo.</p>
      </section>
    </div>
  );
}
