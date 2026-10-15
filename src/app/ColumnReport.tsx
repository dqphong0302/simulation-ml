import type { ColumnInfo, FreeTable } from '../core/datasets/freecsv';
import './column-report.css';
import { encodedLevels } from '../core/datasets/customCsv';

type Status = 'use' | 'encode' | 'drop' | 'target' | 'idle';
interface Row { name: string; detected: string; action: string; notes: string[]; status: Status }

const ROLE_TEXT = { id: 'Mã định danh (ID, họ tên)', date: 'Ngày tháng', constant: 'Chỉ có 1 giá trị', text: 'Văn bản tự do' } as const;
const DROP_WHY = {
  id: 'Loại: mã định danh không phải số đo, dùng sẽ làm mô hình học "thuộc lòng" từng người.',
  date: 'Loại: ngày tháng không tự là biến liên tục; cần tách thành tuổi, khoảng thời gian… trong notebook.',
  constant: 'Loại: không mang thông tin để phân biệt.',
  text: 'Loại: quá nhiều giá trị khác nhau để mã hóa.',
} as const;

/** Mô tả cách hệ thống đọc và xử lý từng cột, để không cột nào bị bỏ hay đổi âm thầm. */
export function columnReport(table: FreeTable, cols: ColumnInfo[], target = '', used?: string[]): Row[] {
  return cols.map((c) => {
    const notes: string[] = [];
    if (c.missingTokens) notes.push(`${c.missingTokens} ô ghi mã thiếu (“-”, “không rõ”, “N/A”…)`);
    if (c.coerced) notes.push(`${c.coerced} ô không đọc được thành số (ví dụ ${c.coercedExamples.map((x) => `“${x}”`).join(', ')}) → coi là thiếu`);
    if (c.units.length > 1) notes.push(`nhiều đơn vị (${c.units.slice(0, 4).join(', ')}): cần quy đổi trước`);
    if (c.missing && c.role === 'feature' && c.name !== target) notes.push(`${c.missing} ô thiếu → điền median của train`);
    if (c.missing && c.name === target) notes.push(`${c.missing} dòng thiếu nhãn → bỏ khỏi mô hình`);

    const detected = c.role !== 'feature' ? ROLE_TEXT[c.role]
      : c.kind === 'numeric' ? `Số${c.units[0] ? `, đơn vị “${c.units[0]}” (đã bỏ khi đọc)` : ''}${c.decimal === ',' ? ', dấu phẩy thập phân' : ''}`
      : `Phân loại, ${c.unique} mức`;
    if (c.name === target) return { name: c.name, detected, action: 'Cột nhãn: giá trị mô hình cần dự đoán', notes, status: 'target' };
    if (c.role !== 'feature') return { name: c.name, detected, action: DROP_WHY[c.role], notes, status: 'drop' };
    if (c.kind === 'numeric') {
      const on = !used || used.includes(c.name);
      return { name: c.name, detected, action: on ? 'Dùng làm biến số' : 'Dùng được, đang không chọn', notes, status: on ? 'use' : 'idle' };
    }
    const enc = encodedLevels(table, c);
    if (!enc) return { name: c.name, detected, action: `Loại: hơn 12 mức, mã hóa sẽ tạo quá nhiều biến.`, notes, status: 'drop' };
    const names = enc.levels.map((l) => `${c.name} = ${l}`), on = !used || names.some((n) => used.includes(n));
    const action = enc.levels.length === 1
      ? `Mã hóa 0/1: “${enc.levels[0]}” = 1, “${enc.base}” = 0`
      : `Mã hóa one-hot: ${enc.levels.length} cờ 0/1, mức gốc “${enc.base}”`;
    return { name: c.name, detected, action: on ? action : `${action} (đang không chọn)`, notes, status: on ? 'encode' : 'idle' };
  });
}

export function ColumnReport({ table, cols, target, used, open = false }: { table: FreeTable; cols: ColumnInfo[]; target?: string; used?: string[]; open?: boolean }) {
  const rows = columnReport(table, cols, target, used);
  const count = (s: Status) => rows.filter((r) => r.status === s).length;
  const issues = rows.reduce((n, r) => n + r.notes.length, 0);
  return <details className="col-report" open={open}>
    <summary>
      <span>Hệ thống đã xử lý từng cột thế nào</span>
      <span className="cr-chips">
        <b className="cr-use">{count('use')} dùng</b>
        {!!count('encode') && <b className="cr-encode">{count('encode')} mã hóa</b>}
        {!!count('drop') && <b className="cr-drop">{count('drop')} loại</b>}
        {!!issues && <b className="cr-note">{issues} ghi chú</b>}
      </span>
    </summary>
    <p className="muted">Kiểu cột được suy ra từ nội dung, không phải từ tên. Mọi bước điền thiếu và chuẩn hóa chỉ tính trên tập train, sau khi đã chia train/validation/test.</p>
    <div className="import-table"><table className="tbl cr-table">
      <thead><tr><th>Cột</th><th>Nhận diện</th><th>Cách xử lý</th></tr></thead>
      <tbody>{rows.map((r) => <tr key={r.name} className={`cr-${r.status}`}>
        <td>{r.name}</td><td>{r.detected}</td>
        <td>{r.action}{r.notes.map((n) => <small key={n}>{n}</small>)}</td>
      </tr>)}</tbody>
    </table></div>
  </details>;
}
