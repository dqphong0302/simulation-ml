import { useEffect, useState } from 'react';
import { LESSONS } from '../lessons';
import { PATH } from './model';
export interface StudyRecord { score?: number; done?: boolean; journal?: string[] }
export type LearningProgress = Record<string, StudyRecord>;
const KEY = 'sml.learning.v1';
const EVENT = 'sml-learning-change';
const validIds = new Set([...LESSONS.map(l => l.id), ...PATH.map(s => s.id)]);
export function parseProgress(raw: string | null): LearningProgress {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const output: LearningProgress = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (!validIds.has(id) || !value || typeof value !== 'object') continue;
      const item = value as StudyRecord;
      const score = Number.isInteger(item.score) && item.score! >= 0 && item.score! <= 3 ? item.score : undefined;
      const journal = Array.isArray(item.journal) ? Array.from({ length: 4 }, (_, i) => typeof item.journal![i] === 'string' ? item.journal![i].slice(0, 4000) : '') : undefined;
      output[id] = { score, journal, done: item.done === true && (score ?? 0) >= 2 && !!journal?.every(s => s.trim().length > 0) };
    }
    return output;
  } catch { return {}; }
}
const read = () => { try { return parseProgress(localStorage.getItem(KEY)); } catch { return {}; } };
export function useLearningProgress() {
  const [progress, setProgress] = useState<LearningProgress>(read);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    const onChange = () => setProgress(read());
    const onStorage = (e: StorageEvent) => { if (e.key === KEY || e.key === null) onChange(); };
    window.addEventListener(EVENT, onChange);
    window.addEventListener('storage', onStorage);
    return () => { window.removeEventListener(EVENT, onChange); window.removeEventListener('storage', onStorage); };
  }, []);
  const save = (id: string, patch: StudyRecord) => {
    if (!validIds.has(id)) return false;
    const latest = read();
    const next = parseProgress(JSON.stringify({ ...latest, [id]: { ...latest[id], ...patch } }));
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      setProgress(next); setStorageError(false);
      window.dispatchEvent(new Event(EVENT));
      return true;
    } catch { setStorageError(true); return false; }
  };
  return { progress, save, storageError };
}
