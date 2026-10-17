import { useEffect, useRef, useState } from 'react';
import { resourceById } from './catalog';
import type { TeachingSession } from './session';

export function ActivityRunner({ session, onClose }: { session: TeachingSession; onClose: () => void }) {
  const panel = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [index, setIndex] = useState(0);
  const [left, setLeft] = useState(session.activities[0].minutes * 60_000);
  const [deadline, setDeadline] = useState<number | null>(null);
  const activity = session.activities[index];
  useEffect(() => { panel.current?.scrollIntoView({ block: 'start' }); heading.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => {
    if (deadline === null) return;
    const tick = () => { const remaining = Math.max(0, deadline - Date.now()); setLeft(remaining); if (!remaining) setDeadline(null); };
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [deadline]);
  const go = (i: number) => { setDeadline(null); setIndex(i); setLeft(session.activities[i].minutes * 60_000); };
  const seconds = Math.ceil(left / 1000);
  return <section ref={panel} className="activity-runner" aria-labelledby="runner-title">
    <header><p className="eyebrow">Chế độ dẫn buổi học · Không hiển thị ghi chú riêng</p><button id="runner-close" className="btn" onClick={onClose}>Quay lại giáo án</button></header>
    <p>Hoạt động {index + 1}/{session.activities.length} · Gợi ý {session.groupSize} người/nhóm</p><h2 id="runner-title" ref={heading} tabIndex={-1}>{activity.title}</h2>
    <div className="runner-clock" role="timer" aria-label="Thời gian còn lại">{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</div>
    <div className="teaching-actions"><button id="runner-toggle" className="btn primary" disabled={left === 0} onClick={() => {
      if (deadline !== null) { setLeft(Math.max(0, deadline - Date.now())); setDeadline(null); }
      else setDeadline(Date.now() + left);
    }}>{deadline === null ? 'Bắt đầu / Tiếp tục' : 'Tạm dừng'}</button>
      <button id="runner-reset" className="btn" onClick={() => { setDeadline(null); setLeft(activity.minutes * 60_000); }}>Đặt lại thời gian</button></div>
    {left === 0 && <p role="status">Hết thời gian gợi ý. Giảng viên có thể thảo luận thêm hoặc chuyển hoạt động; không tự thu bài.</p>}
    <h3>Nhiệm vụ nhóm</h3><p className="runner-task">{activity.task}</p><h3>Sản phẩm cần có</h3><p>{activity.evidence}</p>
    <p>Luân phiên: thao tác · quan sát/ghi chép · phản biện · trình bày. Nhóm ít người có thể kiêm vai.</p>
    <a id="runner-resource" className="btn" href={resourceById(activity.resourceId)!.href} target="_blank" rel="noreferrer">Mở {resourceById(activity.resourceId)!.title} ở tab mới ↗</a>
    <p className="lesson-level">{resourceById(activity.resourceId)!.requirement}</p>
    <nav className="teaching-actions" aria-label="Chuyển hoạt động"><button id="runner-prev" className="btn" disabled={index === 0} onClick={() => go(index - 1)}>← Hoạt động trước</button>
      <button id="runner-next" className="btn primary" disabled={index === session.activities.length - 1} onClick={() => go(index + 1)}>Hoạt động tiếp →</button></nav>
  </section>;
}
