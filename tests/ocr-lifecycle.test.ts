import { afterEach, expect, it, vi } from 'vitest';
import { ocrFile } from '../src/core/rag/ocr';
const engine = vi.hoisted(() => ({ createWorker: vi.fn() }));
const pdf = vi.hoisted(() => ({ getDocument: vi.fn(), GlobalWorkerOptions: { workerSrc: '' } }));
vi.mock('tesseract.js', () => engine);
vi.mock('pdfjs-dist', () => pdf);
afterEach(() => { vi.resetAllMocks(); vi.unstubAllGlobals(); });
it('does not initialize OCR if cancelled before starting', async () => {
  const controller = new AbortController(); controller.abort();
  await expect(ocrFile(new File(['image'], 'test.png'), () => {}, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
  expect(engine.createWorker).not.toHaveBeenCalled();
});
it('terminates a worker that finishes initializing after cancellation', async () => {
  const worker = { recognize: vi.fn(), terminate: vi.fn().mockResolvedValue(undefined) };
  let ready!: (worker: unknown) => void;
  engine.createWorker.mockImplementation(() => new Promise(resolve => { ready = resolve; }));
  const controller = new AbortController();
  const pending = ocrFile(new File(['image'], 'test.png'), () => {}, controller.signal);
  await vi.waitFor(() => expect(engine.createWorker).toHaveBeenCalledOnce());
  controller.abort(); ready(worker);
  await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  expect(worker.recognize).not.toHaveBeenCalled(); expect(worker.terminate).toHaveBeenCalledOnce();
});
it('terminates OCR after success or recognition failure', async () => {
  const worker = { recognize: vi.fn().mockResolvedValueOnce({ data: { text: '  teaching  ', confidence: 90 } }).mockRejectedValueOnce(new Error('OCR failure')), terminate: vi.fn().mockResolvedValue(undefined) };
  engine.createWorker.mockResolvedValue(worker);
  expect(await ocrFile(new File(['image'], 'test.png'), () => {}, new AbortController().signal)).toEqual({ text: 'teaching', paged: false, confidence: 90 });
  await expect(ocrFile(new File(['image'], 'test.png'), () => {}, new AbortController().signal)).rejects.toThrow('OCR failure');
  expect(worker.terminate).toHaveBeenCalledTimes(2);
});
it('releases each PDF canvas before recognizing the next page and destroys both workers', async () => {
  const canvases: { width: number; height: number }[] = [];
  vi.stubGlobal('document', { createElement: () => { const canvas = { width: 0, height: 0 }; canvases.push(canvas); return canvas; } });
  const destroy = vi.fn().mockResolvedValue(undefined);
  pdf.getDocument.mockReturnValue({ destroy, promise: Promise.resolve({ numPages: 2, getPage: async () => ({ getViewport: () => ({ width: 100, height: 200 }), render: () => ({ promise: Promise.resolve() }) }) }) });
  const worker = { terminate: vi.fn().mockResolvedValue(undefined), recognize: vi.fn().mockImplementation(async () => {
    if (canvases.length > 1) expect(canvases[0].width).toBe(0);
    return { data: { text: 'page', confidence: 80 } };
  }) };
  engine.createWorker.mockResolvedValue(worker);
  expect(await ocrFile(new File(['pdf'], 'test.pdf'), () => {}, new AbortController().signal)).toEqual({ text: 'page\fpage', paged: true, confidence: 80 });
  expect(canvases).toEqual([{ width: 0, height: 0 }, { width: 0, height: 0 }]);
  expect(destroy).toHaveBeenCalledOnce(); expect(worker.terminate).toHaveBeenCalledOnce();
});
