import { useMemo, useRef, useState } from 'react';
import { chat, ProviderError } from '../../core/providers/chat';
import { embed } from '../../core/providers/embed';
import { NeedsOcr, readFileText } from '../../core/rag/readers';
import { ocrFile, type OcrProgress } from '../../core/rag/ocr';
import { bm25, buildContext, checkCitations, chunkDoc, fingerprint, ragSystemPrompt, vectorSearch, type Chunk, type Doc, type Hit } from '../../core/rag/rag';
import { useSession } from '../../core/security/keystore';
import { toPlain } from '../../core/security/sanitize';
import { Field, Table } from '../../app/ui';
import { ChatProfileForm, EmbedProfileForm } from '../genai-playground/ProfileForm';

const MAX_DOCS = 10, MAX_CHUNKS = 1000, BATCH = 16;

export function RagLab() {
  const s = useSession();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [paste, setPaste] = useState('');
  const [size, setSize] = useState(500);
  const [overlap, setOverlap] = useState(80);
  const [topK, setTopK] = useState(3);
  const [mode, setMode] = useState<'bm25' | 'vector'>('bm25');
  const [query, setQuery] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [vectors, setVectors] = useState<{ fp: string; v: Map<string, number[]> } | null>(null);
  const [embProgress, setEmbProgress] = useState<string | null>(null);
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [answer, setAnswer] = useState<{ text: string; error?: string; busy: boolean } | null>(null);
  const [okEmbed, setOkEmbed] = useState(false);
  const [okChat, setOkChat] = useState(false);
  const [open, setOpen] = useState<Chunk | null>(null);
  const [ocrNeed, setOcrNeed] = useState<File | null>(null);
  const [ocrProg, setOcrProg] = useState<OcrProgress | null>(null);
  const ocrCtl = useRef<AbortController | null>(null);
  const ctl = useRef<AbortController | null>(null);

  const chunks = useMemo(() => docs.flatMap((d, i) => chunkDoc(d, i + 1, size, overlap)), [docs, size, overlap]);
  const fp = fingerprint([docs.map((d) => d.id + d.text.length).join(','), size, overlap, s.embed.model, s.embed.baseUrl]);
  const vecOk = vectors?.fp === fp; // đổi tài liệu/chunking/embedding thì chỉ mục cũ không dùng lại

  const addDoc = (name: string, text: string, paged = false) => {
    if (docs.length >= MAX_DOCS) return setMsg(`Tối đa ${MAX_DOCS} tài liệu.`);
    if (!text.trim()) return setMsg('Văn bản rỗng.');
    setDocs([...docs, { id: crypto.randomUUID(), name, text, paged }]); setHits(null); setMsg(null);
  };
  const onFile = async (f?: File) => {
    if (!f) return;
    try {
      setMsg('Đang đọc tệp…');
      const r = await readFileText(f); // đọc cục bộ, không tải lên đâu cả
      addDoc(f.name, r.text, r.paged);
      if (r.note) setMsg(r.note);
    } catch (e) {
      if (e instanceof NeedsOcr) { setOcrNeed(f); setMsg(e.message); return; }
      setMsg(e instanceof Error ? e.message : 'Không đọc được tệp.');
    }
  };

  const runOcr = async () => {
    if (!ocrNeed) return;
    ocrCtl.current = new AbortController();
    setOcrProg({ page: 0, pages: 0, pct: 0, status: 'Đang chuẩn bị' });
    try {
      const r = await ocrFile(ocrNeed, setOcrProg, ocrCtl.current.signal);
      addDoc(`${ocrNeed.name} (OCR)`, r.text, r.paged);
      setMsg(`OCR xong, độ tin cậy trung bình ${r.confidence.toFixed(0)}%. Hãy mở các đoạn để kiểm tra lỗi nhận dạng trước khi dùng.`);
      setOcrNeed(null);
    } catch (e) { setMsg((e as Error).name === 'AbortError' ? 'Đã hủy OCR.' : `OCR lỗi: ${(e as Error).message}`); }
    setOcrProg(null);
  };

  const buildIndex = async () => {
    if (chunks.length > MAX_CHUNKS) return setMsg(`Quá ${MAX_CHUNKS} đoạn; tăng kích thước đoạn hoặc bớt tài liệu.`);
    ctl.current = new AbortController();
    const v = new Map<string, number[]>();
    try {
      for (let i = 0; i < chunks.length; i += BATCH) {
        setEmbProgress(`${Math.min(i + BATCH, chunks.length)}/${chunks.length}`);
        const part = chunks.slice(i, i + BATCH);
        const out = await embed(s.embed, part.map((c) => c.text), ctl.current.signal);
        part.forEach((c, j) => v.set(c.id, out[j]));
      }
      setVectors({ fp, v }); setMsg(`Đã lập chỉ mục ${chunks.length} đoạn (${[...v.values()][0]?.length ?? 0} chiều).`);
    } catch (e) { setMsg(e instanceof ProviderError ? e.message : 'Lỗi embedding.'); }
    setEmbProgress(null);
  };

  const search = async () => {
    setAnswer(null);
    if (mode === 'bm25') return setHits(bm25(chunks, query, topK));
    if (!vecOk) return setMsg('Chỉ mục vector chưa có hoặc đã lỗi thời; hãy lập lại chỉ mục.');
    try {
      ctl.current = new AbortController();
      const [qv] = await embed(s.embed, [query], ctl.current.signal);
      setHits(vectorSearch(chunks, vectors!.v, qv, topK));
    } catch (e) { setMsg(e instanceof ProviderError ? e.message : 'Lỗi embedding câu hỏi.'); }
  };

  const ask = async () => {
    if (!hits) return;
    ctl.current = new AbortController();
    setAnswer({ text: '', busy: true });
    let acc = '';
    try {
      await chat(s.chatA, [{ role: 'system', content: ragSystemPrompt() }, { role: 'user', content: `NGỮ CẢNH:\n${buildContext(hits)}\n\nCÂU HỎI: ${query}` }],
        (d) => { acc += d; setAnswer({ text: acc, busy: true }); }, ctl.current.signal);
      setAnswer({ text: acc, busy: false });
    } catch (e) { setAnswer({ text: acc, busy: false, error: e instanceof ProviderError ? e.message : 'Lỗi.' }); }
  };
  const cites = hits && answer && !answer.busy ? checkCitations(answer.text, hits) : null;
  const hitTable = hits && { columns: ['Mã đoạn', 'Tài liệu', 'Điểm', 'Trích đoạn'], rows: hits.map((h) => [h.chunk.id, h.chunk.docName + (h.chunk.page ? ` (tr. ${h.chunk.page})` : ''), h.score.toFixed(4), h.chunk.text.slice(0, 160)]) };

  return (
    <div className="lab">
      <section className="controls">
        <div className="box">
          <strong>1. Tài liệu (đọc cục bộ)</strong>
          <label className="btn">Chọn TXT, MD, CSV, DOCX, PDF, ảnh<input type="file" accept=".txt,.md,.markdown,.csv,.docx,.pdf,.png,.jpg,.jpeg,.webp" hidden onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ''; }} /></label>
          <Field label="Hoặc dán văn bản"><textarea rows={4} value={paste} onChange={(e) => setPaste(e.target.value)} /></Field>
          <button onClick={() => { addDoc(`Văn bản dán ${docs.length + 1}`, paste); setPaste(''); }}>Thêm văn bản</button>
          <ul>{docs.map((d, i) => <li key={d.id}>D{i + 1}: {d.name} ({d.text.length} ký tự) <button onClick={() => { setDocs(docs.filter((x) => x.id !== d.id)); setHits(null); }}>Xóa</button></li>)}</ul>
        </div>
        <div className="box">
          <strong>2. Chia đoạn</strong>
          <Field label={`Kích thước đoạn = ${size} ký tự`}><input type="range" min={100} max={2000} step={50} value={size} onChange={(e) => setSize(Number(e.target.value))} /></Field>
          <Field label={`Overlap = ${overlap}`}><input type="range" min={0} max={400} step={10} value={overlap} onChange={(e) => setOverlap(Number(e.target.value))} /></Field>
          <Field label={`Top-k = ${topK}`}><input type="range" min={1} max={10} value={topK} onChange={(e) => setTopK(Number(e.target.value))} /></Field>
        </div>
        <EmbedProfileForm p={s.embed} />
        <ChatProfileForm slot="chatA" p={s.chatA} />
      </section>
      <section className="main">
        {msg && <p role="status" className="result">{msg}</p>}
        {ocrNeed && (
          <div className="box">
            <strong>Nhận dạng chữ (OCR) trên máy: {ocrNeed.name}</strong>
            <p className="muted">Chạy hoàn toàn trong trình duyệt (tiếng Việt + tiếng Anh), không gửi tệp đi đâu. Có thể mất vài chục giây mỗi trang; tối đa 30 trang. Kết quả có thể sai chữ, cần kiểm tra lại.</p>
            {ocrProg ? (
              <>
                <div className="ocr-bar"><span style={{ width: `${Math.round(100 * ((Math.max(0, ocrProg.page - 1) + ocrProg.pct) / Math.max(1, ocrProg.pages)))}%` }} /></div>
                <p className="muted">Trang {ocrProg.page}/{ocrProg.pages || '…'} · {ocrProg.status}</p>
                <button onClick={() => ocrCtl.current?.abort()}>Hủy</button>
              </>
            ) : <div className="row"><button className="primary" onClick={runOcr}>Chạy OCR</button><button onClick={() => { setOcrNeed(null); setMsg(null); }}>Bỏ qua</button></div>}
          </div>
        )}
        <h3>{chunks.length} đoạn</h3>
        {chunks.length > 0 && (
          <details><summary>Xem từng đoạn</summary>
            <ul>{chunks.map((c) => <li key={c.id}><button onClick={() => setOpen(c)}>{c.id}</button> {c.text.slice(0, 80)}…</li>)}</ul>
          </details>
        )}
        {open && <div className="box"><strong>{open.id}</strong> — {open.docName}{open.page ? `, trang ${open.page}` : ''}, ký tự {open.start}–{open.end}<pre style={{ whiteSpace: 'pre-wrap' }}>{toPlain(open.text)}</pre><button onClick={() => setOpen(null)}>Đóng</button></div>}

        <h3>3. Truy xuất</h3>
        <div className="row">
          <label className="check"><input type="radio" name="mode" checked={mode === 'bm25'} onChange={() => setMode('bm25')} /> Từ khóa BM25 (cục bộ, không cần API)</label>
          <label className="check"><input type="radio" name="mode" checked={mode === 'vector'} onChange={() => setMode('vector')} /> Ngữ nghĩa (embedding)</label>
        </div>
        {mode === 'vector' && (
          <div className="box">
            <p className="warn">Lập chỉ mục ngữ nghĩa sẽ gửi nội dung <b>{chunks.length} đoạn</b> tới endpoint embedding bạn nhập.</p>
            <label className="check"><input type="checkbox" checked={okEmbed} onChange={(e) => setOkEmbed(e.target.checked)} /> Tôi đồng ý gửi nội dung các đoạn ra ngoài.</label>
            <div className="row">
              <button disabled={!okEmbed || chunks.length === 0 || embProgress !== null} onClick={buildIndex}>{embProgress ? `Đang lập chỉ mục ${embProgress}` : 'Lập chỉ mục vector'}</button>
              {embProgress && <button onClick={() => ctl.current?.abort()}>Hủy</button>}
              <span className="muted">{vecOk ? 'Chỉ mục khớp cấu hình hiện tại.' : vectors ? 'Chỉ mục đã lỗi thời (đổi tài liệu/chunk/embedding) — cần lập lại.' : 'Chưa có chỉ mục.'}</span>
            </div>
          </div>
        )}
        <Field label="Câu hỏi"><input value={query} onChange={(e) => setQuery(e.target.value)} /></Field>
        <button className="primary" disabled={!query.trim() || chunks.length === 0} onClick={search}>Tìm top-{topK}</button>
        {hitTable && (hits!.length ? <Table data={hitTable} caption="Các đoạn được truy xuất" /> : <p className="muted">Không có đoạn nào khớp — nên nói rõ là không đủ bằng chứng.</p>)}

        {hits && hits.length > 0 && (
          <>
            <h3>4. Ghép context và hỏi mô hình</h3>
            <details><summary>Context cuối sẽ gửi</summary><pre className="node" style={{ whiteSpace: 'pre-wrap' }}>{buildContext(hits)}</pre></details>
            <label className="check"><input type="checkbox" checked={okChat} onChange={(e) => setOkChat(e.target.checked)} /> Tôi đồng ý gửi câu hỏi và context này tới endpoint sinh văn bản (có thể phát sinh phí).</label>
            <div className="row"><button className="primary" disabled={!okChat || answer?.busy} onClick={ask}>Hỏi</button><button disabled={!answer?.busy} onClick={() => ctl.current?.abort()}>Dừng</button></div>
          </>
        )}
        {answer && (
          <div className="box">
            {answer.error && <p role="alert" className="warn">{answer.error}</p>}
            <div style={{ whiteSpace: 'pre-wrap' }}>{toPlain(answer.text)}</div>
            {cites && <p className="muted">Mã nguồn có trong context: {cites.found.join(', ') || 'không có'}.{cites.invalid.length ? ` ⚠ Mã không tồn tại: ${cites.invalid.join(', ')}.` : ''} Có mã nguồn chưa có nghĩa nội dung đã được kiểm chứng — hãy mở đoạn gốc để đối chiếu.</p>}
          </div>
        )}
      </section>
    </div>
  );
}
