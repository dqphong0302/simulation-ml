import type { Guide, Question } from './model';
import { APPLICATION_CORE } from '../lessons/theory/applications';
const question = (prompt: string, options: string[], answer: number, explanation: string): Question => ({ prompt, options, answer, explanation });
const extra: Record<string, Pick<Guide, 'case' | 'vocabulary' | 'experiment' | 'questions'>> = {
  BOOST: {
    case: 'Bảng xét nghiệm giả có thể dùng để thử Boosting/Forest. Điểm validation tốt chưa chứng minh bệnh nhân mới được hưởng lợi; trước hết kiểm tra nhãn, mốc đo và cách chia.',
    vocabulary: [['Gradient âm', 'Hướng thay đổi điểm để giảm loss, với log-loss là y−p.'], ['Learning rate', 'Hệ số nhân cập nhật của mỗi cây.'], ['Stump', 'Cây nhỏ chỉ có một ngưỡng chia.']],
    experiment: ['Đoán log-loss validation khi dùng nhiều cây hơn.', 'Giữ bảng, seed, learning rate; chỉ tăng số cây từ 10 lên 40.', 'Ghi log-loss train/validation và so Forest cùng split; nêu ngân sách khác nhau.', 'Giải thích vì sao giảm loss không tự chứng minh calibration hoặc lợi ích y khoa.'],
    questions: [question('Cây sau trong Gradient Boosting học gì?', ['Cập nhật theo gradient của loss hiện tại', 'Chỉ bỏ phiếu độc lập', 'Nhãn test'], 0, 'Cây được fit theo mục tiêu phụ thuộc mô hình hiện tại, không chỉ các điểm sai nhãn.'), question('Thêm cây chắc chắn cải thiện validation?', ['Có', 'Không', 'Chỉ khi là dữ liệu y khoa'], 1, 'Phải quan sát ngoài train; có thể overfit hoặc học nhiễu.'), question('Chọn số cây bằng tập nào?', ['Test thử nhiều lần', 'Mẫu cần chẩn đoán', 'Validation/CV trong train'], 2, 'Giữ test độc lập với lựa chọn tham số.')],
  },
  TRANSFER: {
    case: 'Bộ trích xuất học trên ảnh tự nhiên không tự thành chuyên gia X-quang. Cần đánh giá miền đích, khác biệt thiết bị và các nhóm bệnh nhân trước mọi suy luận sử dụng.',
    vocabulary: [['Backbone', 'Bộ trích xuất đặc trưng trước đầu ra.'], ['Đóng băng', 'Giữ tham số không được cập nhật gradient.'], ['Fine-tuning', 'Học tiếp một phần hoặc toàn bộ trọng số đã học.']],
    experiment: ['Đoán khối nào đổi khi chỉ học đầu phân loại.', 'Giữ learning rate, bấm một bước ở chế độ đóng băng; sau đó đặt lại và đổi sang fine-tune.', 'Ghi mức thay đổi khối cuối và đầu phân loại; chạy notebook để kiểm tra trọng số thật.', 'Giải thích vì sao pretrained không bảo đảm tốt trên ảnh bệnh viện khác.'],
    questions: [question('Khi chỉ học đầu mới, backbone nên?', ['Luôn học lại tất cả', 'Giữ trọng số theo cấu hình đóng băng', 'Học từ nhãn test'], 1, 'Học đầu dùng đặc trưng giữ nguyên; cần kiểm tra cả trạng thái BatchNorm khi có.'), question('Fine-tuning nghĩa là?', ['Cập nhật trọng số đã học trên nhiệm vụ đích', 'Chỉ thêm tài liệu vào prompt', 'Chỉ đổi tên model'], 0, 'Fine-tuning là huấn luyện tiếp, khác cung cấp ngữ cảnh ở suy luận.'), question('Pretrained tốt ở nguồn bảo đảm tốt ở đích?', ['Có', 'Nếu mạng đủ lớn', 'Không, phải đo'], 2, 'Khác miền và lối tắt có thể làm kết quả xấu đi.')],
  },
  SEG: {
    case: 'Nhãn “có vùng đích” cho cả ảnh khác việc chỉ đúng từng pixel của vùng đó. Trong y khoa cần chuyên gia xác định nhãn và đánh giá biên, không chỉ xem hình tô màu đẹp.',
    vocabulary: [['Mask', 'Mặt nạ chỉ nhãn từng pixel.'], ['Dice', 'Hai lần giao chia tổng số pixel dương hai mask.'], ['Skip connection', 'Nối đặc trưng encoder với decoder cùng độ phân giải.']],
    experiment: ['Đoán mask nhỏ hay lớn khi tăng ngưỡng.', 'Giữ lệch tâm, chỉ tăng ngưỡng từ 0,5 lên 0,7.', 'Ghi TP/FP/FN, Dice và IoU; xem vùng sai, không chỉ pixel accuracy.', 'Giải thích vì sao Dice cao trên ảnh tổng hợp chưa xác nhận đúng tổn thương.'],
    questions: [question('Phân đoạn trả đầu ra gì?', ['Nhãn cho từng pixel', 'Chỉ một nhãn toàn ảnh', 'Y lệnh'], 0, 'Khác phân loại toàn ảnh, mask có độ phân giải không gian.'), question('TP=6, FP=2, FN=4 thì Dice bằng?', ['1', '12/18', '6/18'], 1, 'Dice=2TP/(2TP+FP+FN)=12/18; IoU=6/12.'), question('Đổi ngưỡng có huấn luyện lại mạng không?', ['Luôn có', 'Chỉ khi Dice tăng', 'Không, chỉ đổi mask từ cùng điểm'], 2, 'Trọng số và điểm giữ nguyên; ngưỡng chỉ đổi quyết định pixel.')],
  },
};
export const APPLICATION_GUIDES: Record<string, Guide> = Object.fromEntries(Object.entries(extra).map(([id, detail]) => [id, {
  idea: APPLICATION_CORE[id].mechanism,
  takeaways: [...APPLICATION_CORE[id].goals, APPLICATION_CORE[id].mistake],
  ...detail,
}]));
