/// <reference lib="webworker" />
import { runCompare, type CompareEntry, type CompareInput } from '../core/algorithms/compare';

export type CompareOut = { id: number; entries: CompareEntry[] } | { id: number; error: string };

self.onmessage = (e: MessageEvent<CompareInput & { id: number }>) => {
  const { id, ...input } = e.data;
  try { (self as unknown as Worker).postMessage({ id, entries: runCompare(input) } satisfies CompareOut); }
  catch (err) { (self as unknown as Worker).postMessage({ id, error: (err as Error).message } satisfies CompareOut); }
};
