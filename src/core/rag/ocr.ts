/**
 * OCR chạy hoàn toàn trong trình duyệt bằng tesseract.js; thư viện và dữ liệu tiếng Việt/Anh được đóng gói trong /ocr,
 * không tải gì từ CDN. Chất lượng phụ thuộc độ nét ảnh; kết quả phải được người học xem lại.
 */
export const OCR_LIMITS = { pages: 30, imageBytes: 15_000_000 };

export interface OcrProgress { page: number; pages: number; pct: number; status: string }

async function makeWorker(onLog: (p: number, s: string) => void) {
  const mod = await import('tesseract.js');
  // tesseract.js là gói CommonJS: tùy bundler, hàm nằm ở export tên hoặc ở default.
  const createWorker = mod.createWorker ?? (mod as unknown as { default: typeof mod }).default.createWorker;
  return createWorker(['vie', 'eng'], 1, {
    workerPath: '/ocr/worker.min.js',
    corePath: '/ocr/core',
    langPath: '/ocr/lang',
    gzip: true,
    workerBlobURL: false,
    logger: (m: { progress: number; status: string }) => onLog(m.progress ?? 0, m.status ?? ''),
  });
}

/** Render/recognize one page at a time; never retain all full-size page canvases. */
async function* imagesFromFile(file: File, signal: AbortSignal) {
  signal.throwIfAborted();
  if (!/\.pdf$/i.test(file.name)) { yield { image: file, page: 1, pages: 1 }; return; }
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  signal.throwIfAborted();
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), enableXfa: false });
  const abort = () => { void task.destroy().catch(() => {}); };
  signal.addEventListener('abort', abort, { once: true });
  try {
    signal.throwIfAborted();
    const pdf = await task.promise;
    if (pdf.numPages > OCR_LIMITS.pages) throw new Error(`PDF có ${pdf.numPages} trang; OCR trên máy giới hạn ${OCR_LIMITS.pages} trang.`);
    for (let i = 1; i <= pdf.numPages; i++) {
      signal.throwIfAborted();
      const page = await pdf.getPage(i);
      const vp = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(vp.width); canvas.height = Math.ceil(vp.height);
      try {
        // 'print' also works when the browser tab is not visible.
        await page.render({ canvas, viewport: vp, intent: 'print' }).promise;
        signal.throwIfAborted();
        yield { image: canvas, page: i, pages: pdf.numPages };
      } finally { canvas.width = 0; canvas.height = 0; }
    }
  } finally {
    signal.removeEventListener('abort', abort);
    await task.destroy();
  }
}

/** Nhận dạng chữ từ PDF scan hoặc ảnh; trả văn bản, các trang ngăn bởi \f (giữ số trang cho dẫn nguồn). */
export async function ocrFile(file: File, onProgress: (p: OcrProgress) => void, signal: AbortSignal): Promise<{ text: string; paged: boolean; confidence: number }> {
  signal.throwIfAborted();
  const isPdf = /\.pdf$/i.test(file.name);
  if (!isPdf && file.size > OCR_LIMITS.imageBytes) throw new Error('Ảnh quá lớn cho OCR (tối đa 15 MB).');
  let page = 0, pages = 0;
  let worker: Awaited<ReturnType<typeof makeWorker>> | null = null;
  let termination: Promise<unknown> | undefined;
  const terminate = () => termination ??= worker ? worker.terminate() : Promise.resolve();
  const abort = () => { void terminate().catch(() => {}); };
  try {
    const texts: string[] = [];
    let conf = 0;
    for await (const item of imagesFromFile(file, signal)) {
      page = item.page; pages = item.pages;
      if (!worker) {
        worker = await makeWorker((p, s) => onProgress({ page, pages, pct: p, status: s }));
        signal.addEventListener('abort', abort, { once: true });
      }
      // Covers cancellation while the worker was still being initialized.
      signal.throwIfAborted();
      const r = await worker.recognize(item.image);
      signal.throwIfAborted();
      texts.push(r.data.text.trim());
      conf += r.data.confidence;
    }
    return { text: texts.join('\f'), paged: isPdf, confidence: conf / Math.max(1, pages) };
  } finally {
    signal.removeEventListener('abort', abort);
    await terminate().catch(() => {});
  }
}
