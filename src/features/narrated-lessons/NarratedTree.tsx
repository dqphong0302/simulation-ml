import { useMemo, useState } from 'react';
import { buildTree, treePredict, type TreeNode } from '../../core/algorithms/tree';
import { evaluate } from '../../core/algorithms/metrics';
import { Chart } from '../../app/ui';
import { useData, type DataState } from '../ml-lab/useData';
import { NarratedPlayer, type StageCtx } from './NarratedPlayer';

interface TreePreset { depth: number; showCurve: boolean }
const DEPTHS = [1, 2, 3, 4, 5, 6, 8, 10];
const GUESSES = ['Tăng mãi', 'Tăng rồi giảm', 'Gần như không đổi'];

function NodeView({ node, names, side = '' }: { node: TreeNode; names: string[]; side?: string }) {
  const leaf = !node.left;
  return (
    <li><span className="node">{side && <b>{side} </b>}{leaf ? `Lá: ${node.counts[1] > node.counts[0] ? 'Nhóm cam' : 'Nhóm xanh'}` : `${names[node.feature!]} ≤ ${node.threshold!.toFixed(1)}?`} (n={node.n})</span>
      {!leaf && <ul><NodeView node={node.left!} names={names} side="Có →" /><NodeView node={node.right!} names={names} side="Không →" /></ul>}</li>
  );
}

export function NarratedTree() {
  // Dữ liệu mô phỏng + seed cố định để các con số trong lời dẫn luôn đúng.
  const d = useData({ fixed: 'synthetic', seed: 42 }) as Extract<DataState, { ready: true }>;
  const [guess, setGuess] = useState<number | null>(null);
  const [depthOv, setDepthOv] = useState<{ id: string; depth: number } | null>(null);
  const rows = useMemo(() => DEPTHS.map((md) => {
    const t = buildTree(d.split.train, md, 'gini');
    const acc = (set: typeof d.split.train) => evaluate(set.map((s) => s.y), set.map((s) => treePredict(t, s.x))).accuracy ?? 0;
    return { md, tree: t, tr: acc(d.split.train), va: acc(d.split.val) };
  }), [d]);

  const renderStage = ({ scene, idx }: StageCtx<TreePreset>) => {
    const depth = scene.interactive === 'depth' && depthOv?.id === scene.id ? depthOv.depth : scene.preset.depth;
    const row = rows.find((r) => r.md === depth) ?? rows[0];
    const upTo = rows.filter((r) => r.md <= depth);
    const chart = { title: 'Accuracy theo độ sâu (dữ liệu mô phỏng, seed 42)', xLabel: 'Độ sâu tối đa', yLabel: 'Accuracy',
      series: [{ name: 'Train', points: upTo.map((r) => [r.md, r.tr] as [number, number]) }, { name: 'Validation', points: upTo.map((r) => [r.md, r.va] as [number, number]) }] };
    return (
      <div className="lab lab-stage">
        <section className="main">
          <h3>Cây ở độ sâu tối đa {depth}</h3>
          <ul className="tree" style={{ maxHeight: 280, overflow: 'auto' }}><NodeView node={row.tree} names={d.ds.featureNames} /></ul>
          <p role="status" className="result">Độ sâu {depth}: accuracy train {(100 * row.tr).toFixed(0)}% · validation {(100 * row.va).toFixed(0)}%</p>
          {scene.preset.showCurve && <Chart spec={chart} />}
        </section>
        <section className="controls">
          {idx === 2 && (
            <div className="box"><strong>Dự đoán của bạn</strong><div className="row">{GUESSES.map((g, i) => <button key={g} aria-pressed={guess === i} onClick={() => setGuess(i)}>{g}</button>)}</div></div>
          )}
          {idx > 2 && guess !== null && <div className="box"><p className="muted">Bạn đã đoán: {GUESSES[guess]}. Xem kết quả thật ở các cảnh sau.</p></div>}
          {scene.interactive === 'depth' && (
            <div className="box"><label className="field"><span>Độ sâu = {depth}</span>
              <input type="range" min={0} max={DEPTHS.length - 1} value={DEPTHS.indexOf(depth)} onChange={(e) => setDepthOv({ id: scene.id, depth: DEPTHS[Number(e.target.value)] })} /></label></div>
          )}
        </section>
      </div>
    );
  };
  return <NarratedPlayer<TreePreset> lessonId="TREE" manifestUrl="/audio/tree/manifest.json" noscriptHint="Bạn vẫn có thể học bằng phòng thí nghiệm Decision Tree." stage={renderStage} />;
}
