import type { LessonMeta } from '../lessons';

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

/** Match Vietnamese with or without accents, including each word in the query. */
export function matchesLesson(lesson: Pick<LessonMeta, 'title' | 'goal'>, query: string): boolean {
  const text = normalize(`${lesson.title} ${lesson.goal}`);
  return normalize(query).trim().split(/\s+/).every(word => text.includes(word));
}
