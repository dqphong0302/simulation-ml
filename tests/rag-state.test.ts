import { expect, it } from 'vitest';
import { documentReducer, MAX_DOCS, type DocumentState } from '../src/core/rag/documents';
import { cosine } from '../src/core/rag/rag';

it('serializes independent document completions and preserves existing text at capacity', () => {
  let state: DocumentState = { docs: [], message: null };
  for (let i = 0; i < MAX_DOCS; i++) state = documentReducer(state, { type: 'add', doc: { id: String(i), name: 'File', text: `Text ${i}` } });
  const before = state.docs;
  state = documentReducer(state, { type: 'add', doc: { id: 'extra', name: 'Extra', text: 'More' }, note: 'success' });
  expect(state.docs).toBe(before); expect(state.message).toContain('Tối đa');
  state = documentReducer(state, { type: 'remove', id: '0' });
  state = documentReducer(state, { type: 'add', doc: { id: 'extra', name: 'Extra', text: 'More' }, note: 'success' });
  expect(state.docs).toHaveLength(MAX_DOCS); expect(state.message).toBe('success');
});
it('does not add empty documents or lose them when updating messages', () => {
  const state: DocumentState = { docs: [{ id: 'a', name: 'A', text: 'A' }], message: null };
  expect(documentReducer(state, { type: 'add', doc: { id: 'b', name: 'B', text: ' ' } }).docs).toBe(state.docs);
  expect(documentReducer(state, { type: 'message', message: 'Reading' }).docs).toBe(state.docs);
});
it('refuses incomparable embedding spaces instead of returning NaN similarity', () => {
  expect(cosine([1, 0], [0, 1])).toBe(0);
  expect(cosine([1, 0], [1, 0])).toBe(1);
  expect(() => cosine([1, 0], [1])).toThrow();
  expect(() => cosine([NaN], [1])).toThrow();
});
