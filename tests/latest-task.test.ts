import { expect, it } from 'vitest';
import { latestTask } from '../src/core/async/latestTask';
it('aborts the superseded request and rejects stale results', () => {
  const task = latestTask();
  const first = task.start(); expect(task.isCurrent(first)).toBe(true);
  const next = task.start();
  expect(first.aborted).toBe(true); expect(task.isCurrent(first)).toBe(false);
  expect(task.isCurrent(next)).toBe(true);
  task.cancel(); expect(next.aborted).toBe(true); expect(task.isCurrent(next)).toBe(false);
  const last = task.start(); expect(task.isCurrent(last)).toBe(true);
});
