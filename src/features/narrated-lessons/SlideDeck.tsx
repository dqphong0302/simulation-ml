import type { ReactNode } from 'react';

/** Khung trình chiếu 16:9 với mũi tên qua lại hai bên và số trang. Nội dung dài hơn khung thì khung tự cao thêm. */
export function SlideDeck({ idx, total, title, onPrev, onNext, children, flow = false }: {
  idx: number; total: number; title?: string; onPrev: () => void; onNext: () => void; children: ReactNode;
  /** Cảnh mô phỏng tương tác: giữ tỉ lệ 16:9 tối thiểu nhưng cho nội dung cuộn tự nhiên. */
  flow?: boolean;
}) {
  return (
    <section className="deck" aria-roledescription="trình chiếu" aria-label={`Slide ${idx + 1} trên ${total}${title ? `: ${title}` : ''}`}>
      <div className={`deck-frame${flow ? ' flow' : ''}`}>
        <div className="deck-stage">{children}</div>
        <button className="deck-nav prev" onClick={onPrev} disabled={idx === 0} aria-label="Slide trước">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <button className="deck-nav next" onClick={onNext} disabled={idx === total - 1} aria-label="Slide sau">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
        <span className="deck-count" aria-hidden="true">{idx + 1} / {total}</span>
      </div>
      <div className="deck-progress" aria-hidden="true"><i style={{ width: `${((idx + 1) / total) * 100}%` }} /></div>
    </section>
  );
}
