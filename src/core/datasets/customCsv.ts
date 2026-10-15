import { inspectColumns, guessTarget, isBlank, toNumber, zeroGap, type ColumnInfo, type FreeTable } from './freecsv';
import type { RawTable } from './csv';
import type { Label } from '../algorithms/dataset';

/**
 * CSV người dùng tải riêng cho một bài (các bài nhị phân KNN, Tree, Logistic…).
 * Nhãn 2 lớp: "lớp dương" so với phần còn lại.
 */
export interface CustomCsv {
  name: string; table: FreeTable; cols: ColumnInfo[];
  target: string; positive: string;
  /** Tên các biến mô hình đang dùng (xem featureSpecs): cột số giữ tên gốc, biến mã hóa có dạng "Cột = mức". */
  features: string[];
}

/** Một biến đưa vào mô hình: cột số đọc trực tiếp, hoặc cờ 0/1 cho một mức của cột phân loại. */
export interface FeatureSpec { name: string; column: string; level?: string }
/** Cột phân loại có tối đa từng này mức thì được mã hóa; nhiều hơn thì bỏ và báo lại. */
export const MAX_LEVELS = 12;
const YES = /^(có|co|yes|y|true|đúng|dung|dương tính|duong tinh|positive|pos|\+|x|nam|male|m)$/i;

/** Cột có thể làm nhãn: 2–30 giá trị khác nhau, không phải ID/ngày/văn bản. */
export const labelCandidates = (cols: ColumnInfo[]) => cols.filter((c) => c.role === 'feature' && c.unique >= 2 && c.unique <= 30);

/** Cách mã hóa một cột phân loại: mức nào thành cờ 0/1 (bỏ mức phổ biến nhất làm mức gốc). */
export function encodedLevels(table: FreeTable, c: ColumnInfo): { base: string; levels: string[] } | null {
  if (c.kind !== 'categorical' || c.role !== 'feature' || c.unique < 2 || c.unique > MAX_LEVELS) return null;
  const j = table.names.indexOf(c.name), freq = new Map<string, number>();
  table.cells.forEach((r) => { const v = (r[j] ?? '').trim(); if (!isBlank(v)) freq.set(v, (freq.get(v) ?? 0) + 1); });
  const byFreq = [...freq].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'vi')).map(([v]) => v);
  if (byFreq.length === 2) { // hai mức: mức kiểu "có/dương tính" là 1 cho dễ đọc
    const one = byFreq.find((v) => YES.test(v)) ?? byFreq[1];
    return { base: byFreq.find((v) => v !== one)!, levels: [one] };
  }
  return { base: byFreq[0], levels: byFreq.slice(1) };
}

/** Mọi biến có thể đưa vào mô hình (trừ cột nhãn): cột số trước (hai biến đầu là trục biểu đồ), rồi cờ 0/1 cho cột phân loại ít mức. */
export function featureSpecs(table: FreeTable, cols: ColumnInfo[], target: string): FeatureSpec[] {
  const usable = cols.filter((c) => c.name !== target && c.role === 'feature');
  return [
    ...usable.filter((c) => c.kind === 'numeric').map((c) => ({ name: c.name, column: c.name })),
    ...usable.filter((c) => c.kind === 'categorical').flatMap((c) => encodedLevels(table, c)?.levels.map((level) => ({ name: `${c.name} = ${level}`, column: c.name, level })) ?? []),
  ];
}
const allFeatures = (s: { table: FreeTable; cols: ColumnInfo[]; target: string }) => featureSpecs(s.table, s.cols, s.target).map((f) => f.name);

/** Lớp dương mặc định: giá trị lớn hơn nếu là 0/1, kiểu "có/dương tính" nếu có, ngược lại lớp ít mẫu nhất. */
function defaultPositive(table: FreeTable, cols: ColumnInfo[], target: string): string {
  const c = cols.find((x) => x.name === target);
  if (!c) return '';
  if (c.kind === 'numeric' && c.unique === 2) return c.levels[1];
  if (c.unique === 2) { const yes = c.levels.find((v) => YES.test(v) && !/^(nam|male|m)$/i.test(v)); if (yes) return yes; }
  const j = table.names.indexOf(target), freq = new Map<string, number>();
  table.cells.forEach((r) => freq.set(r[j], (freq.get(r[j]) ?? 0) + 1));
  return c.levels.slice().sort((a, b) => (freq.get(a) ?? 0) - (freq.get(b) ?? 0))[0];
}

export function makeCustomCsv(name: string, table: FreeTable, requireLabel = true): CustomCsv {
  const cols = inspectColumns(table);
  if (!requireLabel) {
    const base = { name, table, cols, target: '', positive: '', features: allFeatures({ table, cols, target: '' }) };
    if (base.features.length < 2) throw new Error('Bài này cần ít nhất 2 biến dùng được (cột số, hoặc cột phân loại ít mức); không cần cột nhãn. ID, ngày tháng và cột chỉ có một giá trị không được dùng.');
    return base;
  }
  const cands = labelCandidates(cols);
  if (!cands.length) throw new Error('Không có cột nào dùng làm nhãn được (cần cột có 2–30 giá trị khác nhau, không phải ID hay ngày tháng).');
  const g = guessTarget(cols);
  const target = cands.some((c) => c.name === g) ? g : cands[cands.length - 1].name;
  const base = { name, table, cols, target, positive: defaultPositive(table, cols, target), features: [] as string[] };
  base.features = allFeatures(base);
  if (base.features.length < 2) throw new Error('Các bài này cần ít nhất 2 biến ngoài cột nhãn (cột số, hoặc cột phân loại ít mức). ID, ngày tháng và cột chỉ có một giá trị không được dùng.');
  return base;
}

export function patchCustomCsv(cur: CustomCsv, patch: Partial<Pick<CustomCsv, 'target' | 'positive' | 'features'>>): CustomCsv {
  const next = { ...cur, ...patch };
  if (patch.target && patch.target !== cur.target) { next.positive = defaultPositive(cur.table, cur.cols, patch.target); next.features = allFeatures(next); }
  return next;
}

/** Bảng số + nhãn 0/1 (lớp dương = 1) cho các bài nhị phân. Bỏ dòng thiếu nhãn. Ô thiếu → NaN (điền median train sau khi chia). */
export function toBinaryRaw(s: CustomCsv): { raw: RawTable; zeroCols: string[]; dropped: number } {
  const ti = s.table.names.indexOf(s.target);
  const specs = featureSpecs(s.table, s.cols, s.target).filter((f) => s.features.includes(f.name));
  const read = specs.map((f) => {
    const j = s.table.names.indexOf(f.column), info = s.cols.find((c) => c.name === f.column)!;
    return f.level === undefined
      ? (r: string[]) => toNumber(r[j] ?? '', info.decimal)
      : (r: string[]) => { const v = (r[j] ?? '').trim(); return isBlank(v) ? NaN : v === f.level ? 1 : 0; };
  });
  const rows: number[][] = [], y: Label[] = [];
  let dropped = 0;
  const tCol = s.cols[ti];
  for (const r of s.table.cells) {
    if (!s.target) { rows.push(read.map((f) => f(r))); y.push(0); continue; }
    const t = (r[ti] ?? '').trim();
    if (isBlank(t)) { dropped++; continue; }
    const isPos = tCol?.kind === 'numeric' ? toNumber(t, tCol.decimal) === Number(s.positive) : t === s.positive;
    rows.push(read.map((f) => f(r)));
    y.push(isPos ? 1 : 0);
  }
  const names = specs.map((f) => f.name);
  const zeroCols = names.filter((_, k) => specs[k].level === undefined && zeroGap(rows.map((r) => r[k])) !== null);
  return { raw: { names, rows, y }, zeroCols, dropped };
}
