import { describe as stats } from '../algorithms/dataset';

/** Bảng CSV bất kỳ: giữ nguyên chuỗi, kiểu cột được suy ra sau. */
export interface FreeTable { names: string[]; cells: string[][]; delimiter: string }
export type ColumnKind = 'numeric' | 'categorical';
/** Vai trò suy ra của cột: chỉ cột "feature" được đưa vào mô hình. */
export type ColumnRole = 'feature' | 'id' | 'date' | 'constant' | 'text';
export type Decimal = ',' | '.';
export interface ColumnInfo {
  name: string; kind: ColumnKind; missing: number; unique: number; levels: string[];
  role: ColumnRole;
  /** Dấu thập phân suy ra cho cột số (“23,8” → ','). */
  decimal: Decimal;
  /** Đơn vị đã bỏ khi đọc số (mg/dL, %, kg…), nhiều nhất trước. */
  units: string[];
  /** Ô ghi mã thiếu như "-", "không rõ", "N/A". */
  missingTokens: number;
  /** Ô không rỗng nhưng không đọc được thành số ở cột số: coi là thiếu. */
  coerced: number;
  /** Ví dụ ô không đọc được, để người học kiểm tra. */
  coercedExamples: string[];
}

export { EXPLORE_ROWS as MAX_ROWS } from './importData';

/** Mã "thiếu" hay gặp trong bảng y tế/Excel tiếng Việt và tiếng Anh. */
const MISSING = /^(null|na|n\/a|n\.a\.?|nan|none|nil|\?+|-+|—|–|\.|#n\/a|#value!|#div\/0!|#ref!|missing|unknown|không rõ|khong ro|chưa rõ|chua ro|chưa đo|chua do|chưa có|không xác định|khong xac dinh|kxđ|kxd|k\/r|ko rõ|trống|n\/d)$/i;
export const isBlank = (c: string) => { const s = c.trim(); return s === '' || MISSING.test(s); };

/** Số kèm dấu so sánh/tiền tệ phía trước và đơn vị phía sau: "<5", "₫1.200", "190 mg/dL", "45%". */
const CELL = /^(?:[<>≤≥~≈]=?\s*)?(?:[$€£¥₫]\s*)?([-+−]?(?:\d[\d.,'  ]*\d|\d)|[-+−]?[.,]\d+)\s*((?:[\p{L}%‰°µ/][\p{L}\p{N}%‰°µ/²³^.·*\s-]*)?)$/u;
const DATE = /^(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})([ T]\d{1,2}:\d{2}(:\d{2}(\.\d+)?)?(z|[+-]\d{2}:?\d{2})?)?$/i;

/** Dấu thập phân của một ô khi nhìn riêng ô đó; null nếu không chắc (ví dụ "1,234"). */
function decimalOf(core: string): Decimal | null {
  const c = core.replace(/[\s ']/g, ''), dots = (c.match(/\./g) ?? []).length, commas = (c.match(/,/g) ?? []).length;
  if (dots && commas) return c.lastIndexOf(',') > c.lastIndexOf('.') ? ',' : '.';
  if (commas === 1) return /,\d{3}$/.test(c) && !/^[-+−]?0,/.test(c) ? null : ',';
  if (dots === 1) return /\.\d{3}$/.test(c) && !/^[-+−]?0\./.test(c) ? null : '.';
  return dots > 1 ? ',' : commas > 1 ? '.' : null; // nhiều dấu cùng loại là phân cách hàng nghìn
}

/** Đọc một ô thành số và đơn vị. decimal: dấu thập phân của cả cột; ô mơ hồ như "1,234" theo cột. */
export function parseCell(c: string, decimal?: Decimal): { value: number; unit: string } {
  const s = c.trim();
  if (isBlank(s)) return { value: NaN, unit: '' };
  if (!(decimal === ',' && s.includes('.')) && /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return { value: Number(s), unit: '' };
  const m = CELL.exec(s);
  // "1A", "2B" là mã phân loại, không phải số kèm đơn vị.
  if (!m || /^\p{L}$/u.test(m[2]) && !/\s\p{L}$/u.test(s)) return { value: NaN, unit: '' };
  let core = m[1].replace(/[\s ']/g, '').replace('−', '-');
  const d = decimalOf(core) ?? decimal ?? '.';
  core = d === ',' ? core.replace(/\./g, '').replace(',', '.') : core.replace(/,/g, '');
  const v = Number(core);
  return { value: Number.isFinite(v) ? v : NaN, unit: m[2].trim() };
}
/** Đọc số; truyền ColumnInfo.decimal của cột để xử lý đúng "1.234" kiểu Việt Nam. */
export const toNumber = (c: string, decimal?: Decimal): number => parseCell(c, decimal).value;

export { detectDelimiter as sniffDelimiter, parseCsvText as parseFreeCsv } from "./importData";

const ID_NAME = /^(id|stt|#|no\.?|mrn|pid|uuid|unnamed: ?\d+)$|(^|[\s_.-])(id|mã|ma|mrn|code|uuid)([\s_.-]|$)|patient.?id|mã.?bn|ma.?bn|họ.?(và.?)?tên|ho.?ten|^(name|tên|ten)$|số.?hồ.?sơ|so.?ho.?so/i;

/**
 * Suy kiểu và vai trò từng cột từ nội dung. Cột là số khi ≥ 80% ô không thiếu đọc được thành số
 * (sau khi bỏ đơn vị, dấu phân cách hàng nghìn); các ô còn lại coi là thiếu và được báo lại.
 */
export function inspectColumns(t: FreeTable): ColumnInfo[] {
  const n = t.cells.length;
  return t.names.map((name, j) => {
    const col = t.cells.map((r) => (r[j] ?? '').trim());
    const filled = col.filter((c) => !isBlank(c));
    const missingTokens = col.filter((c) => c !== '' && isBlank(c)).length;
    const votes = { ',': 0, '.': 0 };
    filled.forEach((c) => { const m = CELL.exec(c), d = m && decimalOf(m[1]); if (d) votes[d]++; });
    const decimal: Decimal = votes[','] > votes['.'] ? ',' : '.';
    const dates = filled.filter((c) => DATE.test(c)).length;
    const isDate = filled.length > 0 && dates / filled.length >= 0.8;
    const parsed = isDate ? [] : filled.map((c) => parseCell(c, decimal));
    const ok = parsed.filter((p) => Number.isFinite(p.value));
    const kind: ColumnKind = !isDate && ok.length >= 2 && ok.length / filled.length >= 0.8 ? 'numeric' : 'categorical';
    const unitCount = new Map<string, number>();
    if (kind === 'numeric') ok.forEach((p) => { if (p.unit) unitCount.set(p.unit, (unitCount.get(p.unit) ?? 0) + 1); });
    const units = [...unitCount].sort((a, b) => b[1] - a[1]).map(([u]) => u);
    const bad = kind === 'numeric' ? filled.filter((_, i) => !Number.isFinite(parsed[i].value)) : [];
    const vals = ok.map((p) => p.value);
    const levels = kind === 'numeric'
      ? [...new Set(vals)].sort((a, b) => a - b).map(String)
      : [...new Set(filled)].sort((a, b) => a.localeCompare(b, 'vi'));
    const unique = levels.length;

    let role: ColumnRole = 'feature';
    const allInt = kind === 'numeric' && vals.every(Number.isInteger);
    // Cột không tiêu đề chứa 0/1, 2, 3… là chỉ số dòng pandas/Excel xuất kèm, không phải số đo.
    const sequence = /^Cột \d+$/.test(name) && allInt && n >= 20 && vals.length === n && vals[0] <= 1 && vals.every((v, i) => !i || v === vals[i - 1] + 1);
    if (unique <= 1) role = 'constant';
    else if (isDate) role = 'date';
    else if ((ID_NAME.test(name.trim()) && unique >= 0.5 * filled.length && (kind === 'categorical' || allInt)) || sequence
      || (kind === 'categorical' && n >= 20 && unique >= 0.9 * filled.length)) role = 'id';
    else if (kind === 'categorical' && unique > 30) role = 'text';
    return { name, kind, missing: col.length - filled.length + bad.length, unique, levels: levels.slice(0, 200), role, decimal, units, missingTokens, coerced: bad.length, coercedExamples: [...new Set(bad)].slice(0, 3) };
  });
}

/** Đọc cả một cột thành số theo kiểu đã suy ra. */
export function columnNumbers(t: FreeTable, info: ColumnInfo): number[] {
  const j = t.names.indexOf(info.name);
  return t.cells.map((r) => toNumber(r[j] ?? '', info.decimal));
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
/** Cột đích hợp lý nhất: tên quen thuộc, nếu không thì cột cuối. Bỏ qua ID, ngày, cột hằng số. */
export function guessTarget(all: ColumnInfo[]): string {
  const usable = all.filter((c) => c.role === 'feature');
  const cols = usable.length ? usable : all;
  // "y" hay là tọa độ (x, y, z) nên chỉ dùng khi không có tên rõ nghĩa hơn.
  const strong = /^(label|target|class|outcome|species|category|group|nhan|nhãn|loai|loại|lop|lớp|nhom|nhóm|kết quả|ket_qua|price|gia|giá)$/i;
  const n = (c: ColumnInfo) => c.name.trim();
  return (cols.find((c) => strong.test(n(c))) ?? (cols.some((c) => /^z$/i.test(n(c))) ? undefined : cols.find((c) => /^y$/i.test(n(c)))) ?? cols[cols.length - 1]).name;
}
