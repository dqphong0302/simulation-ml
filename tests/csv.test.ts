import { describe, expect, it } from 'vitest';
import { guessTarget, inspectColumns, parseFreeCsv, zeroGap } from '../src/core/datasets/freecsv';
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
  it('gộp nhiều lớp thành lớp dương / phần còn lại và chỉ lấy biến số', () => {
    const c = patchCustomCsv(makeCustomCsv('blobs.csv', parseFreeCsv(blobs)), { positive: 'B' });
    expect(c.target).toBe('loai');
    const { raw } = toBinaryRaw(c);
    expect(raw.names).toEqual(['dai', 'rong', 'cao']);
    expect(raw.y.filter((v) => v === 1)).toHaveLength(10);
    expect(raw.y).toHaveLength(30);
  });
  it('báo lỗi rõ khi CSV không có cột nhãn hoặc thiếu biến số', () => {
    expect(() => makeCustomCsv('x.csv', parseFreeCsv('a,b\n' + Array.from({ length: 40 }, (_, i) => `${i},${i * 2}`).join('\n')))).toThrow(/nhãn/);
    expect(() => makeCustomCsv('x.csv', parseFreeCsv('a,nhan\n1,x\n2,y\n3,x'))).toThrow(/2 cột số/);
  });
});
