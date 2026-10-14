export interface Question { prompt: string; options: string[]; answer: number; explanation: string }
export interface Guide {
  idea: string;
  takeaways: string[];
  vocabulary: [string, string][];
  case: string;
  experiment: [string, string, string, string];
  questions: Question[];
}
export const CORE_LESSONS = ['EDA', 'DATA', 'KNN', 'TREE', 'LOGREG', 'COMPARE', 'TEACHABLE', 'GENCON', 'GENAI', 'RAG'];
export const PATH = [
  { id: 'INTRO', title: 'AI trong y khoa', href: '#/intro', outcome: 'Phân biệt AI, học máy và AI tạo sinh; nhận ra việc nào cần người kiểm tra.' },
  { id: 'EDA', title: 'Đọc và hiểu dữ liệu', href: '#/eda', outcome: 'Nhận diện hàng, cột, đơn vị và dấu hiệu chất lượng dữ liệu.' },
  { id: 'DATA', title: 'Làm sạch và chia tập', href: '#/data', outcome: 'Phân biệt ô thiếu với số 0; hiểu train, validation, test và rò rỉ dữ liệu.' },
  { id: 'KNN', title: 'Học từ các điểm gần nhau', href: '#/ml/knn', outcome: 'Dự đoán bằng láng giềng và giải thích tác động của k.' },
  { id: 'TREE', title: 'Học bằng câu hỏi phân nhánh', href: '#/ml/tree', outcome: 'Đọc một cây và phát hiện dấu hiệu học thuộc dữ liệu.' },
  { id: 'LOGREG', title: 'Đọc xác suất và ngưỡng', href: '#/ml/logistic', outcome: 'Phân biệt bỏ sót với cảnh báo thừa khi đổi ngưỡng.' },
  { id: 'COMPARE', title: 'Đánh giá mô hình', href: '#/ml/compare', outcome: 'So sánh công bằng trên cùng dữ liệu và hiểu giới hạn của accuracy.' },
  { id: 'GENCON', title: 'Hiểu AI tạo sinh', href: '#/genai/concepts', outcome: 'Hiểu token, lấy mẫu và vì sao câu trả lời trôi chảy vẫn có thể sai.' },
  { id: 'RAG', title: 'Kiểm tra câu trả lời và nguồn', href: '#/rag', outcome: 'Đối chiếu khẳng định với đoạn gốc; có thể học bằng ví dụ offline.' },
  { id: 'PROJECT', title: 'Bài tập tổng hợp', href: '#/project', outcome: 'Viết báo cáo ngắn: dữ liệu, mô hình, sai sót, giới hạn và cách kiểm tra.' },
];
export const STUDY_PROMPTS = ['Dự đoán trước khi thử', 'Chỉ đổi một yếu tố', 'Quan sát và ghi bằng chứng', 'Giải thích và liên hệ y khoa'];
export const PASS_SCORE = 2;
