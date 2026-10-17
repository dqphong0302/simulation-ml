/** Lý thuyết nhóm Nền tảng dữ liệu y tế và Generative AI trong Y sinh học. */
export const OTHER_THEORY: Record<string, string> = {
EDA: `
Khám phá dữ liệu lâm sàng (Clinical Exploratory Data Analysis - EDA) là bước nền tảng sống còn trong nghiên cứu y sinh học và dịch tễ học tính toán: phân tích toàn diện từng thông số sinh học, đánh giá phân bố dân số bệnh nhân, phát hiện mối liên quan giữa các yếu tố nguy cơ và nhận diện lỗi chất lượng dữ liệu hồ sơ bệnh án (EHR). Bước này **chỉ mô tả hiện trạng và giả thuyết**, chưa đi đến suy luận nhân quả hay triển khai mô hình chẩn đoán.

## Nhận diện cấu trúc dữ liệu y sinh
- **Đơn vị quan sát (Observation Unit)**: mỗi dòng tương ứng với một thực thể y tế (một bệnh nhân cụ thể, một đợt nhập viện, một lần thăm khám ngoại trú hoặc một mẫu sinh thiết).
- **Kiểu biến sinh học**: biến liên tục (nồng độ glucose huyết tương đói, huyết áp tâm thu, chỉ số khối cơ thể BMI), biến đếm (số lần mang thai, số cơn đau thắt ngực trong tháng), biến danh nghĩa (nhóm máu, giới tính sinh học), biến thứ bậc (phân độ suy tim NYHA I–IV, giai đoạn ung thư TNM), dữ liệu thời gian (thời gian sống sót sau can thiệp) và văn bản tự do (bệnh sử, ghi chú điều trị).
- **Biến kết cuộc lâm sàng (Clinical Outcome)**: biến mục tiêu cần dự báo (ví dụ: mắc đái tháo đường, biến cố tim mạch chính MACE trong 5 năm, tái nhập viện sau 30 ngày, tử vong nội viện).
- **Đơn vị đo**: mg/dL so với mmol/L (glucose), mmHg (huyết áp), kg/m² (BMI). Luôn đọc tên xét nghiệm, đơn vị và phương pháp trong metadata; không áp cùng hệ số đổi cho mọi chất. Cùng giá trị số nhưng khác đơn vị không phải cùng kết quả.

## Đo xu hướng trung tâm trong quần thể bệnh nhân
$$ Trung bình mẫu x̄ = (1/n) Σ xᵢ
- **Trung vị (Median)**: giá trị ở giữa khi sắp xếp mẫu; bền vững hơn trung bình trước giá trị cực đoan, không phải hoàn toàn bất biến khi mẫu thay đổi.
- **Yếu vị (Mode)**: giá trị xuất hiện phổ biến nhất trong mẫu (rất hữu ích cho biến phân loại như triệu chứng đầu tiên hay nhóm thuốc ban đầu).
Nhiều chỉ số xét nghiệm và thời gian nằm viện có thể **lệch phải**, nhưng hình dạng phụ thuộc quần thể và quy trình đo. Trung bình thường bị kéo lên bởi giá trị lớn; không có quy tắc trung bình luôn lớn hơn trung vị cho mọi phân bố. Hãy xem biểu đồ và báo cáo trung bình/độ lệch chuẩn hoặc trung vị/IQR phù hợp với mục tiêu mô tả.

## Đo độ phân tán và phân biệt khoảng tham chiếu
$$ Độ lệch chuẩn s = √( Σ (xᵢ − x̄)² / (n − 1) )
- **Khoảng biến thiên (Range = Max − Min)**: phản ánh khoảng trải rộng tuyệt đối nhưng cực kỳ nhạy cảm với các ca bệnh biến chứng hiếm gặp hoặc sai số nhập liệu.
- **Phân vị (Percentiles) & Tứ phân vị**: Q1 (bách phân vị 25), Q2 (trung vị - 50%), Q3 (bách phân vị 75).
$$ Khoảng tứ phân vị IQR = Q3 − Q1
Khoảng Q1 tới Q3 mô tả vùng trung tâm theo phân vị; không nhất thiết chứa đúng 50% số dòng khi có giá trị trùng hoặc mẫu nhỏ. IQR là độ rộng của khoảng đó. Giá trị ngoài [Q1 − 1,5·IQR; Q3 + 1,5·IQR] là ngoại lai thống kê theo Tukey, cần đối chiếu nguồn và bối cảnh chứ không tự là bất thường lâm sàng.
Khoảng IQR và hàng rào Tukey mô tả mẫu dữ liệu, **không phải khoảng tham chiếu xét nghiệm, ngưỡng chẩn đoán hay khoảng an toàn sinh lý**. Khoảng tham chiếu của phòng xét nghiệm phụ thuộc phương pháp đo và quần thể tham chiếu; không suy ra từ dữ liệu bệnh nhân hiện có.

## Hình dạng phân bố và Biến thiên sinh học
- **Biểu đồ tần số (Histogram)**: khảo sát phân bố tần suất của các chỉ số sinh lý. Cần thử nghiệm nhiều độ rộng khoảng (bin width) để nhận diện các đặc trưng phân bố ẩn.
- **Độ lệch (Skewness)**: skewness > 0 biểu thị lệch phải, chưa đủ để kết luận lệch mạnh. Có thể cân nhắc log cho biến dương, nhưng cần đánh giá mục tiêu mô hình và cách diễn giải; không tự động biến đổi chỉ vì skewness dương.
- **Phân bố đa đỉnh (Multimodal Distribution)**: có thể gợi ý các nhóm trộn lẫn, cách đo, đơn vị hoặc cách chia bins. Nhiều đỉnh không tự chứng minh có nhiều nhóm bệnh sinh; đối chiếu metadata và phân nhóm trước khi giải thích.
- **Biểu đồ hộp (Boxplot)**: hiển thị Q1, median, Q3; theo quy ước Tukey, râu tới giá trị quan sát xa nhất còn trong hàng rào 1,5·IQR. Điểm ngoài râu cần kiểm tra; râu không biểu thị giới hạn sinh lý.

## Khảo sát biến phân loại và Tỷ lệ hiện mắc
Bảng tần suất và tỷ lệ phần trăm được trực quan bằng biểu đồ cột. Trong nghiên cứu y khoa, cần đặc biệt lưu ý:
- Nhóm ca bệnh hiếm (low-frequency cohorts): các biến cố có tỷ lệ rất thấp (như shock phản vệ, tử vong chu phẫu) tạo ra tình trạng mất cân bằng lớp trầm trọng (class imbalance).
- Tính không đồng nhất trong mã hóa lâm sàng: tình trạng viết tắt, mã ICD-9 trộn lẫn ICD-10, các tên thuốc biệt dược khác nhau của cùng một hoạt chất.

## Mối liên quan giữa các yếu tố nguy cơ (Bivariate Analysis)
- **Hai biến số liên tục**: biểu đồ phân tán (scatter plot) kết hợp hệ số tương quan tuyến tính Pearson:
$$ r = Σ (xᵢ − x̄)(yᵢ − ȳ) / √( Σ (xᵢ − x̄)² · Σ (yᵢ − ȳ)² )
r ∈ [−1, 1] đo liên hệ tuyến tính; ngoại lai có thể kéo lệch r. Pearson vẫn tính được khi dữ liệu không chuẩn; các giả định cho kiểm định/khoảng tin cậy cần xét riêng. Spearman hữu ích cho liên hệ đơn điệu hoặc biến thứ bậc, nhưng cũng có thể bỏ sót quan hệ chữ U. Luôn xem scatter trước và phân biệt mô tả tương quan với suy luận thống kê.
- **Biến định lượng theo phân nhóm bệnh**: so sánh trung vị, khoảng tứ phân vị và η² (phần tổng biến thiên trong mẫu nằm giữa các trung bình nhóm). Đây là liên hệ mô tả, không phải phần biến thiên do bệnh gây ra.
- **Hai biến định tính**: lập bảng chéo 2×2 (contingency table) phân tích tần số kết hợp kiểm định Chi bình phương (Chi-square) hoặc Fisher exact test.
> Định luật kinh điển trong dịch tễ học: Tương quan thống kê không đồng nghĩa với Mối quan hệ nhân quả (Correlation is NOT Causation). Hai chỉ số sinh học cùng tăng có thể đơn thuần do chúng cùng chịu ảnh hưởng của tuổi tác hoặc tình trạng viêm mạn tính nền.

## Phân tầng theo Biến kết cuộc lâm sàng (Target Stratification)
So sánh thống kê theo kết cuộc, ví dụ nhóm có/không có đái tháo đường. Phân bố khác nhau gợi ý một biến cần khảo sát thêm, chưa chứng minh khả năng tiên lượng hoặc nhân quả. Phải kiểm tra biến có sẵn tại thời điểm dự đoán và đánh giá trên dữ liệu độc lập. Tỷ lệ bệnh trong mẫu không tự động bằng tỷ lệ hiện mắc trong dân số, đặc biệt khi tuyển chọn ca bệnh/chứng hoặc lấy mẫu tại bệnh viện chuyên khoa.

## Kiểm toán chất lượng dữ liệu bệnh án (Data Quality Audit)
- **Dữ liệu khuyết thiếu (Missingness)**: định lượng theo xét nghiệm và nhóm bệnh nhân. Chỉ định xét nghiệm có thể phụ thuộc thông tin đã quan sát hoặc giá trị chưa quan sát; không tự gán MNAR chỉ vì xét nghiệm không được chỉ định.
- **Bản ghi trùng lặp**: cùng một lần khám bệnh nhưng bị lưu trữ lặp lại do lỗi hệ thống thông tin bệnh viện (HIS/LIS).
- **Định danh bệnh nhân**: không đưa mã bệnh nhân vào đặc trưng dự đoán. Mã thay thế có thể cần để nối lần khám và chia theo bệnh nhân; quản lý riêng với quyền truy cập phù hợp. Bỏ tên hoặc mã trực tiếp chưa đảm bảo ẩn danh vì ngày tháng và tổ hợp thông tin khác vẫn có thể nhận diện người.
- **Giá trị cần xác minh**: glucose/BMI bằng 0, tuổi âm hoặc ngày xuất viện trước nhập viện có thể là mã thiếu, lỗi đo, lỗi đơn vị hoặc lỗi nhập liệu. Kiểm tra từ điển dữ liệu và nguồn gốc trước khi sửa; số 0 hợp lệ ở nhiều biến khác như số lần mang thai.
- **Rò rỉ dữ liệu lâm sàng (Clinical Data Leakage)**: xuất hiện các biến số chỉ được đo lường SAU KHI biến cố xảy ra (ví dụ: đơn thuốc điều trị đặc hiệu đái tháo đường lại được đưa vào làm đặc trưng đầu vào để dự đoán đái tháo đường).

## Tự kiểm tra tư duy lâm sàng
- Một chỉ số xét nghiệm men gan có trung bình 95 U/L nhưng trung vị chỉ 35 U/L. Bạn nhận định thế nào về phân bố bệnh nhân trong mẫu này?
- Một nghiên cứu ghi nhận hệ số tương quan r = 0,05 giữa huyết áp và biến cố đột quỵ. Có thể vội vã kết luận huyết áp không liên quan đến đột quỵ không?

## Đặt câu hỏi trước khi mở bảng dữ liệu
Ví dụ học tập: dự đoán một biến cố giả lập trong 30 ngày từ thông tin có sẵn tại lần khám. Xác định đối tượng, nơi thu thập, mốc dự đoán, khoảng theo dõi và định nghĩa kết cuộc trước khi chọn biến.
- Một dòng là một lần khám; một bệnh nhân có thể có nhiều dòng. **Số lần khám không bằng số bệnh nhân độc lập**.
- Chỉ dùng đặc trưng đo được trước hoặc tại mốc dự đoán. Kết quả xét nghiệm trả sau mốc đó chưa phải thông tin sẵn có.
- Nếu không biết bệnh nhân có được theo dõi đủ 30 ngày, không tự gán “không có biến cố”. Mất theo dõi và kiểm duyệt cần thiết kế phân tích riêng.

## Tần suất, tỷ lệ và mẫu số
Nếu 20 trong 100 bệnh nhân có kết quả dương thì tỷ lệ trong mẫu là 20%. Nếu chỉ 40 người được xét nghiệm, 20/40 = 50% trong nhóm được đo, không phải 50% toàn bộ 100 người. Luôn nêu tử số, mẫu số, số thiếu và đơn vị đếm (người hay lượt khám). Tần suất trong mẫu là dữ kiện quan sát, không tự là xác suất bệnh của từng người.
Với dữ liệu [2,4,4,10], mean=5, median=4, mode=4, SD mẫu=√12≈3,46. Đơn vị là ngày nếu cột là số ngày nằm viện. Không diễn giải mean=5 là mọi người đều nằm viện 5 ngày.

## Từ điển dữ liệu và nhật ký chất lượng
Mỗi cột cần tên, ý nghĩa, kiểu, đơn vị, nguồn, thời điểm đo, mã thiếu và quy tắc kiểm tra. Ví dụ glucose_value phải đi cùng glucose_unit; patient_id dùng để nhóm, visit_date dùng để xác định thời gian, event_30d là kết cuộc sau lần khám.
Lưu bản dữ liệu thô, phiên bản quy tắc làm sạch và số ô/dòng bị sửa. Hai lần khám cùng bệnh nhân không phải bản ghi trùng; bản sao hoàn toàn của cùng lần khám mới cần đối chiếu để loại lặp.

## Mẫu đại diện, nhiễu và độ bất định
- Mẫu bệnh viện tuyến cuối có thể nhiều ca nặng hơn cộng đồng. So phân bố tuổi, nơi khám, tỷ lệ thiếu và kết cuộc giữa các nhóm; khác biệt chưa tự chứng minh thiên lệch nhưng cần điều tra.
- Tuổi hoặc điều trị có thể liên quan cả đặc trưng lẫn kết cuộc. EDA giúp đặt giả thuyết, không điều chỉnh được mọi yếu tố gây nhiễu.
- **SD/IQR** mô tả độ phân tán giữa người; **khoảng tin cậy** mô tả độ bất định của ước lượng theo các giả định lấy mẫu. Ý nghĩa thống kê không đồng nghĩa ý nghĩa lâm sàng.
- Bootstrap là lấy mẫu có hoàn lại để khảo sát độ bất định. Với lần khám lặp, lấy mẫu ở cấp bệnh nhân và giữ các lần khám cùng nhau; bootstrap từng dòng giả định độc lập có thể đánh giá thấp độ bất định.

## Tình huống thực hành và đáp án gợi ý
Notebook tạo hoàn toàn dữ liệu y tế tổng hợp: mỗi bệnh nhân có hai lần khám, glucose được ghi bằng hai đơn vị, có mã thiếu 0, ô trống và một bản sao. Không có dữ liệu người thật và kết cuộc không phải tiêu chuẩn chẩn đoán.
1. Đếm bệnh nhân khác với đếm dòng; chuẩn hóa đơn vị theo metadata, ghi lại ô bị sửa.
2. Xem histogram và tỷ lệ thiếu theo nơi khám; không xóa ca nặng chỉ vì ngoài IQR.
3. Đáp án men gan: trung bình cao hơn median gợi ý đuôi phải/giá trị lớn; cần xem histogram, không kết luận mọi người bệnh nặng.
4. Đáp án r = 0,05: chỉ cho thấy liên hệ tuyến tính yếu trong mẫu; còn quan hệ phi tuyến, sai số đo, nhiễu và độ bất định.

## Nguồn tham khảo EDA
- NIST — biểu đồ hộp và hàng rào thống kê: https://itl.nist.gov/div898/handbook/eda/section3/boxplot.htm
- SciPy — Pearson và giới hạn diễn giải: https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.pearsonr.html
- TRIPOD+AI — báo cáo nguồn dữ liệu, quần thể và đánh giá mô hình: https://www.bmj.com/content/385/bmj-2023-078378
`,

DATA: `
Tiền xử lý dữ liệu y sinh học chuyển bảng thô thành đặc trưng dùng được cho mô hình. Các bước học tham số phải được fit trong dữ liệu huấn luyện. **TRIPOD+AI là hướng dẫn báo cáo nghiên cứu mô hình dự đoán**; PROBAST đánh giá nguy cơ sai lệch và tính áp dụng, không phải chứng nhận rằng một pipeline an toàn để triển khai.

## Chia dữ liệu theo mục tiêu sử dụng trước khi fit
1. **Chia theo bệnh nhân**: Khi đánh giá trên bệnh nhân mới, tất cả lần khám của một người thuộc cùng một tập. Chia theo dòng có thể đưa thông tin của cùng người vào cả train và test, làm đánh giá quá lạc quan. GroupShuffleSplit tách nhóm nhưng không tự bảo đảm tỷ lệ nhãn bằng nhau; cần kiểm tra tỷ lệ kết cuộc trong từng tập.
2. **Quy tắc fit tham số**: Toàn bộ các tham số tiền xử lý — trung vị điền thiếu, độ lệch chuẩn, ngưỡng cắt ngoại lai, danh sách biến phân loại — **chỉ được tính toán trên tập Train**.
3. **Áp dụng cùng tham số cho Validation/Test**: Lấy nguyên vẹn các tham số đã fit ở Train để biến đổi cho tập Validation và Test. Học tham số tiền xử lý trên toàn bộ dữ liệu làm thông tin của tập đánh giá tham gia xây dựng mô hình; điểm đánh giá có thể lạc quan. Mức ảnh hưởng phụ thuộc dữ liệu và quy trình, không suy ra bằng một tỷ lệ cố định.

## Cơ chế dữ liệu khuyết thiếu trong Hồ sơ Bệnh án Điện tử (EHR)
Trong dữ liệu y tế có thể gặp cả ba cơ chế. Đây là giả định về quá trình thu thập, không phải nhãn tự suy ra chắc chắn từ tỷ lệ ô thiếu:
- **MCAR (Missing Completely At Random)**: khả năng thiếu không phụ thuộc dữ liệu đã quan sát hoặc chưa quan sát. Ví dụ lỗi ngẫu nhiên của quy trình nếu độc lập với người và giá trị đo. Xóa dòng giảm thông tin; điền trung vị vẫn làm thay đổi phân bố và không phản ánh độ bất định.
- **MAR (Missing At Random)**: sau khi điều kiện hóa trên thông tin đã quan sát, khả năng thiếu không còn phụ thuộc giá trị chưa quan sát. Ví dụ giả định việc chỉ định phụ thuộc tuổi đã ghi nhận, nhưng không còn phụ thuộc kết quả chưa đo sau khi đã xét tuổi. Chỉ thấy thiếu khác nhau theo tuổi chưa chứng minh MAR.
- **MNAR (Missing Not At Random)**: sau khi điều kiện hóa trên thông tin quan sát, khả năng thiếu vẫn phụ thuộc giá trị chưa quan sát. Không thể phân biệt chắc chắn MAR và MNAR chỉ bằng dữ liệu quan sát. Cần hiểu quy trình chỉ định, nêu giả định và làm phân tích độ nhạy.
Chiến lược xử lý:
- **Không tự ý coi số 0 là giá trị đo**: Trong Pima Indians Diabetes, nồng độ Glucose = 0 hay BMI = 0 là điều không thể có về sinh lý học. Cần chuyển các giá trị 0 này thành NaN (khuyết thiếu) trước khi xử lý.
- **Điền trung vị (Median Imputation)**: ít bị ảnh hưởng bởi giá trị cực đoan hơn điền mean; không tái tạo giá trị thật và có thể giảm biến thiên.
- **Cờ thiếu (Missingness Indicator)**: có thể hữu ích cho dự đoán khi thiếu mang thông tin về quy trình khám, nhưng có thể mất tác dụng khi chuyển bệnh viện hoặc chính sách chỉ định đổi. Cần đánh giá ngoài mẫu; không xem đây là cách sửa thiên lệch cho mọi phân tích nhân quả.
- **Phương pháp nâng cao**: KNN imputation hoặc iterative imputation học từ train. Multiple imputation tạo nhiều bộ dữ liệu và gộp ước lượng/độ bất định; một lần điền đa biến không tương đương đầy đủ với multiple imputation.

## Xử lý ngoại lai: Lỗi nhập liệu vs Trường hợp Bệnh lý Nặng
Trước khi loại bỏ bất kỳ điểm ngoại lai nào, nhà khoa học dữ liệu y tế phải phối hợp với bác sĩ để phân loại:
- **Giá trị nghi lỗi kỹ thuật / nhập liệu**: ví dụ tuổi âm, đơn vị không phù hợp hoặc kết quả rất cực đoan → đối chiếu nguồn, đơn vị và bối cảnh trước khi sửa/gán thiếu. Không tự kết luận một giá trị cực đoan là bất khả thi chỉ từ quy tắc thống kê.
- **Giá trị cực đoan thật**: có thể phản ánh một nhóm bệnh nhân hoặc trạng thái sinh học ít gặp, không phải lỗi nhập liệu. Loại các ca hợp lệ chỉ vì ngoài hàng rào thống kê có thể làm mất thông tin và giảm tính đại diện. Cần xác minh với nguồn dữ liệu; không dùng hàng rào IQR để chẩn đoán hoặc xác định mức độ cấp cứu.
- **Clipping**: có thể cắt theo ngưỡng thống kê học từ train nếu có lý do và kiểm tra tác động. Hàng rào 1,5·IQR **không phải ngưỡng sinh lý an toàn**. Cắt mất mức độ nặng có thể làm hỏng tín hiệu dự đoán; ưu tiên xác minh lỗi và thử biến đổi phù hợp trước.

## Chuẩn hóa thang đo (Feature Scaling)
$$ Chuẩn hóa Z-score: x' = (x − μ_train) / σ_train
$$ Chuẩn hóa Min-Max: x' = (x − min_train) / (max_train − min_train)
Ví dụ lâm sàng: Nếu huyết áp có μ_train = 120 mmHg, σ_train = 15 mmHg, thì một bệnh nhân có huyết áp 150 mmHg sẽ có z-score = (150 − 120)/15 = +2,0. Bệnh nhân có huyết áp 150 mmHg ở tập Test cũng sẽ được chuẩn hóa bằng chính μ và σ này.
Chuẩn hóa thường hữu ích cho KNN, SVM, K-means, PCA và mạng nơ-ron khi các biến có thang khác nhau. Không phải điều kiện bắt buộc trong mọi bài toán: cần cân nhắc liệu thang đo gốc có ý nghĩa. Cây quyết định thường không cần bước này. Min-Max có thể cho giá trị ngoài [0,1] ở test nếu test vượt khoảng train.
Z-score và Min-Max là biến đổi affine từng biến: đổi vị trí/thang đo nhưng không tự sửa độ lệch hoặc biến phân bố thành chuẩn. Nếu muốn thử log, chỉ dùng cho miền giá trị phù hợp và giải thích ý nghĩa sau biến đổi. Cột hằng và cột hoàn toàn thiếu cần xử lý riêng, không chia cho 0.

## Mã hóa biến danh nghĩa y khoa
- **One-Hot Encoding**: biến danh nghĩa thành các cột chỉ báo. Với hồi quy không điều chuẩn có intercept, bỏ một mức tham chiếu tránh phụ thuộc tuyến tính hoàn hảo. Không phải mọi thuật toán hoặc mô hình điều chuẩn đều cần bỏ một mức.
- **Ordinal Encoding**: mã hóa biến có thứ tự đã biết, như NYHA I–IV. Mã 1,2,3,4 đưa vào mô hình tuyến tính còn áp giả định khoảng cách bằng nhau; thứ tự tự nhiên không bảo đảm khoảng cách đó có ý nghĩa.
- Mức mới ở Test cần chính sách rõ: báo lỗi, mức "khác" được thiết kế trước, hoặc bỏ qua theo encoder. OneHotEncoder(handle_unknown='ignore') tạo toàn 0 cho khối biến chưa biết, không tự học thêm cột "khác".

## So sánh cách tiền xử lý trong thí nghiệm học tập
Mỗi lần can thiệp tiền xử lý (ví dụ: đổi từ điền median sang MICE, hoặc thêm cờ chỉ báo thiếu), giữ nguyên phân đoạn Train/Validation và thuật toán, sau đó so sánh AUC, Brier score và Net Benefit trên tập Validation. Thay đổi đồng thời nhiều kỹ thuật sẽ gây nhiễu và không thể quy trách nhiệm lâm sàng cho bước cải tiến.

## Ba cạm bẫy y tế phổ biến nhất
- Coi ô trống xét nghiệm là giá trị 0 hoặc ngược lại coi giá trị 0 phi sinh lý là dữ liệu thật.
- Xóa bỏ hàng loạt bệnh nhân nặng vì coi họ là "ngoại lai thống kê".
- Rò rỉ dữ liệu cấp đợt khám có thể làm đánh giá quá lạc quan; mức độ ảnh hưởng phụ thuộc dữ liệu, không có một tỷ lệ accuracy cố định.

## Tự kiểm tra tư duy lâm sàng
- Vì sao học mean/SD trên toàn bộ dữ liệu trước khi chia Train/Test gây rò rỉ? Điều đó khác đổi đơn vị theo quy tắc đã biết như thế nào?
- Một xét nghiệm Troponin chỉ được thực hiện trên 20% bệnh nhân của khoa cấp cứu. Nếu xóa bỏ 80% bệnh nhân còn lại, tập dữ liệu sẽ bị lệch mẫu như thế nào?

## Train, validation, test và kiểm tra ngoài bối cảnh
- Train học tham số; validation/cross-validation chọn cách xử lý và tham số; test chỉ dùng cho đánh giá cuối. Không chỉnh pipeline sau khi nhìn test rồi báo lại điểm trên cùng test như đánh giá độc lập.
- Trong cross-validation, toàn bộ bước điền thiếu, mã hóa, chọn biến và scaling nằm trong pipeline và fit lại ở từng fold train. Nếu nhiều lần khám, dùng fold theo bệnh nhân.
- Chia theo thời gian để hỏi “mô hình học từ quá khứ có dùng được cho tương lai không?”. Chọn mốc dự đoán, tránh cửa sổ kết cuộc chồng lấn; cân nhắc đồng thời ràng buộc bệnh nhân. Chia theo bệnh viện khảo sát khả năng chuyển nơi dùng; không tự động thay thế mọi kiểu thẩm định.
- Notebook minh họa chia bệnh nhân mới. **Lab web hiện chia ngẫu nhiên theo dòng và nhãn**, chưa tự bảo đảm tách bệnh nhân hoặc thời gian; không dùng điểm lab đó làm bằng chứng thẩm định lâm sàng cho bảng nhiều lần khám.

## Pipeline cho bảng y tế hỗn hợp
Sau khi kiểm tra đơn vị và mã thiếu theo metadata, giữ patient_id/visit_date để nhóm và kiểm toán, loại khỏi đặc trưng dự đoán. Numeric: điền median trên train, thêm cờ thiếu nếu phù hợp, chuẩn hóa. Categorical: điền mức thiếu rồi one-hot với quy tắc cho mức mới. Dùng ColumnTransformer để áp dụng từng nhánh.
Quy tắc đổi đơn vị đã biết có thể áp dụng nhất quán trước chia tập; ngưỡng ước lượng từ phân bố như IQR phải học trong train. Không cắt bỏ bệnh nhân chỉ để điểm mô hình cao hơn.

## Đọc kết quả và độ bất định
Accuracy có thể cao dù bỏ sót nhiều ca khi kết cuộc hiếm. Phân biệt **discrimination** (AUROC), **calibration** (xác suất dự báo có phù hợp tần suất quan sát không) và **clinical utility** (lợi ích/hại tại ngưỡng hành động). Brier score đo sai số xác suất, chịu ảnh hưởng cả phân biệt lẫn hiệu chỉnh; không phải thước đo calibration thuần túy.
Kiểm tra sensitivity, specificity, PPV/NPV ở ngưỡng nêu rõ; không mặc định 0,5 là ngưỡng có ý nghĩa y khoa. Khoảng tin cậy và phân tích theo phân nhóm cần đủ mẫu. Net benefit chỉ có ý nghĩa khi xác định đúng quyết định và đánh đổi lợi ích/hại; notebook tổng hợp không xác lập ngưỡng điều trị.

## Đọc một file Excel hoặc CSV chưa quen
1. Giữ bản gốc, chọn đúng sheet và hàng tiêu đề; kiểm tra một dòng là bệnh nhân, lần khám hay mẫu xét nghiệm. Ô gộp và tiêu đề nhiều tầng cần đưa về bảng chữ nhật trước khi nhập.
2. Kiểm tra số đang lưu dạng chữ, dấu thập phân/phân cách hàng nghìn, ngày-tháng-năm và mã thiếu. "01/02" không đủ để biết ngày/tháng nếu thiếu quy ước nguồn; không đoán âm thầm.
3. Đối chiếu kiểu cột với ý nghĩa: mã 001 là định danh, không phải số đo bằng 1; nhóm máu không có thứ tự hơn/kém. Tách giá trị khỏi đơn vị và chỉ quy đổi theo metadata đã xác minh.
4. Xem trước vài dòng và số dòng/cột; xác nhận các cảnh báo. Công cụ suy đoán kiểu không tự hiểu đúng mọi file, mọi đơn vị hay kết cuộc y khoa.
5. EDA không bắt buộc có nhãn đích. Khi học mô hình, tự xác định bài toán: dự đoán số, phân loại, hay tìm cấu trúc không nhãn; không ép mọi bảng thành phân loại nhị phân.

## Đáp án gợi ý và sản phẩm cần nộp
1. Chuẩn hóa trước chia tập dùng thông tin phân bố của test để xây mô hình; pipeline fit trong train tránh lỗi này. Phép đổi đơn vị theo quy tắc cố định đã biết không giống học tham số từ test.
2. Chỉ giữ người được đo troponin có thể chọn nhóm khác về triệu chứng/quy trình khám. Tỷ lệ thiếu một mình không xác định MAR/MNAR hoặc hướng sai lệch.
3. Nộp từ điển dữ liệu, nhật ký làm sạch, danh sách đặc trưng có sẵn tại mốc dự đoán, kiểm tra ID không giao nhau và bảng tỷ lệ kết cuộc train/validation/test.
4. Giải thích kết quả notebook chỉ kiểm tra quy trình với dữ liệu tổng hợp, không chứng minh khả năng chẩn đoán hay lợi ích cho bệnh nhân.

## Nguồn tham khảo tiền xử lý
- scikit-learn — leakage và pipeline: https://scikit-learn.org/stable/common_pitfalls.html
- scikit-learn — chia theo nhóm và thời gian: https://scikit-learn.org/stable/modules/cross_validation.html
- NCBI Bookshelf — giả định và độ bất định khi xử lý dữ liệu thiếu: https://www.ncbi.nlm.nih.gov/books/NBK493610/
- TRIPOD+AI — hướng dẫn báo cáo mô hình dự đoán: https://www.bmj.com/content/385/bmj-2023-078378
`,

GENCON: `
AI tạo sinh dự đoán nội dung tiếp theo theo ngữ cảnh. Phân phối token không phải phân phối xác suất bệnh và không thể đọc trực tiếp như độ tin cậy y khoa.
## Token và context
Token có thể là mảnh từ, ký tự hoặc đơn vị khác tùy tokenizer. Một từ tiếng Việt có thể nhiều token; không có tỷ lệ tiếng Việt/Anh cố định cho mọi model. Context window giới hạn lượng đầu vào và đầu ra; không đồng nghĩa mô hình nhớ chính xác mọi chi tiết trong đó.
## Temperature, top-k và top-p
$$ P(i)=exp(z_i/T)/Σⱼexp(z_j/T), T>0
T thấp làm phân phối nhọn hơn; T cao làm phẳng hơn. T=0 thường được API diễn giải như chế độ greedy, không thay trực tiếp vào phép chia này. Hành vi xác định còn phụ thuộc provider/cài đặt.
Top-k giữ k token có điểm cao; top-p giữ một tập token đạt ngưỡng xác suất tích lũy rồi chuẩn hóa lại. Chúng không biết tên thuốc nào đúng. Giảm temperature không bảo đảm AI trả lời đúng; T thấp có thể vẫn lặp lại một đáp án sai rất tự tin.
## Ví dụ số
Với logits đồ chơi [3;1,5;0,5]:
- T=1: P≈[0,7662;0,1710;0,0629].
- T=0,2: P≈[0,99944;0,00055;0,000004].
- T=2: P≈[0,5685;0,2686;0,1629].
Đây là xác suất lấy mẫu token giả định, không phải tỷ lệ bệnh. Tổng có thể lệch nhỏ vì làm tròn.
## Embedding
$$ cosine(a,b)=(a·b)/(‖a‖‖b‖)
Vector gần có thể biểu thị liên hệ theo mô hình nhưng không bảo đảm đồng nghĩa, cùng chỉ định hoặc cùng mức nguy hiểm. “Có đau ngực” và “không đau ngực” có thể gần về từ vựng nhưng khác ý nghĩa. Vector bằng 0 cần xử lý riêng.
## Liên hệ y khoa
Câu văn trôi chảy có thể bịa dữ kiện hoặc nguồn. Kiểm tra đầu ra với nguồn và phạm vi sử dụng, không dùng chatbot học tập để chẩn đoán hoặc chỉ định điều trị.
## Nguồn đọc thêm
- WHO — rủi ro và quản trị mô hình đa phương thức cho sức khỏe: https://www.who.int/publications/i/item/9789240084759
`,

GENAI: `
Prompt là cách mô tả nhiệm vụ, dữ liệu và dạng đầu ra. Prompt tốt giúp đánh giá rõ ràng hơn nhưng không bảo đảm câu trả lời đúng hoặc an toàn.
## Cấu trúc một lượt gọi
Các vai trò system, user và assistant là một cấu trúc thường gặp; hỗ trợ cụ thể tùy API. Một số dịch vụ có lưu hội thoại, nhưng không giả định mô hình tự nhớ mọi phiên. Chỉ gửi dữ liệu tối thiểu cần cho nhiệm vụ; không bắt buộc gửi toàn bộ tiền sử.
Thêm context trong một lượt suy luận không tự huấn luyện lại trọng số.
## Viết yêu cầu có thể kiểm tra
1. Nêu nhiệm vụ học tập và đối tượng.
2. Tách dữ liệu với chỉ dẫn bằng nhãn hoặc delimiter.
3. Yêu cầu ghi rõ thông tin thiếu, nguồn và giới hạn.
4. Kiểm tra bằng ví dụ có đáp án, ví dụ không đủ dữ kiện và dữ liệu chứa chỉ dẫn độc hại.
Delimiter/XML không chặn hoàn toàn prompt injection. Yêu cầu “không biết thì nói không biết” là định hướng, không cưỡng chế tuyệt đối. Hãy xin giải thích ngắn có căn cứ và đối chiếu nguồn; một chuỗi lập luận dài không tự đúng.
## Ví dụ SOAP
Subjective là thông tin chủ quan do người bệnh kể; Objective là dữ kiện khách quan quan sát/đo; Assessment là đánh giá; Plan là kế hoạch. Ví dụ trên dữ liệu giả lập cần không thêm triệu chứng hoặc xét nghiệm chưa có. Đây là học cấu trúc ghi chép, không xin y lệnh.
## Dữ liệu và API
App này gọi trực tiếp endpoint người dùng cấu hình; nội dung đã chọn được gửi ra ngoài và có thể phát sinh phí. Khóa trong trình duyệt không thể giữ như bí mật máy chủ; dùng khóa thử nghiệm giới hạn quyền/hạn mức, không nhúng khóa vào source. Lab này không cung cấp hệ thống quản trị khóa/quyền dùng cho bệnh viện; việc đó nằm ngoài phạm vi học tập.
Không dùng thông tin sức khỏe người thật. Bỏ tên chưa bảo đảm ẩn danh. HIPAA là khung Hoa Kỳ với phạm vi cụ thể; HHS mô tả Safe Harbor và Expert Determination, không có quy tắc xóa vài trường là tuân thủ mọi luật.
## Liên hệ y khoa
401/403 có thể là xác thực/quyền; 404 là tài nguyên/endpoint; 429 là hạn mức. Không dùng hệ thống học tập làm fallback cấp cứu. Trách nhiệm tổ chức, nhà phát triển và người sử dụng phụ thuộc vai trò/quy định; không quy toàn bộ trách nhiệm pháp lý cho một bác sĩ.
## Nguồn đọc thêm
- WHO: https://www.who.int/publications/i/item/9789240084759
- HHS — hai phương pháp de-identification: https://www.hhs.gov/hipaa/for-professionals/special-topics/de-identification/index.html
`,

RAG: `
RAG tìm tài liệu rồi đưa đoạn liên quan vào context cho mô hình sinh câu trả lời. Nó hỗ trợ truy nguồn, không bảo đảm tài liệu mới, đúng hoặc được diễn giải đúng.
## Các bước
1. Chọn tài liệu phù hợp quyền sử dụng, lưu tên/phiên bản/ngày.
2. Trích xuất và kiểm tra lỗi OCR, bảng, đơn vị.
3. Chia đoạn với metadata để mở được vị trí gốc.
4. Truy xuất theo câu hỏi.
5. Ghép đoạn và chỉ dẫn vào context.
6. Đối chiếu từng khẳng định với nguồn.
Kích thước đoạn và overlap cần thử theo tài liệu/nhiệm vụ, không có 300–500 token bảo đảm giữ nguyên mọi bảng. Lab web đo đoạn bằng ký tự, không token.
## BM25 và vector
$$ BM25(Q,D)=ΣₜIDF(t) · f(t,D)(k₁+1)/[f(t,D)+k₁(1−b+b|D|/avgdl)]
f là tần suất, k₁ kiểm soát bão hòa, b điều chỉnh độ dài. Biến thể IDF tùy cài đặt. BM25 hữu ích cho từ khóa nhưng không bảo đảm bắt đúng tên thuốc hay phủ định.
Vector search dùng biểu diễn và độ tương đồng; gần ngữ nghĩa không tự là đúng chỉ định. Hybrid có thể hữu ích nhưng phải đo trên câu hỏi kiểm thử, không mặc định luôn hơn vector hoặc từ khóa.
## Top-k và kiểm tra nguồn
k lớn có thể thêm đoạn nhiễu, mâu thuẫn hoặc vượt context. Một mã trích dẫn tồn tại chỉ chứng minh mã có trong context, không chứng minh khẳng định được hỗ trợ. Kiểm tra đoạn có chứa đúng kết luận, đối tượng và phiên bản; nếu thiếu nguồn, nói rõ chưa đủ căn cứ.
## Liên hệ y khoa
Một hướng dẫn cũ hoặc cho quần thể khác không tự phù hợp ca mới. Tài liệu truy xuất cũng có thể chứa prompt injection; không xem nội dung tài liệu như quyền ra lệnh cho hệ thống.
Trong lab, BM25 chạy cục bộ không cần API. Embedding gửi các đoạn ra endpoint; sinh câu trả lời gửi câu hỏi và context khi người dùng đồng ý. Dùng tài liệu giả lập, không dùng bệnh án thật.
## Bài kiểm tra không cần API
Nguồn A chỉ báo kết quả ở bệnh viện A. Câu trả lời “đã hiệu quả ở mọi bệnh viện [A]” không được nguồn hỗ trợ dù mã A hợp lệ.
## Nguồn đọc thêm
- RAG nền tảng: https://arxiv.org/abs/2005.11401
- WHO — kiểm tra lợi ích/hại và phạm vi dùng: https://www.who.int/publications/i/item/9789240084759
`,
};
