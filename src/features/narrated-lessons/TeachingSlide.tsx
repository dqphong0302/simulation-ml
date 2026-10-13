import { LessonVisual } from '../../app/LessonVisual';
import { LESSONS } from '../../lessons';
import { SlideFigure } from './SlideFigures';

export interface TeachingPreset { title: string; bullets: string[]; icon?: string }
export function TeachingSlide({ preset, lessonId, index, onPractice }: {
  preset: TeachingPreset; lessonId: string; index: number; onPractice?: () => void;
}) {
  return <article className="slide" aria-label={preset.title}>
    <div className="lecture-illustration">{SlideFigure({ title: preset.title }) ?? <LessonVisual
      group={LESSONS.find(l => l.id === lessonId)?.group ?? 'foundation'}
      lessonId={lessonId} label={`Slide ${index + 1} · Minh họa nguyên lý`} />}</div>
    <span className="slide-no" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
    <div className="slide-body">
      <h2>{preset.title}</h2>
      <ul>{preset.bullets.map((b, i) => <li key={b} style={{ animationDelay: `${0.15 + i * 0.12}s` }}>{b}</li>)}</ul>
      {onPractice && <button className="btn ghost" onClick={onPractice}>Sang phần thực hành →</button>}
    </div>
  </article>;
}
