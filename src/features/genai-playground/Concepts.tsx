import { useMemo, useState } from 'react';
import { estimateTokens, sample, softmax, topP } from '../../core/algorithms/sampling';
import { cosine, tokenize } from '../../core/rag/rag';
import { Chart, Field, Table } from '../../app/ui';

// Logit tự đặt cho câu "Bệnh tiểu đường cần theo dõi ..." — chỉ để minh họa cơ chế, KHÔNG phải xác suất của một model thật.
const VOCAB = ['đường huyết', 'cân nặng', 'huyết áp', 'giấc ngủ', 'thời tiết', 'bóng đá'];
const LOGITS = [3.2, 2.4, 2.0, 1.0, -0.5, -1.5];
// Vector 3 chiều tự đặt (không phải embedding thật).
const TOY: Record<string, number[]> = { insulin: [0.9, 0.1, 0.1], glucose: [0.85, 0.2, 0.1], 'đường huyết': [0.88, 0.15, 0.1], 'bóng đá': [0.05, 0.9, 0.2], 'World Cup': [0.1, 0.95, 0.1], 'thời tiết': [0.1, 0.2, 0.9] };

export function Concepts() {
  const [temp, setTemp] = useState(1);
  const [p, setP] = useState(1);
  const [n, setN] = useState(200);
  const [text, setText] = useState('Bệnh tiểu đường cần theo dõi đường huyết thường xuyên.');
  const probs = useMemo(() => topP(softmax(LOGITS, temp), p), [temp, p]);
  const counts = useMemo(() => sample(probs, n, 1), [probs, n]);
  const tk = estimateTokens(text);
  const table = { columns: ['Token tiếp theo (minh họa)', 'Xác suất', `Số lần chọn / ${n}`], rows: VOCAB.map((v, i) => [v, probs[i].toFixed(3), String(counts[i])]) };
  const chart = { title: `Phân phối token tiếp theo (temperature ${temp}, top-p ${p})`, xLabel: 'Chỉ số token (0 = đường huyết)', yLabel: 'Xác suất', series: [{ name: 'Xác suất', points: probs.map((v, i) => [i, v] as [number, number]) }] };
  const names = Object.keys(TOY);
  const sims = { columns: ['Cặp (vector minh họa)', 'Cosine'], rows: [['insulin ↔ glucose', 'insulin', 'glucose'], ['insulin ↔ đường huyết', 'insulin', 'đường huyết'], ['insulin ↔ bóng đá', 'insulin', 'bóng đá'], ['bóng đá ↔ World Cup', 'bóng đá', 'World Cup'], ['thời tiết ↔ glucose', 'thời tiết', 'glucose']].map(([l, a, b]) => [l, cosine(TOY[a], TOY[b]).toFixed(3)]) };
  return (
    <div className="lab">
      <section className="controls">
        <div className="box">
          <Field label={`Temperature = ${temp}`}><input type="range" min={0.1} max={3} step={0.1} value={temp} onChange={(e) => setTemp(Number(e.target.value))} /></Field>
          <Field label={`Top-p = ${p}`}><input type="range" min={0.1} max={1} step={0.05} value={p} onChange={(e) => setP(Number(e.target.value))} /></Field>
          <Field label="Số lần lấy mẫu"><input type="number" min={10} max={5000} value={n} onChange={(e) => setN(Math.min(5000, Math.max(10, Number(e.target.value) || 10)))} /></Field>
        </div>
      </section>
      <section className="main">
        <p className="badge">Mô phỏng nguyên lý — không gọi API</p>
        <h3>1. Dự đoán token tiếp theo, temperature và top-p</h3>
        <p>Mô hình ngôn ngữ cho điểm (logit) mỗi token, softmax biến thành xác suất. Temperature thấp làm phân phối nhọn (ổn định), cao làm phẳng (đa dạng); top-p chỉ giữ nhóm token nhỏ nhất đạt tổng xác suất p. Logit ở đây tự đặt để minh họa, không phải của model thật; API ngoài thường không trả xác suất nội bộ.</p>
        <Table data={table} /><Chart spec={chart} />
        <h3>2. Token hóa</h3>
        <Field label="Văn bản"><textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} /></Field>
        <p>{tk.chars} ký tự · {tk.words} từ · khoảng {tk.approx} token (ước tính thô 4 ký tự/token). Số token thật phụ thuộc tokenizer của từng model; tiếng Việt thường tốn nhiều token hơn tiếng Anh. Tách theo từ/chữ: {tokenize(text).slice(0, 12).join(' | ')}</p>
        <h3>3. Embedding và độ tương tự</h3>
        <Table data={sims} caption={`Vector 3 chiều tự đặt cho: ${names.join(', ')}`} />
        <p className="muted">Embedding thật có hàng trăm đến hàng nghìn chiều do model học được; ví dụ này chỉ cho thấy ý tưởng: ý gần nghĩa → vector gần hướng → cosine cao.</p>
        <h3>4. Giới hạn cần nhớ</h3>
        <ul>
          <li>Hallucination: mô hình có thể trả lời trôi chảy nhưng sai; cần đối chiếu nguồn.</li>
          <li>Prompt injection: văn bản trong tài liệu hay web có thể chứa chỉ dẫn độc hại; coi context là dữ liệu, không phải mệnh lệnh.</li>
          <li>Dẫn nguồn có mã đoạn chưa chứng minh nội dung đúng; hãy mở đoạn gốc để kiểm tra.</li>
        </ul>
      </section>
    </div>
  );
}
