import { expect, it, vi } from 'vitest';
import { parseLabelledCsv } from '../src/core/datasets/csv';
import { csvToText, readFileText } from '../src/core/rag/readers';

const pdf = vi.hoisted(() => ({ getDocument: vi.fn(), GlobalWorkerOptions: { workerSrc: '' } }));
vi.mock('pdfjs-dist', () => pdf);
it('uses shared quote-aware CSV parsing for RAG, preserving multiline cells and delimiters', () => {
  expect(csvToText('name,note\nA,"one, two\nthree"')).toBe('Dòng 1: name: A; note: one, two\nthree');
  expect(csvToText('name;note\nA;"one; two"')).toBe('Dòng 1: name: A; note: one; two');
  expect(() => csvToText('a,b\n1,2,3')).toThrow();
});
it('accepts quoted numeric cells but never silently turns an empty label into 0', () => {
  expect(parseLabelledCsv('"x",y\n"2",1', 'y').rows).toEqual([[2]]);
  expect(() => parseLabelledCsv('x,y\n2,', 'y')).toThrow();
});
it.each(['success', 'too-many-pages', 'page-error', 'scan'])('destroys PDF worker on %s', async mode => {
  const destroy = vi.fn().mockResolvedValue(undefined);
  const getPage = vi.fn().mockImplementation(async () => {
    if (mode === 'page-error') throw new Error('Page error');
    return { getTextContent: async () => ({ items: [{ str: mode === 'scan' ? '' : 'This synthetic teaching document contains readable words.' }] }) };
  });
  pdf.getDocument.mockReturnValue({ destroy, promise: Promise.resolve({ numPages: mode === 'too-many-pages' ? 151 : 1, getPage }) });
  const pending = readFileText(new File(['test'], 'test.pdf'));
  if (mode === 'success') await expect(pending).resolves.toMatchObject({ paged: true });
  else await expect(pending).rejects.toThrow();
  expect(destroy).toHaveBeenCalledOnce();
});
