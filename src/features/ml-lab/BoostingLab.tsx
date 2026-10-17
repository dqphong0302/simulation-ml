import { useMemo, useState } from 'react';
import { boostProba, fitBoosting, logLoss } from '../../core/algorithms/boosting';
import { forestProba, trainForest } from '../../core/algorithms/ml_extra';
import { Chart, Field, Table } from '../../app/ui';
import type { LabData } from './useData';

export function BoostingLab({ d }: { d: LabData }) {
  const [rate, setRate] = useState(.2), [stage, setStage] = useState(10);
  const model = useMemo(() => fitBoosting(d.split.train, 60, rate), [d.split, rate]);
  const forest = useMemo(() => trainForest(d.split.train, 30, 3, d.seed), [d.split, d.seed]);
  const loss = (set: typeof d.split.train, n: number) => logLoss(set, x => boostProba(model, x, n));
  const val = loss(d.split.val, stage);
  const tree = model.trees[stage - 1];
  return <div className="lab">
    <section className="controls">{d.panel}<div className="box">
      <Field label={`Learning rate = ${rate}`}><input id="boost-rate" type="range" min="0.05" max="1" step="0.05" value={rate} onChange={e => setRate(+e.target.value)} /></Field>
      <Field label={`Số cây đang dùng = ${stage}`}><input id="boost-stage" type="range" min="1" max="60" value={stage} onChange={e => setStage(+e.target.value)} /></Field>
      <p>Mỗi cây chỉ có một ngưỡng chia. Thêm cây theo phần gradient còn lại, không bỏ phiếu độc lập như Random Forest.</p>
    </div></section>
    <section className="main" aria-label="Kết quả Gradient Boosting">
      <h2>Học bổ sung từng bước</h2><p>Điểm ban đầu → cây 1 → cây 2 → … → sigmoid. Nhãn dương và phép chia theo thiết lập bên trái.</p>
      <output id="boost-loss">Log-loss validation: {val?.toFixed(4) ?? 'Không xác định (tập rỗng)'}</output>
      <Chart spec={{ title: 'Log-loss theo số cây — thấp hơn là khớp nhãn hơn', xLabel: 'Số cây', yLabel: 'Log-loss', series: [
        { name: 'Train', points: Array.from({ length: 61 }, (_, n) => [n, loss(d.split.train, n) ?? 0] as [number, number]) },
        { name: 'Validation', points: Array.from({ length: 61 }, (_, n) => [n, loss(d.split.val, n) ?? 0] as [number, number]) },
      ] }} />
      <p id="boost-tree">Cây {stage}: {Number.isFinite(tree.threshold) ? `${d.ds.featureNames[tree.feature]} ≤ ${tree.threshold.toFixed(3)}` : 'không tìm được phép chia cải thiện'}; cập nhật trái {tree.left.toFixed(3)}, phải {tree.right.toFixed(3)}; nhân learning rate trước khi cộng vào điểm.</p>
      <Table data={{ columns: ['Mô hình', 'Cách học', 'Log-loss validation'], rows: [
        ['Boosting', `${stage} cây nông tuần tự`, val?.toFixed(4) ?? '—'],
        ['Random Forest', '30 cây, depth ≤ 3; cùng train/validation', logLoss(d.split.val, x => forestProba(forest, x))?.toFixed(4) ?? '—'],
      ] }} />
      <p className="warn">So sánh minh họa, chưa tối ưu công bằng ngân sách mỗi mô hình. Chọn bằng validation, không dùng test ở đây. Log-loss thấp chưa chứng minh xác suất đã hiệu chỉnh hoặc lợi ích y khoa.</p>
      <p>Web dùng bước gradient cố định với cây một ngưỡng, không tái tạo chính xác GradientBoostingClassifier của scikit-learn. Không dùng nhãn hoặc thống kê validation để fit cây.</p>
    </section>
  </div>;
}
