export interface ReadResult { text: string; paged: boolean; note?: string }

/** Lỗi riêng: tệp cần OCR (PDF scan hoặc ảnh). */
export class NeedsOcr extends Error { constructor(message: string) { super(message); this.name = 'NeedsOcr'; } }

export const LIMITS = { fileBytes: 10_000_000, textChars: 2_000_000, pdfPages: 150, docxXmlBytes: 20_000_000 };

/** CSV → mỗi dòng thành một câu "cột: giá trị; …" để tìm kiếm được. */
export function csvToText(csv: string): string {
  const lines = csv.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return csv;
  const head = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((l, i) => `Dòng ${i + 1}: ` + l.split(',').map((c, j) => `${head[j] ?? `cột ${j + 1}`}: ${c.trim()}`).join('; ')).join('\n\n');
}

/** Lấy văn bản thô từ word/document.xml: mỗi <w:p> một đoạn. Không suy ra số trang. */
export function docxXmlToText(xml: string): string {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('XML trong DOCX không hợp lệ.');
  const paras: string[] = [];
  Array.from(doc.getElementsByTagNameNS('*', 'p')).forEach((p) => {
    let t = '';
    Array.from(p.querySelectorAll('*')).forEach((n) => {
      if (n.localName === 't') t += n.textContent ?? '';
      else if (n.localName === 'tab') t += '\t';
      else if (n.localName === 'br') t += '\n';
    });
    if (t.trim()) paras.push(t.trim());
  });
  return paras.join('\n\n');
}

export async function readFileText(f: File): Promise<ReadResult> {
  if (f.size > LIMITS.fileBytes) throw new Error(`Tệp quá lớn (tối đa ${LIMITS.fileBytes / 1e6} MB).`);
  const name = f.name.toLowerCase();
  let r: ReadResult;
  if (/\.(txt|md|markdown)$/.test(name)) r = { text: await f.text(), paged: false };
  else if (name.endsWith('.csv')) r = { text: csvToText(await f.text()), paged: false, note: 'Mỗi dòng CSV được chuyển thành một đoạn văn bản.' };
  else if (name.endsWith('.docx')) {
    const { default: JSZip } = await import('jszip');
    const zip = await JSZip.loadAsync(await f.arrayBuffer());
    const entry = zip.file('word/document.xml');
    if (!entry) throw new Error('Không tìm thấy nội dung trong DOCX.');
    const xml = await entry.async('string');
    if (xml.length > LIMITS.docxXmlBytes) throw new Error('Nội dung DOCX sau giải nén quá lớn.');
    r = { text: docxXmlToText(xml), paged: false, note: 'DOCX không có số trang đáng tin cậy nên mã nguồn chỉ có mã đoạn.' };
  } else if (name.endsWith('.pdf')) {
    const pdfjs = await import('pdfjs-dist');
    const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
    pdfjs.GlobalWorkerOptions.workerSrc = worker;
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(await f.arrayBuffer()), enableXfa: false }).promise;
    if (pdf.numPages > LIMITS.pdfPages) throw new Error(`PDF quá dài (${pdf.numPages} trang, tối đa ${LIMITS.pdfPages}).`);
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const c = await (await pdf.getPage(i)).getTextContent();
      pages.push(c.items.map((it) => ('str' in it ? it.str : '')).join(' ').replace(/\s+/g, ' ').trim());
    }
    void pdf.cleanup();
    r = { text: pages.join('\f'), paged: true, note: 'Đã đọc lớp văn bản của PDF.' };
    if (!pages.some((p) => p.length > 20)) throw new NeedsOcr('PDF gần như không có lớp văn bản (có thể là bản scan). Bạn có thể chạy OCR trên máy.');
  } else if (/\.(png|jpe?g|webp|bmp)$/.test(name)) throw new NeedsOcr('Đây là ảnh; cần OCR để lấy chữ.');
  else throw new Error('Định dạng chưa hỗ trợ (dùng TXT, Markdown, CSV, DOCX, PDF hoặc ảnh).');
  if (r.text.length > LIMITS.textChars) throw new Error('Văn bản sau khi đọc quá dài (tối đa 2 triệu ký tự).');
  if (!r.text.trim()) throw new Error('Không đọc được văn bản.');
  return r;
}
