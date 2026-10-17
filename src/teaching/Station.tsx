import { Icon } from '../app/icons';
import { LESSONS } from '../lessons';
import { resourceById, STATION_GROUPS } from './catalog';

export function Station({ groupId }: { groupId: string | null }) {
  const selected = STATION_GROUPS.find(group => group.id === groupId);
  return <div className="station-page">
    <header className="library-intro"><p className="eyebrow">Không gian bộ môn · Học & thực hành & giảng dạy</p>
      <h1>Trạm Tin học Y khoa</h1><p>Chọn nhóm năng lực, mở công cụ thực hành hoặc chuẩn bị một buổi học. Khung tổ chức đang phát triển theo từng nhóm, chưa thay thế đề cương chính thức của bộ môn.</p></header>
    <div className="station-entry-actions"><a id="station-student" className="btn primary" href="#/learning">Tôi muốn bắt đầu học →</a>
      <a id="station-teacher" className="btn" href="#/teaching">Bàn giảng viên · Soạn buổi học</a>
      <a id="station-library" href="#/">Toàn bộ thư viện · {LESSONS.length} bài</a></div>
    <p><a id="station-workshop-import" href="#/workshop">Đã có phiếu tương tác từ giảng viên? Mở Xưởng và nhập phiếu →</a></p>
    <section aria-labelledby="station-groups-title"><h2 id="station-groups-title">Các nhóm học tập</h2>
      <div className="station-groups">{STATION_GROUPS.map((group, i) => <a id={`station-group-${group.id}`} href={`#/station?group=${group.id}`} key={group.id}
        className="station-group" aria-current={selected?.id === group.id ? 'true' : undefined}>
        <div><Icon name={group.icon} size={24} /><span>0{i + 1}</span></div><h3>{group.title}</h3><p>{group.summary}</p><small>{group.resourceIds.length} điểm vào học tập <span aria-hidden="true">→</span></small>
      </a>)}</div>
    </section>
    {selected ? <section className="station-resources" aria-labelledby="station-selected-title">
      <header><div><p className="eyebrow">Nhóm đang chọn</p><h2 id="station-selected-title">{selected.title}</h2><p>Chuẩn bị: {selected.prerequisite}</p></div>
        <a id="station-plan-group" className="btn primary" href={`#/teaching?group=${selected.id}`}>Soạn buổi học nhóm này</a></header>
      <ol>{selected.resourceIds.map(id => { const resource = resourceById(id)!; return <li key={id}>
        <div><h3><a id={`station-resource-${id}`} href={resource.href}>{resource.title}</a></h3><p>{resource.outcome}</p><small>{resource.requirement}</small></div>
        <div className="station-resource-actions"><a className="btn" id={`station-open-${id}`} href={resource.href} aria-label={`Mở ${resource.title}`}>Mở công cụ →</a>
          <a className="btn" id={`station-workshop-${id}`} href={`#/workshop?topic=${id}`} aria-label={`Thực hành nhóm ${resource.title}`}>Phiếu thực hành nhóm</a>
          <a className="btn" id={`station-teach-${id}`} href={`#/teaching?group=${selected.id}&topic=${id}`} aria-label={`Soạn buổi ${resource.title}`}>Soạn buổi này</a></div>
      </li>; })}</ol>
    </section> : <section className="station-help"><h2>Một buổi học có thể bắt đầu như thế nào?</h2><p>Chọn nhóm năng lực → giảng viên chuẩn bị nhiệm vụ → sinh viên dự đoán, thực hành và ghi bằng chứng → cùng thảo luận kết quả và giới hạn.</p><a id="station-first-group" href="#/station?group=data">Thử bắt đầu với dữ liệu & thống kê →</a></section>}
    <aside className="station-help"><h2>Học liệu chung, không phải hệ thống quản lý sinh viên</h2>
      <p>Giáo án và tiến độ lưu riêng trên trình duyệt. Chưa có thu bài, quản lý lớp hay đồng bộ đa thiết bị. Chỉ dùng dữ liệu mẫu hoặc được phép; các ví dụ y khoa không phục vụ quyết định điều trị.</p>
      <p>Giữ sáu nhóm hiện tại theo lựa chọn của bộ môn. Các phiếu và tiêu chí là gợi ý tổ chức dạy học, không phải đề cương chính thức hay chứng nhận năng lực.</p></aside>
  </div>;
}
