import { useMemo, useState } from 'react';
import { attention, randomMat } from '../../core/algorithms/attention';
import { Field, Table } from '../../app/ui';

const DIM = 6, DK = 4;

/** Vector đầu vào cố định theo token (hash đơn giản): đồ chơi, KHÔNG phải embedding đã học. */
function toyEmbed(tok: string): number[] {
  let h = 2166136261;
  for (const c of tok.toLowerCase()) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return Array.from({ length: DIM }, (_, i) => Math.sin((h >>> 0) / 1e6 + i * 1.7));
}

export function AttentionLab() {
  const [text, setText] = useState('bệnh nhân uống thuốc đúng giờ');
  const [seed, setSeed] = useState(1);
  const [causal, setCausal] = useState(false);
  const [q, setQ] = useState(0);
  const tokens = text.trim().split(/\s+/).filter(Boolean).slice(0, 8);
  const res = useMemo(() => {
    if (tokens.length === 0) return null;
    const X = tokens.map(toyEmbed);
    return attention(X, randomMat(DIM, DK, seed), randomMat(DIM, DK, seed + 100), randomMat(DIM, DK, seed + 200), causal);
  }, [tokens.join('|'), seed, causal]); // eslint-disable-line react-hooks/exhaustive-deps
  const qi = Math.min(q, Math.max(0, tokens.length - 1));
  const table = res && { columns: ['Token (query)', ...tokens], rows: tokens.map((t, i) => [t, ...res.weights[i].map((w) => w.toFixed(3))]) };

  return (
    <div className="lab">
      <section className="controls">
        <div className="box">
          <Field label="Câu (tối đa 8 token, tách theo khoảng trắng)"><input value={text} onChange={(e) => setText(e.target.value)} /></Field>
          <Field label="Seed của Wq, Wk, Wv"><input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value) || 0)} /></Field>
          <label className="check"><input type="checkbox" checked={causal} onChange={(e) => setCausal(e.target.checked)} /> Che token tương lai (causal mask)</label>
          <Field label="Token đang xét"><select value={qi} onChange={(e) => setQ(Number(e.target.value))}>{tokens.map((t, i) => <option key={i} value={i}>{i + 1}. {t}</option>)}</select></Field>
        </div>
      </section>
      <section className="main">
        <p className="badge">Mô phỏng nguyên lý — trọng số ngẫu nhiên, chưa huấn luyện</p>
        <p>Attention: <code>softmax(Q·Kᵀ / √d) · V</code>. Mỗi token (query) chấm điểm mọi token (key), softmax thành trọng số, rồi lấy trung bình có trọng số của V. Vì Wq, Wk, Wv ở đây là ngẫu nhiên, các trọng số không phản ánh ý nghĩa ngôn ngữ; đây không phải attention của một mô hình thật và không dùng để suy diễn cách LLM đọc câu.</p>
        {res && table && (
          <>
            <div className="tbl-wrap"><table className="tbl heat" aria-label="Ma trận trọng số attention"><thead><tr><th>Query \\ Key</th>{tokens.map((t, i) => <th key={i}>{t}</th>)}</tr></thead>
              <tbody>{tokens.map((t, i) => <tr key={i} style={i === qi ? { outline: '3px solid currentColor' } : undefined}><th>{t}</th>{res.weights[i].map((w, j) => <td key={j} style={{ background: `rgba(31,111,235,${w})` }}>{w.toFixed(2)}</td>)}</tr>)}</tbody></table></div>
            <p className="node" role="status">Token “{tokens[qi]}”: điểm (đã chia √{DK}) = [{res.scores[qi].map((s) => (Number.isFinite(s) ? s.toFixed(2) : '−∞')).join(', ')}] → softmax = [{res.weights[qi].map((w) => w.toFixed(3)).join(', ')}] (tổng {res.weights[qi].reduce((a, b) => a + b, 0).toFixed(3)}).</p>
            <Table data={{ columns: ['Token', `Đầu ra (${DK} chiều)`], rows: tokens.map((t, i) => [t, res.out[i].map((v) => v.toFixed(2)).join(', ')]) }} />
          </>
        )}
      </section>
    </div>
  );
}
