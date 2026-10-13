import type { ChartSpec } from '../types';

const COLORS = ['#2563eb', '#ea580c', '#059669', '#9333ea'];
const MARKS = ['circle', 'square', 'triangle', 'diamond'];
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** Biểu đồ đường có tiêu đề, trục, đơn vị và chú giải; dùng cho cả xem trước lẫn PNG trong báo cáo. */
export function chartToSvg(spec: ChartSpec, w = 720, h = 420): string {
  const m = { l: 64, r: 20, t: 44, b: 56 };
  const all = spec.series.flatMap((s) => s.points);
  if (all.length === 0) return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"></svg>`;
  let x0 = Math.min(...all.map((p) => p[0])), x1 = Math.max(...all.map((p) => p[0]));
  let y0 = Math.min(...all.map((p) => p[1])), y1 = Math.max(...all.map((p) => p[1]));
  if (x0 === x1) { x0 -= 1; x1 += 1; }
  const pad = (y1 - y0 || 1) * 0.1;
  const unit = y0 >= 0 && y1 <= 1; // tỷ lệ/xác suất: không vẽ trục ra ngoài [0, 1]
  y0 -= pad; y1 += pad;
  if (unit) { y0 = Math.max(0, y0); y1 = Math.min(1, y1); }
  const X = (v: number) => m.l + ((v - x0) / (x1 - x0)) * (w - m.l - m.r);
  const Y = (v: number) => h - m.b - ((v - y0) / (y1 - y0)) * (h - m.t - m.b);
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="Inter, Segoe UI, Arial, sans-serif">`,
    `<rect width="${w}" height="${h}" fill="#fff"/>`,
    `<text x="${w / 2}" y="24" text-anchor="middle" font-size="15" font-weight="600" fill="#111827">${esc(spec.title)}</text>`,
  ];
  for (let i = 0; i <= 4; i++) {
    const yv = y0 + ((y1 - y0) * i) / 4;
    parts.push(`<line x1="${m.l}" x2="${w - m.r}" y1="${Y(yv)}" y2="${Y(yv)}" stroke="#eceef2"/>`,
      `<text x="${m.l - 8}" y="${Y(yv) + 4}" text-anchor="end" font-size="11">${yv.toFixed(2)}</text>`);
  }
  const xs = Array.from(new Set(all.map((p) => p[0]))).sort((a, b) => a - b);
  const xTicks = xs.length <= 10 ? xs : [0, 1, 2, 3, 4].map((i) => x0 + ((x1 - x0) * i) / 4);
  xTicks.forEach((xv) => parts.push(
    `<line x1="${X(xv)}" x2="${X(xv)}" y1="${h - m.b}" y2="${h - m.b + 4}" stroke="#333"/>`,
    `<text x="${X(xv)}" y="${h - m.b + 18}" text-anchor="middle" font-size="11">${Number.isInteger(xv) ? xv : xv.toFixed(2)}</text>`));
  parts.push(`<line x1="${m.l}" x2="${m.l}" y1="${m.t}" y2="${h - m.b}" stroke="#333"/>`,
    `<line x1="${m.l}" x2="${w - m.r}" y1="${h - m.b}" y2="${h - m.b}" stroke="#333"/>`,
    `<text x="${(m.l + w - m.r) / 2}" y="${h - 22}" text-anchor="middle" font-size="12">${esc(spec.xLabel)}</text>`,
    `<text transform="translate(16 ${(m.t + h - m.b) / 2}) rotate(-90)" text-anchor="middle" font-size="12">${esc(spec.yLabel)}</text>`);
  spec.series.forEach((s, i) => {
    const c = COLORS[i % COLORS.length];
    const dash = i % 2 ? ' stroke-dasharray="6 3"' : '';
    parts.push(`<polyline fill="none" stroke="${c}" stroke-width="2"${dash} points="${s.points.map((p) => `${X(p[0])},${Y(p[1])}`).join(' ')}"/>`);
    s.points.forEach((p) => {
      const cx = X(p[0]), cy = Y(p[1]);
      const mk = MARKS[i % MARKS.length];
      parts.push(mk === 'circle' ? `<circle cx="${cx}" cy="${cy}" r="4" fill="${c}"/>`
        : mk === 'square' ? `<rect x="${cx - 4}" y="${cy - 4}" width="8" height="8" fill="${c}"/>`
        : mk === 'triangle' ? `<polygon points="${cx},${cy - 5} ${cx - 5},${cy + 4} ${cx + 5},${cy + 4}" fill="${c}"/>`
        : `<polygon points="${cx},${cy - 5} ${cx + 5},${cy} ${cx},${cy + 5} ${cx - 5},${cy}" fill="${c}"/>`);
    });
    const lx = m.l + 10 + i * 170;
    parts.push(`<line x1="${lx}" x2="${lx + 24}" y1="${m.t + 8}" y2="${m.t + 8}" stroke="${c}" stroke-width="2"${dash}/>`,
      `<text x="${lx + 30}" y="${m.t + 12}" font-size="12">${esc(s.name)}</text>`);
  });
  parts.push('</svg>');
  return parts.join('');
}
