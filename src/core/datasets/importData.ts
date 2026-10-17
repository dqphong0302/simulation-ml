import type { FreeTable } from './freecsv';

export const IMPORT_LIMITS = { textBytes: 100 * 1024 ** 2, binaryBytes: 30 * 1024 ** 2, rows: 200_000, columns: 200, cells: 2_000_000, cellChars: 100_000 };
export const EXPLORE_ROWS = 20_000;
export const TRAIN_ROWS = 2_000;
export const TRAIN_COLUMNS = 32;
export function modelLimitsFor(path: string) {
  if (path === '/ml/forest' || path === '/ml/boosting') return { rows: 500, columns: 8 };
  if (path === '/ml/svm') return { rows: 500, columns: 16 };
  if (path === '/ml/tree') return { rows: 1000, columns: 16 };
  return { rows: TRAIN_ROWS, columns: TRAIN_COLUMNS };
}
export const DATA_ACCEPT = '.csv,.tsv,.txt,.json,.xlsx,.xls';

export function validateDataFile(file: Pick<File, 'name' | 'size'>) {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!['csv', 'tsv', 'txt', 'json', 'xlsx', 'xls'].includes(ext)) throw new Error('Chỉ hỗ trợ CSV, TSV, TXT UTF-8, JSON, XLSX và XLS. PDF/ảnh dùng phòng RAG hoặc nhận diện ảnh.');
  const limit = ['csv', 'tsv', 'txt'].includes(ext) ? IMPORT_LIMITS.textBytes : IMPORT_LIMITS.binaryBytes;
  if (file.size > limit) throw new Error(`Tệp vượt ${limit / 1024 ** 2} MiB. Hãy chia nhỏ tệp trước khi tải.`);
  if (!file.size) throw new Error('Tệp rỗng.');
  return ext;
}

export function uniqueHeaders(values: string[]) {
  const used = new Set<string>();
  return values.map((v, i) => {
    const base = v.trim() || `Cột ${i + 1}`;
    let name = base, n = 2;
    while (used.has(name)) name = `${base} (${n++})`;
    used.add(name);
    return name;
  });
}

export class TableBuilder {
  names: string[] = [];
  cells: string[][] = [];
  blankRows = 0;
  add(row: string[], keepBlank = false) {
    if (!keepBlank && row.every(c => !c.trim())) { this.blankRows++; return; }
    if (row.length > IMPORT_LIMITS.columns) throw new Error(`Vượt giới hạn ${IMPORT_LIMITS.columns} cột.`);
    if (row.some(c => c.length > IMPORT_LIMITS.cellChars)) throw new Error(`Một ô vượt ${IMPORT_LIMITS.cellChars.toLocaleString('vi')} ký tự.`);
    if (!this.names.length) { this.names = uniqueHeaders(row); return; }
    if (row.length !== this.names.length) throw new Error(`Dòng dữ liệu ${this.cells.length + 1}: có ${row.length} cột, cần ${this.names.length}. Không có dòng nào được bỏ qua.`);
    if (this.cells.length >= IMPORT_LIMITS.rows) throw new Error(`Vượt ${IMPORT_LIMITS.rows.toLocaleString('vi')} dòng. Hãy chia nhỏ tệp; không cắt dòng tự động.`);
    if ((this.cells.length + 1) * this.names.length > IMPORT_LIMITS.cells) throw new Error(`Vượt ${IMPORT_LIMITS.cells.toLocaleString('vi')} ô. Hãy giảm số dòng hoặc cột.`);
    this.cells.push(row.map(c => c.trim()));
  }
  table(delimiter = ','): FreeTable {
    if (!this.cells.length) throw new Error('Cần hàng tiêu đề và ít nhất một dòng dữ liệu.');
    return { names: this.names, cells: this.cells, delimiter };
  }
}

/** Stateful RFC4180 parser. Quoted newlines and escaped quotes may cross chunks. */
export class CsvStreamParser {
  private row: string[] = [];
  private cell = '';
  private quoted = false;
  private afterQuote = false;
  private skipLF = false;
  private first = true;
  constructor(private delimiter: string, private emit: (row: string[]) => void) {}
  private pushCell() {
    this.row.push(this.cell); this.cell = ''; this.afterQuote = false;
    if (this.row.length > IMPORT_LIMITS.columns) throw new Error(`Vượt ${IMPORT_LIMITS.columns} cột.`);
  }
  feed(text: string) {
    for (const c of text) {
      if (this.first) { this.first = false; if (c === '\uFEFF') continue; }
      if (this.skipLF) { this.skipLF = false; if (c === '\n') continue; }
      if (this.quoted) {
        if (c === '"') { this.quoted = false; this.afterQuote = true; }
        else this.cell += c;
      } else if (this.afterQuote && c === '"') { this.cell += '"'; this.quoted = true; this.afterQuote = false; }
      else if (c === this.delimiter) this.pushCell();
      else if (c === '\n' || c === '\r') { this.pushCell(); this.emit(this.row); this.row = []; this.skipLF = c === '\r'; }
      else if (this.afterQuote) { if (c !== ' ' && c !== '\t') throw new Error('Ký tự không hợp lệ sau dấu ngoặc kép đóng.'); }
      else if (c === '"') { if (this.cell.length) throw new Error('Ngoặc kép không hợp lệ trong ô CSV.'); this.quoted = true; }
      else this.cell += c;
      if (this.cell.length > IMPORT_LIMITS.cellChars) throw new Error(`Một ô vượt ${IMPORT_LIMITS.cellChars.toLocaleString('vi')} ký tự.`);
    }
  }
  end() {
    if (this.quoted) throw new Error('CSV thiếu dấu ngoặc kép đóng.');
    if (this.cell.length || this.row.length || this.afterQuote) { this.pushCell(); this.emit(this.row); this.row = []; }
  }
}

/** Score delimiters using complete logical records, ignoring separators inside quotes. */
export function detectDelimiter(text: string) {
  let best = ',', score = -1;
  for (const d of [',', ';', '\t', '|']) {
    const widths: number[] = [];
    try {
      const p = new CsvStreamParser(d, r => { if (r.some(c => c.trim())) widths.push(r.length); });
      p.feed(text.slice(0, 64 * 1024));
      // A partial last record is intentionally not finalized while sniffing.
      const first = widths[0] ?? 1;
      const value = first > 1 ? widths.filter(n => n === first).length / Math.max(1, widths.length) * 100 + Math.min(first, 20) : 0;
      if (value > score) { best = d; score = value; }
    } catch { /* A wrong separator can make quoting invalid. */ }
  }
  return best;
}

export function parseCsvText(text: string, delimiter = detectDelimiter(text)): FreeTable {
  const builder = new TableBuilder();
  const p = new CsvStreamParser(delimiter, row => builder.add(row));
  p.feed(text); p.end();
  return builder.table(delimiter);
}

export function parseJsonTable(text: string): FreeTable {
  const value: unknown = JSON.parse(text.replace(/^\uFEFF/, ''));
  if (!Array.isArray(value) || !value.length) throw new Error('JSON cần là mảng các đối tượng phẳng: [{"cot": 1, "nhan": "A"}, …].');
  if (value.length > IMPORT_LIMITS.rows) throw new Error(`JSON vượt ${IMPORT_LIMITS.rows.toLocaleString('vi')} dòng.`);
  const keys = new Set<string>();
  for (const row of value) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error('Mỗi dòng JSON phải là một đối tượng phẳng.');
    for (const [k, v] of Object.entries(row)) {
      if (v !== null && typeof v === 'object') throw new Error(`Cột “${k}” chứa object/mảng lồng nhau. Hãy làm phẳng JSON trước.`);
      if (typeof v === 'number' && !Number.isFinite(v)) throw new Error(`Cột “${k}” có số không hữu hạn.`);
      if (typeof v === 'number' && Number.isInteger(v) && !Number.isSafeInteger(v)) throw new Error(`Cột “${k}” có số nguyên quá lớn. Hãy lưu mã định danh dạng chuỗi để tránh mất chữ số.`);
      keys.add(k);
      if (keys.size > IMPORT_LIMITS.columns) throw new Error(`Vượt ${IMPORT_LIMITS.columns} cột.`);
    }
  }
  if (!keys.size) throw new Error('JSON không có cột dữ liệu.');
  const names = [...keys], b = new TableBuilder(); b.add(names, true);
  for (const row of value) b.add(names.map(k => !Object.hasOwn(row, k) || row[k] == null ? '' : String(row[k])), true);
  return b.table();
}

/** Seeded reservoir sample, retaining original row order and never mutating source. */
export function sampleTable(table: FreeTable, count: number, seed = 42): FreeTable {
  if (!Number.isInteger(count) || count < 1) throw new Error('Số dòng mẫu phải là số nguyên dương.');
  if (table.cells.length <= count) return table;
  const indices = Array.from({ length: count }, (_, i) => i);
  let state = seed >>> 0;
  for (let i = count; i < table.cells.length; i++) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = Math.floor(state / 4294967296 * (i + 1));
    if (j < count) indices[j] = i;
  }
  return { ...table, cells: indices.sort((a, b) => a - b).map(i => table.cells[i]) };
}
