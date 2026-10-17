# Rà soát và refactor code — 17/10/2026

## Phạm vi nghiệm thu

Yêu cầu: kiểm tra lỗi, sửa lỗi và refactor để dễ bảo trì/nâng cấp. Giữ sáu nhóm hiện có, các đường dẫn và học liệu đang dùng; không thêm backend, không thay framework, không push/deploy. Worktree đã có nhiều thay đổi trước đợt này; chúng được bảo toàn.

Các yêu cầu được đối chiếu bằng code hiện tại, unit, type-check/build và luồng chạy thật: nhập dữ liệu; ML/DL; bài giảng/audio; notebook; tiến độ; giáo án/phiếu; kết nối API/RAG; đóng/hủy tác vụ và tài nguyên.

## Lỗi đã sửa và bằng chứng

| Khu vực | Lỗi / rủi ro đã tái hiện | Sửa và kiểm chứng |
| --- | --- | --- |
| Chat streaming | Mất sự kiện cuối không có newline; tiếp tục sau `[DONE]`; error envelope bị coi là thành công rỗng | Tách bộ đọc SSE; xử lý EOF, CR/LF, UTF-8 qua nhiều chunk; đóng reader; unit và trình duyệt với endpoint mock |
| Embedding | Chấp nhận index trùng/ngoài phạm vi, vector rỗng/sai số chiều/không phải số | Kiểm tra contract và thứ tự theo index; lỗi JSON/abort có kiểu; từ chối khác số chiều giữa lô và lúc truy xuất |
| Cấu hình API | Trộn trực tiếp JSON chưa kiểm tra kiểu vào state; sửa đối tượng của caller khi đổi endpoint; thiếu thông báo cho subscriber khi khôi phục | Tách parser/serializer allowlist, không serialize key; cập nhật bất biến và notify; unit + khôi phục trên trình duyệt |
| Chỉ số ML | F1 trả `null` khi TP=0 nhưng FP/FN>0; đầu vào lệch số mẫu bị tính âm thầm | Công thức theo confusion counts, kiểm tra đầu vào; ROC tích lũy theo nhóm score bằng nhau, O(n log n); kiểm tra AUC với cách so sánh từng cặp độc lập |
| CSV | RAG không đọc đúng ô có dấu phân cách/xuống dòng trong ngoặc kép; CSV nhị phân coi nhãn trống là 0 | Dùng chung `CsvStreamParser`/`parseCsvText`, giữ kiểm tra kích thước/cấu trúc; unit và hồi quy nhập dữ liệu |
| RAG bất đồng bộ | Tác vụ dùng chung controller; kết quả/câu trả lời cũ còn lại sau khi đổi tài liệu, câu hỏi hoặc cấu hình; thêm tệp có thể ghi đè danh sách từ closure cũ | `latestTask` và hook sở hữu tác vụ riêng, hủy khi unmount; reducer tài liệu; xóa kết quả hết hiệu lực; kiểm tra race và consent trên trình duyệt |
| PDF/OCR | Không giải phóng tài liệu khi lỗi; OCR giữ tất cả canvas; worker khởi tạo sau khi hủy có thể không được terminate | `finally` giải phóng loading task; OCR render/nhận dạng từng trang; cleanup khi thành công/lỗi/hủy; unit vòng đời và PNG OCR, DOCX/PDF reader chạy thật |
| Giáo án | Rời bằng liên kết/đóng trang có thể mất nháp; bản sửa ở tab khác bị ghi đè | Dùng chung hook cảnh báo với xưởng; kiểm tra xung đột trước lưu, mở lại bản mới nhất; giữ nháp khi lỗi. Đây không phải cơ chế khóa phân tán/đồng bộ đa người dùng |
| Bản sao JSON | Kiểm tra ký tự không khớp giới hạn byte của File; pretty-print có thể tạo tệp lớn hơn giới hạn nhập | Dùng chung giới hạn UTF-8; tự chọn JSON gọn nếu chỉ khoảng trắng làm vượt 1 MB; test biên tiếng Việt và roundtrip |

## Refactor và nâng cấp bảo trì

- `src/app/LabRouter.tsx`: registry lab có/không cần dữ liệu, lazy-load từng module. Bài giảng và Python Guide cũng tải khi cần. `App.tsx` tập trung điều hướng/shell.
- `src/core/providers/sse.ts`, `errors.ts`: tách framing và kiểu lỗi khỏi nghiệp vụ Chat Completions.
- `src/core/security/profiles.ts`: hợp đồng lưu/khôi phục cấu hình, không có API key.
- `src/core/async/latestTask.ts`, `src/app/useLatestTask.ts`: sở hữu tác vụ và bỏ kết quả cũ dùng chung cho GenAI/RAG.
- `src/app/useUnsavedChanges.ts`, `src/teaching/mergeSession.ts`, `src/core/reporting/portableJson.ts`: tái sử dụng guard, phát hiện xung đột và giới hạn bản sao.
- `tests/browser.config.mjs`: một `BASE_URL` cho mọi bộ kiểm tra; sửa selector webcam cũ `.hero` sang `#home-title` hiện tại. Không nới assertion dừng media stream.
- `pnpm check`: unit + type-check/build. `pnpm test:browser`: tự tìm toàn bộ `*.browser.mjs`, kiểm tra server trước chạy, dừng và báo khi một suite lỗi.

## Kết quả xác minh

- Trước sửa: 118 unit đạt; bộ test mới tái hiện 10 lỗi transport/embedding và 2 nhóm lỗi metric trên code cũ.
- Sau sửa: `pnpm check` đạt 157 unit (23 file), TypeScript strict và production build.
- Entry JavaScript build giảm từ 687,20 kB xuống 489,49 kB; gzip từ 219,86 kB xuống khoảng 159,18 kB. Đây là entry chunk, không phải tổng tài nguyên/tốc độ tải thực tế. PDF worker và mô hình ảnh vẫn là tài nguyên lớn, chỉ tải ở luồng sử dụng.
- `pnpm audit --prod --json`: không advisory trong 45 dependency được audit tại lần chạy này. Không đồng nghĩa không có rủi ro chưa công bố.
- `pnpm test:browser`: cả 16 suite đạt. Bao phủ 26 route lab, 26 bài giảng/audio, 26 notebook tải xuống, Python cơ bản, tiến độ, nhập dữ liệu và worker thật 200.000 dòng, ba lab ứng dụng, webcam giả lập có dừng track, huấn luyện MobileNet thật + ZIP roundtrip, lý thuyết, bàn giảng viên và xưởng. Các luồng có kiểm tra trên ba kích thước màn hình; các suite có kiểm tra lỗi trang/yêu cầu ngoài dự kiến.
- Browser giáo án có kiểm tra hai tab: từ chối ghi đè bản đã thay đổi, giữ nháp và mở lại nội dung mới nhất. API/RAG kiểm tra PNG OCR và hủy OCR, DOCX/PDF thật, đồng thời mock endpoint AI để không phát sinh phí; kiểm tra hủy lập chỉ mục khi bỏ consent.
- Preview production build tại cổng 5185: `test:ui` (gồm navigation 26 lab), `test:providers`, `test:teaching`, `test:workshop` đạt. Không chỉ dựa vào dev server để xác minh lazy-loaded chunks.

## Giới hạn kiểm chứng

- API ngoài được mock để không gửi dữ liệu/khóa thật hay phát sinh phí; chưa chứng minh mọi nhà cung cấp tương thích. Không dùng dữ liệu bệnh nhân.
- Notebook được kiểm tra cú pháp Python, cấu trúc, tải xuống và hiển thị; chưa chạy lại toàn bộ 26 notebook trên Colab. Runtime Python kèm ứng dụng thiếu matplotlib/PyTorch; không tự cài gói lớn vào máy người dùng.
- Đã xem screenshot RAG mobile và xưởng; kiểm thử overflow trên desktop/tablet/mobile, không tự nhận đạt chuẩn accessibility đầy đủ.
- Công cụ review không chạy được lint vì repo chưa có ESLint config, directory security scan thiếu semgrep. Quét regex các file Chat/keystore/RAG/OCR không phát hiện vấn đề; đây không phải kiểm toán bảo mật toàn diện.
- Cảnh báo bản nháp chặn liên kết cùng tab và beforeunload; không cam kết chặn mọi thao tác Back/Forward của trình duyệt. Xung đột giáo án được phát hiện trước ghi, không khóa atomic nhiều tab cùng ghi trong cùng thời điểm.
- Không push/deploy hoặc xóa thay đổi có sẵn của người dùng.
