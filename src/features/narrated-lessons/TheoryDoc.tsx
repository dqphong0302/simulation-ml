import { Fragment, useMemo, type ReactNode } from 'react';
import { THEORY, parseTheory } from '../../lessons/theory';
import { download } from '../../core/reporting/files';

/** **đậm** trong một dòng chữ (không dùng HTML thô). */
function inline(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>);
}

/** Tài liệu lý thuyết đầy đủ bằng chữ của một bài, đặt dưới bài giảng. */
export function TheoryDoc({ lessonId, title }: { lessonId: string; title: string }) {
  const src = THEORY[lessonId];
  const blocks = useMemo(() => (src ? parseTheory(src) : []), [src]);
  if (!src) return null;
  const heads = blocks.filter((b): b is Extract<typeof b, { t: 'h' }> => b.t === 'h');
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return (
    <article className="theory" aria-labelledby={`theory-${lessonId}`}>
      <header className="theory-head">
        <div>
          <p className="eyebrow">Tài liệu lý thuyết</p>
          <h2 id={`theory-${lessonId}`}>{title}</h2>
        </div>
        <button className="btn sm" onClick={() => download(new Blob([`# ${title}\n${src}`], { type: 'text/markdown;charset=utf-8' }), `ly-thuyet-${lessonId.toLowerCase()}.md`)}>⬇ Tải tài liệu (.md)</button>
      </header>
      {heads.length > 2 && <nav className="theory-toc" aria-label="Mục lục">
        {heads.map((h, i) => <button key={h.id} onClick={() => jump(h.id)}><span>{i + 1}</span>{h.text}</button>)}
      </nav>}
      <div className="theory-body">
        {blocks.map((b, i) => {
          switch (b.t) {
            case 'h': return <h3 key={i} id={b.id}>{b.text}</h3>;
            case 'p': return <p key={i}>{inline(b.text)}</p>;
            case 'ul': return <ul key={i}>{b.items.map((x, j) => <li key={j}>{inline(x)}</li>)}</ul>;
            case 'ol': return <ol key={i}>{b.items.map((x, j) => <li key={j}>{inline(x)}</li>)}</ol>;
            case 'f': return <div key={i} className="formula" role="math" aria-label={b.text}>{b.text}</div>;
            case 'note': return <aside key={i} className="theory-note">{inline(b.text)}</aside>;
          }
        })}
      </div>
    </article>
  );
}
