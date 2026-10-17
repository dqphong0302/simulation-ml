import { expect, it } from 'vitest';
import { checkPortableSize, portableJson, PORTABLE_JSON_BYTES } from '../src/core/reporting/portableJson';
import { mergeSession } from '../src/teaching/mergeSession';
import { makeSession } from '../src/teaching/session';
it('counts UTF-8 bytes, not JavaScript string length', () => {
  const raw = JSON.stringify({ text: 'ế'.repeat(400_000) });
  expect(raw.length).toBeLessThan(PORTABLE_JSON_BYTES);
  expect(() => checkPortableSize(raw)).toThrow(/1 MB/);
  expect(() => portableJson({ text: 'ế'.repeat(400_000) })).toThrow();
});
it('falls back to compact JSON when indentation alone would exceed the import limit', () => {
  const value = Array.from({ length: 60_000 }, () => ({ a: 'ế' }));
  const output = portableJson(value);
  expect(new TextEncoder().encode(output).byteLength).toBeLessThanOrEqual(PORTABLE_JSON_BYTES);
  expect(() => checkPortableSize(output)).not.toThrow();
  expect(JSON.parse(output)).toEqual(value);
});
it('rejects a stale or removed saved plan without mutating the latest data', () => {
  const plan = makeSession('data', 'one'), baseline = JSON.stringify(plan);
  const latest = [{ ...plan, title: 'Updated in another tab' }];
  expect(() => mergeSession(latest, { ...plan, title: 'My edit' }, baseline)).toThrow(/tab khác/);
  expect(latest[0].title).toBe('Updated in another tab');
  expect(() => mergeSession([], plan, baseline)).toThrow();
  expect(mergeSession([plan], { ...plan, title: 'Safe edit' }, baseline)[0].title).toBe('Safe edit');
});
