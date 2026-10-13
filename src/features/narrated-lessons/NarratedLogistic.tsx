import { useMemo, useState } from 'react';
import { classify, logisticProba, trainLogistic } from '../../core/algorithms/logistic';
import { evaluate, roc } from '../../core/algorithms/metrics';
import { Chart } from '../../app/ui';
import { useData, type DataState } from '../ml-lab/useData';
import { NarratedPlayer, type StageCtx } from './NarratedPlayer';

interface LogPreset { threshold: number; showRoc: boolean }
const GUESSES = ['Bỏ sót giảm, báo nhầm tăng', 'Cả hai cùng giảm', 'Bỏ sót tăng, báo nhầm giảm'];

export function NarratedLogistic() {
  // Dữ liệu mô phỏng + seed cố định + cùng tham số với phòng thí nghiệm để lời dẫn khớp số liệu.
  const d = useData({ fixed: 'synthetic', seed: 42 }) as Extract<DataState, { ready: true }>;
  const [guess, setGuess] = useState<number | null>(null);
  const [thOv, setThOv] = useState<{ id: string; t: number } | null>(null);
  const { y, p, curve } = useMemo(() => {
    const m = trainLogistic(d.scaled.train, 0.3, 200);
    const y = d.scaled.val.map((s) => s.y), p = d.scaled.val.map((s) => logisticProba(m, s.x));
    return { y, p, curve: roc(y, p) };
  }, [d]);

  const renderStage = ({ scene, idx }: StageCtx<LogPreset>) => {
    const t = scene.interactive === 'threshold' && thOv?.id === scene.id ? thOv.t : scene.preset.threshold;
    const e = evaluate(y, p.map((q) => classify(q, t)));
    const c = e.confusion;
    const fpr = c.fp / (c.fp + c.tn), tpr = c.tp / (c.tp + c.fn);
    const chart = curve && { title: `ROC trên validation (AUC ${curve.auc.toFixed(2)})`, xLabel: 'FPR = 1 − specificity', yLabel: 'TPR = recall',
      series: [{ name: 'ROC', points: curve.points.map((q) => [q.fpr, q.tpr] as [number, number]) }, { name: `Ngưỡng ${t.toFixed(2)}`, points: [[fpr, tpr] as [number, number]] }] };
    return (
      <div className="lab lab-stage">
        <section className="main">
          <h3>Bảng nhầm lẫn trên validation — ngưỡng {t.toFixed(2)}</h3>
          <div className="cm" role="table" aria-label="Bảng nhầm lẫn">
            <div className="cm-cell tp"><b>{c.tp}</b><span>Bắt đúng (TP)</span></div>
            <div className="cm-cell fn"><b>{c.fn}</b><span>Bỏ sót (FN)</span></div>
            <div className="cm-cell fp"><b>{c.fp}</b><span>Báo nhầm (FP)</span></div>
            <div className="cm-cell tn"><b>{c.tn}</b><span>Loại đúng (TN)</span></div>
          </div>
          <p role="status" className="result">Precision {(e.precision ?? 0).toFixed(2)} · Recall {(e.recall ?? 0).toFixed(2)} · Specificity {(e.specificity ?? 0).toFixed(2)}. Hàng trên: thực tế nhóm cam (dương); hàng dưới: thực tế nhóm xanh.</p>
          {scene.preset.showRoc && chart && <Chart spec={chart} />}
        </section>
        <section className="controls">
          {idx === 2 && <div className="box"><strong>Dự đoán của bạn: hạ ngưỡng xuống 0,2 thì…</strong><div className="row">{GUESSES.map((g, i) => <button key={g} aria-pressed={guess === i} onClick={() => setGuess(i)}>{g}</button>)}</div></div>}
          {idx > 2 && guess !== null && <div className="box"><p className="muted">Bạn đã đoán: {GUESSES[guess]}.</p></div>}
          {scene.interactive === 'threshold' && (
            <div className="box"><label className="field"><span>Ngưỡng = {t.toFixed(2)}</span>
              <input type="range" min={0.05} max={0.95} step={0.05} value={t} onChange={(ev) => setThOv({ id: scene.id, t: Number(ev.target.value) })} /></label></div>
          )}
        </section>
      </div>
    );
  };
  return <NarratedPlayer<LogPreset> lessonId="LOGREG" manifestUrl="/audio/logistic/manifest.json" noscriptHint="Bạn vẫn có thể học bằng phòng thí nghiệm Logistic Regression." stage={renderStage} />;
}
