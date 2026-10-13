import { CsvStreamParser, TableBuilder, detectDelimiter, IMPORT_LIMITS, parseJsonTable, validateDataFile } from '../core/datasets/importData';
import type { FreeTable } from '../core/datasets/freecsv';

self.onmessage = async (event: MessageEvent<{ file: File; sheet?: string; delimiter?: string }>) => {
  try {
    const { file, sheet, delimiter: selectedDelimiter } = event.data;
    const ext = validateDataFile(file);
    let table: FreeTable;
    let sheets: string[] = [], selectedSheet = '', blankRows = 0;
    const notes: string[] = [];
    if (['csv', 'tsv', 'txt'].includes(ext)) {
      const head = await file.slice(0, 64 * 1024).text();
      const delimiter = selectedDelimiter || (ext === 'tsv' ? '\t' : detectDelimiter(head));
      const builder = new TableBuilder(), parser = new CsvStreamParser(delimiter, row => builder.add(row));
      const decoder = new TextDecoder('utf-8', { fatal: true });
      const reader = file.stream().getReader();
      let bytes = 0, reported = -1;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        parser.feed(decoder.decode(value, { stream: true })); bytes += value.byteLength;
        const pct = Math.floor(bytes / file.size * 100);
        if (pct !== reported) { self.postMessage({ type: 'progress', pct }); reported = pct; }
      }
      parser.feed(decoder.decode()); parser.end();
      table = builder.table(delimiter); blankRows = builder.blankRows;
    } else if (ext === 'json') {
      self.postMessage({ type: 'progress', pct: 10 });
      const text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
      table = parseJsonTable(text);
      notes.push('JSON: hợp các khóa thành cột; khóa thiếu/null thành ô trống. Object/mảng lồng nhau không được tự làm phẳng.');
    } else {
      self.postMessage({ type: 'progress', pct: 10 });
      const XLSX = await import('xlsx');
      const bytes = await file.arrayBuffer();
      const book = XLSX.read(bytes, { type: 'array', bookSheets: true });
      sheets = book.SheetNames;
      selectedSheet = sheet ?? sheets[0];
      if (!selectedSheet || !sheets.includes(selectedSheet)) throw new Error('Không tìm thấy sheet đã chọn.');
      self.postMessage({ type: 'sheets', sheets, sheet: selectedSheet });
      self.postMessage({ type: 'progress', pct: 35 });
      const workbook = XLSX.read(bytes, { type: 'array', sheets: selectedSheet, sheetRows: IMPORT_LIMITS.rows + 2, cellDates: true, cellFormula: false, cellHTML: false, bookVBA: false });
      const ws = workbook.Sheets[selectedSheet];
      const ref = ws['!fullref'] || ws['!ref'];
      if (!ref) throw new Error('Sheet rỗng. Hãy chọn sheet khác.');
      const range = XLSX.utils.decode_range(ref);
      if (range.e.c - range.s.c + 1 > IMPORT_LIMITS.columns) throw new Error(`Sheet vượt ${IMPORT_LIMITS.columns} cột (kể cả ô được định dạng).`);
      if (range.e.r - range.s.r > IMPORT_LIMITS.rows || (range.e.r - range.s.r) * (range.e.c - range.s.c + 1) > IMPORT_LIMITS.cells) throw new Error('Sheet vượt giới hạn 200.000 dòng hoặc 2.000.000 ô; hãy chia nhỏ sheet.');
      const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: '', blankrows: true });
      const builder = new TableBuilder();
      for (const row of rows) builder.add(row.map(v => v instanceof Date ? v.toISOString() : String(v ?? '')));
      table = builder.table(); blankRows = builder.blankRows;
      notes.push('Excel: dùng giá trị công thức đã lưu, không tính lại công thức/không chạy macro. Ngày chuyển thành ISO; dòng không rỗng đầu tiên là tiêu đề.');
    }
    if (blankRows) notes.push(`Đã bỏ ${blankRows} dòng hoàn toàn trống.`);
    self.postMessage({ type: 'done', table, sheets, sheet: selectedSheet, notes });
  } catch (error) {
    self.postMessage({ type: 'error', error: error instanceof Error ? error.message : 'Không đọc được dữ liệu.' });
  }
};
