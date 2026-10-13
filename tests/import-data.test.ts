import { describe, expect, it } from 'vitest';
import { CsvStreamParser, TableBuilder, IMPORT_LIMITS, parseCsvText, parseJsonTable, sampleTable, uniqueHeaders, validateDataFile } from '../src/core/datasets/importData';
import { modelLimitsFor } from '../src/core/datasets/importData';
import { makeCustomCsv, toBinaryRaw } from '../src/core/datasets/customCsv';

describe('bounded data imports', () => {
  it('uses tighter budgets for expensive model demos', () => {
    expect(modelLimitsFor('/ml/forest')).toEqual({ rows: 500, columns: 8 });
    expect(modelLimitsFor('/ml/svm')).toEqual({ rows: 500, columns: 16 });
    expect(modelLimitsFor('/ml/tree')).toEqual({ rows: 1000, columns: 16 });
    expect(modelLimitsFor('/ml/pca')).toEqual({ rows: 2000, columns: 32 });
  });
  it('allows numeric tasks without inventing classification labels', () => {
    const table = parseCsvText('height,weight\n' + Array.from({ length: 80 }, (_, i) => `${i + 150},${i + 50}`).join('\n'));
    const data = makeCustomCsv('measurements.csv', table, false);
    expect(data.target).toBe('');
    expect(data.features).toEqual(['height', 'weight']);
    expect(toBinaryRaw(data).raw.rows).toHaveLength(80);
    expect(() => makeCustomCsv('measurements.csv', table)).toThrow(/nhãn/);
  });
  it('handles quoted separators/newlines/escaped quotes split at every chunk boundary', () => {
    const text = '\uFEFFa;b;c\r\n1;"hello; world\nnext";"say ""hi"""\r\n2;3;4';
    const expected = parseCsvText(text);
    for (let i = 1; i < text.length; i++) {
      const b = new TableBuilder(), p = new CsvStreamParser(';', row => b.add(row));
      p.feed(text.slice(0, i)); p.feed(text.slice(i)); p.end();
      expect(b.table(';')).toEqual(expected);
    }
    expect(expected.cells[0]).toEqual(['1', 'hello; world\nnext', 'say "hi"']);
  });
  it('rejects malformed rows and unclosed quotes rather than dropping data', () => {
    expect(() => parseCsvText('a,b\n1,2\n3')).toThrow(/cột/);
    expect(() => parseCsvText('a,b\n1,"two')).toThrow(/ngoặc kép/);
  });
  it('reads beyond the old silent 20,000-row cutoff', () => {
    const t = parseCsvText('a,b\n' + Array.from({ length: 20001 }, (_, i) => `${i},${i + 1}`).join('\n'));
    expect(t.cells).toHaveLength(20001);
    expect(t.cells.at(-1)).toEqual(['20000', '20001']);
  });
  it('enforces exact file boundaries and supported extensions', () => {
    expect(validateDataFile({ name: 'a.csv', size: IMPORT_LIMITS.textBytes })).toBe('csv');
    expect(() => validateDataFile({ name: 'a.csv', size: IMPORT_LIMITS.textBytes + 1 })).toThrow(/100 MiB/);
    expect(() => validateDataFile({ name: 'a.xlsx', size: IMPORT_LIMITS.binaryBytes + 1 })).toThrow(/30 MiB/);
    expect(() => validateDataFile({ name: 'a.pdf', size: 30 })).toThrow(/Chỉ hỗ trợ/);
    expect(() => validateDataFile({ name: 'a.csv', size: 0 })).toThrow(/rỗng/);
  });
  it('enforces rows, columns, cell budget and cell length', () => {
    const b = new TableBuilder(); b.add(['a']);
    for (let i = 0; i < IMPORT_LIMITS.rows; i++) b.add(['1']);
    expect(() => b.add(['2'])).toThrow(/200/);
    expect(() => new TableBuilder().add(Array(201).fill('a'))).toThrow(/200 cột/);
    const wide = new TableBuilder(); wide.add(Array(200).fill('a'));
    for (let i = 0; i < 10000; i++) wide.add(Array(200).fill('1'));
    expect(() => wide.add(Array(200).fill('2'))).toThrow(/ô/);
    expect(() => parseCsvText('a\n' + 'x'.repeat(100001))).toThrow(/ký tự/);
  });
  it('keeps header names unique even when suffixes already exist', () => {
    const names = uniqueHeaders(['a', 'a', 'a (2)', '']);
    expect(new Set(names).size).toBe(4);
  });
  it('supports one-column data and flat JSON with missing/null values', () => {
    expect(parseCsvText('name\nAlice\nBob').cells).toHaveLength(2);
    const t = parseJsonTable('[{"a":1,"b":true},{"a":null},{"c":"xin chào"},{}]');
    expect(t.names).toEqual(['a', 'b', 'c']);
    expect(t.cells).toEqual([['1', 'true', ''], ['', '', ''], ['', '', 'xin chào'], ['', '', '']]);
    expect(() => parseJsonTable('[{"a":{"nested":2}}]')).toThrow(/lồng nhau/);
    expect(() => parseJsonTable('[1,2]')).toThrow(/đối tượng/);
    expect(() => parseJsonTable('[{"id":9007199254740993}]')).toThrow(/quá lớn/);
    expect(parseJsonTable('[{"constructor":"id","__proto__":"value"},{}]').cells).toEqual([['id', 'value'], ['', '']]);
  });
  it('samples reproducibly across the whole table without modifying the original', () => {
    const t = parseCsvText('a,b\n' + Array.from({ length: 10000 }, (_, i) => `${i},${i}`).join('\n'));
    const sampled = sampleTable(t, 100);
    expect(sampled).toEqual(sampleTable(t, 100));
    expect(sampled).not.toEqual(sampleTable(t, 100, 43));
    expect(t.cells).toHaveLength(10000);
    expect(new Set(sampled.cells.map(r => r[0])).size).toBe(100);
    expect(Number(sampled.cells.at(-1)![0])).toBeGreaterThan(9000);
    expect(sampleTable(t, 10000)).toBe(t);
  });
});
