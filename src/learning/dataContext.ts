import { guessTarget, inspectColumns } from '../core/datasets/freecsv';
import { labelCandidates } from '../core/datasets/customCsv';
import { modelLimitsFor } from '../core/datasets/importData';
import type { SessionData } from '../core/datasets/session';
import type { Guide } from './model';

export const TABLE_NOTEBOOKS = new Set(['EDA', 'DATA', 'KNN', 'TREE', 'LOGREG', 'COMPARE', 'LINREG', 'KMEANS', 'PCA', 'FOREST', 'SVM', 'MLP']);
const numericLabs = new Set(['DATA', 'LINREG', 'KMEANS', 'PCA', 'AE', 'VAE']);
const tableLabs = new Set([...TABLE_NOTEBOOKS, 'AE', 'VAE']);
const cache = new WeakMap<SessionData, ReturnType<typeof analyze>>();
function analyze(data: SessionData) {
  const columns = inspectColumns(data.table);
  const numeric = columns.filter(c => c.kind === 'numeric');
  const candidates = labelCandidates(columns);
  const guessed = columns.length ? guessTarget(columns) : '';
  const target = candidates.find(c => c.name === guessed)?.name ?? candidates.at(-1)?.name ?? '';
  const flags = columns.filter(c => /(^|[_\s])(id|name|date|time|timestamp)([_\s]|$)|patient|bệnh nhân|ngày|họ tên|ma_bn/i.test(c.name)).map(c => c.name);
  return { columns, numeric, target, flags };
}
export function dataContext(data: SessionData) {
  let result = cache.get(data);
  if (!result) { result = analyze(data); cache.set(data, result); }
  return result;
}
export function compatibility(id: string, path: string, data: SessionData) {
  const c = dataContext(data);
  if (!tableLabs.has(id)) return { suitable: false, reason: 'Bài này dùng ảnh, văn bản hoặc mô phỏng riêng; bảng đã nhập không tự trở thành đầu vào của bài.' };
  if (id === 'EDA') return { suitable: true, reason: 'Có thể khám phá bảng số/chữ, tỷ lệ thiếu và phân bố; chưa cần nhãn.' };
  const count = c.numeric.filter(col => !c.flags.includes(col.name) && (numericLabs.has(id) || col.name !== c.target)).length;
  if (!numericLabs.has(id) && !c.target) return { suitable: false, reason: 'Chưa có cột nhãn với 2–30 giá trị. Có thể bắt đầu bằng EDA, PCA hoặc K-means nếu đủ cột số.' };
  if (count < 2) return { suitable: false, reason: 'Lab web cần ít nhất 2 cột số phù hợp (ngoài nhãn nếu phân loại). Biến chữ cần mã hóa; ngày tháng cần thiết kế đặc trưng riêng.' };
  if (data.table.cells.length < 10) return { suitable: false, reason: 'Lab web cần ít nhất 10 dòng; hãy khám phá bảng bằng EDA trước.' };
  const limits = modelLimitsFor(path);
  if (data.table.cells.length > limits.rows || count > limits.columns) return { suitable: false, reason: `Trước khi chạy lab, cần chủ động chọn mẫu ≤ ${limits.rows} dòng và ≤ ${limits.columns} cột số. Không tự cắt dữ liệu.` };
  return { suitable: true, reason: numericLabs.has(id) ? 'Dùng biến số, không cần nhãn phân loại. Hồi quy cần chọn một cột số làm đầu ra.' : `Cần xác nhận nhãn trong lab. Gợi ý mặc định: “${c.target}”; chọn lớp dương so với phần còn lại, không phải phân loại đa lớp đầy đủ.` };
}
export function adaptGuide(id: string, guide: Guide, data: SessionData | null): Guide {
  if (!data || !tableLabs.has(id)) return guide;
  const c = dataContext(data);
  const features = c.numeric.filter(col => !c.flags.includes(col.name) && (numericLabs.has(id) || col.name !== c.target)).slice(0, 2).map(col => `“${col.name}”`).join(' và ') || 'các cột số sau khi kiểm tra kiểu';
  const context = `Bảng “${data.name}” có ${data.table.cells.length} dòng và ${data.table.names.length} cột. Hãy kiểm tra đơn vị của ${features}${c.target && !numericLabs.has(id) ? ` và định nghĩa nhãn “${c.target}”` : ''}. Không suy ra đây là dữ liệu y khoa từ tên cột; nếu là dữ liệu y tế, phải nêu mốc dự đoán và kết cuộc.`;
  let experiment: Guide['experiment'] = [...guide.experiment];
  if (id === 'EDA') experiment = [`Dự đoán phân bố và tỷ lệ thiếu của ${features}.`, 'Giữ bảng hiện tại; ở phần Phân bố chỉ đổi cột cần phóng to, không chuyển sang Pima.', 'Ghi khoảng giá trị, ô thiếu, số 0 và giá trị cần xác minh; đối chiếu đơn vị trước khi kết luận.', 'Giải thích một khác biệt trong bảng mà không khẳng định nhân quả. Với dữ liệu y tế, phân biệt lần khám và bệnh nhân.'];
  else if (id === 'PCA') experiment = [`Dự đoán thông tin nào của ${features} được giữ trong hai thành phần đầu.`, 'Giữ bảng/seed; chỉ thêm hoặc bỏ một cột số ở phần chọn biến. Không dùng ID làm số đo.', 'Ghi tỷ lệ phương sai giữ lại và hình chiếu; xem biến nào chi phối.', 'Giải thích vì sao phương sai lớn không đồng nghĩa khả năng phân loại hoặc mức bệnh nặng.'];
  else if (id === 'LINREG') experiment = [`Dự đoán mối liên hệ giữa ${features}; tự chọn cột đầu vào và cột số cần dự báo.`, 'Giữ cách chia và đầu ra; chỉ đổi một biến giải thích trong lab.', 'Ghi RMSE, R² trên validation và hình dạng phần dư.', 'Giải thích giới hạn ngoại suy và vì sao hệ số không tự là tác động can thiệp.'];
  else if (id === 'DATA') experiment = [`Dự đoán cách xử lý ô thiếu sẽ ảnh hưởng ${features}.`, 'Dùng bảng hiện tại, giữ các thiết lập khác; chỉ đổi điền median sang xóa dòng thiếu.', 'Ghi số dòng còn lại và phân bố trước/sau. Không tự coi mọi số 0 là thiếu.', 'Giải thích mẫu bị loại có thể khác mẫu còn lại. Với nhiều lần khám, lab chia theo dòng chưa bảo đảm tách bệnh nhân.'];
  else {
    experiment[0] = `Dùng ${features}${c.target ? ` và nhãn đã xác nhận trong lab (gợi ý “${c.target}”)` : ''}. ${guide.experiment[0]}`;
    experiment[1] = `Giữ nguồn “Dữ liệu của bạn: ${data.name}”. ${guide.experiment[1]}`;
    experiment[3] += ' Định nghĩa nhóm dương/âm theo bảng đang dùng, không tự gọi chúng là có bệnh/không bệnh.';
  }
  return { ...guide, case: context, experiment };
}
