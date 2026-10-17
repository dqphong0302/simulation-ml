import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';
import { THEORY, parseTheory, type Block } from '../../lessons/theory';
import { LESSONS, GROUPS, type Group } from '../../lessons';
import { download } from '../../core/reporting/files';
import { Icon } from '../../app/icons';
import { PythonPractice } from './PythonPractice';
import { ConceptSim } from '../concept-sim/ConceptSim';
import { useReveal } from '../concept-sim/useReveal';

/** Chữ đậm và liên kết HTTPS tham khảo, không dùng HTML thô. */
function inline(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*|https:\/\/[^\s<>]+)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part.startsWith('https://') ? <a key={i} href={part} target="_blank" rel="noreferrer">{part}</a>
        : <Fragment key={i}>{part}</Fragment>);
}

/** Tài liệu lý thuyết đầy đủ bằng chữ của một bài: mục lục dính bên trái, nội dung đọc bên phải. */
export function TheoryDoc({ lessonId, title, group }: { lessonId: string; title: string; group: Group }) {
  const src = THEORY[lessonId];
  const blocks = useMemo(() => (src ? parseTheory(src) : []), [src]);
  const [active, setActive] = useState<string>('');
  const lesson = LESSONS.find((l) => l.id === lessonId);
  const subject = GROUPS.find((g) => g.id === group)?.title ?? 'Bài học';
  const heads = useMemo(() => blocks.filter((b): b is Extract<typeof b, { t: 'h' }> => b.t === 'h'), [blocks]);
  const advancedAt = blocks.findIndex(b => b.t === 'h' && b.text.startsWith('Mở rộng ·'));
  const core = advancedAt < 0 ? blocks : blocks.slice(0, advancedAt);
  const advanced = advancedAt < 0 ? [] : blocks.slice(advancedAt);
  const tocHeads = advancedAt < 0 ? heads : heads.filter(h => core.includes(h) || h === advanced[0]);
  const body = useReveal<HTMLDivElement>([blocks]);
  const mins = Math.max(1, Math.round((src?.split(/\s+/).length ?? 0) / 200));

  // Mục lục sáng theo đề mục đang đọc, để người học luôn biết mình đang ở đâu.
  useEffect(() => {
    if (!heads.length) return;
    const seen = new Map<string, number>();
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => seen.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0)),
      { rootMargin: '-72px 0px -60% 0px', threshold: [0, 1] },
    );
    heads.forEach((h) => { const el = document.getElementById(h.id); if (el) io.observe(el); });
    const pick = () => setActive(heads.find((h) => (seen.get(h.id) ?? 0) > 0)?.id ?? '');
    pick();
    const timer = window.setInterval(pick, 400);
    return () => { io.disconnect(); window.clearInterval(timer); };
  }, [heads]);

  if (!src) return null;
  const jump = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const parent = el.closest('details');
    if (parent) parent.open = true;
    el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    setActive(id);
  };
  const renderBlock = (b: Block, i: number) => {
    switch (b.t) {
      case 'h': return <h3 key={i} id={b.id} className="rv">{b.text}</h3>;
      case 'p': return <p key={i} className="rv">{inline(b.text)}</p>;
      case 'ul': return <ul key={i} className="rv">{b.items.map((x, j) => <li key={j}>{inline(x)}</li>)}</ul>;
      case 'ol': return <ol key={i} className="rv">{b.items.map((x, j) => <li key={j}>{inline(x)}</li>)}</ol>;
      case 'f': return <div key={i} className="formula rv" role="math" aria-label={b.text}>{b.text}</div>;
      case 'note': return <aside key={i} className="theory-note rv">{inline(b.text)}</aside>;
    }
  };

  return (
    <><ConceptSim lessonId={lessonId} mode="theory" /><article className="theory" aria-labelledby={`theory-${lessonId}`}>
      <header className="theory-head">
        <div className="th-copy">
          <h2 id={`theory-${lessonId}`} className="sr-only">{title} — tài liệu lý thuyết</h2>
          <p className="eyebrow">{subject} · Tài liệu lý thuyết</p>
          <ul className="th-meta">
            <li><b>{heads.length}</b> đề mục</li>
            <li><b>~{mins}</b> phút đọc</li>
            <li><b>{blocks.length}</b> đoạn</li>
            <li>{lesson?.mode}</li>
            <li>Lưu trên thiết bị, không cần mạng</li>
          </ul>
        </div>
        <div className="th-actions">
          <button id={`download-theory-${lessonId}`} className="btn sm" onClick={() => download(new Blob([`# ${title}\n${src}`], { type: 'text/markdown;charset=utf-8' }), `ly-thuyet-${lessonId.toLowerCase()}.md`)}>
            <Icon name="file" size={14} /> Tải tài liệu (.md)
          </button>
          <a className="btn primary sm" href={`#${lesson?.path}?tab=lab`}>
            Thực hành ngay <Icon name="arrow" size={14} />
          </a>
        </div>
      </header>

      <div className={`theory-grid${heads.length > 1 ? '' : ' no-toc'}`}>
        {heads.length > 1 && (
          <nav className="theory-toc" aria-label="Mục lục">
            <p className="toc-label">Nội dung</p>
            <ol>
              {tocHeads.map((h, i) => (
                <li key={h.id}>
                  <button id={`toc-${lessonId}-${i}`} type="button" aria-current={active === h.id ? 'true' : undefined} className={active === h.id ? 'on' : ''} onClick={() => jump(h.id)}>
                    <span className="toc-n">{String(i + 1).padStart(2, '0')}</span>
                    <span className="toc-t">{h.text}</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        )}
        <div className="theory-body" ref={body}>
          <section className="theory-core" aria-label="Kiến thức cơ bản">{core.map(renderBlock)}</section>
          {advanced.length > 0 && <details id={`theory-advanced-${lessonId}`} className="optional-theory"><summary>Đọc thêm: công thức và lý thuyết chuyên sâu</summary>{advanced.map(renderBlock)}</details>}
        </div>
      </div>
    </article><p className="optional-note">Python là phần tùy chọn: đọc ý chính và thử mô phỏng trước, rồi chạy notebook khi muốn khám phá thêm.</p><PythonPractice lessonId={lessonId} /></>
  );
}
