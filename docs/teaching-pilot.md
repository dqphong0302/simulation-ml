# Thử nghiệm giảng dạy: AI/ML trong y khoa

## Mục tiêu và phạm vi
Học liệu giúp người mới đọc dữ liệu, hiểu cách mô hình học, nhận diện sai sót và kiểm tra nguồn. Không chứng nhận năng lực chẩn đoán. Lộ trình học tập có 10 bước; mô hình nâng cao là tùy chọn. Python không phải điều kiện để bắt đầu.

## Kế hoạch thử với sinh viên
Chưa tiến hành thử nghiệm với lớp học thật. Giảng viên có thể thử một nhóm nhỏ trước khi mở rộng:

1. Trước học: hỏi AI/ML/GenAI khác nhau thế nào, 95% accuracy có thể bỏ sót bệnh không, câu trả lời có trích dẫn đã đủ đúng chưa.
2. Buổi đầu: Intro, EDA, DATA; dùng dữ liệu mẫu, không dùng bệnh án thật.
3. Buổi tiếp: KNN, TREE, LOGREG; cho sinh viên dự đoán trước khi đổi một tham số.
4. Buổi tổng hợp: COMPARE, GENCON, RAG và báo cáo ngưỡng 0,5/0,3. Có thể truy xuất BM25 offline; không bắt buộc API trả phí.
5. Sau học: hỏi lại khái niệm bằng tình huống mới; chấm báo cáo bằng bằng chứng và giải thích, không chỉ điểm trắc nghiệm.

## Quan sát cần ghi
- Thời gian hoàn thành từng bước; thuật ngữ gây vướng; vị trí sinh viên cần trợ giúp.
- Có phân biệt train/validation/test, FN/FP, xác suất token/nguy cơ bệnh không?
- Có nhận ra leakage giữa lần khám cùng bệnh nhân và nguồn không hỗ trợ khẳng định không?
- Lỗi thao tác, tải notebook, đọc trên điện thoại; không thu thông tin sức khỏe cá nhân.

## Rubric báo cáo, mỗi mục 0–2 điểm
- Câu hỏi/nguồn dữ liệu: 0 thiếu; 1 có nhưng mơ hồ; 2 rõ và nêu dữ liệu giả lập.
- Thí nghiệm: 0 không mô tả; 1 có kết quả thiếu cấu hình; 2 lặp lại được, chỉ đổi một yếu tố.
- Sai sót: 0 chỉ accuracy; 1 nêu FP/FN thiếu bằng chứng; 2 có số và giải thích đánh đổi.
- Giới hạn: 0 kết luận sử dụng lâm sàng; 1 có cảnh báo chung; 2 nêu giới hạn cụ thể và kế hoạch thẩm định ngoài/phân nhóm.

Điểm trên web là tự kiểm tra, không phải rubric này. Tiến độ lưu ở trình duyệt, không có tài khoản/LMS hay đồng bộ lớp. Báo cáo Markdown tải về để nộp riêng. Không tuyên bố hiệu quả đào tạo trước khi có kết quả thử nghiệm.

## Ưu tiên tiếp theo sau thử nghiệm
1. Điều chỉnh thời lượng, thuật ngữ và hướng dẫn dựa trên lỗi thật của sinh viên.
2. Thêm bộ tình huống dùng cùng dữ liệu y khoa tổng hợp xuyên suốt các bài cơ bản.
3. Nếu dùng cho cả lớp: quản lý nộp bài/LMS, export tiến độ; backend API giới hạn quyền và chi phí.
4. Kiểm thử accessibility với người dùng bàn phím/đọc màn hình, chưa coi kiểm tra tự động là đủ.
