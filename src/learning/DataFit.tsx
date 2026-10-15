import { LESSONS, orderLessons } from '../lessons';
import { useSessionData } from '../core/datasets/session';
import { compatibility, dataContext } from './dataContext';

const ROLE = { id: 'mã định danh', date: 'ngày tháng', constant: 'chỉ 1 giá trị', text: 'văn bản tự do' };

export function DataFit({ lessonId }: { lessonId?: string }) {
  const data = useSessionData();
  if (!data) return null;
  const c = dataContext(data);
  const lesson = LESSONS.find(l => l.id === lessonId);
  const status = lesson && compatibility(lesson.id, lesson.path, data);
  return <aside className="data-fit" aria-label="Bài học và dữ liệu hiện tại">
    <strong>Đang dùng: {data.name}</strong>
    <p>{data.table.cells.length.toLocaleString('vi')} dòng · {c.numeric.filter(x => x.role === 'feature').length} cột số · {c.columns.filter(x => x.kind === 'categorical' && x.role === 'feature').length} cột phân loại{c.flags.length ? ` · ${c.flags.length} cột bị loại` : ''}. Kiểu là suy đoán từ nội dung, cần kiểm tra lại.</p>
    {status ? <p><b>{status.suitable ? 'Có thể thử lab: ' : 'Cần kiểm tra trước: '}</b>{status.reason}</p> : <details><summary>Bài nào phù hợp với bảng này?</summary><ul>{orderLessons(LESSONS).filter(l => l.group === 'foundation' || l.group === 'ml' || ['MLP', 'AE', 'VAE'].includes(l.id)).map(l => {
      const fit = compatibility(l.id, l.path, data);
      return <li key={l.id}><a href={`#${l.path}?tab=lab`}>{l.title.split(':')[0]}</a> — {fit.reason}</li>;
    })}</ul></details>}
    {!!c.flags.length && <p className="warn">Tự động loại khỏi mô hình: {c.columns.filter(x => x.role !== 'feature').map(x => `${x.name} (${ROLE[x.role as keyof typeof ROLE]})`).join(', ')}. Hãy kiểm tra lại; nếu có nhiều lần khám mỗi người, cần chia theo bệnh nhân/thời gian trong notebook.</p>}
    {data.sampled && <p>Đây là mẫu từ {data.originalRows.toLocaleString('vi')} dòng, không phải toàn bộ tệp.</p>}
    <p className="muted">Hướng dẫn và notebook dùng gợi ý từ bảng; lựa chọn biến/nhãn thực tế trong lab có thể khác. Không có dữ liệu nào được gửi ra API từ phần này.</p>
  </aside>;
}
