/** Hiển thị đầu ra AI như văn bản thuần: không bao giờ chèn HTML, không tải ảnh/link ngoài. */
export function toPlain(text: string): string {
  return text.replace(/\u0000/g, '');
}
