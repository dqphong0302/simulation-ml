import { useState } from 'react';
import { maskMetrics, teachingMask, weightStep } from '../../core/algorithms/imageTeaching';
import { Field, Table } from '../../app/ui';

function PixelGrid({ values, label, accent = false }: { values: number[]; label: string; accent?: boolean }) {
  return <figure className="image-teaching-grid"><svg viewBox="0 0 160 160" role="img" aria-label={label}>
    {values.map((v, i) => <rect key={i} x={i % 16 * 10} y={Math.floor(i / 16) * 10} width="10" height="10" fill={accent ? `rgb(${Math.round(10 + 210 * v)}, ${Math.round(60 + 90 * v)}, ${Math.round(105 - 60 * v)})` : `rgb(${v * 255},${v * 255},${v * 255})`} />)}
  </svg><figcaption>{label}</figcaption></figure>;
}

export function SegmentationLab() {
  const [threshold, setThreshold] = useState(.5), [offset, setOffset] = useState(1);
  const { truth, image, scores } = teachingMask(offset);
  const predicted = scores.map(p => p >= threshold), m = maskMetrics(truth, predicted);
  return <section className="image-application" aria-labelledby="seg-title">
    <h2 id="seg-title">Một nhãn ảnh khác 256 nhãn pixel</h2>
    <p>Phân loại: “ảnh có hình tròn”. Phân đoạn: chỉ ra pixel nào thuộc hình tròn. Đây là ảnh tổng hợp 16×16, không phải ảnh bệnh nhân.</p>
    <div className="application-controls">
      <Field label={`Ngưỡng mặt nạ = ${threshold.toFixed(2)}`}><input id="seg-threshold" type="range" min="0.1" max="0.9" step="0.05" value={threshold} onChange={e => setThreshold(+e.target.value)} /></Field>
      <Field label={`Lệch tâm minh họa = ${offset} pixel`}><input id="seg-offset" type="range" min="0" max="4" step="1" value={offset} onChange={e => setOffset(+e.target.value)} /></Field>
    </div>
    <div className="image-teaching-panels">
      <PixelGrid values={image} label="Ảnh đầu vào giả" />
      <PixelGrid values={truth.map(Number)} label="Mặt nạ tham chiếu" />
      <PixelGrid values={predicted.map(Number)} label="Mặt nạ theo ngưỡng" />
      <PixelGrid values={truth.map((v, i) => v === predicted[i] ? .15 : 1)} label="Pixel sai (màu cam)" accent />
    </div>
    <output id="seg-metrics">Dice {m.dice.toFixed(3)} · IoU {m.iou.toFixed(3)} · Pixel accuracy {m.accuracy.toFixed(3)}</output>
    <p>TP={m.tp}, FP={m.fp}, FN={m.fn}, TN={m.tn}. Dice = 2TP/(2TP+FP+FN); IoU = TP/(TP+FP+FN). Nếu cả hai mặt nạ đều trống, bài này quy ước điểm bằng 1.</p>
    <p className="warn">Bản đồ điểm được tạo bằng công thức đặt tay, chưa huấn luyện U-Net. Ngưỡng chỉ đổi cách chuyển điểm thành mask, không đổi trọng số. Không chọn ngưỡng trên test; Dice cao chưa chứng minh vùng phân đoạn có ý nghĩa lâm sàng.</p>
    <p>Colab của bài có U-Net nhỏ thực sự học mặt nạ tổng hợp. Với ảnh y khoa thật cần nhãn chuyên gia, tách bệnh nhân, kiểm tra nhóm và sai số biên.</p>
  </section>;
}

export function TransferLab() {
  const [phase, setPhase] = useState<'head' | 'fine'>('head');
  const [rate, setRate] = useState(.01), [steps, setSteps] = useState(0);
  const frozen = phase === 'head';
  // Fixed, invented gradients make the update rule visible; no image learning here.
  const initial = [.8, -.4, .2], gradient = [.3, -.2, .1];
  const early = initial;
  const last = weightStep(initial, gradient, rate * steps, frozen);
  const head = weightStep(initial, gradient, rate * steps, false);
  return <section className="image-application" aria-labelledby="transfer-title">
    <h2 id="transfer-title">Đã học trước → đóng băng → mở một phần</h2>
    <p>Ảnh → khối đầu → khối cuối → đầu phân loại. Trong ví dụ: giai đoạn 1 chỉ học đầu mới; giai đoạn 2 mở khối cuối với learning rate nhỏ.</p>
    <div className="application-controls">
      <Field label="Giai đoạn"><select id="transfer-phase" value={phase} onChange={e => { setPhase(e.target.value as typeof phase); setSteps(0); }}><option value="head">1 · Đóng băng bộ trích xuất</option><option value="fine">2 · Fine-tune khối cuối</option></select></Field>
      <Field label={`Learning rate = ${rate}`}><input id="transfer-rate" type="range" min="0.001" max="0.05" step="0.001" value={rate} onChange={e => setRate(+e.target.value)} /></Field>
      <button id="transfer-step" className="btn primary" onClick={() => setSteps(s => s + 1)}>Một bước cập nhật minh họa</button>
      <button id="transfer-reset" className="btn" onClick={() => setSteps(0)}>Đặt lại</button>
    </div>
    <Table data={{ columns: ['Khối', 'Trạng thái', 'Trọng số giả sau cập nhật'], rows: [
      ['Khối đầu', 'Đóng băng ở cả hai giai đoạn', early.map(v => v.toFixed(4)).join(' / ')],
      ['Khối cuối', frozen ? 'Đóng băng' : 'Đang mở để fine-tune', last.map(v => v.toFixed(4)).join(' / ')],
      ['Đầu phân loại mới', 'Đang học', head.map(v => v.toFixed(4)).join(' / ')],
    ] }} />
    <output id="transfer-delta">Số bước: {steps} · Thay đổi khối cuối: {Math.abs(last[0] - initial[0]).toFixed(4)}</output>
    <p>Quy tắc: w mới = w cũ − learning rate × gradient. “Đóng băng” giữ nguyên trọng số; không đồng nghĩa mọi trạng thái mạng đều tự đứng yên. Trong notebook, đặt chế độ eval cho backbone để giữ thống kê BatchNorm khi cần.</p>
    <p className="warn">Các trọng số và gradient trên là số đặt trước để nhìn phép tính, không phải checkpoint MobileNet. Notebook thực sự pretrain CNN nhỏ trên ảnh tổng hợp, sau đó đóng băng và fine-tune. Chuyển từ nguồn sang đích không bảo đảm tốt hơn học từ đầu.</p>
    <a id="transfer-real-lab" className="btn" href="#/ml/teachable?tab=lab">Thử bộ trích xuất MobileNet học sẵn trong Teachable Machine →</a>
    <p>Teachable Machine học đầu phân loại, không cung cấp nút fine-tune backbone. Không dùng ảnh bệnh nhân; ảnh gần trùng phải được giữ cùng nhóm khi chia tập.</p>
  </section>;
}
