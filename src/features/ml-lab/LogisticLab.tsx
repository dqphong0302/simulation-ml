import { useMemo, useState } from 'react';
import { classify, logisticProba, trainLogistic } from '../../core/algorithms/logistic';
import { evaluate, fmt, roc } from '../../core/algorithms/metrics';
import { Chart, Field, Table } from '../../app/ui';
import type { LabData } from './useData';

export function LogisticLab({ d }: { d: LabData }) {
  const [lr, setLr] = useState(0.3);
  const [epochs, setEpochs] = useState(200);
  const [th, setTh] = useState(0.5);
  const model = useMemo(() => trainLogistic(d.scaled.train, lr, epochs), [d, lr, epochs]);
  const yVal = d.scaled.val.map((s) => s.y);
  const proba = useMemo(() => d.scaled.val.map((s) => logisticProba(model, s.x)), [d, model]);
  const m = evaluate(yVal, proba.map((p) => classify(p, th)));
  const r = roc(yVal, proba);
  const c = m.confusion;
  const lossChart = { title: 'Logistic Regression: loss theo epoch', xLabel: 'Epoch', yLabel: 'Cross-entropy (train)',
    series: [{ name: 'Loss', points: model.lossHistory.map((v, i) => [i + 1, v] as [number, number]).filter(([i]) => i % Math.max(1, Math.floor(epochs / 25)) === 0 || i === epochs) }] };
  const rocChart = r && { title: `ROC trên validation (AUC = ${r.auc.toFixed(3)})`, xLabel: 'FPR = 1 − specificity', yLabel: 'TPR = recall',
    series: [{ name: 'ROC', points: r.points.map((p) => [p.fpr, p.tpr] as [number, number]) }] };
  const table = { columns: ['Chỉ số (validation)', 'Giá trị'], rows: [
    ['Ngưỡng', th.toFixed(2)], ['TP / FP / TN / FN', `${c.tp} / ${c.fp} / ${c.tn} / ${c.fn}`], ['Accuracy', fmt(m.accuracy)], ['Precision', fmt(m.precision)],
    ['Recall', fmt(m.recall)], ['Specificity', fmt(m.specificity)], ['F1', fmt(m.f1)], ['AUC', r ? fmt(r.auc) : 'n/a'],
    ['Loss train cuối', fmt(model.lossHistory[model.lossHistory.length - 1] ?? null, 4)]] };
  return (
    <div className="lab">
      <section className="controls">
        {d.panel}
        <div className="box">
          <Field label={`Learning rate = ${lr}`}><input type="range" min={0.01} max={2} step={0.01} value={lr} onChange={(e) => setLr(Number(e.target.value))} /></Field>
          <Field label={`Số epoch = ${epochs}`}><input type="range" min={10} max={1000} step={10} value={epochs} onChange={(e) => setEpochs(Number(e.target.value))} /></Field>
          <Field label={`Ngưỡng phân loại = ${th.toFixed(2)}`}><input type="range" min={0.05} max={0.95} step={0.05} value={th} onChange={(e) => setTh(Number(e.target.value))} /></Field>
          <p className="muted">Dữ liệu được chuẩn hóa (fit trên train). Trọng số: {model.w.map((w) => w.toFixed(2)).join(', ')}; bias {model.b.toFixed(2)}.</p>
        </div>
      </section>
      <section className="main">
        <h3>Confusion matrix (validation)</h3>
        <Table data={{ columns: ['', 'Dự đoán: cam (dương)', 'Dự đoán: xanh (âm)'], rows: [['Thực tế: cam', `TP = ${c.tp}`, `FN = ${c.fn}`], ['Thực tế: xanh', `FP = ${c.fp}`, `TN = ${c.tn}`]] }} />
        <p className="muted">Giữ nguyên điểm dự báo và hạ ngưỡng → recall không giảm, specificity không tăng; có thể thêm cảnh báo sai. Precision có thể tăng hoặc giảm. Lớp dương là nhóm cam; ngưỡng ở đây chỉ minh họa, không phải ngưỡng điều trị.</p>
        <Table data={table} />
        <Chart spec={lossChart} />
        {rocChart ? <Chart spec={rocChart} /> : <p className="muted">Tập validation chỉ có một lớp nên không tính ROC/AUC.</p>}
      </section>
    </div>
  );
}
