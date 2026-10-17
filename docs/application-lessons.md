# Bổ sung ML/DL nhập môn — 16/10/2026

## Phạm vi

Thư viện có 26 bài: 2 nền tảng dữ liệu, 11 ML, 10 DL, 3 GenAI. Đây là số bài học, không phải số thuật toán độc lập: ML còn gồm so sánh mô hình và Teachable Machine.

- BOOST: Gradient Boosting sau Random Forest; web huấn luyện stump theo gradient log-loss, có learning rate, số cây, đường train/validation và Forest đối chiếu. Nhận bảng upload theo cơ chế kiểm tra tương thích sẵn có.
- TRANSFER: học đầu mới, đóng băng và fine-tune khối cuối. Web minh họa cập nhật trọng số; notebook pretrain CNN nhỏ trên ảnh tổng hợp rồi thực sự học chuyển giao. Liên kết Teachable Machine cho bộ trích xuất MobileNet học sẵn.
- SEG: phân loại toàn ảnh khác phân đoạn từng pixel; mặt nạ, TP/FP/FN, Dice/IoU và ngưỡng. Web dùng bản đồ điểm đặt bằng công thức; notebook huấn luyện U-Net một mức có skip connection trên ảnh tổng hợp.
- VAE/GAN/Diffusion vẫn có đầy đủ bài nhưng được tách thành “Khám phá thêm · Không bắt buộc”. Giữ lộ trình bắt buộc và tiến độ cũ; ba bài ứng dụng là nhánh bổ sung có liên kết.

Mỗi bài mới có lý thuyết cơ bản/mở rộng, ví dụ tính tay, câu hỏi/đáp án, nguồn riêng, thumbnail, mô phỏng, bài thực hành, 3 câu quiz, notebook tải xuống và 6 slide có lời đọc VieNeu Duyên Hà My. Tổng hợp 18 clip mới thành công; manifest chính và fallback khớp kịch bản.

## Giới hạn cần giữ rõ

- Số bài đã đủ rộng cho nhập môn; không đặt mục tiêu liệt kê mọi thuật toán. Ưu tiên bài tập đọc dữ liệu, chống rò rỉ và giải thích sai sót, không thêm độ khó bắt buộc cho sinh viên năm nhất.
- Mô phỏng không được giới thiệu thành mô hình y khoa đã huấn luyện. Không chứng minh lợi ích lâm sàng bằng dữ liệu tổng hợp.
- Notebook Boosting dùng scikit-learn, khác cập nhật lá của web; không hứa hai nơi có loss bằng nhau. So Forest chưa cân bằng ngân sách tối ưu.
- Notebook chuyển giao không tải ImageNet. Fine-tuning không bảo đảm tốt hơn học từ đầu. Teachable Machine chỉ học đầu, không fine-tune backbone.
- Web SEG không học U-Net; notebook có U-Net rút gọn, không phải toàn bộ kiến trúc gốc. Dice/IoU dùng quy ước cả hai mask trống bằng 1.
- Tab cỡ mẫu TRANSFER/SEG chỉ là thí nghiệm thay thế được ghi rõ, không phải học lại CNN/U-Net trên ảnh thật.
- Nhập bảng không đồng nghĩa mọi bài hỗ trợ mọi kiểu tệp: ảnh, văn bản, chuỗi thời gian và bảng cần pipeline riêng. Không thêm backend hay hệ thống lâm sàng.

## Xác minh

- `NOTEBOOK_PYTHON=/tmp/simulation-notebook-check.hxXY3L/venv/bin/python pnpm test`: 110/110 đạt, 13 file. Bao gồm thực thi 26 notebook mẫu và 13 notebook thích ứng trên CPU offline.
- `pnpm build`: type-check/build đạt; còn cảnh báo chunk trên 500 kB.
- `test:applications`: 3 lab × 3 viewport, thay đổi tham số, cập nhật trọng số, mặt nạ/metric, quiz, fallback slide khi manifest trả 503, nhóm tùy chọn, đường dẫn và upload CSV vào Boosting; không lỗi trang/yêu cầu mạng ngoài dự kiến.
- `test:ui`, `test:adaptive`, `test:python`, `test:imports`, `test:learning`, `test:python-basics` và `tests/theory.browser.mjs`: đạt. Theory kiểm tra đủ 26 bài; nhập tệp vẫn kiểm tra XLS/XLSX/CSV/JSON và giới hạn 200.000 dòng.
- `test:lectures`: 26/26 bài đạt, từng slide ở 3 viewport; phát/tạm dừng audio, URL, caption và thời lượng thực tế khớp manifest, không tràn ngang hoặc lỗi trang.
- Đã xem screenshot catalog mobile và lab desktop/mobile; sửa nút liên kết MobileNet tràn ngang ở 390 px, không che lỗi bằng cắt overflow toàn trang.
- Công cụ review bổ sung không thấy vấn đề ở bước regex security; lint không chạy được do repo chưa có eslint.config.*. Không xem đây là audit an toàn toàn diện; type-check và kiểm thử ở trên là bằng chứng riêng.

Chưa commit/push/deploy trong đợt bổ sung này. Các thay đổi sẵn có và clip cũ được giữ nguyên.
