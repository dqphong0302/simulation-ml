import { describe, expect, it } from 'vitest';
import { guessTarget, inspectColumns, parseFreeCsv, toNumber, zeroGap } from '../src/core/datasets/freecsv';
import { makeCustomCsv, patchCustomCsv, toBinaryRaw } from '../src/core/datasets/customCsv';

const blobs = 'dai,rong,cao,mau,loai\n' + Array.from({ length: 30 }, (_, i) => `${i % 3}.${i},${(i % 3) * 2}.5,${i},${['do', 'xanh'][i % 2]},${'ABC'[i % 3]}`).join('\n');

describe('đọc CSV tải lên', () => {
  it('đọc ngoặc kép, dấu ; và dấu phẩy thập phân', () => {
    const t = parseFreeCsv('﻿ten;"mo ta";gia\nA;"có ; trong ô";3,5\nB;"dòng ""trích""";4\n');
    expect(t.delimiter).toBe(';');
    expect(t.names).toEqual(['ten', 'mo ta', 'gia']);
    expect(t.cells[0][1]).toBe('có ; trong ô');
    expect(t.cells[1][1]).toBe('dòng "trích"');
    expect(inspectColumns(t).map((x) => x.kind)).toEqual(['categorical', 'categorical', 'numeric']);
  });
  it('đổi tên cột trùng và báo lỗi khi thiếu dữ liệu', () => {
    expect(parseFreeCsv('a,a,b\n1,2,3').names).toEqual(['a', 'a (2)', 'b']);
    expect(() => parseFreeCsv('a,b')).toThrow();
  });
  it('đoán cột nhãn, ưu tiên tên rõ nghĩa hơn tọa độ y', () => {
    expect(guessTarget(inspectColumns(parseFreeCsv(blobs)))).toBe('loai');
    expect(guessTarget(inspectColumns(parseFreeCsv('x,y,z,nhom\n1,2,3,a\n2,3,4,b')))).toBe('nhom');
  });
  it('nhận ra 0 là mã thiếu nhưng không nhầm với biến đếm', () => {
    expect(zeroGap([0, 0, ...Array.from({ length: 150 }, (_, i) => 44 + i)])).toBe(44); // kiểu Glucose
    expect(zeroGap([0, 1, 2, 3, 5, 0, 4])).toBeNull();                                  // số lần mang thai
    expect(zeroGap([0, 0.2, 0.5, 1.1, 2])).toBeNull();                                  // liên tục từ gần 0
  });
});

describe('CSV riêng cho các bài nhị phân', () => {
  it('gộp nhiều lớp thành lớp dương / phần còn lại; cột phân loại ít mức được mã hóa 0/1', () => {
    const c = patchCustomCsv(makeCustomCsv('blobs.csv', parseFreeCsv(blobs)), { positive: 'B' });
    expect(c.target).toBe('loai');
    const { raw } = toBinaryRaw(c);
    expect(raw.names).toEqual(['dai', 'rong', 'cao', 'mau = xanh']);
    expect(new Set(raw.rows.map((r) => r[3]))).toEqual(new Set([0, 1]));
    expect(raw.y.filter((v) => v === 1)).toHaveLength(10);
    expect(raw.y).toHaveLength(30);
  });
  it('báo lỗi rõ khi CSV không có cột nhãn hoặc thiếu biến số', () => {
    expect(() => makeCustomCsv('x.csv', parseFreeCsv('a,b\n' + Array.from({ length: 40 }, (_, i) => `${i},${i * 2}`).join('\n')))).toThrow(/nhãn/);
    expect(() => makeCustomCsv('x.csv', parseFreeCsv('a,nhan\n1,x\n2,y\n3,x'))).toThrow(/2 biến/);
  });
});

describe('đọc dữ liệu "bẩn" kiểu bệnh viện', () => {
  const rows = Array.from({ length: 40 }, (_, i) => [
    String(1000 + i), `2025-0${1 + (i % 9)}-1${i % 9}`, i % 7 === 0 ? 'không rõ' : String(30 + i), i % 2 ? 'Nam' : 'Nữ',
    i % 9 === 0 ? '-' : `${100 + i * 2} mg/dL`, `"${18 + (i % 10)},${i % 10}"`, i % 3 ? 'Không' : 'Có', 'BV A', i % 4 ? 'Không' : 'Có',
  ].join(','));
  const t = parseFreeCsv(['Mã BN,Ngày khám,Huyết áp,Giới tính,Glucose,BMI,Hút thuốc,Bệnh viện,Tiểu đường', ...rows].join('\n'));
  const cols = inspectColumns(t), col = (n: string) => cols.find((c) => c.name === n)!;

  it('đọc số có đơn vị, dấu phẩy thập phân và mã thiếu', () => {
    expect(col('Glucose')).toMatchObject({ kind: 'numeric', units: ['mg/dL'], missingTokens: 5 });
    expect(col('BMI')).toMatchObject({ kind: 'numeric', decimal: ',' });
    expect(Number(col('BMI').levels[1])).toBeCloseTo(19.1);
    expect(col('Huyết áp')).toMatchObject({ kind: 'numeric', missing: 6, missingTokens: 6 });
  });
  it('nhận ra ID, ngày tháng và cột hằng số', () => {
    expect(col('Mã BN').role).toBe('id');
    expect(col('Ngày khám').role).toBe('date');
    expect(col('Bệnh viện').role).toBe('constant');
    expect(col('Giới tính').role).toBe('feature');
  });
  it('mã hóa cột phân loại, loại ID/ngày và không dùng chúng làm nhãn', () => {
    const c = makeCustomCsv('lan.csv', t);
    expect(c.target).toBe('Tiểu đường');
    expect(c.positive).toBe('Có');
    expect(c.features).toEqual(['Huyết áp', 'Glucose', 'BMI', 'Giới tính = Nam', 'Hút thuốc = Có']);
    const { raw } = toBinaryRaw(c);
    expect(raw.rows[1]).toEqual([31, 102, 19.1, 1, 0]);
    expect(Number.isNaN(raw.rows[0][0])).toBe(true); // "không rõ" → thiếu, điền sau khi chia
  });
  it('đọc các kiểu số thường gặp', () => {
    expect(toNumber('1.234,5')).toBe(1234.5);
    expect(toNumber('1,234.5')).toBe(1234.5);
    expect(toNumber('1.234', ',')).toBe(1234);
    expect(toNumber('45%')).toBe(45);
    expect(toNumber('<5')).toBe(5);
    expect(toNumber('1e3')).toBe(1000);
    expect(toNumber('−2,5')).toBe(-2.5);
    expect(toNumber('1A')).toBeNaN();
    expect(toNumber('N/A')).toBeNaN();
  });
});
