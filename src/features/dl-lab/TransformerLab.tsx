import { useEffect, useRef, useState } from 'react';
import { CORPUS } from '../../core/algorithms/minigpt';
import { Chart, Field, Table } from '../../app/ui';
import type { GptIn, GptOut } from '../../workers/gpt.worker';

type Gen = Extract<GptOut, { type: 'generated' }>['result'];
type Att = Extract<GptOut, { type: 'attention' }>['result'];
const MAX_STEPS = 600, MAX_LINES = 30;

export function TransformerLab() {
  const [corpus, setCorpus] = useState(CORPUS.join('\n'));
  const [applied, setApplied] = useState(CORPUS.join('\n'));
  const [d, setD] = useState(16);
  const [lr, setLr] = useState(0.02);
  const [info, setInfo] = useState<{ vocab: number; params: number; windows: number } | null>(null);
  const [losses, setLosses] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [running, setRunning] = useState(false);
  const [prompt, setPrompt] = useState('bác sĩ');
  const [temp, setTemp] = useState(0.7);
  const [gseed, setGseed] = useState(1);
  const [gen, setGen] = useState<Gen | null>(null);
  const [att, setAtt] = useState<Att | null>(null);
  const [attText, setAttText] = useState('điều dưỡng nhắc bệnh nhân uống thuốc');
  const w = useRef<Worker | null>(null);
  const gid = useRef(0);
  const lines = applied.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, MAX_LINES);

  useEffect(() => {
    const worker = new Worker(new URL('../../workers/gpt.worker.ts', import.meta.url), { type: 'module' });
    gid.current++;
    const my = gid.current;
    worker.onmessage = (e: MessageEvent<GptOut>) => {
      const m = e.data;
      if (m.type === 'ready') setInfo(m);
      else if ('id' in m && m.id !== my) return;
      else if (m.type === 'trained') { setLosses((l) => [...l, ...m.losses]); setBusy(false); }
      else if (m.type === 'generated') setGen(m.result);
      else if (m.type === 'attention') setAtt(m.result);
    };
    worker.postMessage({ type: 'init', lines, cfg: { ctx: 8, d, ff: 2 * d, seed: 1, lr } } satisfies GptIn);
    w.current = worker; setLosses([]); setGen(null); setAtt(null); setInfo(null); setRunning(false); setBusy(false);
    return () => worker.terminate();
  }, [applied, d, lr]); // eslint-disable-line react-hooks/exhaustive-deps

  const train = (n: number) => {
    if (busy || !w.current || losses.length >= MAX_STEPS) return;
    setBusy(true);
    w.current.postMessage({ type: 'train', steps: Math.min(n, MAX_STEPS - losses.length), id: gid.current } satisfies GptIn);
  };
  useEffect(() => { if (running && !busy) { if (losses.length >= MAX_STEPS) setRunning(false); else train(10); } }); // eslint-disable-line react-hooks/exhaustive-deps

  const every = Math.max(1, Math.floor(losses.length / 40));
  const chart = { title: 'Transformer nhỏ: loss dự đoán token tiếp theo', xLabel: 'Bước huấn luyện', yLabel: 'Cross-entropy (train)', series: [{ name: 'Loss', points: losses.map((v, i) => [i + 1, v] as [number, number]).filter(([i]) => i % every === 0 || i === losses.length) }] };
  const table = { columns: ['Chỉ số', 'Giá trị'], rows: [['Số câu trong corpus', String(lines.length)], ['Kích thước từ vựng', info ? String(info.vocab) : '…'], ['Số tham số', info ? String(info.params) : '…'], ['Chiều ẩn d', String(d)], ['Learning rate (Adam)', String(lr)], ['Bước đã huấn luyện', String(losses.length)], ['Loss cuối', losses.length ? losses[losses.length - 1].toFixed(4) : 'n/a'], ...(gen ? [['Câu sinh', gen.text], ['Temperature', String(temp)]] : [])] };

  return (
    <div className="lab">
      <section className="controls">
        <div className="box"><strong>Dữ liệu huấn luyện</strong>
          <Field label={`Corpus (mỗi dòng một câu, tối đa ${MAX_LINES} dòng)`}><textarea rows={8} value={corpus} onChange={(e) => setCorpus(e.target.value)} /></Field>
          <button disabled={corpus === applied} onClick={() => setApplied(corpus)}>Dùng corpus này (khởi tạo lại)</button>
        </div>
        <div className="box"><strong>Mô hình và huấn luyện</strong>
          <Field label="Chiều ẩn d"><select value={d} onChange={(e) => setD(Number(e.target.value))}>{[8, 16, 24, 32].map((x) => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Learning rate"><select value={lr} onChange={(e) => setLr(Number(e.target.value))}>{[0.005, 0.01, 0.02, 0.05].map((x) => <option key={x}>{x}</option>)}</select></Field>
          <div className="row"><button onClick={() => train(20)} disabled={busy}>+20 bước</button><button className="primary" aria-pressed={running} onClick={() => setRunning(!running)}>{running ? 'Dừng' : 'Huấn luyện'}</button></div>
          <p className="muted">Chạy trong Web Worker. Tối đa {MAX_STEPS} bước.</p>
        </div>
      </section>
      <section className="main">
        <p className="badge">Huấn luyện thật — một khối Transformer decoder rất nhỏ, đầu vào theo âm tiết</p>
        <p>Kiến trúc: embedding + vị trí → self-attention một đầu có causal mask → mạng truyền thẳng (FFN) có kết nối tắt → lớp ra dự đoán token tiếp theo. Web tách token theo khoảng trắng; notebook mẫu dùng ký tự. Bỏ LayerNorm và chỉ có một khối để dễ theo dõi. Loss thấp trên vài câu có thể chỉ là ghi nhớ, không chứng minh hiểu y khoa.</p>
        <Table data={table} />
        {losses.length > 0 && <Chart spec={chart} />}

        <h3>Sinh văn bản</h3>
        <div className="row">
          <label className="field" style={{ flex: 1, minWidth: 180 }}><span>Mở đầu</span><input value={prompt} onChange={(e) => setPrompt(e.target.value)} /></label>
          <label className="field" style={{ width: 160 }}><span>Temperature {temp}</span><input type="range" min={0.1} max={2} step={0.1} value={temp} onChange={(e) => setTemp(Number(e.target.value))} /></label>
          <label className="field" style={{ width: 90 }}><span>Seed</span><input type="number" value={gseed} onChange={(e) => setGseed(Number(e.target.value) || 0)} /></label>
          <button className="primary" disabled={!info} onClick={() => w.current?.postMessage({ type: 'generate', prompt, n: 12, temperature: temp, seed: gseed, id: gid.current } satisfies GptIn)}>Sinh tiếp</button>
        </div>
        {gen && (
          <>
            {gen.unknown.length > 0 && <p className="warn">Bỏ qua âm tiết không có trong từ vựng: {gen.unknown.join(', ')}.</p>}
            <p className="result"><b>{gen.text}</b></p>
            <Table caption="Từng bước: token được chọn và 5 token có xác suất cao nhất (của mô hình nhỏ này)" data={{ columns: ['Bước', 'Chọn', 'Top-5'], rows: gen.steps.map((s, i) => [String(i + 1), s.token, s.top.map(([t, p]) => `${t} ${(100 * p).toFixed(0)}%`).join(' · ')]) }} />
          </>
        )}

        <h3>Trọng số attention của mô hình đã huấn luyện</h3>
        <div className="row">
          <label className="field" style={{ flex: 1 }}><span>Câu</span><input value={attText} onChange={(e) => setAttText(e.target.value)} /></label>
          <button disabled={!info} onClick={() => w.current?.postMessage({ type: 'attention', text: attText, id: gid.current } satisfies GptIn)}>Xem attention</button>
        </div>
        {att && (
          <div className="tbl-wrap"><table className="tbl heat" aria-label="Ma trận attention">
            <thead><tr><th>Query \ Key</th>{att.tokens.map((t, i) => <th key={i}>{t}</th>)}</tr></thead>
            <tbody>{att.tokens.map((t, i) => <tr key={i}><th>{t}</th>{att.weights[i].map((v, j) => <td key={j} style={{ background: `rgba(79,70,229,${v})`, color: v > 0.55 ? '#fff' : undefined }}>{j > i ? '' : v.toFixed(2)}</td>)}</tr>)}</tbody>
          </table></div>
        )}
        <p className="muted">Ô trống là token tương lai bị che. Đây là attention của mô hình nhỏ này, không dùng để suy diễn cách một LLM thật xử lý câu.</p>
      </section>
    </div>
  );
}
