import { useState } from 'react';
import { applyScaler, type Label } from '../../core/algorithms/dataset';
import { knnPredict } from '../../core/algorithms/knn';
import { Scatter } from '../../app/Scatter';
import { useData, type DataState } from '../ml-lab/useData';
import { NarratedPlayer, type StageCtx } from './NarratedPlayer';

interface KnnPreset { k: number; scale: boolean; step: number; query: [number, number] }
type KnnScene = StageCtx<KnnPreset>;

export function NarratedKnn() {
  // Dữ liệu mô phỏng + seed cố định để lời dẫn luôn khớp kết quả.
  const d = useData({ fixed: 'synthetic', seed: 42 }) as Extract<DataState, { ready: true }>;
  const [guess, setGuess] = useState<Label | null>(null);
  const [kOverride, setKOverride] = useState<{ id: string; k: number } | null>(null); // gắn với cảnh nên tự bỏ khi đổi cảnh

  const renderStage = ({ scene, idx }: KnnScene) => {
    const k = scene.interactiveK && kOverride?.id === scene.id ? kOverride.k : scene.preset.k;
    const { scale, step, query } = scene.preset;
    const space = scale ? d.scaled : d.split;
    const q = scale ? applyScaler(query, d.scaler) : query;
    const res = knnPredict(space.train, q, k);
    return (
      <div className="lab lab-stage">
        <section className="main">
          <Scatter points={d.split.train} names={d.ds.classNames} featureNames={d.ds.featureNames} query={query} bounds={d.bounds}
            highlight={step >= 2 ? res.neighbors.map((n) => n.index) : []} predicted={step >= 3 ? res.label : undefined} />
          {step >= 3 && <p role="status" className="result">k = {k}{scale ? ', đã chuẩn hóa' : ''}: phiếu {d.ds.classNames[0]} {res.votes[0]} – {d.ds.classNames[1]} {res.votes[1]} → <b>{d.ds.classNames[res.label]}</b></p>}
        </section>
        <section className="controls">
          {scene.id === 's1' || idx === 0 ? (
            <div className="box"><strong>Dự đoán của bạn</strong><div className="row">
              {d.ds.classNames.map((n, i) => <button key={n} aria-pressed={guess === i} onClick={() => setGuess(i as Label)}>{n}</button>)}</div></div>
          ) : guess !== null && idx === 3 ? (
            <div className="box"><p className="muted">Bạn đã đoán: {d.ds.classNames[guess]}; kết quả k=3 là {d.ds.classNames[knnPredict(d.split.train, [115, 28], 3).label]}.</p></div>
          ) : null}
          {scene.interactiveK && <div className="box"><label className="field"><span>k = {k}</span><input type="range" min={1} max={15} value={k} onChange={(e) => setKOverride({ id: scene.id, k: Number(e.target.value) })} /></label></div>}
        </section>
      </div>
    );
  };
  return <NarratedPlayer<KnnPreset> lessonId="KNN" manifestUrl="/audio/knn/manifest.json" noscriptHint="Bạn vẫn có thể học bằng phòng thí nghiệm KNN (không phụ thuộc giọng đọc)." stage={renderStage} />;
}
