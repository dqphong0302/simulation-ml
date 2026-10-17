import { LESSONS, orderLessons } from '../lessons';

export interface TeachingResource {
  id: string;
  title: string;
  href: string;
  outcome: string;
  requirement: string;
}
export interface StationGroup {
  id: string;
  title: string;
  icon: string;
  summary: string;
  prerequisite: string;
  resourceIds: string[];
}

const extra: TeachingResource[] = [
  { id: 'INTRO', title: 'AI trong y khoa: bắt đầu từ đâu?', href: '#/intro', outcome: 'Phân biệt quy tắc, học máy, AI tạo sinh và việc cần người kiểm tra.', requirement: 'Không cần API; cần tải trang trước.' },
  { id: 'LEARNING', title: 'Góc tò mò và lộ trình tự học', href: '#/learning', outcome: 'Thử ba câu hỏi nhỏ và chọn bước học đầu tiên.', requirement: 'Không cần API; tiến độ chỉ lưu trên trình duyệt.' },
  { id: 'PYTHON', title: 'Python & Colab · Buổi 1', href: '#/python', outcome: 'Đọc cell, biến, điều kiện và vòng lặp; tải notebook để thực hành.', requirement: 'Đọc/tải notebook không cần API. Chạy trên Colab cần Internet và tài khoản Google.' },
  { id: 'DATASETS', title: 'Nhập và kiểm tra bảng dữ liệu', href: '#/datasets', outcome: 'Chọn sheet, xem kiểu biến và kiểm tra tương thích trước khi phân tích.', requirement: 'Xử lý tệp tại thiết bị theo giới hạn công bố; chỉ dùng dữ liệu mẫu hoặc đã được phép.' },
  { id: 'PROJECT', title: 'Bài tập tổng hợp', href: '#/project', outcome: 'Viết báo cáo dữ liệu, kết quả, sai sót và giới hạn.', requirement: 'Không cần API cho phần viết báo cáo; không nhập thông tin bệnh nhân.' },
];
export const RESOURCES: TeachingResource[] = [...extra, ...orderLessons(LESSONS).map(lesson => ({
  id: lesson.id, title: lesson.title, href: `#${lesson.path}?tab=lab`, outcome: lesson.goal,
  requirement: lesson.mode === 'Suy luận qua API'
    ? 'Chế độ gọi mô hình cần Internet và API do giảng viên cấu hình. Chỉ gửi nội dung đã được phép; có thể phát sinh phí.'
    : lesson.id === 'TEACHABLE' ? 'Tải thư viện/mô hình trước khi thực hành; webcam chỉ dùng khi người học cho phép. Không dùng ảnh bệnh nhân.'
    : 'Không cần khóa API; cần tải trang và tài nguyên trước. Chưa bảo đảm hoạt động hoàn toàn offline.',
}))];
export const resourceById = (id: string) => RESOURCES.find(resource => resource.id === id);
export const STATION_GROUPS: StationGroup[] = [
  { id: 'start', title: 'Khởi động & tư duy số', icon: 'home', summary: 'Tạo hứng thú, hiểu AI là gì và chọn cách học.', prerequisite: 'Không cần biết lập trình; bắt đầu từ Góc tò mò hoặc AI trong y khoa.', resourceIds: ['LEARNING', 'INTRO', 'PROJECT'] },
  { id: 'python', title: 'Python & Colab', icon: 'file', summary: 'Từ đọc một dòng code tới tự chạy notebook.', prerequisite: 'Biết mở trình duyệt và quản lý tệp tải về.', resourceIds: ['PYTHON'] },
  { id: 'data', title: 'Dữ liệu & thống kê mô tả', icon: 'database', summary: 'Nhận bảng, hiểu biến, mô tả và tiền xử lý đúng cách.', prerequisite: 'Phân biệt hàng/cột, ý nghĩa biến và đơn vị đo.', resourceIds: ['DATASETS', 'EDA', 'DATA'] },
  { id: 'ml', title: 'Machine Learning', icon: 'chart', summary: 'Học từ dữ liệu, so sánh mô hình và phân tích sai sót.', prerequisite: 'Đọc dữ liệu; hiểu train/validation/test trước khi so điểm.', resourceIds: orderLessons(LESSONS.filter(l => l.group === 'ml')).map(l => l.id) },
  { id: 'dl', title: 'Deep Learning & ảnh', icon: 'brain', summary: 'Neuron, CNN, chuyển giao, phân đoạn và attention.', prerequisite: 'Vững cách chia tập và đánh giá; mô hình sinh nâng cao là tùy chọn.', resourceIds: orderLessons(LESSONS.filter(l => l.group === 'dl')).map(l => l.id) },
  { id: 'genai', title: 'GenAI & kiểm chứng nguồn', icon: 'sparkles', summary: 'Token, prompt và RAG; kiểm tra thay vì chỉ tin câu trả lời.', prerequisite: 'Hiểu giới hạn mô hình và không gửi dữ liệu nhạy cảm tới API.', resourceIds: ['GENCON', 'GENAI', 'RAG'] },
];
