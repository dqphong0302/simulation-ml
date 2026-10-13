import { useSyncExternalStore } from 'react';
import type { FreeTable } from './freecsv';

export interface SessionData {
  id: number;
  name: string;
  table: FreeTable;
  originalRows: number;
  sheet?: string;
  sampled: boolean;
}
let current: SessionData | null = null;
let revision = 0;
const listeners = new Set<() => void>();
export function setSessionData(data: Omit<SessionData, 'id'> | null) {
  current = data ? { ...data, id: ++revision } : null;
  listeners.forEach(fn => fn());
}
export function getSessionData() { return current; }
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export function useSessionData() { return useSyncExternalStore(subscribe, getSessionData); }
