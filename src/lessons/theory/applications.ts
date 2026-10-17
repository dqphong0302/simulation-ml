import type { TheoryCore } from './curriculum';

export const APPLICATION_CORE: Record<string, TheoryCore> = {
  BOOST: {
    goals: ['Mô tả vì sao cây sau phụ thuộc mô hình trước.', 'Phân biệt số cây với learning rate.', 'So sánh Boosting với Forest trên cùng dữ liệu và tập chia.'],
    mechanism: 'Gradient Boosting cộng các cây nhỏ tuần tự để cải thiện một hàm mất mát. Với log-loss nhị phân, tính điểm F, chuyển qua sigmoid thành p, rồi fit cây theo gradient âm y−p. Cây sau bổ sung vào điểm, không chỉ học các dòng bị phân loại sai. Random Forest học cây trên bootstrap rồi tổng hợp, không theo chuỗi sửa gradient này.',
    example: 'Một mẫu giả có y=1, p=0,5 nên gradient âm bằng 0,5. Nếu lá cây trả 0,4 và learning rate=0,1, điểm F=0 tăng thành 0,04. Sigmoid(0,04)≈0,510. Cây dự đoán một cập nhật điểm, không phải cộng 0,04 trực tiếp vào xác suất.',
    mistake: 'Thêm cây không bảo đảm validation tốt hơn. Learning rate nhỏ không tự tránh overfit và có thể cần nhiều cây hơn. Boosting không tự chữa nhãn sai, rò rỉ hoặc thiếu nhóm bệnh nhân; không mặc định hơn Forest cho mọi bảng.',
    practice: 'Giữ dữ liệu và seed, đổi số cây từ 10 lên 40. Ghi log-loss train/validation. Sau đó giữ số cây, đổi learning rate. So với Forest trên cùng split và nêu khác biệt độ phức tạp; không chọn cấu hình theo test.',
    answer: 'Train loss giảm còn validation xấu đi gợi ý cần kiểm tra overfit hoặc khác biệt dữ liệu. So hai họ mô hình cần ngân sách chọn tham số tương xứng, cùng metric và kiểm tra độc lập sau lựa chọn.',
    scope: 'Web học 60 cây một ngưỡng theo gradient log-loss với bước cố định; điều khiển số cây chỉ chọn tiền tố của chuỗi đó. Median được học từ train. Forest đối chiếu có 30 cây depth 3, chưa phải tối ưu ngân sách công bằng. Notebook dùng scikit-learn nên cập nhật lá và kết quả không giống hệt web.',
    sources: [['scikit-learn — Gradient Boosting', 'https://scikit-learn.org/stable/modules/ensemble.html#gradient-boosting'], ['scikit-learn — tránh rò rỉ dữ liệu', 'https://scikit-learn.org/stable/common_pitfalls.html']],
  },
  TRANSFER: {
    goals: ['Phân biệt pretraining, học đầu phân loại và fine-tuning.', 'Xác định khối nào thay đổi khi đóng băng hoặc mở mạng.', 'Kiểm tra dữ liệu đích khác nguồn và giới hạn chuyển giao.'],
    mechanism: 'Mô hình đã học trước cung cấp bộ trích xuất đặc trưng. Thay đầu ra cho nhiệm vụ mới, đóng băng bộ trích xuất rồi học đầu phân loại. Có thể mở một số lớp và học tiếp với learning rate nhỏ. Fine-tuning thật sự cập nhật trọng số đã học; thêm ngữ cảnh cho chatbot không phải fine-tuning.',
    example: 'Trọng số w=0,8, gradient=0,3, learning rate=0,01 cho w mới=0,797 khi khối được mở. Khi đóng băng, w vẫn bằng 0,8. Đây là phép tính giả định một gradient, không là điểm accuracy hay mức nguy cơ bệnh.',
    mistake: 'Học sẵn trên ảnh tự nhiên không chứng minh phù hợp ảnh y khoa. Đổi nền, máy chụp hoặc bệnh viện có thể làm dự đoán đổi. Đóng băng gradient không tự giữ thống kê BatchNorm; cần quản lý train/eval và bộ tối ưu đúng các tham số được mở.',
    practice: 'Trong web, cập nhật một bước ở chế độ học đầu rồi thử chế độ fine-tune, ghi khối nào đổi. Trong Colab chạy pretrain nguồn → học đầu đích → mở khối cuối; đo mức thay đổi trọng số, validation và chỉ đánh giá test sau khi cố định cấu hình.',
    answer: 'Ở giai đoạn học đầu, backbone đóng băng còn đầu mới thay đổi. Khi fine-tune, chỉ phần được mở tham gia cập nhật. Điểm tăng hay giảm trên miền đích phải đo, không suy ra từ việc model có nhiều tham số hoặc đã pretrain.',
    scope: 'Web minh họa số học bằng gradient đặt trước, không huấn luyện ảnh. Teachable Machine liên kết dùng MobileNet học sẵn để học đầu phân loại, chưa fine-tune backbone. Notebook offline thật sự pretrain CNN nhỏ trên ảnh hình học nguồn rồi chuyển sang ảnh đích tổng hợp; đó không phải pretrained ImageNet hay nghiên cứu bệnh nhân.',
    sources: [['PyTorch — Transfer Learning for Computer Vision', 'https://docs.pytorch.org/tutorials/beginner/transfer_learning_tutorial.html'], ['TensorFlow — Transfer learning and fine-tuning', 'https://www.tensorflow.org/tutorials/images/transfer_learning']],
  },
  SEG: {
    goals: ['Phân biệt nhãn toàn ảnh với mặt nạ từng pixel.', 'Tính Dice/IoU từ vùng giao và vùng sai.', 'Giải thích ngưỡng, nhãn tham chiếu và sai số biên.'],
    mechanism: 'Phân loại trả một nhãn cho ảnh; phân đoạn trả nhãn cho từng pixel. U-Net có nhánh encoder giảm kích thước, decoder đưa về bản đồ đầu ra và skip connection nối đặc trưng cùng độ phân giải. Với nhiệm vụ hai lớp, sigmoid cho điểm từng pixel; ngưỡng biến điểm thành mặt nạ, không tự xác nhận tổn thương.',
    example: 'Mặt nạ dự đoán có 8 pixel dương, tham chiếu có 10, giao nhau 6: TP=6, FP=2, FN=4. Dice=12/18≈0,667; IoU=6/12=0,5. Pixel nền còn lại không vào hai công thức này. Dice và IoU không phải sensitivity của bệnh nhân.',
    mistake: 'Pixel accuracy có thể cao khi phần lớn ảnh là nền. Dice cao chưa chứng minh biên đủ chính xác hoặc không bỏ sót cấu trúc nhỏ. Nhãn chuyên gia cũng có bất đồng; cần mô tả quy trình gán nhãn, không gọi mọi mask là chân lý tuyệt đối.',
    practice: 'Giữ ảnh và bản đồ điểm, tăng ngưỡng rồi ghi TP/FP/FN, Dice và IoU. Sau đó giữ ngưỡng và dịch tâm minh họa. Trong notebook, huấn luyện U-Net nhỏ trên các hình tổng hợp; giữ riêng validation/test và xem ảnh, mask cùng vùng sai.',
    answer: 'Tăng ngưỡng làm tập pixel dương không lớn thêm, nhưng Dice có thể tăng hoặc giảm tùy tham chiếu. Với cả hai mask trống, bài này quy ước Dice/IoU=1 và phải báo quy ước. Không chọn ngưỡng theo test rồi báo đó là kiểm tra độc lập.',
    scope: 'Web dùng ảnh 16×16 và điểm công thức, chưa học U-Net, không đọc Excel hay ảnh bệnh nhân. Notebook huấn luyện U-Net rút gọn một tầng xuống/lên, có skip connection, trên ảnh tổng hợp 16×16. Ví dụ không đại diện X-quang, CT hay MRI; cần chia bệnh nhân/khối ảnh đúng khi ứng dụng thực tế.',
    sources: [['Ronneberger và cộng sự — U-Net', 'https://arxiv.org/abs/1505.04597'], ['TensorFlow — Image segmentation', 'https://www.tensorflow.org/tutorials/images/segmentation']],
  },
};

export const APPLICATION_THEORY: Record<string, string> = {
  BOOST: `## Điểm cộng dồn và hàm mất mát
$$ F_m(x) = F_(m−1)(x) + η h_m(x); p(x) = sigmoid(F_m(x))
Gradient âm của binary log-loss theo F là y−p. Web fit stump bằng bình phương sai số lên gradient này, rồi dùng bước η cố định. Đây là một biến thể minh họa gradient boosting, không phải toàn bộ thuật toán tối ưu lá của scikit-learn hoặc XGBoost.
## Boosting khác bagging
Random Forest dùng bootstrap và chọn biến ngẫu nhiên tại nút. Boosting tạo chuỗi cây phụ thuộc mô hình trước. Cả hai có thể overfit hoặc học lối tắt. Không so chỉ bằng số cây vì độ sâu, cách fit và chi phí khác nhau.
## Chọn tham số và kiểm tra dữ liệu y khoa
Learning rate, số cây, độ sâu và early stopping chọn trong train/validation hoặc CV thích hợp. Mỗi fold fit lại pipeline. Với nhiều lần khám, chia theo bệnh nhân; với dùng tương lai, cân nhắc thời gian và mốc kết cuộc. Lab web vẫn chia theo dòng; không gọi điểm lab là thẩm định bệnh viện.
## Bảng kết quả cần báo
Ghi nguồn, số người/dòng, nhãn dương, split, metric và cấu hình. So baseline, Forest và Boosting cùng dữ liệu. Log-loss là sai số xác suất, không tự là thước đo calibration thuần túy hoặc lợi ích điều trị.`,
  TRANSFER: `## Ba giai đoạn cần phân biệt
1. Pretraining: học bộ biểu diễn từ nhiệm vụ nguồn. Nguồn có thể là ImageNet hoặc bài toán riêng, phải nêu rõ.
2. Feature extraction: giữ backbone, học đầu mới trên train đích.
3. Fine-tuning: mở một phần hoặc toàn bộ backbone, cập nhật bằng dữ liệu train đích.
## Đóng băng không chỉ là một nút
Trong PyTorch, requires_grad=False ngăn tính gradient tham số. Optimizer phải chứa đúng tham số được mở; khi đổi giai đoạn có thể tạo optimizer mới. eval() điều khiển Dropout/BatchNorm, không tự đóng băng mọi tham số. Nếu giữ BatchNorm cố định, đặt backbone.eval() trong vòng lặp học đầu.
## Thẩm định miền đích
Giữ test đích ngoài việc chọn checkpoint, learning rate và số epoch. Ảnh biến đổi từ cùng ảnh gốc phải cùng tập; trong y khoa, tất cả ảnh của cùng bệnh nhân cần xử lý nhóm theo mục tiêu đánh giá. Báo cả hiệu năng theo nơi chụp và loại sai sót, không suy từ điểm nguồn sang đích.
## Giới hạn bài thực hành
Notebook tạo ảnh hình học và pretrain CNN nhỏ ngay trong phiên. Nguồn và đích có ảnh độc lập; màu/nhiễu đích đổi nhưng đây vẫn là ví dụ thuận lợi do người viết thiết kế. Không tải checkpoint công cộng, không huấn luyện từ hồ sơ thật và không chứng minh fine-tuning luôn hơn học từ đầu.`,
  SEG: `## Từ encoder tới mặt nạ
U-Net gốc dùng nhiều mức encoder/decoder. Notebook rút gọn còn một mức để chạy CPU: convolution → pooling → bottleneck → upsample → nối skip → convolution → logits từng pixel. Skip không sao chép nhãn; nó nối đặc trưng từ encoder.
## Dice, IoU và cách gộp
$$ Dice = 2TP/(2TP+FP+FN); IoU = TP/(TP+FP+FN)
Với cùng hai mask không rỗng, Dice=2IoU/(1+IoU). Gộp TP/FP/FN mọi ảnh (micro) không nhất thiết bằng trung bình điểm từng ảnh (macro). Báo cách gộp và quy ước khi không có vùng dương. Trong bài này micro theo pixel, cả hai rỗng cho điểm 1.
## Loss không phải metric cuối
Notebook học BCEWithLogitsLoss trên logits; không sigmoid trước loss này. Khi đánh giá mới sigmoid rồi threshold. Có thể dùng soft Dice loss trong nghiên cứu, nhưng tối ưu loss không bảo đảm biên đúng lâm sàng.
## Đặt câu hỏi đúng với y khoa
Vùng giải phẫu, tổn thương và vật thể là những định nghĩa nhãn khác nhau. Cần chuyên gia và quy trình gán nhãn, kiểm tra sai số biên/kích thước, nhóm hiếm và ảnh không có vùng đích. Chia theo lát ảnh có thể làm cùng bệnh nhân xuất hiện ở train/test; điểm cao từ cách chia đó không chứng minh dùng được cho người mới.`,
};
