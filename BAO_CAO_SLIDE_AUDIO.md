# Kiểm tra bài giảng và audio — 13/10/2026

## Cập nhật: bỏ phần bài làm, bổ sung bài Khám phá dữ liệu

- Bỏ tính năng bài làm/nộp bài. Slide cuối của 22 bài đổi từ "Bài nộp: …" thành "Tổng kết: …" (tự kiểm tra, không nộp); sửa thêm câu
  ở DATA (cảnh s3), GENAI (extended-1) và SVM (extended-4). Lời mới: `scripts/lecture-revisions.json`; tạo lại audio chỉ cho câu đổi lời:
  `node scripts/revise-lecture-audio.mjs [--dry] [BÀI…]` (cùng giọng Duyên Hà My, cùng cách đặt tên clip theo mã băm, dọn clip cũ không dùng).
- Bài mới EDA (Khám phá dữ liệu: thống kê mô tả) có 8 slide audio; kịch bản `src/lessons/eda-script.json`.
- `scripts/lecture-expansions.mjs` và `public/audio/guide/data/manifest.json` đã đồng bộ với lời mới.
- Tài liệu lý thuyết (`src/lessons/theory/`) bổ sung ví dụ tính tay khớp số liệu trên slide và các mục giới hạn/đọc kết quả thận trọng.

## Đã hoàn tất

- 17 bài có bản mở rộng 8 slide: DATA, KMEANS, PCA, LINREG, FOREST, SVM, COMPARE, MLP, CNN, ATTN, GPT, AE, DIFF, VAE, GAN, GENCON, GENAI.
- RAG đã xuất bản đủ 8 slide (3 clip cũ + 5 clip mở rộng).
- KNN, TREE, LOGREG đã xuất bản 11 slide: giữ 7 cảnh tương tác cũ và thêm 4 slide bổ sung mỗi bài.
- TEACHABLE đã có manifest audio 8 slide (trước đây chỉ có bản đọc chữ).
- Audio mới dùng đúng profile Duyên Hà My `6265e356b8a9` (alias `clone-duyenhamy`). Thời lượng lấy từ ffprobe, không ước lượng.
- Mỗi bài thêm định hướng, ví dụ tính toán hoặc tình huống, thí nghiệm, bẫy diễn giải và slide tổng kết (tự kiểm tra). Kịch bản tại `scripts/lecture-expansions.mjs`.
- Slide 16:9 có mũi tên qua lại (không còn mục lục dạng dropdown); giữ mô phỏng tương tác của KNN, Tree, Logistic. Sửa câu hỏi tương tác Logistic lệch một cảnh.
- Bài DATA có audio đủ 8 slide, không còn thông báo thiếu giọng.
- Cả 22 bài có audio đang xuất bản đã được kiểm tra từng slide ở 1440, 768, 390 px: phát audio, phụ đề, thời lượng, một phần tử audio duy nhất và không tràn ngang ở trạng thái đứng yên/giảm chuyển động. Không phát hiện lỗi JavaScript.

## Đã giải quyết

- Dịch vụ VieNeu trả health OK và tổng hợp được; đã chạy `node scripts/expand-lecture-audio.mjs RAG KNN TREE LOGREG TEACHABLE` để hoàn tất các bài còn thiếu, giữ nguyên audio và manifest cũ.
- Kiểm tra toàn bộ manifest trong `public/audio/lectures-v2`: 185 cảnh / 22 bài, audio tồn tại, thời lượng khớp ffprobe, phụ đề và preset đầy đủ, không trùng mã cảnh.
- Còn lại: nghe duyệt thủ công phát âm trước khi giảng dạy chính thức.

## Điểm cần lưu ý

- KNN, TREE, LOGREG có 11 cảnh nên hàng chấm `scene-dots` tràn ngang 3 px ở khổ 390 px. Cần xử lý ở tầng giao diện (ngoài phạm vi bổ sung nội dung này).

## Kiểm thử

- `node tests/lectures.browser.mjs`: rà từng slide và audio của mọi bài đang xuất bản.
- `node tests/teachable.browser.mjs`: huấn luyện thật bằng thư viện, dự đoán, xuất ZIP, vô hiệu hóa mô hình khi sửa dữ liệu; kiểm tra không gửi request ra ngoài origin.
- `node tests/teachable-webcam.browser.mjs`: webcam giả lập của trình duyệt để kiểm tra bật có chủ ý, chụp mẫu, tắt và giải phóng camera khi chuyển trang; chưa thay thế kiểm tra webcam vật lý.
- `node tests/learning-ui.browser.mjs`: trang chủ và các thao tác bài giảng chính.
- Kiểm tra phát được không đồng nghĩa đã nghe và đối chiếu thủ công toàn bộ lời đọc. Nên nghe duyệt phát âm trước khi giảng dạy chính thức.

## Teachable Machine chạy tại chỗ

- Route: `/#/ml/teachable?tab=lab`.
- Thư viện chính thức @teachablemachine/image 0.8.5, TensorFlow.js 1.3.1 và trọng số MobileNet được lưu cùng website; không iframe hoặc điều hướng sang Google để huấn luyện.
- Tạo 2–5 lớp, thêm ảnh hoặc chụp webcam, train/validation loss, thử ảnh mới, tải mô hình ZIP.
- Giới hạn: chỉ ảnh, chưa có âm thanh/tư thế; ảnh và mô hình đang học không được lưu nháp khi rời trang; ZIP mô hình không chứa ảnh gốc.
- Không dùng dữ liệu nhạy cảm. Validation nội bộ không phải test độc lập. Điểm softmax không phải độ chính xác.
