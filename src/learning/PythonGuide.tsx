import { useEffect, useRef, useState } from 'react';
import { LibraryTabs } from '../app/DataWorkspace';
import { download } from '../core/reporting/files';
import { COLAB_GUIDE, PYTHON_BASICS, makeBasicsNotebook } from './pythonBasics';
import { NotebookCell } from './NotebookCell';
import { PythonAudio } from './PythonAudio';

export function PythonGuide() {
  const activeAudio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => () => { activeAudio.current?.pause(); }, []);
  const [copied, setCopied] = useState('');
  const [copyError, setCopyError] = useState('');
  async function copyCode(id: string, code: string) {
    try { await navigator.clipboard.writeText(code); setCopied(id); setCopyError(''); }
    catch { setCopyError('Không thể sao chép tự động. Hãy chọn code rồi sao chép thủ công.'); }
  }
  return <div className="python-guide" onPlayCapture={e => {
    if (!(e.target instanceof HTMLAudioElement)) return;
    if (activeAudio.current && activeAudio.current !== e.target) activeAudio.current.pause();
    activeAudio.current = e.target;
  }}>
    <header className="library-intro"><p className="eyebrow">Bắt đầu từ số 0 · Buổi 1</p><h1>Python &amp; Google Colab</h1><p>Từ dòng lệnh đầu tiên đến đọc bảng dữ liệu. Chưa cần biết lập trình, chưa cần học thuật toán.</p></header>
    <LibraryTabs active="python" />
    <section className="python-guide-start" aria-labelledby="python-start-title">
      <div><h2 id="python-start-title">Đọc → chạy → sửa → giải thích</h2><p>Biên soạn từ <code>MSHV_BUOI1.ipynb</code> bạn cung cấp, kèm lời giải thích, bài tập và kiểm tra lỗi. Notebook tải về dùng dữ liệu giả và thư viện Python có sẵn.</p></div>
      <div className="python-guide-actions"><button id="download-python-basics" className="btn primary" onClick={() => download(new Blob([JSON.stringify(makeBasicsNotebook(), null, 2)], { type: 'application/x-ipynb+json' }), 'python-colab-buoi-1.ipynb')}>Tải notebook buổi 1</button><a id="open-colab-basics" className="btn" href="https://colab.research.google.com/" target="_blank" rel="noreferrer">Mở Google Colab ↗</a></div>
    </section>
    <nav className="python-guide-outline" aria-label="Nội dung Python và Colab"><a id="jump-colab" href="#colab-setup" onClick={e => { e.preventDefault(); document.getElementById('colab-setup')?.scrollIntoView({ block: 'start' }); }}>Làm quen Colab</a>{PYTHON_BASICS.map((s, i) => <a key={s.id} id={`jump-python-${s.id}`} href={`#python-${s.id}`} onClick={e => { e.preventDefault(); document.getElementById(`python-${s.id}`)?.scrollIntoView({ block: 'start' }); }}>{String(i + 1).padStart(2, '0')} · {s.title}</a>)}</nav>
    <section id="colab-setup" className="python-guide-panel" aria-labelledby="colab-setup-title"><h2 id="colab-setup-title">Trước khi viết code: làm quen Colab</h2><PythonAudio id="colab" title="Làm quen Colab" /><ol className="colab-guide-grid">{COLAB_GUIDE.map(s => <li key={s.title}><h3>{s.title}</h3><p>{s.text}</p></li>)}</ol><p className="python-warning">Code chạy trên Colab, không chạy trong trang này. Chỉ dùng dữ liệu giả hoặc được phép chia sẻ; không đưa thông tin định danh hay hồ sơ sức khỏe người thật lên đám mây.</p><a id="colab-official-help" href="https://research.google.com/colaboratory/faq.html" target="_blank" rel="noreferrer">Hướng dẫn và giới hạn chính thức của Colab ↗</a></section>
    <p role="status" className="python-copy-status">{copyError || (copied ? 'Đã sao chép code. Dán vào một code cell trên Colab.' : 'Mỗi phần có giải thích, code, kết quả cần kiểm tra và bài tập tự thử.')}</p>
    {PYTHON_BASICS.map((s, i) => <section className="python-guide-panel python-step" id={`python-${s.id}`} key={s.id} aria-labelledby={`python-heading-${s.id}`}><header className="python-guide-step-head"><h2 id={`python-heading-${s.id}`}><span>{String(i + 1).padStart(2, '0')}</span> {s.title}</h2></header><p>{s.explanation}</p><PythonAudio id={s.id} title={s.title} />{s.id === 'statistics' && <p className="python-warning">Chạy phần 07 — Đọc CSV trước: phần này dùng các biến <code>cot</code> và <code>dulieu</code> đã tạo.</p>}<NotebookCell id={s.id} index={i + 1} code={s.code} copied={copied === s.id} onCopy={() => { void copyCode(s.id, s.code); }} /><div className="python-guide-outcome"><p><strong>Kết quả cần kiểm tra:</strong> {s.expected}</p><p><strong>Tự thử:</strong> {s.exercise}</p></div></section>)}
    <section className="python-guide-panel" aria-labelledby="python-errors-title"><h2 id="python-errors-title">Gặp lỗi? Đọc dòng cuối trước</h2><dl className="python-errors"><dt>NameError</dt><dd>Chưa tạo biến/hàm hoặc gõ sai tên. Chạy cell định nghĩa trước; sau khi restart, chạy lại từ đầu.</dd><dt>ValueError</dt><dd>Giá trị không đúng định dạng. Ví dụ int("abc"); kiểm tra số và dấu thập phân.</dd><dt>IndentationError / SyntaxError</dt><dd>Kiểm tra thụt dòng, dấu hai chấm, ngoặc và dấu nháy. Dùng 4 khoảng trắng cho một cấp thụt dòng.</dd><dt>FileNotFoundError / KeyError</dt><dd>Kiểm tra đã upload dữ liệu vào phiên hiện tại chưa và tên cột có đúng chữ hoa, chữ thường, khoảng trắng không.</dd></dl></section>
    <section className="python-guide-panel" aria-labelledby="python-finish-title"><h2 id="python-finish-title">Bạn đã sẵn sàng khi…</h2><ul><li>Phân biệt được chuỗi và số; tự giải thích input, if, for và return.</li><li>Đổi dữ liệu đầu vào và dự đoán được kết quả trước khi chạy.</li><li>Đọc CSV theo tên cột, báo được số giá trị bị bỏ và mẫu số của tỷ lệ.</li><li>Khởi động lại runtime rồi chạy từ đầu; lưu notebook và kiểm tra kết quả trước khi chia sẻ.</li></ul><a id="python-next-eda" className="btn primary" href="#/eda?tab=theory">Tiếp theo: Khám phá dữ liệu →</a></section>
  </div>;
}
