export const COLAB_GUIDE = [
  { title: 'Mở notebook', text: 'Tải notebook bên dưới. Mở Google Colab, đăng nhập tài khoản Google rồi chọn File → Upload notebook (Tệp → Tải sổ tay lên). Chọn file .ipynb vừa tải.' },
  { title: 'Hiểu cell và kết nối', text: 'Text cell chứa lời giải thích; code cell chứa Python. Chọn Connect / Kết nối để mở phiên chạy. Bài này chỉ cần CPU, không cần GPU hay cài Python trên máy.' },
  { title: 'Chạy từ trên xuống', text: 'Bấm nút ▶ cạnh cell hoặc Shift + Enter để chạy và sang cell tiếp theo. Khi input() xuất hiện, nhập vào ô dưới cell rồi Enter. Chờ cell chạy xong trước khi tiếp tục.' },
  { title: 'Sửa và chạy lại', text: 'Thay một giá trị, dự đoán kết quả rồi chạy lại cell. Các biến sống trong phiên chạy; sau khi khởi động lại runtime, cần chạy lại từ đầu. Có thể dùng Runtime → Run all để kiểm tra toàn bộ notebook; các ô input vẫn cần trả lời.' },
  { title: 'Phân biệt notebook và dữ liệu', text: 'Upload notebook là mở file .ipynb; upload CSV là đưa dữ liệu vào phiên chạy (xem bước CSV). File và biến trong máy ảo có thể mất khi phiên kết thúc. Không coi thư mục tạm của Colab là nơi lưu lâu dài.' },
  { title: 'Lưu và chia sẻ an toàn', text: 'Lưu bản riêng vào Drive hoặc dùng File → Download → Download .ipynb. Notebook chia sẻ có thể chứa code, văn bản và kết quả đã in. Xóa kết quả nhạy cảm, kiểm tra quyền Share; không upload dữ liệu bệnh nhân thật.' },
];

export const PYTHON_BASICS = [
  { id: 'variables', title: 'Biến, kiểu dữ liệu và print()', explanation: 'Biến là tên gắn với một giá trị. str là chuỗi, int là số nguyên, float là số thực, bool là đúng/sai. Dấu = gán giá trị; == dùng để so sánh. Dữ liệu dưới đây hoàn toàn giả lập.', code: `ten = "Sinh viên A"
tuoi = 19
chieu_cao_m = 1.70
dang_hoc = True
print(ten, tuoi, chieu_cao_m, dang_hoc)
print(type(ten), type(tuoi), type(chieu_cao_m), type(dang_hoc))`, expected: 'In các giá trị và kiểu str, int, float, bool.', exercise: 'Đổi tuổi thành 20. So sánh type(20) với type("20").' },
  { id: 'input', title: 'Nhập dữ liệu và chuyển kiểu', explanation: 'input() luôn trả về chuỗi. Dùng int() hoặc float() khi cần tính toán. Dùng dấu chấm cho số thập phân (ví dụ 1.70). f-string chèn giá trị biến vào câu; :.2f hiển thị hai chữ số thập phân.', code: `try:
    ho_ten = input("Nhập tên giả: ")
    tuoi_nhap = int(input("Nhập tuổi nguyên: "))
    cao_nhap = float(input("Nhập chiều cao (m), ví dụ 1.70: "))
    nang_nhap = float(input("Nhập cân nặng (kg): "))
    if tuoi_nhap < 0 or cao_nhap <= 0 or nang_nhap <= 0:
        print("Kiểm tra lại tuổi, chiều cao và cân nặng.")
    else:
        print(f"{ho_ten}: {tuoi_nhap} tuổi, {cao_nhap:.2f} m, {nang_nhap:.2f} kg")
except ValueError:
    print("Cần nhập số đúng định dạng; sửa rồi chạy lại cell.")`, expected: 'Với A, 19, 1.70, 65 → A: 19 tuổi, 1.70 m, 65.00 kg.', exercise: 'Thử nhập chữ ở ô tuổi. Vì sao chương trình đi vào except?' },
  { id: 'conditions', title: 'Điều kiện if / elif / else', explanation: 'Điều kiện chọn nhánh thực thi. Dấu : mở khối; các dòng trong khối thụt vào 4 khoảng trắng. Ví dụ chỉ kiểm tra một quy tắc tuổi giả định, không kết luận đủ điều kiện nghiên cứu thực tế.', code: `tuoi_mau = 19
if tuoi_mau < 0:
    print("Tuổi không hợp lệ")
elif tuoi_mau >= 18:
    print("Đạt quy tắc tuổi giả định")
else:
    print("Chưa đạt quy tắc tuổi giả định")`, expected: 'Đạt quy tắc tuổi giả định.', exercise: 'Thử lần lượt -1, 17 và 18; giải thích nhánh được chọn.' },
  { id: 'bmi', title: 'Phép tính và đơn vị: ví dụ BMI', explanation: 'BMI = cân nặng (kg) / chiều cao (m)². ** là lũy thừa; / là phép chia. Kiểm tra đầu vào trước khi chia. Bài học chỉ minh họa lập trình, không phân loại hay đưa lời khuyên sức khỏe từ BMI.', code: `chieu_cao_m = 1.70
can_nang_kg = 65
if chieu_cao_m <= 0 or can_nang_kg <= 0:
    print("Chiều cao và cân nặng phải lớn hơn 0")
else:
    bmi = can_nang_kg / chieu_cao_m ** 2
    print(f"BMI minh họa: {bmi:.2f}")`, expected: 'BMI minh họa: 22.49.', exercise: 'Nếu chiều cao đang là cm thì phải đổi sang m thế nào? Thử chiều cao bằng 0.' },
  { id: 'loops', title: 'Danh sách, chỉ số và vòng lặp', explanation: 'list chứa nhiều giá trị; chỉ số bắt đầu từ 0. len() đếm phần tử. for đi qua từng phần tử; += tăng biến đếm. Ngưỡng dưới đây chỉ là mốc chia nhóm để luyện code, không phải phân loại sốt lâm sàng; mỗi giá trị là một lần đo, không mặc định một ngày.', code: `nhiet_do = [36.8, 37.6, 38.5, 37.0, 39.1, 37.8, 36.5]
duoi_moc = tu_moc = 0
for gia_tri in nhiet_do:
    if gia_tri < 38.0:
        duoi_moc += 1
    else:
        tu_moc += 1
print("Lần đo đầu:", nhiet_do[0])
print("Tổng số lần đo:", len(nhiet_do))
print("Dưới mốc 38.0:", duoi_moc)
print("Từ mốc 38.0:", tu_moc)`, expected: '7 lần đo; 5 dưới mốc và 2 từ mốc 38.0.', exercise: 'Thêm 38.0 vào danh sách. Nhóm nào tăng? Thử nhiet_do[:3] và nhiet_do[-3:].' },
  { id: 'functions', title: 'Hàm: viết một lần, gọi nhiều lần', explanation: 'def khai báo hàm; tham số là dữ liệu đầu vào, return trả kết quả về nơi gọi. Hàm giúp tránh lặp công thức. ValueError báo đầu vào không hợp lệ; đây là ví dụ dùng raise và try/except.', code: `def tinh_bmi(chieu_cao_m, can_nang_kg):
    if chieu_cao_m <= 0 or can_nang_kg <= 0:
        raise ValueError("Chiều cao và cân nặng phải dương")
    return can_nang_kg / chieu_cao_m ** 2

for cao, nang in [(1.70, 65), (1.50, 50), (1.60, 70)]:
    print(f"BMI minh họa: {tinh_bmi(cao, nang):.2f}")
try:
    tinh_bmi(0, 65)
except ValueError as loi:
    print(loi)`, expected: '22.49; 22.22; 27.34; sau đó thông báo đầu vào phải dương.', exercise: 'Viết hàm doi_cm_sang_m(cm) rồi dùng kết quả làm đầu vào tinh_bmi().' },
  { id: 'csv', title: 'Đọc CSV bằng tên cột', explanation: 'CSV là bảng văn bản có hàng tiêu đề. Dùng csv.DictReader để đọc theo tên cột, không phụ thuộc Glucose nằm ở cột số mấy. Mặc định chạy ngay bằng dữ liệu giả, có ô trống và giá trị lỗi. Muốn dùng file riêng trên Colab, đổi DUNG_FILE_UPLOAD thành True. Ví dụ này nhận CSV UTF-8, dấu phẩy hoặc chấm phẩy; không nhận Excel/JSON.', code: `import csv
import io

DUNG_FILE_UPLOAD = False
csv_mau = """Glucose,Outcome
100,0
150,1
,1
khong_ro,
120,0
"""
noi_dung = csv_mau
if DUNG_FILE_UPLOAD:
    from google.colab import files
    tep = files.upload()
    if len(tep) != 1:
        raise ValueError("Chọn đúng một file CSV")
    ten_tep, du_lieu = next(iter(tep.items()))
    if not ten_tep.lower().endswith(".csv"):
        raise ValueError("Bài này chỉ đọc CSV")
    noi_dung = du_lieu.decode("utf-8-sig")

if not noi_dung.strip():
    raise ValueError("File CSV rỗng")
dau_phan_cach = ";" if ";" in noi_dung.splitlines()[0] else ","
reader = csv.DictReader(io.StringIO(noi_dung), delimiter=dau_phan_cach)
cot = reader.fieldnames or []
if not cot or len(cot) != len(set(cot)):
    raise ValueError("Cần tiêu đề cột không trùng tên")
dulieu = list(reader)
if not dulieu or any(None in dong or None in dong.values() for dong in dulieu):
    raise ValueError("CSV rỗng hoặc số ô không khớp tiêu đề")
print("Các cột:", cot)
print("Số dòng / cột:", len(dulieu), len(cot))
print("5 dòng đầu:", dulieu[:5])
print("5 dòng cuối:", dulieu[-5:])`, expected: 'Bảng giả có 5 dòng, 2 cột: Glucose và Outcome. Slicing vẫn an toàn nếu bảng có dưới 5 dòng.', exercise: 'Đảo thứ tự hai cột trong dữ liệu mẫu. Tên cột và giá trị phải đi cùng nhau. Trước khi upload, kiểm tra file không chứa thông tin cá nhân.' },
  { id: 'statistics', title: 'Thống kê và đếm nhãn có kiểm tra lỗi', explanation: 'Chọn tên cột đúng với bảng. Bỏ giá trị trống, không chuyển được sang số hoặc không hữu hạn, nhưng phải báo số lượng bị bỏ. Không đặt tên biến là min, max, sum vì sẽ che các hàm Python. Với nhãn, chỉ đếm mã 0/1; mã khác được báo riêng, không tự coi là âm tính.', code: `import math

COT_SO = "Glucose"
COT_NHAN = "Outcome"
if COT_SO not in cot or COT_NHAN not in cot:
    raise ValueError(f"Đổi COT_SO / COT_NHAN theo tên cột: {cot}")
gia_tri_so = []
bo_qua = nhan_0 = nhan_1 = nhan_khac = 0
for dong in dulieu:
    try:
        gia_tri = float(dong[COT_SO].strip().replace(",", "."))
        if not math.isfinite(gia_tri):
            raise ValueError("Không hữu hạn")
        gia_tri_so.append(gia_tri)
    except ValueError:
        bo_qua += 1
    nhan = dong[COT_NHAN].strip()
    if nhan == "0":
        nhan_0 += 1
    elif nhan == "1":
        nhan_1 += 1
    else:
        nhan_khac += 1

print("Tổng dòng:", len(dulieu), "| Giá trị số bị bỏ:", bo_qua)
if gia_tri_so:
    print(f"Trung bình: {sum(gia_tri_so) / len(gia_tri_so):.2f}")
    print("Nhỏ nhất / lớn nhất:", min(gia_tri_so), max(gia_tri_so))
else:
    print("Không có số hợp lệ để thống kê")
print("Nhãn 0 / 1 / khác hoặc thiếu:", nhan_0, nhan_1, nhan_khac)
so_nhan_hop_le = nhan_0 + nhan_1
if so_nhan_hop_le:
    print(f"Tỷ lệ nhãn 1 trong nhãn hợp lệ: {nhan_1 / so_nhan_hop_le:.2%}")`, expected: 'Bỏ 2 giá trị số; trung bình 123.33, min 100, max 150. Nhãn 0: 2, nhãn 1: 2, nhãn khác/thiếu: 1; tỷ lệ nhãn 1 là 50% trong 4 nhãn hợp lệ.', exercise: 'Đổi toàn bộ Glucose thành ô trống; chương trình có chia cho 0 không? Tại sao tỷ lệ dùng 4 thay vì 5 làm mẫu số? Nhãn 1 nghĩa là gì phải được xác nhận từ mô tả dữ liệu, không suy ra từ code.' },
];

export function makeBasicsNotebook() {
  const markdown = (text: string) => ({ cell_type: 'markdown', metadata: {}, source: [text] });
  return {
    nbformat: 4, nbformat_minor: 5,
    metadata: { kernelspec: { display_name: 'Python 3', language: 'python', name: 'python3' }, language_info: { name: 'python' }, colab: { provenance: [] } },
    cells: [
      markdown('# Python & Colab — Buổi 1\nBiên soạn từ MSHV_BUOI1.ipynb, bổ sung giải thích và kiểm tra đầu vào. Dùng dữ liệu giả, không phục vụ chẩn đoán. Chạy theo thứ tự từ trên xuống; không cần thư viện ngoài hay GPU.'),
      markdown('## Bắt đầu với Colab\n' + COLAB_GUIDE.map((s, i) => `${i + 1}. **${s.title}**: ${s.text}`).join('\n\n') + '\n\nTài liệu: https://research.google.com/colaboratory/faq.html'),
      ...PYTHON_BASICS.flatMap((s, i) => [markdown(`## ${i + 1}. ${s.title}\n${s.explanation}`), { cell_type: 'code', execution_count: null, metadata: {}, outputs: [], source: [s.code] }, markdown(`**Kết quả cần kiểm tra:** ${s.expected}\n\n**Tự thử:** ${s.exercise}`)]),
      markdown('## Tự kiểm tra cuối buổi\n- Giải thích vì sao input() cần chuyển kiểu.\n- Viết hàm tính trung bình một list; xử lý list rỗng.\n- Chọn cột số và nhãn của bảng CSV riêng, báo các dòng không hợp lệ.\n- Khởi động lại runtime rồi chạy lại từ đầu; không phụ thuộc biến còn sót.\n- Xóa kết quả nhạy cảm trước khi chia sẻ notebook.'),
    ].map((cell, index) => ({ ...cell, id: `python-basics-${index}` })),
  };
}
