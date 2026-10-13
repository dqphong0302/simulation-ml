import { useEffect, useState } from 'react';
import type { CompareEntry } from '../../core/algorithms/compare';
import { classify } from '../../core/algorithms/logistic';
import { evaluate, fmt, roc, type Metrics } from '../../core/algorithms/metrics';
import type { CompareOut } from '../../workers/compare.worker';
import { Chart, Table } from '../../app/ui';
import type { LabData } from './useData';

export function CompareLab({ d }: { d: LabData }) {
  const [models, setModels] = useState<CompareEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testRes, setTestRes] = useState<string | null>(null);
  // Huấn luyện bốn mô hình trong Web Worker để giao diện vẫn phản hồi.
  useEffect(() => {
    setModels(null); setError(null); setTestRes(null);
    const w = new Worker(new URL('../../workers/compare.worker.ts', import.meta.url), { type: 'module' });
    w.onmessage = (e: MessageEvent<CompareOut>) => { if ('error' in e.data) setError(e.data.error); else setModels(e.data.entries); };
    w.onerror = () => setError('Worker bị lỗi.');
    w.postMessage({ id: 1, train: d.scaled.train, val: d.scaled.val, test: d.scaled.test, seed: d.seed });
    return () => w.terminate();
  }, [d]);
  const yVal = d.scaled.val.map((s) => s.y);
  if (error) return <div className="lab"><section className="controls">{d.panel}</section><p role="alert" className="warn">{error}</p></div>;
  if (!models) return <div className="lab"><section className="controls">{d.panel}</section><p role="status" className="loading">Đang huấn luyện 4 mô hình…</p></div>;
  const rows = models.map((m, mi) => {
    const met: Metrics = evaluate(yVal, m.val.map((p) => classify(p, 0.5)));
    return { m, mi, met, roc: roc(yVal, m.val) };
  });
  const best = rows.reduce((a, b) => ((b.met.f1 ?? -1) > (a.met.f1 ?? -1) ? b : a));
  const table = { columns: ['Mô hình', 'Thiết lập', 'Accuracy', 'Precision', 'Recall', 'Specificity', 'F1', 'AUC'],
    rows: rows.map((r) => [r.m.name, r.m.setting, fmt(r.met.accuracy), fmt(r.met.precision), fmt(r.met.recall), fmt(r.met.specificity), fmt(r.met.f1), r.roc ? fmt(r.roc.auc) : 'n/a']) };
  const chart = { title: 'ROC trên validation: so sánh mô hình', xLabel: 'FPR = 1 − specificity', yLabel: 'TPR = recall',
    series: rows.filter((r) => r.roc).map((r) => ({ name: `${r.m.name} (AUC ${fmt(r.roc!.auc, 2)})`, points: r.roc!.points.map((p) => [p.fpr, p.tpr] as [number, number]) })) };

  return (
    <div className="lab">
      <section className="controls">
        {d.panel}
        <div className="box"><p className="muted">Mọi mô hình dùng cùng dữ liệu, cùng cách chia, cùng chuẩn hóa. Siêu tham số của KNN và Decision Tree được chọn bằng validation; ngưỡng phân loại cố định 0,5.</p></div>
      </section>
      <section className="main">
        <Table data={table} caption="So sánh trên tập validation" />
        <Chart spec={chart} />
        <p>Theo F1 trên validation, mô hình nhỉnh nhất là <b>{best.m.name}</b>. Chênh lệch nhỏ có thể chỉ do tập validation ít mẫu ({d.scaled.val.length}); hãy đổi seed để xem kết quả có ổn định không, và cân nhắc recall khi nhãn dương hiếm.</p>
        <div className="row"><button onClick={() => {
          const ys = d.scaled.test.map((s) => s.y);
          const m = evaluate(ys, best.m.test.map((p) => classify(p, 0.5)));
          setTestRes(`${best.m.name}: accuracy test ${fmt(m.accuracy)}, precision ${fmt(m.precision)}, recall ${fmt(m.recall)}, F1 ${fmt(m.f1)}. Chỉ xem một lần ở bước cuối; không dùng để chọn lại mô hình.`);
        }}>Đánh giá cuối mô hình được chọn trên test</button></div>
        {testRes && <p role="status" className="result">{testRes}</p>}
      </section>
    </div>
  );
}
