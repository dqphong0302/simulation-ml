import { PYTHON_LESSONS, makeNotebook, COLAB_URL, setupCode } from '../../lessons/python';
import { download } from '../../core/reporting/files';
import { useSessionData } from '../../core/datasets/session';
import { TABLE_NOTEBOOKS } from '../../learning/dataContext';
import { makeUploadedNotebook } from '../../lessons/python/uploaded';

export function PythonPractice({ lessonId }: { lessonId: string }) {
  const data = useSessionData();
  const sample = PYTHON_LESSONS[lessonId];
  if (!sample) return null;
  return <section className="python-practice" aria-labelledby="python-title">
    <header className="python-head">
      <div><p className="eyebrow">Python · {sample.level} · CPU</p><h2 id="python-title">Tự thử trên Google Colab</h2><p>{sample.summary}</p></div>
      <button id="download-notebook" className="btn primary" onClick={() => download(new Blob([JSON.stringify(makeNotebook(lessonId), null, 2)], { type: 'application/x-ipynb+json' }), `${lessonId.toLowerCase()}.ipynb`)}>Tải notebook .ipynb</button>
    </header>
    <ol className="colab-steps"><li>Tải notebook của bài này.</li><li>Mở <a href={COLAB_URL} target="_blank" rel="noreferrer">Google Colab ↗</a> → File → Upload notebook.</li><li>Chọn tệp vừa tải, chạy lần lượt các cell từ trên xuống bằng Shift + Enter.</li></ol>
    <p className="python-warning">Notebook dùng dữ liệu mẫu và chạy trên CPU. Colab xử lý trên đám mây; dùng dữ liệu được phép chia sẻ.{lessonId === 'GENAI' && ' Phần gọi API mặc định tắt; cần tài khoản và có thể phát sinh phí.'}</p>
    {data && <div className="uploaded-notebook"><h3>Thử với bảng “{data.name}”</h3>{TABLE_NOTEBOOKS.has(lessonId) ? <>
      <p>Notebook riêng gợi ý tên cột từ bảng hiện tại, không nhúng hàng dữ liệu. Kiểm tra cấu hình rồi upload lại bảng trên Colab. Biến chữ được mã hóa trong notebook; ngày tháng cần thiết kế riêng.</p>
      <button id="download-uploaded-notebook" className="btn primary" onClick={() => download(new Blob([JSON.stringify(makeUploadedNotebook(lessonId, data), null, 2)], { type:'application/x-ipynb+json' }), `${lessonId.toLowerCase()}-du-lieu-cua-ban.ipynb`)}>Tải notebook cho dữ liệu của bạn</button>
      <button id="download-session-csv" className="btn" onClick={() => {
        const quote = (s: string) => '"' + s.replaceAll('"','""') + '"';
        // Keep strings unchanged and preserve the separator/decimal convention.
        const content = [data.table.names, ...data.table.cells].map(r => r.map(quote).join(data.table.delimiter)).join('\r\n');
        download(new Blob(['\uFEFF'+content], { type:'text/csv;charset=utf-8' }), 'bang-dang-dung.csv');
      }}>Tải bảng đang dùng</button>
      <p className="python-warning">Bảng tải về chứa dữ liệu đang xem, kể cả mẫu đã chọn. Đây là tải xuống thiết bị; chưa gửi lên Colab. Dùng trình đọc dữ liệu; phần mềm bảng tính có thể diễn giải ô bắt đầu bằng dấu = như công thức. Không đưa dữ liệu sức khỏe người thật lên dịch vụ đám mây.</p>
    </> : <p>Bài này giữ notebook mô phỏng riêng; chưa có biến thể cho bảng tải lên. Với bảng, hãy thử EDA, tiền xử lý hoặc các bài học máy phù hợp.</p>}</div>}
    <details className="python-preview"><summary>Xem giải thích từng bước và code Python ({sample.steps.length} bước)</summary>
      <section className="python-step"><h3>Chuẩn bị thư viện</h3><p>Chạy cell cài thư viện trước, sau đó khởi tạo NumPy và Matplotlib. Không cần GPU.</p><pre><code>{`%pip -q install ${sample.packages.join(' ')}\n\n${setupCode}`}</code></pre></section>
      {sample.steps.map((step, i) => <section className="python-step" key={step.title}><h3>{i + 1}. {step.title}</h3><p>{step.explanation}</p><pre><code>{step.code}</code></pre></section>)}
      <section className="python-step"><h3>Bài tập tự thử</h3><ul>{sample.exercises.map(x => <li key={x}>{x}</li>)}</ul><p><strong>Giới hạn: </strong>{sample.limitation}</p></section>
    </details>
  </section>;
}
