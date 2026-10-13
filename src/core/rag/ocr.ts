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

async function pdfPagesToCanvas(file: File, scale: number, maxPages: number): Promise<HTMLCanvasElement[]> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), enableXfa: false }).promise;
  if (pdf.numPages > maxPages) throw new Error(`PDF có ${pdf.numPages} trang; OCR trên máy giới hạn ${maxPages} trang.`);
  const out: HTMLCanvasElement[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const vp = page.getViewport({ scale });
    const c = document.createElement('canvas');
    c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
    // intent 'print' không phụ thuộc requestAnimationFrame, nên vẫn chạy khi người học chuyển sang tab khác.
    await page.render({ canvas: c, viewport: vp, intent: 'print' }).promise;
    out.push(c);
  }
  void pdf.cleanup();
  return out;
}

/** Nhận dạng chữ từ PDF scan hoặc ảnh; trả văn bản, các trang ngăn bởi \f (giữ số trang cho dẫn nguồn). */
export async function ocrFile(file: File, onProgress: (p: OcrProgress) => void, signal: AbortSignal): Promise<{ text: string; paged: boolean; confidence: number }> {
  const isPdf = /\.pdf$/i.test(file.name);
  if (!isPdf && file.size > OCR_LIMITS.imageBytes) throw new Error('Ảnh quá lớn cho OCR (tối đa 15 MB).');
  const images: (HTMLCanvasElement | File)[] = isPdf ? await pdfPagesToCanvas(file, 2, OCR_LIMITS.pages) : [file];
  let page = 0;
  const worker = await makeWorker((p, s) => onProgress({ page: page + 1, pages: images.length, pct: p, status: s }));
  const abort = () => { void worker.terminate(); };
  signal.addEventListener('abort', abort);
  try {
    const texts: string[] = [];
    let conf = 0;
    for (page = 0; page < images.length; page++) {
      if (signal.aborted) throw new DOMException('Đã hủy', 'AbortError');
      const r = await worker.recognize(images[page]);
      texts.push(r.data.text.trim());
      conf += r.data.confidence;
    }
    return { text: texts.join('\f'), paged: isPdf, confidence: conf / Math.max(1, images.length) };
  } finally {
    signal.removeEventListener('abort', abort);
    images.forEach((c) => { if (c instanceof HTMLCanvasElement) { c.width = 0; c.height = 0; } }); // giải phóng bộ nhớ
    if (!signal.aborted) await worker.terminate();
  }
}
