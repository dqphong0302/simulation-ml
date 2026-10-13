/** Lý thuyết nhóm Machine Learning. Định dạng: xem src/lessons/theory/index.ts. */
export const ML_THEORY: Record<string, string> = {
KNN: `
KNN (k-Nearest Neighbors, k láng giềng gần nhất) là thuật toán phân loại "lười": không học tham số nào trong lúc huấn luyện, chỉ ghi nhớ toàn bộ tập train. Khi cần dự đoán, nó tìm k điểm train gần nhất và cho chúng bỏ phiếu.

## Trực giác
Những điểm nằm gần nhau trong không gian đặc trưng thường có cùng nhãn. Một bệnh nhân mới có glucose và BMI giống nhiều bệnh nhân "có tiểu đường" thì nhiều khả năng cũng thuộc nhóm đó.

## Thuật toán
1. Chọn số láng giềng k và một thước đo khoảng cách.
2. Với điểm mới x, tính khoảng cách từ x tới **mọi** điểm trong tập train.
3. Lấy k điểm có khoảng cách nhỏ nhất.
4. Bỏ phiếu đa số theo nhãn của k điểm đó; nếu hòa, chọn nhãn của láng giềng gần nhất (cách dùng trong bài này).

## Khoảng cách
Khoảng cách Euclid giữa hai điểm có d biến:
$$ d(x, z) = √( Σⱼ (xⱼ − zⱼ)² )
Các lựa chọn khác: Manhattan Σ|xⱼ − zⱼ|, cosine (cho văn bản/embedding). Có thể **bỏ phiếu có trọng số** w = 1 / khoảng cách để láng giềng gần có tiếng nói lớn hơn.

## Vì sao phải chuẩn hóa
Khoảng cách cộng trực tiếp các chênh lệch theo từng biến. Glucose dao động hàng chục đơn vị, BMI chỉ vài đơn vị, nên chưa chuẩn hóa thì glucose gần như quyết định mọi thứ. Chuẩn hóa z-score đưa các biến về cùng thang:
$$ x' = (x − μ_train) / σ_train
> μ và σ phải tính **chỉ trên tập train** rồi áp dụng cho validation/test. Tính trên toàn bộ dữ liệu là rò rỉ thông tin (data leakage).

## Vai trò của k
- k nhỏ (1–3): ranh giới quyết định ngoằn ngoèo, bám sát từng điểm, dễ bị nhiễu → **phương sai cao, overfitting**. Với k = 1, accuracy trên train luôn bằng 1.
- k lớn: ranh giới mượt, có thể bỏ qua cấu trúc thật → **độ chệch cao, underfitting**. Khi k = số mẫu train, mô hình luôn đoán lớp đa số.
- Với 2 lớp nên chọn k lẻ để giảm hòa phiếu.

## Chọn k đúng cách
Chia dữ liệu train / validation / test. Thử nhiều k, chọn k có kết quả validation tốt nhất, sau cùng mới đánh giá **một lần** trên test. Chọn k theo test làm test không còn khách quan.

## Ưu và nhược điểm
- Ưu: đơn giản, không giả định dạng ranh giới, tự nhiên cho nhiều lớp.
- Nhược: dự đoán chậm (O(n·d) mỗi điểm), tốn bộ nhớ, nhạy với thang đo và biến nhiễu, kém khi nhiều chiều ("lời nguyền số chiều": mọi điểm đều xa nhau gần như bằng nhau).

## Ví dụ tính tay
Hai điểm (1, 2) và (4, 6): chênh lệch theo hai trục là 3 và 4.
$$ d = √(3² + 4²) = √25 = 5
Giả sử k = 3 và ba láng giềng gần nhất có nhãn A, A, B → dự đoán **A** (2 phiếu so với 1). Nếu đổi sang k = 1 và láng giềng gần nhất là B, dự đoán đổi thành B — đó là lý do k nhỏ nhạy với nhiễu.

## Tự kiểm tra
- Vì sao accuracy train của 1-NN luôn bằng 1 mà không có nghĩa mô hình tốt?
- Nếu thêm một biến hoàn toàn ngẫu nhiên vào dữ liệu, KNN bị ảnh hưởng thế nào?
`,

TREE: `
Cây quyết định (Decision Tree) chia không gian dữ liệu bằng chuỗi câu hỏi có/không dạng "biến j ≤ ngưỡng t?". Mỗi lá chứa một dự đoán. Mô hình dễ đọc như một bộ luật.

## Cấu trúc
- **Nút gốc**: chứa toàn bộ dữ liệu train.
- **Nút trong**: một phép chia (biến, ngưỡng).
- **Lá**: dự đoán bằng lớp chiếm đa số (phân loại) hoặc trung bình y (hồi quy) của các mẫu rơi vào lá.

## Đo độ "tạp" của một nút
Với tỷ lệ lớp pₖ trong nút:
$$ Gini = 1 − Σₖ pₖ²
$$ Entropy = − Σₖ pₖ · log₂ pₖ
Nút thuần (chỉ một lớp) có Gini = Entropy = 0. Hai lớp 50/50: Gini = 0,5, Entropy = 1.

## Chọn phép chia tốt nhất
Với mỗi biến và mỗi ngưỡng ứng viên (trung điểm giữa hai giá trị liên tiếp), tính mức giảm tạp chất:
$$ Gain = I(cha) − (n_trái/n)·I(trái) − (n_phải/n)·I(phải)
Chọn phép chia có Gain lớn nhất, rồi lặp lại đệ quy cho hai nhánh con (thuật toán tham lam CART).

## Khi nào dừng
- Đạt độ sâu tối đa (max_depth).
- Nút có ít hơn số mẫu tối thiểu (min_samples_split / min_samples_leaf).
- Nút đã thuần, hoặc không phép chia nào làm giảm tạp chất.

## Overfitting theo độ sâu
Cây đủ sâu có thể tách riêng từng điểm train → accuracy train ≈ 1 nhưng validation giảm. Vẽ accuracy train và validation theo độ sâu: điểm validation cao nhất là độ sâu nên chọn. Các cách hạn chế: giới hạn độ sâu, tăng số mẫu tối thiểu ở lá, cắt tỉa sau (pruning), hoặc dùng rừng ngẫu nhiên.

## Đặc điểm
- Không cần chuẩn hóa: phép chia theo ngưỡng không đổi khi co giãn biến.
- Ranh giới quyết định gồm các đoạn song song trục.
- Không ổn định: đổi vài điểm dữ liệu có thể đổi cả cây.
- Mức quan trọng của biến = tổng Gain (nhân số mẫu) mà biến đó đóng góp.

## Ví dụ tính tay
Nút cha có 4 mẫu A và 4 mẫu B: Gini = 1 − 0,5² − 0,5² = 0,5.
Phép chia tạo hai nút con, mỗi nút 4 mẫu: trái 3A + 1B, phải 1A + 3B.
$$ Gini(trái) = 1 − (3/4)² − (1/4)² = 0,375 = Gini(phải)
$$ Gain = 0,5 − (4/8)·0,375 − (4/8)·0,375 = 0,125
Thuật toán thử mọi phép chia và giữ phép có Gain lớn nhất.

## Đọc luật của cây thận trọng
- Thay một ít dữ liệu có thể đổi cả cấu trúc cây.
- Nhánh chứa rất ít mẫu có thể chỉ phản ánh sự tình cờ.
- Luật dự đoán ("nếu glucose > 127 thì…") không phải luật nhân quả hay khuyến cáo thực tế.

## Tự kiểm tra
- Vì sao cây không cần chuẩn hóa còn KNN thì cần?
- Một cây độ sâu 1 ("gốc cây") có thể biểu diễn ranh giới chéo y = x không?
`,

LOGREG: `
Hồi quy logistic là mô hình **phân loại** (dù tên có "hồi quy"). Nó ước lượng xác suất một mẫu thuộc lớp dương, rồi so với một ngưỡng để ra quyết định.

## Mô hình
Tổ hợp tuyến tính các biến rồi đưa qua hàm sigmoid:
$$ z = w₁x₁ + … + w_dx_d + b
$$ p = σ(z) = 1 / (1 + e^(−z))
σ ép mọi số thực vào (0, 1). Ranh giới quyết định z = 0 (tức p = 0,5) là một **đường thẳng / siêu phẳng**.

## Học tham số
Tối thiểu hóa log-loss (cross-entropy) trên train:
$$ L = − (1/n) Σᵢ [ yᵢ·log pᵢ + (1 − yᵢ)·log(1 − pᵢ) ]
Gradient có dạng gọn: ∂L/∂w = (1/n) Σ (pᵢ − yᵢ)·xᵢ. Cập nhật bằng gradient descent: w ← w − η·∂L/∂w. Thêm điều chuẩn L2 (λ‖w‖²) để tránh hệ số quá lớn.

## Diễn giải hệ số
e^(wⱼ) là tỷ số odds (odds ratio): khi xⱼ tăng 1 đơn vị (các biến khác giữ nguyên), odds = p/(1−p) nhân lên e^(wⱼ) lần. Diễn giải chỉ có nghĩa khi biến được chuẩn hóa phù hợp và không cộng tuyến mạnh.

## Ngưỡng và ma trận nhầm lẫn
Quyết định: dự đoán 1 nếu p ≥ ngưỡng. Với mỗi ngưỡng có bốn ô:
- TP (dương thật), FP (báo động giả), TN (âm thật), FN (bỏ sót).
$$ Precision = TP / (TP + FP)    Recall = TP / (TP + FN)
$$ Specificity = TN / (TN + FP)    F1 = 2·P·R / (P + R)
Hạ ngưỡng → bắt được nhiều ca dương hơn (recall tăng) nhưng nhiều báo động giả hơn (precision giảm). Chọn ngưỡng theo **chi phí** của từng loại sai, không mặc định 0,5.

## ROC và AUC
Đường ROC vẽ TPR (recall) theo FPR = FP/(FP+TN) khi quét mọi ngưỡng. AUC là diện tích dưới đường: xác suất mô hình chấm điểm một mẫu dương ngẫu nhiên cao hơn một mẫu âm ngẫu nhiên. AUC = 0,5: ngẫu nhiên; 1: tách hoàn hảo. AUC không phụ thuộc ngưỡng.

## Nhiều lớp
Softmax mở rộng sigmoid: pₖ = e^(zₖ) / Σⱼ e^(zⱼ), mỗi lớp một vector trọng số. Phòng CSV tự do dùng dạng này.

## Ví dụ tính tay
- z = 0 → p = 1/(1 + e⁰) = 0,5. z = 2 → p = 1/(1 + e⁻²) ≈ 0,881.
- Đổi ngưỡng chỉ đổi quyết định, không huấn luyện lại trọng số.
Ở một ngưỡng có TP = 8, FP = 2, FN = 4:
$$ Precision = 8 / (8 + 2) = 0,8
$$ Recall = 8 / (8 + 4) ≈ 0,667
$$ F1 = 2 · 0,8 · 0,667 / (0,8 + 0,667) ≈ 0,727
Precision trả lời "trong các ca báo dương, bao nhiêu đúng?", recall trả lời "trong các ca dương thật, bắt được bao nhiêu?" — hai câu hỏi khác nhau.

## Tự kiểm tra
- Trong sàng lọc bệnh, bỏ sót (FN) hay báo động giả (FP) tốn kém hơn? Nên dịch ngưỡng về phía nào?
- Vì sao accuracy 90% có thể vô nghĩa khi chỉ 10% mẫu là dương?
`,

KMEANS: `
K-means là thuật toán **phân cụm** (học không giám sát): không dùng nhãn, chỉ tìm k nhóm sao cho các điểm trong một nhóm gần tâm của nhóm đó.

## Mục tiêu
Tìm k tâm μ₁…μ_k và phép gán để tối thiểu tổng bình phương khoảng cách (inertia, WCSS):
$$ J = Σᵢ ‖xᵢ − μ_c(i)‖²

## Thuật toán Lloyd
1. Khởi tạo k tâm (ngẫu nhiên hoặc k-means++).
2. **Gán**: mỗi điểm thuộc tâm gần nhất.
3. **Cập nhật**: mỗi tâm = trung bình các điểm được gán.
4. Lặp bước 2–3 đến khi phép gán không đổi.
Mỗi vòng không làm J tăng, nên thuật toán luôn dừng — nhưng có thể dừng ở **cực tiểu cục bộ**.

## Khởi tạo k-means++
Chọn tâm đầu ngẫu nhiên; mỗi tâm tiếp theo được chọn với xác suất tỷ lệ với bình phương khoảng cách tới tâm gần nhất đã có. Cách này trải tâm ra xa nhau, hội tụ nhanh và ổn định hơn. Nên chạy nhiều lần với seed khác nhau và giữ kết quả có J nhỏ nhất.

## Chọn k
- **Elbow**: vẽ J theo k; J luôn giảm khi k tăng, chọn chỗ "khuỷu tay" mà giảm tiếp không còn đáng kể.
- **Silhouette**: với mỗi điểm, a = khoảng cách trung bình tới điểm cùng cụm, b = trung bình tới cụm gần nhất khác; s = (b − a)/max(a, b) ∈ [−1, 1]. Trung bình càng gần 1 càng tốt.
- Hiểu biết về bài toán quan trọng hơn mọi chỉ số.

## Giả định và giới hạn
- Cụm có dạng gần tròn, kích thước tương đương (vì dùng khoảng cách Euclid tới tâm).
- Nhạy với thang đo → nên chuẩn hóa. Nhạy với ngoại lai (trung bình bị kéo lệch).
- Không xử lý tốt cụm hình vành khuyên, hình trăng: dùng DBSCAN hoặc phân cụm phổ.

## DBSCAN (so sánh)
Cụm theo mật độ: điểm có ít nhất minPts láng giềng trong bán kính ε là điểm lõi; các điểm lõi nối nhau thành cụm; điểm không thuộc cụm nào là nhiễu. Không cần chọn k, tìm được cụm hình bất kỳ, nhưng nhạy với ε.

## Ví dụ tính tay
Dữ liệu một chiều 1, 2, 8, 9 với k = 2, tâm ban đầu 1 và 9.
1. Gán: {1, 2} về tâm 1; {8, 9} về tâm 9.
2. Cập nhật: tâm mới 1,5 và 8,5.
3. Gán lại không đổi → dừng.
$$ J = (1−1,5)² + (2−1,5)² + (8−8,5)² + (9−8,5)² = 1
Nếu khởi tạo xấu (cả hai tâm ở 1 và 2), thuật toán vẫn hội tụ về cùng kết quả ở ví dụ dễ này, nhưng với dữ liệu phức tạp có thể kẹt ở cực tiểu cục bộ.

## Tự kiểm tra
- Vì sao "nhãn cụm 1, 2, 3" không có nghĩa sẵn như nhãn lớp?
- Nếu J giảm đều khi tăng k từ 2 đến 10, có nên chọn k = 10?
`,

PCA: `
PCA (Principal Component Analysis, phân tích thành phần chính) là phép **giảm chiều tuyến tính, không giám sát**: tìm các hướng mà dữ liệu trải rộng nhất và chiếu dữ liệu lên vài hướng đầu.

## Ý tưởng
Hướng thứ nhất (PC1) là hướng có phương sai lớn nhất. PC2 vuông góc với PC1 và có phương sai lớn nhất trong phần còn lại, v.v. Các trục mới không tương quan với nhau.

## Cách tính
1. Chuẩn hóa dữ liệu (trừ trung bình; thường chia độ lệch chuẩn để các biến cùng thang).
2. Ma trận hiệp phương sai:
$$ C = (1/(n−1)) · Xᵀ X
3. Tìm trị riêng λ₁ ≥ λ₂ ≥ … và vector riêng v₁, v₂, … của C (hoặc dùng SVD của X).
4. Tọa độ mới của điểm x: zₖ = vₖ · (x − μ).

## Phương sai giải thích
$$ tỷ lệ của PCk = λₖ / Σⱼ λⱼ
Cộng dồn để biết cần bao nhiêu thành phần giữ, ví dụ, 90% thông tin. Biểu đồ "scree" giúp chọn số thành phần.

## Tái dựng
Giữ k thành phần: x̂ = μ + Σₖ zₖ·vₖ. Lỗi tái dựng = phần phương sai bị bỏ đi. PCA là autoencoder **tuyến tính** tối ưu.

## Lưu ý quan trọng
- Không chuẩn hóa → biến có đơn vị lớn chi phối PC1 (ví dụ Insulin hàng trăm so với BMI vài chục).
- PCA **không nhìn nhãn**: hướng có phương sai lớn chưa chắc là hướng tách lớp tốt. Có thể bỏ đi đúng thông tin cần cho dự đoán.
- Thành phần chính là tổ hợp của mọi biến nên khó diễn giải; xem hệ số (loadings) để biết biến nào đóng góp.
- Chỉ bắt được quan hệ tuyến tính; dữ liệu nằm trên mặt cong cần phương pháp phi tuyến (autoencoder, t-SNE, UMAP).

## Dùng khi nào
Trực quan hóa dữ liệu nhiều chiều trên 2D/3D, khử tương quan, giảm nhiễu, tăng tốc mô hình phía sau.

## Ví dụ trực quan
Đám mây điểm kéo dài theo đường chéo (hai biến cùng tăng). PC1 chạy dọc dải điểm, PC2 vuông góc với nó. Nếu phương sai theo PC1 là 1,8 và theo PC2 là 0,2:
$$ tỷ lệ PC1 = 1,8 / (1,8 + 0,2) = 90%
Chiếu xuống PC1 giữ "chiều dài" của dải và bỏ "độ rộng" — 10% biến thiên bị mất.

## Tự kiểm tra
- Nếu hai biến tương quan gần 1, PCA sẽ làm gì với chúng?
- Vì sao phải fit PCA trên train rồi mới chiếu validation/test?
`,

LINREG: `
Hồi quy tuyến tính dự đoán một **giá trị số liên tục** bằng một đường thẳng (hay siêu phẳng) khớp nhất với dữ liệu.

## Mô hình
$$ ŷ = w₁x₁ + … + w_dx_d + b
Với một biến: ŷ = a·x + b, a là độ dốc (y tăng bao nhiêu khi x tăng 1), b là giao điểm.

## Bình phương tối thiểu
Chọn w, b để tối thiểu tổng bình phương phần dư (residual) eᵢ = yᵢ − ŷᵢ:
$$ MSE = (1/n) Σ (yᵢ − ŷᵢ)²
Một biến có nghiệm đóng: a = cov(x, y) / var(x), b = ȳ − a·x̄. Nhiều biến: w = (XᵀX)⁻¹Xᵀy (phương trình chuẩn) hoặc gradient descent.

## Đánh giá
- **RMSE** = √MSE: cùng đơn vị với y, phạt mạnh sai số lớn.
- **MAE** = trung bình |e|: ít nhạy với ngoại lai.
- **R²** = 1 − SSE/SST: tỷ lệ phương sai của y được mô hình giải thích. R² = 0 tương đương đoán bằng trung bình; có thể âm trên validation nếu mô hình tệ hơn trung bình.

## Giả định (cho suy luận thống kê)
Quan hệ tuyến tính; phần dư độc lập, phương sai không đổi, xấp xỉ chuẩn; các biến không cộng tuyến mạnh. Hãy vẽ phần dư theo ŷ: có hình chữ U hoặc hình phễu là dấu hiệu vi phạm.

## Mở rộng
- **Đa thức**: thêm x², x³… vẫn là hồi quy tuyến tính theo tham số; bậc cao dễ overfitting.
- **Ridge (L2)**: thêm λ‖w‖² để co hệ số, ổn định khi biến tương quan. **Lasso (L1)**: λΣ|w| có thể đưa hệ số về 0 (chọn biến).

## Giới hạn diễn giải
Tương quan không phải nhân quả. Hệ số phụ thuộc vào các biến khác có trong mô hình. Ngoại suy ra ngoài khoảng dữ liệu đã thấy rất rủi ro. Ngoại lai có thể kéo lệch cả đường.

## Ví dụ tính tay
Giá trị thật 2 và 4, mô hình dự đoán 3 và 3.
$$ MSE = ((2−3)² + (4−3)²) / 2 = 1    RMSE = 1    MAE = 1
Trung bình ȳ = 3 nên SST = (2−3)² + (4−3)² = 2, SSE = 2:
$$ R² = 1 − 2/2 = 0
Mô hình đoán toàn 3 không tốt hơn việc đoán bằng trung bình — R² = 0 nói đúng điều đó.

## Tự kiểm tra
- R² train = 0,95 nhưng R² validation = 0,2 nói lên điều gì?
- Vì sao dùng MSE chứ không dùng tổng phần dư (không bình phương)?
`,

FOREST: `
Rừng ngẫu nhiên (Random Forest) kết hợp nhiều cây quyết định được huấn luyện hơi khác nhau rồi lấy biểu quyết. Đây là ví dụ kinh điển của **ensemble** (học tập hợp) theo kiểu bagging.

## Hai nguồn ngẫu nhiên
1. **Bootstrap**: mỗi cây học trên một mẫu lấy có hoàn lại n điểm từ tập train (khoảng 63% điểm khác nhau, phần còn lại là "out-of-bag").
2. **Chọn biến ngẫu nhiên**: ở mỗi lần chia, cây chỉ xét một tập con m biến (thường m ≈ √d cho phân loại).

## Dự đoán
Phân loại: trung bình xác suất (hoặc bỏ phiếu) của các cây. Hồi quy: trung bình dự đoán.

## Vì sao hiệu quả
Một cây sâu có độ chệch thấp nhưng phương sai cao. Lấy trung bình B mô hình có phương sai σ² và tương quan ρ:
$$ Var(trung bình) = ρσ² + (1 − ρ)σ²/B
Bootstrap và chọn biến ngẫu nhiên làm giảm ρ giữa các cây, nên phương sai tổng giảm mạnh mà độ chệch gần như giữ nguyên.

## Siêu tham số
- Số cây: càng nhiều càng ổn định, không gây overfitting thêm, chỉ tốn thời gian.
- Độ sâu / số mẫu tối thiểu ở lá: kiểm soát độ phức tạp từng cây.
- m (số biến mỗi lần chia): nhỏ → cây đa dạng hơn; lớn → cây mạnh hơn nhưng giống nhau hơn.

## Out-of-bag và mức quan trọng của biến
Mỗi điểm được đánh giá bởi các cây không thấy nó → ước lượng lỗi OOB gần giống validation. Mức quan trọng: tổng mức giảm tạp chất theo biến, hoặc (đáng tin hơn) mức giảm chất lượng khi xáo trộn ngẫu nhiên giá trị của biến đó (permutation importance).

## So sánh
Thường mạnh hơn một cây rõ rệt, ít cần tinh chỉnh, xử lý tốt tương tác phi tuyến. Đổi lại mất tính dễ đọc của một cây và tốn bộ nhớ hơn. Boosting (XGBoost, LightGBM) là họ ensemble khác: cây học tuần tự để sửa lỗi cây trước.

## Ví dụ bỏ phiếu
Năm cây dự đoán A, A, B, A, B → 3 phiếu A → dự đoán **A**. Tỷ lệ 3/5 = 0,6 thể hiện mức đồng thuận của các cây, nhưng chưa chắc là xác suất đã được hiệu chỉnh.

## Rừng không miễn nhiễm sai lệch
- Nếu mọi cây cùng học từ dữ liệu lệch, cả rừng vẫn sai theo cùng một hướng.
- Không dùng tập test để chọn số cây hay độ sâu.
- Biến "quan trọng" với dự đoán không có nghĩa là thay đổi biến đó sẽ thay đổi kết quả (không phải nhân quả).

## Tự kiểm tra
- Nếu mọi cây đều dùng toàn bộ dữ liệu và toàn bộ biến, rừng khác một cây thế nào?
- Vì sao tăng số cây không làm overfitting như tăng độ sâu?
`,

SVM: `
SVM (Support Vector Machine) tìm ranh giới phân loại có **lề (margin) lớn nhất** giữa hai lớp. Với kernel, SVM tạo được ranh giới cong mà không cần tự tạo đặc trưng phi tuyến.

## SVM tuyến tính
Siêu phẳng w·x + b = 0, nhãn y ∈ {−1, +1}. Khoảng cách từ ranh giới tới điểm gần nhất là 1/‖w‖, nên tối đa lề ⇔ tối thiểu ‖w‖.
Bài toán lề mềm (cho phép vi phạm):
$$ min ½‖w‖² + C · Σᵢ max(0, 1 − yᵢ(w·xᵢ + b))
Hạng tử thứ hai là **hinge loss**: bằng 0 khi điểm nằm đúng phía và ngoài lề.

## Tham số C
- C lớn: phạt nặng mỗi vi phạm → lề hẹp, bám sát dữ liệu train, dễ overfitting.
- C nhỏ: chấp nhận vi phạm → lề rộng, mượt hơn, có thể underfitting.

## Vector hỗ trợ
Chỉ những điểm nằm trên hoặc trong lề (hoặc bị phân loại sai) quyết định ranh giới. Bỏ các điểm khác đi, nghiệm không đổi.

## Kernel trick
Dạng đối ngẫu của SVM chỉ cần tích vô hướng xᵢ·xⱼ. Thay bằng hàm kernel K(xᵢ, xⱼ) tương đương làm việc trong không gian đặc trưng rất nhiều chiều mà không tính tường minh:
$$ RBF: K(x, z) = exp(−γ‖x − z‖²)
$$ Đa thức: K(x, z) = (x·z + c)^p
Hàm quyết định: f(x) = Σᵢ αᵢyᵢK(xᵢ, x) + b. Bài này giải bằng SMO (tối ưu từng cặp αᵢ).

## Tham số γ của RBF
γ lớn: mỗi điểm chỉ ảnh hưởng vùng rất gần → ranh giới ngoằn ngoèo (overfitting). γ nhỏ: ảnh hưởng rộng → ranh giới gần tuyến tính. C và γ cần được chọn cùng nhau trên validation (lưới tham số).

## Lưu ý
Cần chuẩn hóa dữ liệu. SVM chuẩn không cho xác suất (cần hiệu chỉnh Platt). Huấn luyện tốn O(n²)–O(n³) nên khó với dữ liệu rất lớn.

## Ví dụ tính tay
Với w = (3, 4): ‖w‖ = √(3² + 4²) = 5.
$$ độ rộng lề = 2 / ‖w‖ = 2 / 5 = 0,4
Muốn lề rộng hơn thì ‖w‖ phải nhỏ hơn — đó là lý do bài toán tối thiểu ½‖w‖².

## Điểm số không phải xác suất
Giá trị f(x) = w·x + b cho biết điểm nằm phía nào và cách ranh giới bao xa, không phải xác suất thuộc lớp. Khi trình bày kết quả, gọi đúng tên đại lượng; với dữ liệu lệch lớp, xem lỗi của từng lớp.

## Tự kiểm tra
- Điều gì xảy ra với ranh giới khi xóa một điểm không phải vector hỗ trợ?
- Vì sao RBF với γ rất lớn gần giống 1-NN?
`,

COMPARE: `
So sánh mô hình là quy trình chọn mô hình **công bằng và trung thực**: cùng dữ liệu, cùng cách chia, cùng tiền xử lý, cùng chỉ số, và chỉ dùng test ở bước cuối.

## Ba tập dữ liệu
- **Train**: học tham số mô hình.
- **Validation**: chọn mô hình và siêu tham số, chọn ngưỡng.
- **Test**: ước lượng hiệu năng cuối cùng — chỉ xem **một lần**.
Mỗi lần nhìn test rồi quay lại chỉnh, test dần trở thành validation và kết quả bị lạc quan.

## Kiểm định chéo (cross-validation)
Chia train thành K phần; lần lượt dùng một phần làm validation, K−1 phần còn lại để train; lấy trung bình K kết quả. Ước lượng ổn định hơn một lần chia, đặc biệt khi dữ liệu nhỏ. Dùng **stratified** để giữ tỷ lệ lớp trong mỗi phần.

## Chọn chỉ số phù hợp
- Dữ liệu lệch lớp: accuracy dễ gây ảo tưởng; xem precision, recall, F1, AUC.
- Chi phí sai khác nhau: chọn ngưỡng theo chi phí.
- Hồi quy: RMSE (phạt sai lớn) hay MAE (bền với ngoại lai).
Luôn so với **mô hình nền** (baseline): đoán lớp đa số, hoặc đoán trung bình.

## Độ chệch – phương sai
$$ Lỗi kỳ vọng = độ chệch² + phương sai + nhiễu không thể giảm
Mô hình đơn giản: chệch cao. Mô hình phức tạp: phương sai cao. Khoảng cách lớn giữa train và validation là dấu hiệu phương sai cao (overfitting).

## Rò rỉ dữ liệu
Mọi bước "học từ dữ liệu" — chuẩn hóa, điền thiếu, chọn biến, PCA, cân bằng lớp — phải fit trên train trong từng lần chia. Biến chứa thông tin của tương lai hoặc của chính nhãn (ví dụ "đã điều trị tiểu đường") làm kết quả đẹp giả.

## Khác biệt có ý nghĩa không?
Chênh 0,01 accuracy trên validation 150 mẫu có thể chỉ là ngẫu nhiên. Đổi seed chia dữ liệu, dùng cross-validation, xem khoảng dao động trước khi kết luận.

## Ví dụ: luôn có mô hình nền
Trong Pima diabetes khoảng 65% mẫu là Outcome = 0. Mô hình "luôn đoán 0" đã đạt accuracy ≈ 0,65 mà không học gì. Một mô hình đạt 0,70 chỉ hơn mức nền 5 điểm — và có thể có recall lớp 1 rất thấp. Luôn đặt kết quả cạnh mô hình nền.

## Tự kiểm tra
- Mô hình A: train 0,99 / val 0,74. Mô hình B: train 0,80 / val 0,78. Chọn mô hình nào, vì sao?
- Chuẩn hóa toàn bộ dữ liệu trước khi chia có sai không? Sai ở đâu?
`,

TEACHABLE: `
Teachable Machine minh họa **học chuyển giao (transfer learning)**: dùng lại một mạng nơ-ron đã học trên hàng triệu ảnh, chỉ huấn luyện thêm một lớp nhỏ cho các lớp ảnh của bạn.

## Vì sao không huấn luyện từ đầu
Mạng CNN lớn cần hàng triệu ảnh và nhiều giờ GPU. Nhưng các lớp đầu của mạng đã học được những đặc trưng chung (cạnh, kết cấu, hình dạng, bộ phận vật thể) dùng được cho hầu hết bài toán ảnh.

## Quy trình
1. **Mô hình nền** MobileNet (đã học trên ImageNet) được giữ cố định (đóng băng).
2. Mỗi ảnh đi qua MobileNet, lấy vector đặc trưng (embedding) ở lớp áp chót — vài trăm đến hơn nghìn số.
3. Huấn luyện một **đầu phân loại** nhỏ (lớp dense + softmax) trên các embedding đó với nhãn bạn cung cấp.
4. Dự đoán: ảnh mới → embedding → đầu phân loại → xác suất từng lớp.

## Dữ liệu tốt quan trọng hơn mô hình
- Mỗi lớp cần nhiều ảnh đa dạng: góc chụp, ánh sáng, nền, khoảng cách.
- Cân bằng số ảnh giữa các lớp.
- Tránh **lối tắt**: nếu mọi ảnh lớp A có nền trắng và lớp B nền tối, mô hình học màu nền thay vì vật thể.
- Thêm lớp "không phải gì cả" (nền) nếu cần phát hiện khi không có vật thể.

## Đánh giá
Giữ riêng một ít ảnh không dùng để train để kiểm tra. Thử ảnh ở điều kiện khác hẳn lúc thu thập. Xác suất cao không đồng nghĩa với đúng: mô hình softmax luôn chọn một trong các lớp đã biết, kể cả với ảnh hoàn toàn lạ.

## Tinh chỉnh (fine-tuning)
Khi có nhiều dữ liệu hơn, có thể mở khóa vài lớp cuối của mạng nền và huấn luyện tiếp với tốc độ học nhỏ.

## Quyền riêng tư
Ảnh và mô hình ở bài này xử lý trên máy bạn. Khi chụp người, cần sự đồng ý của họ.

## Tự kiểm tra
- Vì sao chỉ cần vài chục ảnh mỗi lớp mà vẫn hoạt động?
- Mô hình nhận dạng "chó" và "mèo" rất tốt trong phòng nhưng sai ngoài trời. Nguyên nhân có thể là gì?
`,
};
