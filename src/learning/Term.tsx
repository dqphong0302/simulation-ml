import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import './learn-ui.css';
import { GLOSSARY } from './glossary';

/**
 * Thuật ngữ kèm nút (?) giải nghĩa tại chỗ. Hiện khi rê chuột/focus, bấm để giữ mở (cho màn hình cảm ứng), Esc để đóng.
 * `k` là khóa trong GLOSSARY; nội dung hiển thị là children (mặc định chính khóa đó).
 */
export function Term({ k, children }: { k: keyof typeof GLOSSARY; children?: ReactNode }) {
  const id = useId(), [pinned, setPinned] = useState(false), [pos, setPos] = useState<CSSProperties>({});
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => { // khung nổi định vị cố định: cuộn trang thì đóng lại
    if (!pinned) return;
    const close = () => setPinned(false);
    window.addEventListener('scroll', close, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', close, { capture: true });
  }, [pinned]);
  const text = GLOSSARY[k];
  if (!text) return <>{children ?? k}</>;
  // Định vị theo viewport để không bị khung điều khiển hẹp (overflow) cắt mất.
  const place = () => {
    const r = btn.current?.getBoundingClientRect();
    if (!r) return;
    const w = Math.min(280, window.innerWidth * .8);
    setPos({ left: Math.max(8, Math.min(r.left - 8, window.innerWidth - w - 8)), top: r.bottom + 6, maxWidth: w });
  };
  return <span className={`term${pinned ? ' pinned' : ''}`} onMouseEnter={place} onKeyDown={(e) => { if (e.key === 'Escape') setPinned(false); }}>
    {children ?? k}
    <button ref={btn} type="button" className="term-q" aria-label={`Giải nghĩa: ${k}`} aria-describedby={id} aria-expanded={pinned}
      onFocus={place} onClick={(e) => { e.preventDefault(); e.stopPropagation(); place(); setPinned((p) => !p); }} onBlur={() => setPinned(false)}>?</button>
    <span role="tooltip" id={id} className="term-pop" style={pos}>{text}</span>
  </span>;
}
