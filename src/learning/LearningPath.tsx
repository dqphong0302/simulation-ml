import { PATH } from './model';
import { useLearningProgress } from './progress';
import { CuriosityStart } from './CuriosityStart';

export function LearningPath({ compact = false }: { compact?: boolean }) {
  const { progress } = useLearningProgress();
  const completed = PATH.filter(step => progress[step.id]?.done).length;
  const next = PATH.find(step => !progress[step.id]?.done);
  if (compact) return <section className="path-preview" aria-labelledby="path-preview-title">
    <div><p className="eyebrow">Học theo từng bước</p><h2 id="path-preview-title">Lộ trình học tập</h2>
      <p>Từ hiểu AI đến đọc dữ liệu, thử mô hình và kiểm tra nguồn. {completed}/{PATH.length} bước đã học.</p></div>
    <a id="open-learning-path" className="btn primary" href={next?.href ?? '#/project'}>{completed ? 'Tiếp tục học' : 'Bắt đầu học'} →</a>
    <a className="path-all" href="#/learning">Xem toàn bộ lộ trình</a>
  </section>;
  return <div className="learning-path-page">
    <header className="library-intro"><p className="eyebrow">AI · Dữ liệu · Ứng dụng y khoa</p><h1>Lộ trình học tập</h1>
      <p>Bắt đầu bằng trực giác và mô phỏng. Python, công thức và các mô hình nâng cao là phần đọc thêm.</p></header>
    <CuriosityStart />
    <section className="path-progress" aria-label="Tiến độ học tập">
      <span>{completed}/{PATH.length} bước đã học</span><progress max={PATH.length} value={completed} />
      <p>Tiến độ và ghi chép lưu trên trình duyệt này, không đồng bộ giữa thiết bị. Đánh dấu sau khi làm câu hỏi và ghi nhận xét; không phải chứng chỉ.</p>
    </section>
    <ol className="path-steps">{PATH.map((step, i) => <li key={step.id} className={progress[step.id]?.done ? 'done' : ''}>
      <span className="path-step-number" aria-hidden="true">{progress[step.id]?.done ? '✓' : String(i + 1).padStart(2, '0')}</span>
      <div><h2><a href={step.href}>{step.title}</a></h2><p>{step.outcome}</p>
        <span className="path-step-status">{progress[step.id]?.done ? 'Đã học' : progress[step.id]?.score !== undefined ? `Đã làm câu hỏi: ${progress[step.id]?.score}/3` : 'Chưa đánh dấu đã học'}</span></div>
    </li>)}</ol>
    <aside className="path-extra"><h2>Nhánh ứng dụng · Học sau phần nền tảng</h2><p>Không thay đổi các bước bắt buộc hoặc tiến độ đã lưu. Có thể chọn nhánh phù hợp sau bài cây quyết định và CNN.</p>
      <ol><li><a id="path-boost" href="#/ml/boosting">Gradient Boosting</a> — học cây tuần tự, so với Random Forest.</li>
      <li><a id="path-transfer" href="#/dl/transfer">Học chuyển giao</a> — CNN → đóng băng → học đầu → fine-tune.</li>
      <li><a id="path-seg" href="#/dl/segmentation">Phân đoạn ảnh</a> — nhãn ảnh → mặt nạ → Dice/IoU → U-Net nhỏ.</li></ol>
      <h3>Khám phá thêm · Không bắt buộc</h3><p>VAE, GAN và Diffusion dành cho khi đã vững dữ liệu, đánh giá và mạng cơ bản. Không cần học hết để hoàn thành lộ trình năm nhất.</p><a className="btn" href="#/">Mở thư viện bài học</a></aside>
  </div>;
}
