import type { Label } from '../algorithms/dataset';

export interface RawTable { names: string[]; rows: number[][]; y: Label[] } // thiếu giá trị = NaN

/** Phân tích CSV đơn giản (dấu phẩy, không ngoặc kép). Ô rỗng/NULL/NA → NaN. Báo lỗi rõ ràng nếu sai cấu trúc. */
export function parseLabelledCsv(text: string, labelColumn: string): RawTable {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length < 2) throw new Error('Tệp CSV không có dữ liệu.');
  const header = lines[0].split(',').map((h) => h.trim());
  const li = header.indexOf(labelColumn);
  if (li < 0) throw new Error(`Không tìm thấy cột nhãn "${labelColumn}".`);
  const names = header.filter((_, i) => i !== li);
  const rows: number[][] = [];
  const y: Label[] = [];
  lines.slice(1).forEach((line, n) => {
    const cells = line.split(',').map((c) => c.trim());
    if (cells.length !== header.length) throw new Error(`Dòng ${n + 2} có ${cells.length} cột, cần ${header.length}.`);
    const isBlank = (c: string) => c === '' || /^(null|na|nan)$/i.test(c);
    const lab = Number(cells[li]);
    if (lab !== 0 && lab !== 1) throw new Error(`Dòng ${n + 2}: nhãn phải là 0 hoặc 1.`);
    const vals = cells.filter((_, i) => i !== li).map((c) => {
      if (isBlank(c)) return NaN;
      const v = Number(c);
      if (!Number.isFinite(v)) throw new Error(`Dòng ${n + 2}: "${c}" không phải số.`);
      return v;
    });
    rows.push(vals);
    y.push(lab);
  });
  return { names, rows, y };
}

export const PIMA = {
  url: '/datasets/diabetes.csv',
  label: 'Outcome',
  vi: {
    Pregnancies: 'Số lần mang thai', Glucose: 'Glucose (mg/dL)', BloodPressure: 'Huyết áp tâm trương (mmHg)',
    SkinThickness: 'Nếp da cơ tam đầu (mm)', Insulin: 'Insulin (µU/mL)', BMI: 'BMI (kg/m²)',
    DiabetesPedigreeFunction: 'Hệ số tiền sử gia đình (DPF)', Age: 'Tuổi',
  } as Record<string, string>,
  /** Các cột mà giá trị 0 không hợp lý về sinh lý, thường là mã hóa cho "thiếu". */
  zeroMeansMissing: ['Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI'],
};
