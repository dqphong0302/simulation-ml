# Nhập dữ liệu chung — 13/10/2026

## Phạm vi
- CSV/TSV/TXT UTF-8, XLSX/XLS, JSON mảng đối tượng phẳng.
- Tải một lần, giữ trong bộ nhớ phiên; dùng giữa Khám phá dữ liệu và các bài dữ liệu bảng.
- Không gửi file lên máy chủ, không lưu bền vững; tải lại trang sẽ xóa phiên.
- Không mở rộng giới hạn PDF/OCR/ảnh trong đợt này.

## Kế hoạch thực hiện
1. Bộ đọc chạy trong Web Worker, có tiến độ và hủy; CSV đọc theo từng khối.
2. Kiểm tra dung lượng, dòng, cột, tổng ô; lỗi cấu trúc phải báo thay vì bỏ dòng.
3. Xem trước, chọn sheet, báo giới hạn, lựa chọn mẫu tái lập trước khi dùng.
4. Kho dữ liệu phiên chung và tích hợp trang chủ, EDA, các bài ML/DL dữ liệu bảng.
5. Chặn tập quá lớn cho lab; không tự chuyển dữ liệu không tương thích thành Pima.
6. Unit test parser/giới hạn/lấy mẫu, kiểm thử trình duyệt luồng nhập/chuyển bài/hủy/lỗi, build.

## Giới hạn thiết kế (không phải bảo đảm hiệu năng mọi thiết bị)
- CSV/TSV/TXT: 100 MiB; Excel/JSON: 30 MiB.
- 200.000 dòng dữ liệu, 200 cột, 2.000.000 ô, 100.000 ký tự/ô.
- Tối đa 20.000 dòng cho phiên khám phá; nếu lớn hơn phải chọn mẫu và xác nhận.
- Lab mô hình: tối đa 2.000 dòng, 32 biến; cần xác nhận lấy mẫu nếu vượt.
- Các mô hình nặng có giới hạn thấp hơn: Forest 500 dòng/8 biến, SVM 500/16, Tree 1.000/16.
- Mô hình nhị phân hiện tại vẫn cần nhãn 2–30 giá trị và ít nhất hai biến số. PCA/K-means/hồi quy/tiền xử lý/AE/VAE nhận bảng số không nhãn. Không tuyên bố hỗ trợ tự động mọi loại mô hình.
- Excel: dùng giá trị công thức được lưu trong file, không tính lại công thức hay thực thi macro.

## Tiêu chí nghiệm thu
- Không cắt dữ liệu hoặc bỏ dòng sai âm thầm.
- Lỗi/hủy không thay thế bộ dữ liệu phiên đang dùng.
- Chọn sheet không áp dụng cho tới khi xác nhận; đổi file không nhận kết quả cũ.
- Xem trước giới hạn 10 dòng; chọn mẫu ghi rõ số dòng gốc và số dòng sử dụng.
- Build, unit test và browser test đạt; kiểm tra giao diện ở 390/768/1440 px.

## Kết quả triển khai
- Hoàn thành bộ đọc nền, giới hạn, chọn sheet/dấu phân cách, xem trước, lấy mẫu có xác nhận và kho dữ liệu phiên chung.
- Đã nối trang chủ, EDA và các bài bảng; hỗ trợ dữ liệu số không nhãn cho các bài phù hợp, chọn x/y trong hồi quy.
- `pnpm test`: 67 kiểm thử đạt, gồm ngưỡng dòng/ô/cột/dung lượng và dữ liệu lỗi.
- `test:imports`: CSV/JSON/XLSX/XLS, sheet đầu rỗng, bảo toàn phiên khi lỗi/hủy, lấy mẫu, chuyển EDA → ML; chạy trên dev và production preview.
- Bộ đọc thật trong browser đọc đủ 200.000 dòng và từ chối 200.001 dòng, giữ nguyên bộ dữ liệu phiên trước đó.
- `test:ui`: trang chủ, tìm kiếm, điều hướng, audio và mở 23 lab; 3 khổ màn hình.
- Rà soát bảo mật tự động mức regex ở parser và giao diện nhập không báo vấn đề; không thay thế audit toàn diện.
- Chưa deploy, chưa kiểm thử Safari/Firefox; chưa benchmark tệp sát 100 MiB trên thiết bị yếu. Không cam kết mọi tệp đạt ngưỡng đều chạy nhanh.
