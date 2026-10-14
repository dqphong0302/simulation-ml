import { PATH } from './model';
import { useLearningProgress } from './progress';

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
    <section className="path-progress" aria-label="Tiến độ học tập">
      <span>{completed}/{PATH.length} bước đã học</span><progress max={PATH.length} value={completed} />
      <p>Tiến độ và ghi chép lưu trên trình duyệt này, không đồng bộ giữa thiết bị. Đánh dấu sau khi làm câu hỏi và ghi nhận xét; không phải chứng chỉ.</p>
    </section>
    <ol className="path-steps">{PATH.map((step, i) => <li key={step.id} className={progress[step.id]?.done ? 'done' : ''}>
      <span className="path-step-number" aria-hidden="true">{progress[step.id]?.done ? '✓' : String(i + 1).padStart(2, '0')}</span>
      <div><h2><a href={step.href}>{step.title}</a></h2><p>{step.outcome}</p>
        <span className="path-step-status">{progress[step.id]?.done ? 'Đã học' : progress[step.id]?.score !== undefined ? `Đã làm câu hỏi: ${progress[step.id]?.score}/3` : 'Chưa đánh dấu đã học'}</span></div>
    </li>)}</ol>
    <aside className="path-extra"><h2>Khám phá thêm khi đã sẵn sàng</h2><p>Nhận diện ảnh, hồi quy, phân cụm, PCA và các mô hình deep learning nằm trong thư viện. VAE, GAN, Diffusion, Transformer là phần mở rộng; không cần học hết để hoàn thành lộ trình.</p><a className="btn" href="#/">Mở thư viện bài học</a></aside>
  </div>;
}
