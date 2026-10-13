/** Lý thuyết nhóm Machine Learning Ứng dụng trong Y tế & Khoa học Dữ liệu Lâm sàng. */
export const ML_THEORY: Record<string, string> = {
KNN: `
K-Nearest Neighbors (KNN - k Láng giềng gần nhất) trong y học là hiện thân toán học của phương pháp **Lập luận Dựa trên Tình huống Lâm sàng (Case-Based Reasoning - CBR)**: khi tiếp cận một bệnh nhân mới, hệ thống tìm kiếm k bệnh nhân trong quá khứ có các đặc điểm bệnh sử, dấu hiệu sinh tồn và xét nghiệm tương đồng nhất để tham khảo chẩn đoán và tiên lượng.

## Trực giác Y học
Các bệnh nhân có cùng kiểu hình bệnh học (pathophysiological phenotype) — ví dụ: cùng có chỉ số glucose huyết đói cao, huyết áp tâm thu tăng và chỉ số BMI trong ngưỡng béo phì — thường chia sẻ chung cơ chế bệnh sinh và kết cuộc lâm sàng. KNN không ước lượng bất kỳ hàm tham số định trước nào trong quá trình huấn luyện (thuật toán học "lười" - instance-based learning), mà lưu trữ toàn bộ dữ liệu mẫu bệnh nhân để đối chiếu trực tiếp tại thời điểm suy luận.

## Quy trình Thực hiện
1. Thu thập bộ dữ liệu bệnh nhân chuẩn (tập Train) đã có chẩn đoán xác định từ hội đồng chuyên gia.
2. Với bệnh nhân mới cần chẩn đoán x, tính toán khoảng cách sinh học từ x tới **tất cả** bệnh nhân trong cơ sở dữ liệu.
3. Chọn ra k bệnh nhân có khoảng cách gần nhất.
4. Bỏ phiếu đa số: gán chẩn đoán xuất hiện nhiều nhất trong k ca bệnh tương đồng cho bệnh nhân mới; nếu hòa phiếu, ưu tiên nhãn của bệnh nhân có khoảng cách gần nhất.

## Khoảng cách Sinh học và Độ đo Tương đồng
Khoảng cách Euclid trong không gian d chiều của các chỉ số sinh lý:
$$ d(x, z) = √( Σⱼ (xⱼ − zⱼ)² )
Trong thực tế y tế, có thể sử dụng:
- Khoảng cách Manhattan Σ|xⱼ − zⱼ|: ít bị chi phối bởi một chỉ số xét nghiệm đột biến cá biệt.
- Khoảng cách Mahalanobis: tính đến tương quan đồng thời giữa các thông số sinh học (ví dụ tương quan tự nhiên giữa chiều cao và cân nặng, hoặc giữa ALT và AST).
- Bỏ phiếu có trọng số theo khoảng cách w = 1 / d: các ca bệnh có kiểu hình cực kỳ giống bệnh nhân mới sẽ có tiếng nói quyết định mạnh mẽ hơn các ca ở xa.

## Tầm quan trọng Sống còn của Chuẩn hóa Thang đo Y sinh
Các biến số lâm sàng có khoảng giá trị và đơn vị đo hoàn toàn khác biệt: nồng độ Glucose dao động từ 70 đến 300 mg/dL, trong khi Kali máu chỉ dao động trong khoảng hẹp từ 3,5 đến 5,0 mmol/L. Nếu không chuẩn hóa, chênh lệch glucose sẽ áp đảo hoàn toàn nồng độ kali — dù một biến thiên nhỏ của kali máu có thể gây ngừng tim tử vong!
Chuẩn hóa Z-score đưa tất cả chỉ số về cùng thang độ lệch chuẩn:
$$ x' = (x − μ_train) / σ_train
> Bắt buộc tuân thủ nguyên tắc TRIPOD: μ_train và σ_train phải được tính **độc quyền trên tập Train**, sau đó áp dụng cố định cho bệnh nhân mới ở tập Test. Tính toán trên toàn bộ dữ liệu là rò rỉ thông tin y tế nghiêm trọng.

## Đánh đổi Lâm sàng khi Chọn Siêu tham số k
- **k quá nhỏ (k = 1–3)**: Quyết định chẩn đoán bị phụ thuộc vào từng ca bệnh cá biệt. Nếu cơ sở dữ liệu có một bệnh nhân bị nhập sai kết quả xét nghiệm (nhiễu), bệnh nhân mới sẽ bị chẩn đoán sai hoàn toàn → **Phương sai cao (High Variance), Overfitting**. Với k = 1, độ chính xác trên tập Train luôn bằng 100% nhưng không có giá trị thực tiễn.
- **k quá lớn**: Ranh giới chẩn đoán bị san phẳng, mô hình có xu hướng luôn dự đoán nhóm bệnh phổ biến nhất trong cộng đồng và bỏ sót các hội chứng hiếm gặp → **Độ chệch cao (High Bias), Underfitting**.
- Nên chọn k là số lẻ đối với bài toán phân loại nhị phân (như Mắc bệnh / Không mắc bệnh) để triệt tiêu tình huống hòa phiếu.

## Thẩm định Lựa chọn k bằng Tập Kiểm định (Validation Cohort)
Không bao giờ dùng tập Test để chọn k. Chia dữ liệu thành Train / Validation / Test: quét qua một dải giá trị k trên tập Train, theo dõi đường cong Độ nhạy (Sensitivity) và Diện tích dưới đường ROC (AUC) trên tập Validation để chọn k tối ưu, sau đó mới kiểm định độc lập một lần duy nhất trên tập Test.

## Giới hạn và Thách thức trong Môi trường Lâm sàng
- Tốc độ suy luận: KNN đòi hỏi tính toán khoảng cách với hàng trăm nghìn bệnh án cũ tại mỗi lượt khám, gây chậm trễ trong các ứng dụng cấp cứu.
- Lời nguyền số chiều (Curse of Dimensionality): Khi đưa vào quá nhiều biến số gen hoặc xét nghiệm vi mô, mọi bệnh nhân đều cách xa nhau một khoảng tương đương trong không gian đa chiều, làm mất ý nghĩa của khái niệm "láng giềng gần nhất".

## Ví dụ Tính toán Cụ thể
Một bệnh nhân mới có (Glucose = 140 mg/dL, BMI = 32). Ba láng giềng gần nhất trong kho dữ liệu:
- Bệnh nhân 1: khoảng cách d = 1,2, Nhãn = Đái tháo đường.
- Bệnh nhân 2: khoảng cách d = 1,5, Nhãn = Đái tháo đường.
- Bệnh nhân 3: khoảng cách d = 2,8, Nhãn = Bình thường.
Bỏ phiếu đa số 2/3 → Dự đoán: **Đái tháo đường**. Nếu áp dụng trọng số nghịch đảo khoảng cách, phiếu của Bệnh nhân 1 và 2 càng vượt trội hơn Bệnh nhân 3.

## Tự kiểm tra tư duy lâm sàng
- Tại sao một mô hình KNN đạt độ chính xác 100% trên tập huấn luyện lại có thể gây nguy hiểm tính mạng khi áp dụng cho bệnh nhân thực tế tại phòng khám?
- Nếu đưa thêm 50 biến số xét nghiệm không liên quan vào bộ dữ liệu, thuật toán KNN sẽ bị suy giảm hiệu năng chẩn đoán ra sao?
`,

TREE: `
Cây Quyết Định Lâm Sàng (Clinical Decision Trees - CART) mô phỏng chính xác lưu đồ tư duy chẩn đoán (Diagnostic Flowcharts) của người thầy thuốc: tuần tự đặt ra các câu hỏi phân nhánh dựa trên các ngưỡng chỉ số sinh học cụ thể để phân loại bệnh nhân vào các nhóm nguy cơ.

## Cấu trúc Lưu đồ Ra Quyết định
- **Nút gốc (Root Node)**: chứa toàn thể quần thể bệnh nhân ban đầu.
- **Nút trung gian (Internal Splitting Nodes)**: phép kiểm tra một chỉ số lâm sàng kèm ngưỡng cắt (ví dụ: *"Huyết áp tâm thu > 140 mmHg?"* hoặc *"Tuổi ≥ 65?"*).
- **Nút lá (Leaf Nodes)**: kết luận chẩn đoán phân loại cuối cùng (ví dụ: *"Nguy cơ tim mạch cao"*) hoặc xác suất mắc bệnh của phân nhóm bệnh nhân rơi vào lá đó.

## Tiêu chí Tối ưu Điểm Cắt: Độ Tạp Gini và Entropy
Tại mỗi nút, thuật toán tìm kiếm biến số và ngưỡng giá trị cắt sao cho hai nhóm con sinh ra có mức độ thuần khiết bệnh học cao nhất.
Với tỷ lệ bệnh nhân thuộc nhóm bệnh k trong nút là pₖ:
$$ Chỉ số Tạp Gini = 1 − Σₖ pₖ²
$$ Độ hỗn loạn Entropy = − Σₖ pₖ · log₂ pₖ
- Nút hoàn toàn thuần khiết (100% bệnh nhân mắc bệnh hoặc 100% người khỏe mạnh): Gini = Entropy = 0.
- Nút phân vân tối đa (tỷ lệ 50/50 giữa có bệnh và không bệnh): Gini = 0,5, Entropy = 1,0.
Độ lợi thông tin (Information Gain) đo lường mức độ giảm độ tạp sau phép phân nhánh:
$$ Gain = I(nút cha) − (n_trái / n)·I(nút trái) − (n_phải / n)·I(nút phải)
Thuật toán CART quét qua toàn bộ các biến số và mọi ngưỡng cắt khả dĩ để chọn phép chia có Gain lớn nhất.

## Điều kiện Dừng và Kiểm soát Overfitting
Nếu để cây tự do phát triển không kiểm soát, nó sẽ tiếp tục phân nhánh cho tới khi mỗi chiếc lá chỉ chứa đúng một bệnh nhân. Cây lúc này sẽ học thuộc lòng cả các sai số ngẫu nhiên của tập Train và hoàn toàn mất khả năng tổng quát hóa trên quần thể bệnh nhân mới.
Các tiêu chí dừng lâm sàng cần thiết:
- Giới hạn độ sâu tối đa (max_depth): cây có độ sâu từ 3 đến 5 tầng là lý tưởng để bác sĩ có thể ghi nhớ và thực hiện nhanh tại giường bệnh.
- Số lượng bệnh nhân tối thiểu ở nút lá (min_samples_leaf): đảm bảo mỗi khuyến cáo điều trị đại diện cho một nhóm bệnh nhân đủ lớn, tránh hiện tượng đưa ra phác đồ dựa trên một vài ca bệnh cá biệt.
- Cắt tỉa cây (Cost-Complexity Pruning): loại bỏ các nhánh phụ không đóng góp đáng kể vào khả năng phân biệt trên tập Validation.

## Ưu điểm Vượt trội trong Y học Chứng cứ
- **Tính minh bạch và Khả năng giải trình 100% (White-box Model)**: Bác sĩ, bệnh nhân và các cơ quan quản lý y tế (FDA, Bộ Y tế) đều có thể kiểm tra từng bước lập luận trước khi áp dụng y lệnh.
- Bất biến trước phép co giãn thang đo: Phép phân nhánh theo ngưỡng không bị thay đổi bởi việc chuyển đổi đơn vị đo (ví dụ mg/dL sang mmol/L).
- Tự động lượng hóa Mức độ Quan trọng của Yếu tố Nguy cơ (Feature Importance): tổng mức giảm Gini tích lũy mà một biến số đóng góp trên toàn cây phản ánh sức nặng chẩn đoán của xét nghiệm đó.

## Cảnh báo Sai lầm khi Ứng dụng Cây Quyết định
- Ranh giới quyết định trực giao: Cây chỉ chia không gian bằng các đường song song với trục tọa độ, gặp khó khăn khi mô tả các mối quan hệ chéo tương hỗ giữa hai dấu ấn sinh học.
- Tính bất ổn định cấu trúc: Thay đổi một số lượng nhỏ bệnh nhân trong tập dữ liệu có thể làm thay đổi hoàn toàn nút gốc và toàn bộ cấu trúc phân nhánh bên dưới.
- Luật phân nhánh không đồng nghĩa với Khuyến cáo Nhân quả: Dòng chữ *"Nếu Glucose > 126 mg/dL thì kết luận Đái tháo đường"* là tiêu chuẩn chẩn đoán thống kê, không có nghĩa là hạ đường huyết xuống dưới 126 mg/dL sẽ lập tức đảo ngược toàn bộ biến chứng vi mạch đã tổn thương.

## Ví dụ Tính toán Phép Chia Lâm sàng
Một nhóm 10 bệnh nhân gồm 5 ca Đái tháo đường (Đ) và 5 ca Bình thường (B) (Gini cha = 0,5).
Bác sĩ thử phân nhánh theo biến Glucose tại ngưỡng 126 mg/dL:
- Nhánh Trái (Glucose ≤ 126): gồm 1 Đ và 4 B → Gini = 1 − (1/5)² − (4/5)² = 0,32.
- Nhánh Phải (Glucose > 126): gồm 4 Đ và 1 B → Gini = 1 − (4/5)² − (1/5)² = 0,32.
$$ Gain = 0,5 − (5/10)·0,32 − (5/10)·0,32 = 0,18
Phép chia này làm giảm đáng kể độ tạp của nhóm bệnh nhân và được chọn làm tiêu chí phân nhánh.

## Tự kiểm tra tư duy lâm sàng
- Tại sao các thang điểm phân tầng nguy cơ tim mạch kinh điển (như thang điểm TIMI trong nhồi máu cơ tim) thường được thiết kế dưới dạng cây quyết định nông thay vì mạng nơ-ron sâu?
- Nếu một nút lá chỉ chứa đúng 2 bệnh nhân và đạt độ chính xác 100%, bạn có nên đưa quy luật của nhánh đó vào phác đồ điều trị của bệnh viện không?
`,

LOGREG: `
Hồi quy Logistic (Logistic Regression) là mô hình nền tảng tiêu chuẩn vàng trong **Dịch tễ học Lâm sàng, Sàng lọc Bệnh tật và Thang điểm Tiên lượng Nguy cơ (Clinical Risk Scoring)**. Dù mang tên "hồi quy", đây là mô hình phân loại xác suất ước lượng nguy cơ p ∈ (0, 1) một bệnh nhân phát triển biến cố bệnh lý dựa trên tổ hợp tuyến tính các yếu tố nguy cơ.

## Mô hình Xác suất Sigmoid
Tổ hợp tuyến tính của các biến số lâm sàng z (log-odds) được đưa qua hàm Sigmoid để ánh xạ thành xác suất:
$$ z = β₀ + β₁x₁ + β₂x₂ + … + β_dx_d
$$ p = σ(z) = 1 / (1 + e^(−z))
Hàm Sigmoid đảm bảo xác suất dự báo luôn nằm chặt chẽ trong khoảng (0, 1). Khi z = 0, xác suất mắc bệnh p = 0,5 (ranh giới quyết định tuyến tính).

## Tỷ số Chênh (Odds Ratio - OR) và Ý nghĩa Dịch tễ Học
Trong dịch tễ học, chênh (Odds) mắc bệnh được định nghĩa là tỷ số giữa xác suất mắc bệnh và xác suất không mắc bệnh: Odds = p / (1 − p) = e^z.
Khi một yếu tố nguy cơ xⱼ tăng thêm 1 đơn vị sinh học (trong khi cố định toàn bộ các biến số khác):
$$ Tỷ số Chênh Odds Ratio: OR_j = e^(βⱼ)
- **OR = 1 (β = 0)**: Yếu tố không liên quan đến nguy cơ mắc bệnh.
- **OR > 1 (β > 0)**: Yếu tố làm tăng nguy cơ mắc bệnh (ví dụ: Hút thuốc lá đối với ung thư phổi, Tăng huyết áp đối với đột quỵ não).
- **OR < 1 (β < 0)**: Yếu tố bảo vệ làm giảm nguy cơ (ví dụ: Hoạt động thể lực thường xuyên đối với đái tháo đường).
Diễn giải OR đòi hỏi các biến liên tục phải được chuẩn hóa hợp lý và mô hình không bị hiện tượng đa cộng tuyến nghiêm trọng.

## Ước lượng Tham số bằng Hàm Hợp lý Cực đại (MLE)
Mô hình tối thiểu hóa hàm mất mát Cross-Entropy (Log-Loss) trên tập Train:
$$ L = − (1/n) Σᵢ [ yᵢ·log pᵢ + (1 − yᵢ)·log(1 − pᵢ) ]
Cập nhật trọng số thông qua thuật toán Gradient Descent kết hợp điều chuẩn L2 (Ridge) để ngăn chặn các hệ số β tăng vọt khi cỡ mẫu nghiên cứu nhỏ hoặc có hiện tượng tách biệt hoàn hảo (quasi-complete separation).

## Ma trận Nhầm lẫn và Hệ thống Chỉ số Lâm sàng Chuẩn mực
Quyết định can thiệp: Bệnh nhân được phân loại là Dương tính nếu xác suất p ≥ Ngưỡng quyết định (Decision Threshold).
Các chỉ số đánh giá độ chính xác chẩn đoán theo chuẩn STARD:
- **Độ nhạy (Sensitivity / Recall)**: Tỷ lệ bệnh nhân mắc bệnh thật sự được mô hình phát hiện đúng:
$$ Sensitivity = TP / (TP + FN)
- **Độ đặc hiệu (Specificity)**: Tỷ lệ người khỏe mạnh thật sự được mô hình xác nhận không có bệnh:
$$ Specificity = TN / (TN + FP)
- **Giá trị Tiên đoán Dương (PPV - Positive Predictive Value)**: Xác suất một người thực sự mắc bệnh khi nhận kết quả dương tính:
$$ PPV = TP / (TP + FP)
- **Giá trị Tiên đoán Âm (NPV - Negative Predictive Value)**: Xác suất một người thực sự khỏe mạnh khi nhận kết quả âm tính:
$$ NPV = TN / (TN + FN)
> Cực kỳ quan trọng trong y tế: PPV và NPV phụ thuộc mật thiết vào Tỷ lệ hiện mắc (Prevalence) của bệnh trong cộng đồng. Trong môi trường sàng lọc dân số nói chung (tỷ lệ bệnh rất thấp), ngay cả một mô hình có độ đặc hiệu 95% vẫn có thể cho ra PPV rất thấp do số lượng ca báo động giả (FP) áp đảo số ca bệnh thật.

## Tỉ số Khả dĩ (Likelihood Ratios) và Định lý Bayes
- **Tỉ số khả dĩ dương (LR+)**: LR+ = Sensitivity / (1 − Specificity). Đo lường khả năng một kết quả xét nghiệm dương tính xuất hiện ở người có bệnh so với người không bệnh (LR+ > 10 mang ý nghĩa chẩn đoán xác định bệnh rất mạnh).
- **Tỉ số khả dĩ âm (LR−)**: LR− = (1 − Sensitivity) / Specificity (LR− < 0,1 mang ý nghĩa loại trừ bệnh rất mạnh).

## Đường cong ROC, Diện tích AUROC và Độ Hiệu Chuẩn (Calibration)
- **Đường cong ROC (Receiver Operating Characteristic)**: biểu diễn mối quan hệ đánh đổi giữa Độ nhạy (Trục Y) và 1 − Độ đặc hiệu (Trục X) trên mọi ngưỡng cắt khả dĩ.
- **AUROC (C-index)**: thước đo năng lực phân biệt (Discrimination) tổng thể của mô hình. AUC = 0,5 tương đương đoán ngẫu nhiên; AUC > 0,8 đại diện cho mô hình lâm sàng tốt; AUC > 0,9 là xuất sắc.
- **Độ hiệu chuẩn (Calibration)**: Trong thực hành y khoa, khả năng phân biệt tốt là chưa đủ. Nếu mô hình dự báo bệnh nhân có 20% nguy cơ nhồi máu cơ tim, thì trong 100 bệnh nhân được dự báo 20%, phải có đúng khoảng 20 người gặp biến cố. Đánh giá độ hiệu chuẩn bằng Đường cong hiệu chuẩn (Calibration Plot) và Điểm Brier (Brier Score).

## Tối ưu hóa Ngưỡng theo Mục tiêu Y tế: Sàng lọc vs Can thiệp Xâm lấn
- **Chiến lược Sàng lọc Cộng đồng (Screening)**: Chi phí của việc bỏ sót bệnh (False Negative - ung thư giai đoạn sớm không được phát hiện) là cái chết của người bệnh. Cần tối đa hóa Độ nhạy → **Hạ ngưỡng quyết định xuống thấp (ví dụ p_cut = 0,2)**. Chấp nhận nhiều ca báo động giả (False Positive) để thực hiện xét nghiệm khẳng định chuyên sâu sau đó.
- **Chiến lược Chỉ định Can thiệp Xâm lấn (Rule-in / Surgery)**: Phẫu thuật hoặc hóa trị có biến chứng nguy hiểm tính mạng. Không được phép mổ nhầm trên người khỏe mạnh (False Positive). Cần tối đa hóa Độ đặc hiệu và PPV → **Nâng ngưỡng quyết định lên cao (ví dụ p_cut = 0,8)**.

## Tự kiểm tra tư duy lâm sàng
- Tại sao trong chương trình tầm soát ung thư đại trực tràng cộng đồng, bác sĩ luôn yêu cầu xét nghiệm có Độ nhạy cao thay vì Độ đặc hiệu cao?
- Một mô hình dự báo tử vong có AUROC = 0,88 nhưng luôn ước lượng nguy cơ gấp đôi thực tế (dự báo 40% trong khi tỷ lệ thực chỉ 20%). Mô hình này gặp vấn đề về Discrimination hay Calibration?
`,

KMEANS: `
K-means trong y học là công cụ nghiên cứu khám phá phục vụ **Phân nhóm Dưới Lâm sàng (Clinical Subtyping) và Y học Cá thể hóa (Precision Medicine)**: phân chia một quần thể bệnh nhân mắc cùng một căn bệnh chung thành k phân nhóm nhỏ có đặc điểm sinh học và đáp ứng điều trị đồng nhất mà không cần dựa vào nhãn chẩn đoán có sẵn.

## Mục tiêu Lâm sàng
Ví dụ kinh điển: Hội chứng suy tim hoặc Đái tháo đường typ 2 từ lâu đã được xem là một bệnh lý đồng nhất, nhưng thực chất bao gồm nhiều nhóm bệnh sinh khác nhau (nhóm đái tháo đường kháng insulin nghiêm trọng, nhóm thiếu hụt insulin do gen, nhóm béo phì chuyển hóa). K-means phân tích cụm giúp các nhà nghiên cứu nhận diện các phân nhóm dưới lâm sàng này để cá thể hóa phác đồ điều trị.

## Hàm Mục tiêu Toán học
Tìm kiếm k tâm cụm μ₁ … μ_k đại diện cho k kiểu hình bệnh nhân sao cho tổng bình phương khoảng cách nội cụm (Inertia / WCSS) đạt mức tối thiểu:
$$ J = Σᵢ ‖xᵢ − μ_c(i)‖²

## Thuật toán Lloyd Lặp từng Bước
1. Khởi tạo k tâm cụm ban đầu bằng phương pháp K-means++ (tránh bẫy hội tụ cục bộ).
2. **Bước Gán (Assignment Step)**: Gán từng bệnh nhân vào phân nhóm có tâm kiểu hình gần nhất dựa trên khoảng cách Euclid của các chỉ số sinh hóa.
3. **Bước Cập nhật (Update Step)**: Tính toán lại tâm của từng phân nhóm bằng trung bình cộng các chỉ số của toàn bộ bệnh nhân thuộc nhóm đó.
4. Lặp lại bước 2 và 3 cho tới khi sự phân chia bệnh nhân không còn thay đổi.

## Khởi tạo K-means++ và Độ Ổn định Sinh học
Khởi tạo ngẫu nhiên đơn thuần có thể khiến các tâm cụm rơi vào cùng một vùng dữ liệu dày đặc. K-means++ chọn tâm đầu tiên ngẫu nhiên, các tâm tiếp theo được chọn với xác suất tỷ lệ với bình phương khoảng cách tới tâm gần nhất đã có, giúp các cụm kiểu hình bệnh nhân trải rộng khắp không gian phân bố sinh học. Luôn chạy thuật toán nhiều lần với các seed ngẫu nhiên khác nhau và chọn nghiệm có J thấp nhất.

## Phương pháp Xác định Số Phân nhóm k Phù hợp
- **Phương pháp Điểm Khuỷu tay (Elbow Method)**: Vẽ đồ thị WCSS theo số lượng cụm k; tìm điểm gập mà sau đó việc tăng thêm số cụm không còn làm giảm đáng kể phương sai nội nhóm.
- **Hệ số Silhouette**: Đo lường mức độ tách biệt giữa các cụm. Silhouette dao động từ −1 đến +1; giá trị càng gần +1 chứng minh các phân nhóm bệnh nhân được phân định rõ ràng và không bị chồng lấn.
- **Thẩm định Lâm sàng Thực nghiệm**: Một giải pháp phân cụm chỉ có giá trị y khoa thực sự nếu các phân nhóm sinh ra có sự khác biệt có ý nghĩa thống kê về kết cuộc sống còn (như tỷ lệ tử vong 5 năm phân tách rõ rệt trên đường cong Kaplan-Meier) hoặc đáp ứng thuốc khác biệt.

## Giới hạn Nghiêm ngặt của K-means trong Dữ liệu Y sinh
- Giả định cụm hình cầu đẳng hướng: K-means giả định các nhóm bệnh nhân có dạng hình cầu với kích thước tương đương, thất bại khi các phân nhóm bệnh lý có cấu trúc xoắn phức tạp hoặc phân bố phi tuyến (khi đó DBSCAN hoặc Gaussian Mixture Models - GMM phù hợp hơn).
- Nhạy cảm với Thang đo và Ngoại lai: Bắt buộc phải chuẩn hóa Z-score toàn bộ các xét nghiệm trước khi phân cụm. Các ca bệnh biến chứng cực đoan có thể kéo lệch hoàn toàn tâm của phân nhóm.

## Tự kiểm tra tư duy lâm sàng
- Tại sao các nhãn phân cụm "Nhóm 1", "Nhóm 2", "Nhóm 3" do K-means tạo ra không thể tự động coi là các tên bệnh chẩn đoán chính thức nếu chưa có xác thực sinh học phân tử?
- Nếu tăng k từ 2 lên 10 và chỉ số WCSS liên tục giảm, có nên chia bệnh nhân thành 10 nhóm điều trị khác nhau trong thực tế bệnh viện không?
`,

PCA: `
Phân tích Thành phần Chính (Principal Component Analysis - PCA) là kỹ thuật **giảm chiều dữ liệu tuyến tính, không giám sát** cốt lõi trong Tin sinh học và Y học Đa tầng dữ liệu (Multi-omics): nén hàng nghìn biến số biểu hiện gen, dữ liệu protein hoặc chỉ số chuyển hóa phức tạp xuống một vài chiều không gian trực quan mà vẫn bảo tồn tối đa phương sai sinh học của mẫu nghiên cứu.

## Trực giác Sinh học
Khi nghiên cứu một căn bệnh mạn tính, các nhà khoa học thường đo lường hàng trăm thông số sinh hóa. Nhiều chỉ số trong số đó có mối liên hệ sinh lý chặt chẽ với nhau (ví dụ: các chỉ số trong bộ mỡ máu Cholesterol toàn phần, LDL-C, Triglyceride, ApoB đều cùng phản ánh tình trạng rối loạn lipid máu). PCA tìm kiếm các trục biến đổi mới (các Thành phần chính - PCs) đại diện cho các con đường sinh học chung mà không còn chứa đựng thông tin trùng lặp.

## Quy trình Tính toán Đại số Tuyến tính
1. Chuẩn hóa Z-score toàn bộ ma trận dữ liệu y sinh X (bắt buộc trừ trung bình và chia độ lệch chuẩn để các gen có biên độ biểu hiện lớn không áp đảo các gen có biên độ nhỏ).
2. Tính ma trận hiệp phương sai mẫu C:
$$ C = (1/(n−1)) · Xᵀ X
3. Tìm các trị riêng (eigenvalues) λ₁ ≥ λ₂ ≥ … và các vector riêng (eigenvectors) v₁, v₂, … tương ứng của C.
4. Tọa độ của bệnh nhân trên thành phần chính thứ k: zₖ = vₖ · (x − μ).

## Tỷ lệ Phương sai Giải thích (Explained Variance Ratio)
Phương sai của thành phần chính thứ k tương ứng với trị riêng λₖ.
$$ Tỷ lệ phương sai của PCk = λₖ / Σⱼ λⱼ
Cộng dồn tỷ lệ này để xác định cần giữ lại bao nhiêu thành phần chính nhằm bảo tồn một lượng thông tin định trước (ví dụ: giữ lại 80% hoặc 90% biến thiên sinh học tổng thể). Đồ thị Scree Plot giúp nhận diện điểm gãy để lựa chọn số chiều tối ưu.

## Tái dựng và Mất mát Thông tin Lâm sàng
Bệnh nhân có thể được tái dựng lại từ k thành phần chính đầu tiên: x̂ = μ + Σₖ zₖ·vₖ. Sai số giữa dữ liệu gốc và dữ liệu tái dựng đại diện cho phần nhiễu sinh học hoặc các biến thiên cá thể nhỏ bị loại bỏ. PCA thực chất là một mạng Autoencoder tuyến tính tối ưu.

## Lưu ý Sống còn khi Ứng dụng PCA trong Y tế
- **PCA hoàn toàn "Mù" trước Nhãn Bệnh (Unsupervised Nature)**: Hướng có phương sai lớn nhất trong tập dữ liệu có thể là biến thiên do tuổi tác, giới tính, kỹ thuật lấy mẫu của phòng lab hoặc hiệu ứng lô (batch effect), **chứ không nhất thiết là hướng phân biệt giữa người bệnh và người khỏe**. Việc giảm chiều bằng PCA đôi khi vô tình xóa bỏ đúng chiều biến thiên nhỏ nhưng mang tính quyết định bệnh lý.
- Khó khăn trong Diễn giải Lâm sàng: Thành phần chính PC1 là một tổ hợp toán học tuyến tính của hàng chục xét nghiệm khác nhau. Bác sĩ không thể kê đơn dựa trên "chỉ số PC1". Cần phân tích ma trận tải trọng (Loadings) để xem xét nghiệm nào đóng góp trọng số lớn nhất vào từng thành phần.
- Giới hạn Tuyến tính: PCA chỉ nhận diện được các quan hệ tuyến tính; các cấu trúc sinh học phi tuyến đòi hỏi các kỹ thuật như t-SNE, UMAP hoặc Autoencoder phi tuyến.

## Tự kiểm tra tư duy lâm sàng
- Tại sao trong nghiên cứu biểu hiện gen vi mảng (Microarray), bước đầu tiên luôn là vẽ biểu đồ phân tán PCA 2D của các mẫu bệnh phẩm để kiểm tra hiệu ứng lô (batch effect)?
- Nếu một bệnh nhân có nồng độ kháng thể đặc hiệu biến thiên rất nhỏ nhưng quyết định khả năng miễn dịch, PCA có nguy cơ làm mất thông tin này không?
`,

LINREG: `
Hồi quy Tuyến tính Đa biến (Multivariable Linear Regression) là công cụ kinh điển trong Nghiên cứu Y học Lâm sàng và Dược động học để dự báo một **chỉ số sinh học liên tục** (như huyết áp tâm thu sau điều trị, nồng độ HbA1c, độ thanh thải thuốc) và định lượng mối quan hệ nhân quả/liều-đáp ứng giữa các yếu tố can thiệp với kết cuộc sức khỏe.

## Mô hình Hồi quy Đa biến
$$ ŷ = β₀ + β₁x₁ + β₂x₂ + … + β_dx_d
- β₀: Giá trị nền của chỉ số sinh học khi tất cả các yếu tố nguy cơ bằng 0.
- βⱼ: Hệ số hồi quy riêng phần (Partial Regression Coefficient) — phản ánh sự thay đổi trung bình của chỉ số kết cuộc khi yếu tố nguy cơ xⱼ tăng thêm 1 đơn vị, **khi đã hiệu chỉnh và cố định toàn bộ các biến số lâm sàng khác trong mô hình**.

## Phương pháp Bình phương Tối thiểu (OLS) và Hàm Mất mát
Tìm kiếm các trọng số β nhằm tối thiểu hóa tổng bình phương phần dư (Residual Sum of Squares):
$$ MSE = (1/n) Σ (yᵢ − ŷᵢ)²
Với phần dư eᵢ = yᵢ − ŷᵢ là chênh lệch giữa giá trị đo thực tế tại phòng xét nghiệm và giá trị mô hình dự báo.

## Thước đo Sai số và Khả năng Giải thích Mô hình
- **RMSE (Root Mean Squared Error)** = √MSE: có cùng đơn vị đo lường với biến kết cuộc (ví dụ: mmHg hoặc mg/dL), phạt rất nặng các sai số dự báo lớn trên những bệnh nhân nặng.
- **MAE (Mean Absolute Error)**: trung bình độ lệch tuyệt đối, bền vững hơn trước các ca ngoại lai.
- **Hệ số Xác định R²**: tỷ lệ biến thiên của chỉ số sinh học được giải thích bởi tập hợp các yếu tố nguy cơ trong mô hình:
$$ R² = 1 − [ Σ (yᵢ − ŷᵢ)² ] / [ Σ (yᵢ − ȳ)² ]
R² = 0,40 có nghĩa là mô hình giải thích được 40% sự biến thiên của huyết áp trong quần thể nghiên cứu; 60% còn lại do các yếu tố di truyền, môi trường hoặc ngẫu nhiên chưa được đo lường.

## Kiểm tra Các Giả định Cốt lõi của Mô hình Y sinh
Để các kết luận thống kê (khoảng tin cậy 95%, p-value) có giá trị y học, phần dư e phải thỏa mãn 4 điều kiện Gauss-Markov:
1. Tính Tuyến tính (Linearity): Mối quan hệ giữa biến số và kết cuộc là tuyến tính (kiểm tra bằng biểu đồ phần dư theo giá trị dự báo).
2. Tính Độc lập (Independence): Các quan sát bệnh nhân độc lập với nhau (không có hiện tượng đo lặp lại trên cùng một bệnh nhân mà không dùng mô hình hiệu ứng hỗn hợp Mixed-effects).
3. Phương sai Sai số Đồng nhất (Homoscedasticity): Phương sai của phần dư không đổi trên các mức giá trị dự đoán khác nhau (không có hình phễu).
4. Phân bố Chuẩn (Normality): Phần dư có phân bố xấp xỉ chuẩn (kiểm tra qua biểu đồ Q-Q plot).

## Điều chuẩn Ridge (L2) và Lasso (L1) trong Dữ liệu Gen Đa chiều
Khi số lượng chỉ số sinh học lớn hơn cỡ mẫu bệnh nhân (p > n) hoặc giữa các xét nghiệm có hiện tượng đa cộng tuyến cao:
- **Ridge (L2)**: thêm số hạng phạt λΣβⱼ² giúp co nhỏ các hệ số, ổn định mô hình.
- **Lasso (L1)**: thêm số hạng phạt λΣ|βⱼ| có khả năng triệt tiêu các hệ số không quan trọng về đúng bằng 0, đóng vai trò công cụ chọn lọc các dấu ấn sinh học hàng đầu (Biomarker Selection).

## Cảnh báo Ngoại suy Lâm sàng (Clinical Extrapolation Danger)
Mô hình chỉ có giá trị dự báo trong phạm vi khoảng giá trị sinh học của quần thể huấn luyện. Việc ngoại suy mô hình tính liều thuốc của người lớn cho trẻ em hoặc bệnh nhân suy thận nặng là điều cấm kỵ tuyệt đối vì động học thải trừ hoàn toàn khác biệt.

## Tự kiểm tra tư duy lâm sàng
- Một mô hình dự báo đường huyết có R² trên tập Train là 0,85 nhưng trên tập Validation độc lập chỉ đạt 0,15. Hiện tượng gì đang xảy ra và nguyên nhân lâm sàng có thể là gì?
- Tại sao trong nghiên cứu y học, việc báo cáo khoảng tin cậy 95% của hệ số β lại quan trọng hơn việc chỉ đưa ra giá trị dự báo điểm đơn thuần?
`,

FOREST: `
Rừng Ngẫu Nhiên (Random Forest) là giải pháp **Học Tập Hợp (Ensemble Learning)** hàng đầu trong Tin sinh học và Y học Dự đoán: kết hợp hàng trăm cây quyết định độc lập thông qua kỹ thuật lấy mẫu tái lặp có hoàn lại (Bootstrap) và chọn lọc ngẫu nhiên đặc trưng, tạo nên một công cụ tiên lượng có độ chính xác cao và khả năng chống Overfitting vượt trội.

## Cơ chế Hai Tầng Ngẫu Nhiên
1. **Lấy mẫu Bootstrap (Bagging)**: Mỗi cây trong rừng được huấn luyện trên một tập dữ liệu bệnh nhân riêng biệt, được rút ngẫu nhiên có hoàn lại từ tập Train gốc. Khoảng 63,2% bệnh nhân xuất hiện trong mẫu luyện; 36,8% bệnh nhân còn lại không được cây nhìn thấy tạo thành tập Out-Of-Bag (OOB).
2. **Chọn biến ngẫu nhiên (Random Feature Selection)**: Tại mỗi nút phân nhánh, thay vì tìm kiếm trên toàn bộ d chỉ số xét nghiệm, thuật toán chỉ xem xét một tập con ngẫu nhiên m biến (thường m ≈ √d). Kỹ thuật này triệt tiêu sự phụ thuộc vào một vài dấu ấn sinh học quá áp đảo, buộc các cây phải khai phá các con đường bệnh sinh tiềm ẩn khác.

## Cơ chế Dự báo và Giảm Phương sai
- Dự đoán Phân loại: Lấy trung bình xác suất mắc bệnh từ toàn bộ B cây trong rừng (hoặc bỏ phiếu đa số).
- Phép màu thống kê: Nếu một cây đơn lẻ có phương sai lỗi là σ² và độ tương quan giữa các cây là ρ, phương sai của toàn bộ rừng:
$$ Var(Rừng) = ρσ² + [(1 − ρ)σ²] / B
Bằng cách giảm tương quan ρ giữa các cây thông qua tính ngẫu nhiên, Random Forest giảm thiểu ngoạn mục phương sai sai số mà không làm tăng độ chệch của mô hình.

## Đánh giá Tự thân Out-Of-Bag (OOB Error)
Vì mỗi bệnh nhân đều là mẫu OOB đối với khoảng 37% số cây trong rừng, ta có thể đánh giá năng lực dự báo của mô hình ngay trên tập OOB mà không cần phân chia riêng một tập Validation ban đầu. Sai số OOB cung cấp một ước lượng khách quan, không thiên vị về độ chính xác lâm sàng thực tế.

## Lượng hóa Độ Quan Trọng của Biến số Lâm sàng (Feature Importance)
- **Mức giảm tạp chất Gini (MDI)**: Tổng độ giảm Gini mà một xét nghiệm đóng góp trên toàn bộ các cây.
- **Độ quan trọng Hoán vị (Permutation Feature Importance - PFI)**: Kỹ thuật chuẩn mực hơn trong y tế — xáo trộn ngẫu nhiên các giá trị của một biến số trên tập OOB và đo lường mức độ sụt giảm AUC. Biến số nào khi bị xáo trộn làm AUC sụt giảm nghiêm trọng nhất chính là yếu tố nguy cơ chi phối mạnh nhất đối với bệnh tật.

## So sánh với Cây Đơn lẻ và Gradient Boosting trong Y tế
- So với Cây quyết định: Random Forest chính xác hơn rất nhiều, không bị nhạy cảm với nhiễu bệnh án, nhưng đánh đổi lại bằng việc biến thành mô hình "Hộp đen" (Black-box) khó giải trình tường minh.
- So với Gradient Boosting (XGBoost/LightGBM): Random Forest dễ tinh chỉnh hơn và hầu như không bị Overfitting khi tăng thêm số lượng cây; tuy nhiên Boosting thường đạt hiệu năng phân biệt nhỉnh hơn một chút trên các bảng dữ liệu lâm sàng dạng bảng lớn.

## Cảnh báo Thiên lệch trong Dữ liệu Lệch Lớp (Imbalanced Data)
Trong các bệnh lý hiếm gặp (tỷ lệ mắc < 5%), các cây trong rừng có xu hướng ưu tiên học lớp người khỏe mạnh để tối đa hóa độ chính xác tổng thể. Khi đó, bắt buộc phải áp dụng kỹ thuật Balanced Random Forest hoặc gán trọng số lớp (class weights) để bảo vệ Độ nhạy chẩn đoán.

## Tự kiểm tra tư duy lâm sàng
- Tại sao việc tăng số lượng cây trong Random Forest từ 100 lên 1.000 cây không làm mô hình bị Overfitting như việc tăng độ sâu của một cây đơn lẻ?
- Nếu hai xét nghiệm lâm sàng có tương quan sinh học rất cao (như ALT và AST), độ quan trọng Permutation Importance của từng biến sẽ bị ảnh hưởng như thế nào trong Random Forest?
`,

SVM: `
Support Vector Machine (SVM - Máy Vector Hỗ Trợ) trong y học là thuật toán phân loại mạnh mẽ được thiết kế để tìm kiếm một siêu phẳng phân tách tối ưu hóa **Biên An Toàn (Margin)** lớn nhất giữa nhóm bệnh nhân mắc bệnh và nhóm người khỏe mạnh, đặc biệt xuất sắc trong các bài toán dữ liệu gen và hình ảnh y sinh có số chiều lớn nhưng cỡ mẫu nhỏ (Small-n-Large-p Problem).

## Siêu phẳng và Khái niệm Biên An Toàn trong Lâm sàng
Xét siêu phẳng phân tách tuyến tính w·x + b = 0 với nhãn y ∈ {−1, +1}:
Khoảng cách từ siêu phẳng tới các bệnh nhân nằm sát ranh giới nhất chính là độ rộng biên: Margin = 2 / ‖w‖.
Tối đa hóa biên an toàn đồng nghĩa với việc tối thiểu hóa chuẩn vector trọng số ½‖w‖². Trong y học, một biên an toàn càng rộng đồng nghĩa với việc mô hình có độ dung thứ sinh học cao, ít bị chẩn đoán sai khi các chỉ số xét nghiệm của bệnh nhân dao động tự nhiên quanh ngưỡng ranh giới.

## Bài toán Biên Mềm (Soft Margin) và Tham số Đánh đổi C
Dữ liệu y tế luôn có sự chồng lấn sinh học giữa người bình thường và người bệnh ở giai đoạn tiền lâm sàng. Do đó, bài toán cho phép một mức độ vi phạm lề nhất định thông qua biến bù sai số ξᵢ và hàm mất mát Hinge Loss:
$$ min  ½‖w‖² + C · Σᵢ max(0, 1 − yᵢ(w·xᵢ + b))
- **Tham số phạt C**:
  * C lớn: Phạt cực nặng mỗi ca bệnh bị phân loại sai → Biên hẹp, mô hình cố gắng bám sát từng điểm dữ liệu Train, rất dễ Overfitting trước nhiễu xét nghiệm.
  * C nhỏ: Chấp nhận biên rộng hơn và dung thứ cho một số ca ngoại lai → Mô hình mượt mà, tổng quát hóa tốt hơn trên quần thể bên ngoài.

## Các Vector Hỗ Trợ (Support Vectors)
Điểm độc đáo của SVM: Ranh giới chẩn đoán cuối cùng **chỉ được định đoạt bởi một số ít các bệnh nhân nằm ngay trên đường biên hoặc bị phân loại sai (các Support Vectors)**. Toàn bộ các bệnh nhân khỏe mạnh bình thường nằm sâu phía sau đường biên hoàn toàn không ảnh hưởng đến vị trí của siêu phẳng. Điều này giúp SVM cực kỳ gọn gàng và ít bị kéo lệch bởi phân bố đa số.

## Kỹ xảo Hạt nhân (Kernel Trick) trong Bệnh học Phi tuyến
Nhiều quá trình bệnh sinh có ranh giới phi tuyến phức tạp không thể tách rời bằng một đường thẳng. Kernel trick ánh xạ dữ liệu bệnh nhân vào một không gian đặc trưng nhiều chiều vô hạn mà không cần tính toán tường minh tọa độ mới:
$$ Hạt nhân RBF (Gaussian): K(x, z) = exp(−γ‖x − z‖²)
$$ Hạt nhân Đa thức: K(x, z) = (x·z + c)^p
- **Tham số γ (Gamma) của RBF**:
  * γ lớn: Vùng ảnh hưởng của mỗi bệnh nhân mẫu rất hẹp → ranh giới chẩn đoán co cụm quanh từng ca bệnh cụ thể (nguy cơ Overfitting nghiêm trọng tương tự 1-NN).
  * γ nhỏ: Vùng ảnh hưởng lan rộng → ranh giới biến đổi từ từ, tiến gần về ranh giới tuyến tính.
Bộ đôi siêu tham số (C, γ) bắt buộc phải được tối ưu đồng thời thông qua tìm kiếm lưới (Grid Search) trên tập Validation.

## Hiệu chuẩn Platt (Platt Scaling) sang Xác suất Y tế
Mặc định, SVM xuất ra một điểm số khoảng cách ký hiệu f(x) = w·x + b chứ không phải xác suất. Bác sĩ không thể đưa ra quyết định điều trị dựa trên một giá trị khoảng cách trừu tượng. Phương pháp hiệu chuẩn Platt khớp một hàm hồi quy logistic 1 biến trên khoảng cách f(x) để chuyển đổi điểm số SVM thành xác suất lâm sàng có thể diễn giải p ∈ (0, 1).

## Tự kiểm tra tư duy lâm sàng
- Điều gì sẽ xảy ra với ranh giới phân loại của SVM nếu ta bổ sung thêm 1.000 bệnh nhân hoàn toàn khỏe mạnh nằm rất xa vùng ranh giới bệnh lý?
- Tại sao việc chuẩn hóa thang đo Z-score lại là điều kiện tiên quyết bắt buộc trước khi đưa dữ liệu bệnh nhân vào huấn luyện mô hình SVM?
`,

COMPARE: `
So Sánh & Thẩm Định Mô Hình Lâm Sàng theo Chuẩn Quốc Tế (**TRIPOD-AI, STARD-AI và PROBAST**) là quy trình khoa học nghiêm ngặt nhằm xác định mô hình học máy nào thực sự ưu việt, an toàn và sẵn sàng triển khai trong thực tế chăm sóc sức khỏe, loại bỏ hoàn toàn các ảo tưởng về hiệu năng do rò rỉ dữ liệu hoặc sai lệch phương pháp luận.

## Ba Phân đoạn Dữ liệu Độc lập Bắt buộc
- **Tập Huấn luyện (Derivation / Training Cohort)**: Dùng để ước lượng các trọng số và tham số nội tại của các thuật toán.
- **Tập Kiểm định Nội bộ (Internal Validation / Tuning Cohort)**: Dùng để lựa chọn mô hình, tinh chỉnh các siêu tham số (như k của KNN, độ sâu cây, tham số C/γ của SVM) và xác định ngưỡng cắt quyết định lâm sàng.
- **Tập Đánh giá Độc lập (Independent Test / External Validation Cohort)**: Đóng vai trò như một thử nghiệm lâm sàng độc lập — chỉ được mở khóa và đánh giá **duy nhất một lần** sau khi tất cả các mô hình đã được cố định hoàn toàn. Việc xem kết quả tập Test rồi quay lại chỉnh sửa mô hình là hành vi gian lận học thuật biến Test thành Validation.

## Kiểm định Chéo Phân Tầng (Stratified K-Fold Cross-Validation)
Khi cỡ mẫu nghiên cứu y học có hạn, phân chia K-Fold phân tầng (thường K = 5 hoặc 10) chia tập Train thành K phần bằng nhau sao cho tỷ lệ ca bệnh trong mỗi phần phản ánh đúng tỷ lệ hiện mắc của toàn bộ mẫu. Mô hình được huấn luyện trên K−1 phần và kiểm tra trên phần còn lại, lặp lại K lần và lấy trung bình. Kỹ thuật này cung cấp ước lượng hiệu năng kèm khoảng tin cậy 95% khách quan.

## Khung Đánh giá Hiệu năng Toàn diện theo Chuẩn Y khoa
Một mô hình không bao giờ được đánh giá đơn độc bằng chỉ số Accuracy (Độ chính xác tổng thể). Khung thẩm định bắt buộc bao gồm:
1. **Năng lực Phân biệt (Discrimination)**: Khả năng xếp hạng bệnh nhân có nguy cơ cao hơn người có nguy cơ thấp — đo lường bằng AUROC (C-index) và Đường cong Precision-Recall (AUPRC đối với bệnh hiếm).
2. **Độ Hiệu chuẩn Lâm sàng (Calibration)**: Đo lường mức độ khớp giữa xác suất rủi ro dự báo và tỷ lệ biến cố quan sát thực tế — đánh giá qua Hệ số dốc hiệu chuẩn (Calibration Slope, lý tưởng = 1), Điểm chặn hiệu chuẩn (Calibration Intercept, lý tưởng = 0) và Điểm Brier Score.
3. **Phân tích Quyết định Lâm sàng (Decision Curve Analysis - DCA)**: Đo lường Lợi ích Ròng (Net Benefit) của mô hình trên các ngưỡng can thiệp lâm sàng khác nhau so với hai chiến lược mặc định: "Can thiệp cho tất cả bệnh nhân" hoặc "Không can thiệp cho ai".

## Nguyên tắc Đối chiếu với Mô hình Nền tảng (Clinical Baseline)
Một mô hình AI phức tạp chỉ được coi là có giá trị thực tiễn nếu nó chứng minh được sự vượt trội vượt bậc so với các công cụ lâm sàng hiện hành:
- Thang điểm lâm sàng truyền thống (như thang điểm Framingham, CURB-65, Glasgow).
- Mô hình Hồi quy Logistic chuẩn tắc chỉ gồm một vài yếu tố nguy cơ kinh điển (Tuổi, Giới tính, Tiền sử).
Nếu một mạng Deep Learning phức tạp chỉ tăng thêm 0,01 AUROC so với Hồi quy Logistic nhưng làm mất hoàn toàn tính giải trình, mô hình đó không đủ điều kiện để triển khai lâm sàng.

## Thẩm định Ngoài (External Geographic/Temporal Validation)
Mô hình đạt kết quả xuất sắc tại bệnh viện tuyến trung ương nơi phát triển (Internal Validation) thường bị suy giảm hiệu năng nghiêm trọng khi đem áp dụng tại một bệnh viện tuyến tỉnh khác (External Validation) do sự khác biệt về dân số bệnh nhân, thiết bị xét nghiệm và thói quen chỉ định (hiện tượng Trôi dạt Miền - Domain Shift). Thẩm định ngoài là điều kiện tiên quyết để được phê duyệt lưu hành y tế.

## Tự kiểm tra tư duy lâm sàng
- Mô hình A đạt AUROC = 0,84, Brier Score = 0,10. Mô hình B đạt AUROC = 0,86 nhưng Brier Score = 0,25 (hiệu chuẩn rất tệ). Nếu bạn là bác sĩ kê đơn thuốc dự phòng, bạn sẽ chọn mô hình nào?
- Tại sao việc chia ngẫu nhiên dữ liệu ở cấp độ đợt khám (Visit-level) thay vì cấp độ bệnh nhân (Patient-level) lại bị coi là sai phạm nghiêm trọng nhất theo chuẩn PROBAST?
`,

TEACHABLE: `
Teachable Machine trong Y sinh học đại diện cho phương pháp **Học Chuyển Giao (Transfer Learning)** ứng dụng trong Phân tích Hình ảnh Y khoa (Medical Computer Vision): tái sử dụng một mạng nơ-ron tích chập sâu đã được huấn luyện trước trên hàng triệu hình ảnh đại thể (như MobileNet, ResNet), đóng băng các tầng trích xuất đặc trưng chung và chỉ huấn luyện lại tầng phân loại cuối cùng cho bài toán chuyên biệt của phòng xét nghiệm.

## Cơ sở Lý luận Y sinh
Việc huấn luyện một mạng nơ-ron sâu từ đầu đòi hỏi hàng trăm nghìn phim chụp X-quang, MRI hoặc tiêu bản giải phẫu bệnh được gán nhãn chuyên gia — một nguồn tài nguyên cực kỳ khan hiếm và đắt đỏ.
Tuy nhiên, các tầng đầu tiên của mạng CNN đã học được các đặc trưng thị giác phổ quát:
- Tầng thấp: Nhận diện các cạnh, đường viền giải phẫu, độ tương phản sáng tối.
- Tầng trung gian: Nhận diện cấu trúc bề mặt, viền tổn thương, dạng lưới mô học.
- Tầng cao: Tổ hợp thành các hình thái giải phẫu và tổn thương khu trú.
Do đó, các đặc trưng này hoàn toàn có thể chuyển giao hiệu quả sang các bài toán phân loại tổn thương da liễu, tế bào học hay soi đáy mắt.

## Quy trình Thực hiện 4 Bước
1. **Mô hình Nền tảng Đóng băng (Frozen Feature Extractor)**: Tải mạng MobileNet đã học sẵn, khóa toàn bộ các trọng số của các tầng tích chập để bảo tồn tri thức thị giác gốc.
2. **Trích xuất Vector Đặc trưng (Embedding Extraction)**: Mỗi ảnh y tế đưa vào được biến đổi thành một vector biểu diễn cô đọng (thường gồm 1024 hoặc 1280 chiều) tại tầng áp chót.
3. **Huấn luyện Đầu Phân loại Nhẹ (Head Classifier)**: Huấn luyện một lớp Dense kết hợp hàm kích hoạt Softmax trên các vector đặc trưng với các nhãn bệnh lý do người dùng cung cấp.
4. **Suy luận Tức thì trên Trình duyệt**: Ảnh bệnh phẩm mới được đưa qua luồng xử lý và xuất ra xác suất tổn thương theo thời gian thực mà không cần gửi dữ liệu hình ảnh nhạy cảm lên máy chủ đám mây.

## Nguy cơ Học Lối Tắt (Shortcut Learning) - Bẫy Tử Thần trong AI Y tế
Mạng nơ-ron có xu hướng tìm con đường dễ nhất để tối thiểu hóa hàm mất mát, dẫn đến việc học các đặc trưng giả mạo thay vì bệnh học thực sự:
- Trong ảnh da liễu: Nếu các tổn thương ung thư ác tính vô tình có hình ảnh thước kẻ đo kích thước do bác sĩ đặt cạnh bên, mô hình sẽ học cách nhận diện chiếc thước kẻ thay vì khối u!
- Trong X-quang phổi: Mô hình học nhãn chữ viết tắt ký hiệu tư thế bệnh nhân (như "AP" vs "PA") hoặc nhãn mác máy chụp của từng bệnh viện (bệnh viện chuyên khoa có nhiều ca nặng hơn) để dự đoán viêm phổi.
Kiểm soát lối tắt: Thu thập dữ liệu đa dạng về góc chụp, ánh sáng, thiết bị và luôn kiểm tra tính giải trình thị giác bằng bản đồ nhiệt Grad-CAM.

## Hiện tượng Trôi Dạt Phân Phối (Distribution Shift)
Một mô hình phân loại nốt ruồi ác tính đạt độ chính xác 95% khi chụp bằng máy ảnh chuyên dụng tại phòng khám da liễu có thể sụt giảm độ chính xác xuống dưới 60% khi bệnh nhân tự chụp bằng camera điện thoại tại nhà với ánh sáng vàng và rung tay. Đánh giá tính bền vững trên các điều kiện chụp thực địa là bắt buộc.

## Đạo đức và Giới hạn Khuyến cáo Sức khỏe
Hệ thống Teachable Machine trong khuôn khổ trình duyệt là công cụ giáo dục trực quan minh họa nguyên lý học máy. Tuyệt đối không được sử dụng làm công cụ tự chẩn đoán bệnh tật tại nhà thay thế cho việc thăm khám lâm sàng và sinh thiết giải phẫu bệnh của bác sĩ chuyên khoa.

## Tự kiểm tra tư duy lâm sàng
- Tại sao một mô hình phân loại ảnh X-quang có thể đạt độ chính xác 98% tại bệnh viện phát triển nhưng lại chẩn đoán sai hàng loạt khi đem sang bệnh viện đối diện?
- Nếu bạn chỉ có 30 tấm ảnh tiêu bản ung thư và 30 tấm ảnh mô lành, tại sao phương pháp Transfer Learning lại khả thi trong khi huấn luyện CNN từ đầu chắc chắn thất bại?
`,
};
