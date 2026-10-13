import { inspectColumns, guessTarget, toNumber, zeroGap, type ColumnInfo, type FreeTable } from './freecsv';
import type { RawTable } from './csv';
import type { Label } from '../algorithms/dataset';

/**
 * CSV người dùng tải riêng cho một bài (các bài nhị phân KNN, Tree, Logistic…).
 * Nhãn 2 lớp: "lớp dương" so với phần còn lại.
 */
export interface CustomCsv {
  name: string; table: FreeTable; cols: ColumnInfo[];
  target: string; positive: string; features: string[];
}

/** Cột có thể làm nhãn: 2–30 giá trị khác nhau. */
export const labelCandidates = (cols: ColumnInfo[]) => cols.filter((c) => c.unique >= 2 && c.unique <= 30);
const numericFeatures = (s: { cols: ColumnInfo[]; target: string }) => s.cols.filter((c) => c.kind === 'numeric' && c.name !== s.target).map((c) => c.name);
/** Lớp dương mặc định: giá trị lớn hơn nếu là 0/1, ngược lại lớp ít mẫu nhất. */
function defaultPositive(table: FreeTable, cols: ColumnInfo[], target: string): string {
  const c = cols.find((x) => x.name === target);
  if (!c) return '';
  if (c.kind === 'numeric' && c.unique === 2) return c.levels[1];
  const j = table.names.indexOf(target), freq = new Map<string, number>();
  table.cells.forEach((r) => freq.set(r[j], (freq.get(r[j]) ?? 0) + 1));
  return c.levels.slice().sort((a, b) => (freq.get(a) ?? 0) - (freq.get(b) ?? 0))[0];
}

export function makeCustomCsv(name: string, table: FreeTable, requireLabel = true): CustomCsv {
  const cols = inspectColumns(table);
  if (!requireLabel) {
    const base = { name, table, cols, target: '', positive: '', features: cols.filter(c => c.kind === 'numeric').map(c => c.name) };
    if (base.features.length < 2) throw new Error('Bài này cần ít nhất 2 cột số; không cần cột nhãn.');
    return base;
  }
  const cands = labelCandidates(cols);
  if (!cands.length) throw new Error('Không có cột nào dùng làm nhãn được (cần cột có 2–30 giá trị khác nhau).');
  const g = guessTarget(cols);
  const target = cands.some((c) => c.name === g) ? g : cands[cands.length - 1].name;
  const base = { name, table, cols, target, positive: defaultPositive(table, cols, target), features: [] as string[] };
  base.features = numericFeatures(base);
  if (base.features.length < 2) throw new Error('Các bài này cần ít nhất 2 cột số ngoài cột nhãn.');
  return base;
}

export function patchCustomCsv(cur: CustomCsv, patch: Partial<Pick<CustomCsv, 'target' | 'positive' | 'features'>>): CustomCsv {
  const next = { ...cur, ...patch };
  if (patch.target && patch.target !== cur.target) { next.positive = defaultPositive(cur.table, cur.cols, patch.target); next.features = numericFeatures(next); }
  return next;
}

/** Bảng số + nhãn 0/1 (lớp dương = 1) cho các bài nhị phân. Bỏ dòng thiếu nhãn. Ô thiếu → NaN. */
export function toBinaryRaw(s: CustomCsv): { raw: RawTable; zeroCols: string[]; dropped: number } {
  const ti = s.table.names.indexOf(s.target);
  const names = numericFeatures(s);
  const idx = names.map((n) => s.table.names.indexOf(n));
  const rows: number[][] = [], y: Label[] = [];
  let dropped = 0;
  const tCol = s.cols[ti];
  for (const r of s.table.cells) {
    if (!s.target) { rows.push(idx.map(j => toNumber(r[j], s.table.delimiter))); y.push(0); continue; }
    const t = r[ti];
    if (t === '' || /^(null|na|nan|n\/a|none|\?)$/i.test(t)) { dropped++; continue; }
    const isPos = tCol?.kind === 'numeric' ? toNumber(t, s.table.delimiter) === toNumber(s.positive, s.table.delimiter) : t === s.positive;
    rows.push(idx.map((j) => toNumber(r[j], s.table.delimiter)));
    y.push(isPos ? 1 : 0);
  }
  const zeroCols = names.filter((_, k) => zeroGap(rows.map((r) => r[k])) !== null);
  return { raw: { names, rows, y }, zeroCols, dropped };
}
