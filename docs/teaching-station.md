# Trạm giảng dạy Tin học Y khoa

Mục tiêu của người dùng: “từng nhóm; nâng cấp lên thành 1 trạm phần mềm hỗ trợ giảng dạy cho bộ môn tin học khoa y của tôi”. Đây là mục tiêu mở rộng toàn sản phẩm, không chỉ đổi tên giao diện.

## Nguyên tắc và phạm vi

- Bảo toàn bài học, dữ liệu và tiến độ cũ. Triển khai từng nhóm, có công cụ hoạt động thật thay vì các ô “sắp có”.
- Ưu tiên sinh viên năm nhất và giảng viên; nội dung y khoa là tình huống học tập, không phải công cụ chẩn đoán.
- Người dùng đã xác nhận: **“theo nhóm hiện tại đủ rồi”**. Giữ sáu nhóm hiện có, không mở thêm nhóm kỹ năng số/tin học văn phòng. Đây là phạm vi sản phẩm đã thống nhất, không phải xác nhận một đề cương đào tạo chính thức.
- Tiếp tục client-side. Không tự thêm tài khoản, thu thập tên/mã sinh viên, quản lý điểm hoặc backend.
- Không triển khai lên GitHub/Cloudflare khi chưa có yêu cầu trong đợt nâng cấp này.

## Kiến trúc đích

Trạm tổng quan → nhóm năng lực → học liệu/lab hiện có. Bàn giảng viên dùng cùng registry học liệu để soạn buổi học, tổ chức hoạt động nhóm, trình chiếu nhiệm vụ và xuất phiếu thực hành. Đường dẫn cũ không đổi.

## Các chặng cần kiểm chứng

1. Tổ chức trạm và bàn giảng viên: phân nhóm, công bố điều kiện Internet/API, giáo án sửa được, lưu cục bộ, xuất/nhập bản sao, phiếu sinh viên tách đáp án, điều phối hoạt động và thời gian. Cần unit cho schema/export và browser cho luồng thực tế, mobile và lỗi storage.
2. Nhóm khởi động hiện có: nối lộ trình, nhập môn AI và dự án với nhiệm vụ/sản phẩm cụ thể. Đề xuất mở rộng kỹ năng số/tin học văn phòng trước đó đã được thay thế bởi lựa chọn giữ nhóm hiện tại của người dùng.
3. Nhóm Python: rà hoạt động chạy Colab, bài tập tăng dần, sản phẩm nộp và phiếu giảng viên; tận dụng notebook buổi 1 đã có.
4. Nhóm dữ liệu/thống kê: quy trình nhận bảng lạ → hiểu biến → kiểm tra chất lượng → mô tả → xuất kết quả, có tình huống thực hành nhóm và rubric; không hứa nhận mọi loại dữ liệu.
5. ML/DL/GenAI: gói thành buổi dạy có mục tiêu, prerequisite, dữ liệu mẫu và tiêu chí đánh giá; thử đường đi của cả giảng viên lẫn sinh viên. Không coi số thuật toán là bằng chứng đủ học phần.
6. Nghiệm thu toàn trạm: đối chiếu phạm vi sáu nhóm đã thống nhất, kiểm tra mọi nhóm, bản xuất/nhập, tách ghi chú riêng, điều hướng, mobile và hồi quy các lab cũ. Không tuyên bố đã kiểm định chương trình hoặc đạt chuẩn accessibility đầy đủ.

## Trạng thái

Đã xây trạm, bàn giảng viên và xưởng thực hành cho cả sáu nhóm hiện có. Toàn bộ 31 điểm vào học tập có mẫu nhiệm vụ riêng, gồm 26 bài lab và 5 học liệu hỗ trợ. Không thêm backend hoặc hệ thống quản lý sinh viên.

### Bằng chứng chặng 1 — 16/10/2026

- `/station` tổ chức 6 nhóm: khởi động, Python, dữ liệu/thống kê, ML, DL và GenAI; toàn bộ 26 bài cũ có trong registry và mỗi bài thuộc đúng một nhóm. Các đường dẫn bài học cũ được giữ. Bàn giảng viên là khu vực riêng `/teaching`, có liên kết ở trang chủ và sidebar.
- Mẫu 45 phút cho từng nhóm lấy nhiệm vụ riêng từ hướng dẫn hiện có; Python có chỉ dẫn thêm cell cụ thể. Sửa được tên, mục tiêu, cỡ nhóm gợi ý, học liệu, nhiệm vụ, sản phẩm, thời gian và ghi chú; thêm/bỏ/đổi thứ tự hoạt động. Đây không phải tự phân nhóm theo danh sách người học.
- Dẫn buổi học có hoạt động trước/sau, timer bắt đầu/tạm dừng/đặt lại dựa trên deadline; ghi chú riêng không nằm trong giao diện trình chiếu.
- Tải Markdown từ bản đang sửa; giáo án giảng viên có ghi chú, phiếu nhóm không có ghi chú. Link dựa trên origin thực, có cảnh báo localhost không tự trở thành địa chỉ truy cập cho cả lớp.
- Lưu tối đa 30 buổi trên trình duyệt, sao lưu JSON, nhập thêm bằng ID mới; schema giới hạn 1 MB, 12 hoạt động/buổi, 1–180 phút/hoạt động, cỡ nhóm 1–12 và chỉ cho resource ID trong registry. Không chạy nội dung/tự mở URL từ tệp nhập. Không ghi đè khi nhập tệp lỗi hoặc khi storage bị chặn.
- Bản lưu hỏng: tải bản thô trước, phải chủ động đồng ý thay bản lỗi và nhập bản hợp lệ; lỗi quyền lưu trữ không giả thành lưu thành công. Bản nháp vẫn xuất được dù không lưu cục bộ.
- `pnpm test`: 112/112 đạt ở lần chạy không bật thực thi notebook Python; 14 file. Thêm unit về bao phủ nhóm, mẫu, validation/import và tách ghi chú khi xuất. Không coi kết quả này là chạy lại notebook trên Colab.
- `pnpm test:teaching`: đạt luồng nhóm → soạn → lưu → tải/xuất/nhập → trình chiếu/timer; 3 viewport, không tràn ngang/ID trùng, không lỗi trang/yêu cầu mạng ngoài dự kiến. Có test bảo toàn bản lỗi và khôi phục sau khi tải bản thô.
- `BASE_URL=http://127.0.0.1:5175 pnpm test:ui`, `pnpm test:learning`, `pnpm test:curiosity`: đạt; kiểm tra đủ 26 route lab cũ và tiến độ cũ. Build/type-check đạt; còn cảnh báo chunk lớn có sẵn.
- Đã xem ảnh hub desktop, bàn giảng viên mobile, chế độ dẫn buổi mobile; sửa vị trí cuộn/focus khi mở chế độ dẫn buổi để không bắt đầu ở giữa hoạt động.
- Công cụ review không lint được vì thiếu eslint.config; quét regex trên TeachingDesk không thấy vấn đề. Không thay thế audit bảo mật độc lập.

### Bổ sung theo phạm vi đã chốt — 16/10/2026

- Cả 31 học liệu có mẫu 45 phút riêng, bốn hoạt động, sản phẩm và gợi ý điều phối. Các bài có hướng dẫn lấy nhiệm vụ từ hướng dẫn tương ứng; Python có thao tác Colab cụ thể, không áp một nhiệm vụ chung cho mọi nhóm.
- Mẫu mới dùng bảng đang hoạt động khi học liệu hỗ trợ bảng đó. Phiếu tùy chỉnh/đã nhập được giữ nguyên, không tự đổi nhiệm vụ theo dữ liệu khác. Dữ liệu không tự đi kèm phiếu.
- Phiếu tương tác JSON chỉ chứa nội dung công khai; xưởng từ chối bản sao giáo án giảng viên và trường ghi chú riêng. Tệp nhập chỉ tham chiếu học liệu trong registry, không thực thi code, tự gọi API hoặc tự mở URL ngoài.
- Sinh viên mở lab ở tab mới, ghi bằng chứng cho từng hoạt động, tự rà soát đầu vào/kết luận/giới hạn/đóng góp. Tải bản làm JSON để tiếp tục và Markdown để đọc; không tự lưu, tự nộp hoặc chấm điểm. Có cảnh báo khi đóng trang hay bấm liên kết rời xưởng mà còn sửa đổi chưa xuất JSON; không cam kết chặn mọi thao tác lịch sử trình duyệt.
- Unit: 118/118 đạt (15 file), gồm bao phủ 31 mẫu, tách ghi chú riêng, schema và roundtrip bản làm; lần này không chạy notebook trên Colab.
- Browser: bàn giảng viên và xưởng có kiểm thử luồng xuất/nhập, lỗi không làm mất bản đang mở, cả sáu nhóm trên desktop/tablet/mobile. Các luồng cũ `test:ui`, `test:learning`, `test:adaptive`, `test:python-basics`, `test:imports` đã đạt. Test nhập kiểm tra Excel nhiều sheet, XLS, CSV/JSON, worker 200.000 dòng và từ chối dòng 200.001 mà giữ dữ liệu đang dùng; không suy ra mọi tệp đều tương thích với mọi lab.
- Build/type-check đạt; còn cảnh báo chunk lớn. Đã xem ảnh xưởng Python mobile và Transfer desktop. Review tự động không lint được vì thiếu eslint.config; quét regex không phát hiện vấn đề, không thay thế kiểm toán bảo mật.

Chưa push/deploy. Không có thu bài, quản lý lớp, tài khoản hoặc đồng bộ đa thiết bị. Trạm hỗ trợ tổ chức học tập theo nhóm hiện có, không phải chứng nhận năng lực y khoa hay công cụ ra quyết định điều trị.
