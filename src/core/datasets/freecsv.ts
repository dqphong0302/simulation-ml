import { describe as stats } from '../algorithms/dataset';

/** Bảng CSV bất kỳ: giữ nguyên chuỗi, kiểu cột được suy ra sau. */
export interface FreeTable { names: string[]; cells: string[][]; delimiter: string }
export type ColumnKind = 'numeric' | 'categorical';
export interface ColumnInfo { name: string; kind: ColumnKind; missing: number; unique: number; levels: string[] }

export { EXPLORE_ROWS as MAX_ROWS } from './importData';
const isBlank = (c: string) => c === '' || /^(null|na|nan|n\/a|none|\?)$/i.test(c);
/** Chấp nhận dấu phẩy thập phân kiểu Việt Nam khi dấu phân cách không phải dấu phẩy ("3,5" → 3.5). */
export const toNumber = (c: string, delimiter = ','): number => {
  const s = c.trim();
  if (isBlank(s)) return NaN;
  const v = Number(delimiter !== ',' && /^-?\d+,\d+$/.test(s) ? s.replace(',', '.') : s);
  return Number.isFinite(v) ? v : NaN;
};

export { detectDelimiter as sniffDelimiter, parseCsvText as parseFreeCsv } from "./importData";

/** Cột là số khi ≥ 95% ô không rỗng đọc được thành số. */
export function inspectColumns(t: FreeTable): ColumnInfo[] {
  return t.names.map((name, j) => {
    const col = t.cells.map((r) => r[j]);
    const filled = col.filter((c) => !isBlank(c));
    const nums = filled.filter((c) => Number.isFinite(toNumber(c, t.delimiter)));
    const kind: ColumnKind = filled.length > 0 && nums.length / filled.length >= 0.95 ? 'numeric' : 'categorical';
    const levels = Array.from(new Set(filled)).sort((a, b) => (kind === 'numeric' ? toNumber(a, t.delimiter) - toNumber(b, t.delimiter) : a.localeCompare(b, 'vi')));
    return { name, kind, missing: col.length - filled.length, unique: levels.length, levels: levels.slice(0, 200) };
  });
}

/**
 * 0 nghi là mã "thiếu": không có số âm, giá trị dương nhỏ nhất cách 0 xa (≥ 10% median phần dương và > 5 lần khoảng cách điển hình giữa các giá trị)
 * và không phải biến đếm số nguyên (bắt đầu từ 1). Trả về giá trị dương nhỏ nhất, hoặc null.
 */
export function zeroGap(v: number[]): number | null {
  const ok = v.filter((x) => !Number.isNaN(x)).sort((a, b) => a - b);
  const pos = ok.filter((x) => x > 0);
  if (!ok.length || ok[0] < 0 || !pos.length || !ok.includes(0)) return null;
  if (ok.every(Number.isInteger) && pos[0] <= 1) return null;
  const u = Array.from(new Set(pos));
  const gap = u.length > 1 ? stats(u.slice(1).map((x, i) => x - u[i])).median ?? 0 : 0;
  return pos[0] >= 0.1 * (stats(pos).median ?? 0) && pos[0] > 5 * gap ? pos[0] : null;
}
/** Cột đích hợp lý nhất: tên quen thuộc, nếu không thì cột cuối. */
export function guessTarget(cols: ColumnInfo[]): string {
  // "y" hay là tọa độ (x, y, z) nên chỉ dùng khi không có tên rõ nghĩa hơn.
  const strong = /^(label|target|class|outcome|species|category|group|nhan|nhãn|loai|loại|lop|lớp|nhom|nhóm|kết quả|ket_qua|price|gia|giá)$/i;
  const n = (c: ColumnInfo) => c.name.trim();
  return (cols.find((c) => strong.test(n(c))) ?? (cols.some((c) => /^z$/i.test(n(c))) ? undefined : cols.find((c) => /^y$/i.test(n(c)))) ?? cols[cols.length - 1]).name;
}
