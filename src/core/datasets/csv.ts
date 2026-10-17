import type { Label } from '../algorithms/dataset';
import { parseCsvText } from './importData';

export interface RawTable { names: string[]; rows: number[][]; y: Label[] } // thiếu giá trị = NaN

/** Shared CSV framing; missing feature cells become NaN, but missing labels are never a negative class. */
export function parseLabelledCsv(text: string, labelColumn: string): RawTable {
  const table = parseCsvText(text, ',');
  const header = table.names;
  const li = header.indexOf(labelColumn);
  if (li < 0) throw new Error(`Không tìm thấy cột nhãn "${labelColumn}".`);
  const names = header.filter((_, i) => i !== li);
  const rows: number[][] = [];
  const y: Label[] = [];
  table.cells.forEach((cells, n) => {
    const isBlank = (c: string) => c === '' || /^(null|na|nan)$/i.test(c);
    const lab = Number(cells[li]);
    if (!cells[li] || (lab !== 0 && lab !== 1)) throw new Error(`Dòng ${n + 2}: nhãn phải là 0 hoặc 1, không được để trống.`);
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
