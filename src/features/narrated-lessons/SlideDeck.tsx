import type { ReactNode } from 'react';

/** Khung trình chiếu cao theo nội dung, có thanh điều hướng riêng phía trên. */
export function SlideDeck({ idx, total, title, onPrev, onNext, children, flow = false }: {
  idx: number; total: number; title?: string; onPrev: () => void; onNext: () => void; children: ReactNode;
  /** Cảnh mô phỏng tương tác dùng bố cục lab thay cho slide văn bản. */
  flow?: boolean;
}) {
  return (
    <section className="deck" aria-roledescription="trình chiếu" aria-label={`Slide ${idx + 1} trên ${total}${title ? `: ${title}` : ''}`}>
      <div className="deck-toolbar">
        <span className="deck-label">{flow ? 'Cùng thử một ví dụ' : 'Bài giảng trực quan'}</span>
        <div className="deck-pagination">
        <button className="deck-nav prev" onClick={onPrev} disabled={idx === 0} aria-label="Slide trước">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <span className="deck-count" aria-label={`Slide ${idx + 1} trên ${total}`}>{idx + 1} / {total}</span>
        <button className="deck-nav next" onClick={onNext} disabled={idx === total - 1} aria-label="Slide sau">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
        </div>
      </div>
      <div className={`deck-frame${flow ? ' flow' : ''}`}>
        <div className="deck-stage">{children}</div>
      </div>
      <div className="deck-progress" aria-hidden="true"><i style={{ width: `${((idx + 1) / total) * 100}%` }} /></div>
    </section>
  );
}
