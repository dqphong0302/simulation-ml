/** Lý thuyết mở rộng: thuật toán, giả định và giới hạn y khoa. */
export const ML_THEORY: Record<string, string> = {
KNN: `
KNN dự đoán bằng k mẫu gần đầu vào nhất theo một độ đo đã chọn. Đây là “học từ ví dụ”, không phải mô phỏng đầy đủ lập luận của bác sĩ.
## Khoảng cách và bỏ phiếu
$$ d(x,z) = √Σⱼ(xⱼ − zⱼ)²
Sau khi chọn k láng giềng, phân loại thường dùng đa số hoặc trọng số khoảng cách. Quy tắc hòa phiếu tùy cài đặt; lab này ưu tiên láng giềng gần nhất. Với trọng số 1/d phải xử lý riêng d = 0.
Khoảng cách giữa glucose và BMI chỉ có ý nghĩa sau khi xem đơn vị, thang đo và chất lượng. Chuẩn hóa thường hữu ích; mean và SD được fit trong train. Khoảng cách nhỏ chưa chứng minh cùng bệnh sinh.
## Chọn k và kiểm tra
k nhỏ dễ nhạy với nhiễu; k lớn có thể làm mất cấu trúc cục bộ. Chọn k bằng validation hoặc CV trong train. k = 1 thường khớp rất sát train khi tự so với mẫu đó, nhưng không luôn đạt 100% nếu có tọa độ trùng và nhãn mâu thuẫn.
## Liên hệ y khoa
Hai trong ba láng giềng có nhãn dương cho tỷ lệ phiếu 2/3. Đây chưa phải nguy cơ thật 66,7% của người mới. Cần kiểm tra calibration, quần thể và định nghĩa nhãn; không coi phiếu là chẩn đoán.
## Tự suy nghĩ
Giữ seed, chỉ đổi k = 3 sang 15. Ranh giới và validation đổi thế nào? Nếu thêm nhiều biến không liên quan, khoảng cách có còn hữu ích?

## Quy trình học và giới hạn
Mô phỏng web dùng ví dụ đơn giản; lab bảng chia theo dòng, chưa tự tách lần khám cùng bệnh nhân. Khi đánh giá trên người mới, cần split/CV theo bệnh nhân và giữ các bước học tham số trong train. Khi chuyển thời gian hoặc nơi khám, cần kiểm tra lại quần thể và quy trình đo.
Chỉ thay một yếu tố mỗi lần, ghi cấu hình, tập đo và loại sai sót. Dữ liệu tổng hợp kiểm tra quy trình, không chứng minh hiệu quả chẩn đoán hay lợi ích điều trị. Không tải thông tin sức khỏe người thật vào công cụ học tập này.
## Đọc thêm
- Thuật toán và đánh giá: https://scikit-learn.org/stable/user_guide.html
- Tránh rò rỉ dữ liệu: https://scikit-learn.org/stable/common_pitfalls.html
`,

TREE: `
Cây quyết định học các câu hỏi phân nhánh từ train. Đường đi dễ đọc nhưng không tự là lưu đồ chẩn đoán được chuyên gia phê duyệt.
## Cách chọn phép chia
$$ Gini = 1 − Σₖ pₖ²
$$ Entropy = −Σₖ pₖ log₂ pₖ
$$ Gain = I(cha) − (n_trái/n)I(trái) − (n_phải/n)I(phải)
Ví dụ nút 5 dương, 5 âm có Gini 0,5. Hai nhánh đều gồm tỷ lệ 1/5 và 4/5 có Gini 0,32; Gain = 0,18. Thuật toán so với các phép chia hợp lệ khác, không tự chứng minh ngưỡng có ý nghĩa y khoa.
## Độ sâu và overfitting
max_depth, min_samples_leaf và pruning giới hạn độ phức tạp. Không có độ sâu 3–5 “lý tưởng” chung cho mọi bệnh. Cây sâu có thể học nhiễu, còn cây quá nông có thể underfit; kiểm tra train và validation.
## Diễn giải có giới hạn
Ngưỡng glucose học trong mẫu không tự là tiêu chuẩn chẩn đoán. Feature importance theo giảm Gini không phải tác động nhân quả và có thể thiên về biến nhiều mức. Cây có thể đổi cấu trúc khi đổi mẫu.
## Tự suy nghĩ
Chỉ đổi độ sâu từ 2 lên 8. Ghi điểm train/validation và đọc một lá ít mẫu. Vì sao tỷ lệ dương 100% trong lá hai mẫu vẫn có độ bất định lớn?

## Quy trình học và giới hạn
Mô phỏng web dùng ví dụ đơn giản; lab bảng chia theo dòng, chưa tự tách lần khám cùng bệnh nhân. Khi đánh giá trên người mới, cần split/CV theo bệnh nhân và giữ các bước học tham số trong train. Khi chuyển thời gian hoặc nơi khám, cần kiểm tra lại quần thể và quy trình đo.
Chỉ thay một yếu tố mỗi lần, ghi cấu hình, tập đo và loại sai sót. Dữ liệu tổng hợp kiểm tra quy trình, không chứng minh hiệu quả chẩn đoán hay lợi ích điều trị. Không tải thông tin sức khỏe người thật vào công cụ học tập này.
## Đọc thêm
- Thuật toán và đánh giá: https://scikit-learn.org/stable/user_guide.html
- Tránh rò rỉ dữ liệu: https://scikit-learn.org/stable/common_pitfalls.html
`,

LOGREG: `
Logistic Regression dự báo nhãn nhị phân từ một tổ hợp tuyến tính. Điểm trong (0,1) cần được kiểm tra trước khi diễn giải như nguy cơ ở quần thể cụ thể.
## Sigmoid và hàm mất mát
$$ z = β₀ + Σⱼ βⱼxⱼ; p = 1/(1 + exp(−z))
$$ L = −(1/n)Σᵢ[yᵢ log pᵢ + (1−yᵢ)log(1−pᵢ)]
Điều chuẩn hạn chế độ lớn hệ số; chọn mức điều chuẩn trong train/validation. z = 0 cho p = 0,5 nhưng không quy định ngưỡng hành động y khoa.
## Odds Ratio và liên hệ
$$ Odds = p/(1−p); Odds Ratio = exp(βⱼ)
OR cho một đơn vị xⱼ khi giữ các biến khác cố định, với dạng mô hình phù hợp. Nếu chuẩn hóa, đơn vị là một SD train, không phải đơn vị xét nghiệm gốc. OR khác risk ratio; dấu hệ số không tự chứng minh yếu tố gây bệnh hay bảo vệ.
## Ngưỡng và loại sai sót
$$ Sensitivity = TP/(TP+FN); Specificity = TN/(TN+FP)
$$ PPV = TP/(TP+FP); NPV = TN/(TN+FN)
Không tính được tỷ lệ nếu mẫu số bằng 0. PPV/NPV phụ thuộc tỷ lệ kết cuộc và quần thể. Với điểm cố định, hạ ngưỡng làm sensitivity không giảm và specificity không tăng; precision có thể tăng hoặc giảm.
## Đánh giá
AUROC đo xếp hạng, không đo calibration hoặc lợi ích điều trị. Không có AUROC 0,8 đủ tốt cho mọi bệnh. Brier đo sai số xác suất, không phải calibration thuần túy. Sàng lọc phải cân nhắc cả bỏ sót và cảnh báo thừa; ngưỡng 0,3/0,5 trong lab chỉ minh họa.

## Quy trình học và giới hạn
Mô phỏng web dùng ví dụ đơn giản; lab bảng chia theo dòng, chưa tự tách lần khám cùng bệnh nhân. Khi đánh giá trên người mới, cần split/CV theo bệnh nhân và giữ các bước học tham số trong train. Khi chuyển thời gian hoặc nơi khám, cần kiểm tra lại quần thể và quy trình đo.
Chỉ thay một yếu tố mỗi lần, ghi cấu hình, tập đo và loại sai sót. Dữ liệu tổng hợp kiểm tra quy trình, không chứng minh hiệu quả chẩn đoán hay lợi ích điều trị. Không tải thông tin sức khỏe người thật vào công cụ học tập này.
## Đọc thêm
- Thuật toán và đánh giá: https://scikit-learn.org/stable/user_guide.html
- Tránh rò rỉ dữ liệu: https://scikit-learn.org/stable/common_pitfalls.html
`,

KMEANS: `
K-means gom các điểm thành k cụm để giảm khoảng cách tới tâm. Cụm là kết quả toán học, không tự là nhóm bệnh hoặc nhóm đáp ứng điều trị.
## Hàm mục tiêu và cập nhật
$$ J = Σᵢ ‖xᵢ − μ_c(i)‖²
Lloyd lặp bước gán về tâm gần nhất và cập nhật tâm bằng trung bình. K-means++ thường cải thiện khởi tạo nhưng không bảo đảm tìm cực tiểu toàn cục. Chạy nhiều khởi tạo và xem độ ổn định.
## Chọn số cụm
Inertia thường giảm khi tăng k; đó không tự là lý do tăng số nhóm điều trị. Elbow là gợi ý, có thể không rõ. Silhouette đo độ gần trong cụm so với cụm khác, không chứng nhận giá trị sinh học.
## Liên hệ y khoa
Khám phá kiểu hình từ các xét nghiệm là một ứng dụng nghiên cứu. Cần xem cụm có phản ánh tuổi, thiết bị hoặc đơn vị hơn là bệnh. Liên hệ kết cuộc sau phân cụm cần đánh giá độc lập; khác biệt thống kê chưa chứng minh can thiệp có lợi.
## Giới hạn
Mục tiêu khoảng cách Euclid phù hợp hơn với cụm gọn, tương đối đồng dạng; không đòi hỏi dữ liệu thật phải hình cầu. Ngoại lai và thang đo có thể chi phối tâm. Scaling là lựa chọn cần lý do và kiểm tra, không quy tắc bắt buộc cho mọi bảng.

## Quy trình học và giới hạn
Mô phỏng web dùng ví dụ đơn giản; lab bảng chia theo dòng, chưa tự tách lần khám cùng bệnh nhân. Khi đánh giá trên người mới, cần split/CV theo bệnh nhân và giữ các bước học tham số trong train. Khi chuyển thời gian hoặc nơi khám, cần kiểm tra lại quần thể và quy trình đo.
Chỉ thay một yếu tố mỗi lần, ghi cấu hình, tập đo và loại sai sót. Dữ liệu tổng hợp kiểm tra quy trình, không chứng minh hiệu quả chẩn đoán hay lợi ích điều trị. Không tải thông tin sức khỏe người thật vào công cụ học tập này.
## Đọc thêm
- Thuật toán và đánh giá: https://scikit-learn.org/stable/user_guide.html
- Tránh rò rỉ dữ liệu: https://scikit-learn.org/stable/common_pitfalls.html
`,

PCA: `
PCA tìm các trục trực giao giữ phương sai lớn nhất của dữ liệu được chuẩn bị. Phương sai giữ lại không đồng nghĩa thông tin bệnh lý giữ lại.
## Đại số cơ bản
Với X đã trừ trung bình, ma trận hiệp phương sai là:
$$ C = XᵀX/(n−1)
Các eigenvector của C cho hướng thành phần; eigenvalue cho phương sai. Nếu các biến cần scaling, chia SD trước và dùng cùng phép biến đổi cho dữ liệu mới.
$$ EVR_k = λ_k / Σⱼλⱼ
$$ z_k = v_kᵀ(x − μ)
Trong công thức cuối, x và μ phải nằm cùng thang đã chọn. PCA luôn center trong dạng thông thường nhưng không luôn cần chuẩn hóa theo SD.
## Tái dựng
Giữ m thành phần: x̂ = μ + Σₖ₌₁ᵐ z_k v_k. Sai số tái dựng là thông tin bị bỏ, có thể gồm cả nhiễu lẫn tín hiệu hữu ích. Không tự gọi phần còn lại là nhiễu sinh học.
## Liên hệ y khoa
PC1 có thể phản ánh tuổi, hiệu ứng lô hoặc máy xét nghiệm. Loadings giúp đọc tổ hợp biến, không đặt tên PC1 là “độ nặng bệnh” nếu chưa có bằng chứng.
## Tự suy nghĩ
Trong notebook, giữ bảng và chỉ bỏ/bật StandardScaler. Hướng trục đổi thế nào? Một dấu ấn ít biến thiên nhưng phân biệt nhãn có thể bị mất không? Lab web dùng dữ liệu chuẩn hóa; có thể thử thêm một biến ở bảng chọn.

## Quy trình học và giới hạn
Mô phỏng web dùng ví dụ đơn giản; lab bảng chia theo dòng, chưa tự tách lần khám cùng bệnh nhân. Khi đánh giá trên người mới, cần split/CV theo bệnh nhân và giữ các bước học tham số trong train. Khi chuyển thời gian hoặc nơi khám, cần kiểm tra lại quần thể và quy trình đo.
Chỉ thay một yếu tố mỗi lần, ghi cấu hình, tập đo và loại sai sót. Dữ liệu tổng hợp kiểm tra quy trình, không chứng minh hiệu quả chẩn đoán hay lợi ích điều trị. Không tải thông tin sức khỏe người thật vào công cụ học tập này.
## Đọc thêm
- Thuật toán và đánh giá: https://scikit-learn.org/stable/user_guide.html
- Tránh rò rỉ dữ liệu: https://scikit-learn.org/stable/common_pitfalls.html
`,

LINREG: `
Hồi quy tuyến tính dự báo giá trị liên tục bằng tổ hợp các biến. Hệ số biểu thị liên hệ có điều kiện theo mô hình, không tự là tác động can thiệp.
## Mô hình và tối ưu
$$ ŷ = β₀ + Σⱼβⱼxⱼ
$$ MSE = (1/n)Σᵢ(yᵢ − ŷᵢ)²
OLS tối thiểu hóa tổng bình phương phần dư. βⱼ là thay đổi trung bình dự báo khi xⱼ tăng một đơn vị, giữ biến khác cố định, theo giả định dạng hàm. Intercept tại mọi x = 0 có thể không có ý nghĩa thực tế.
## Đọc sai số
RMSE có cùng đơn vị y và nhạy với sai số lớn; MAE là độ lệch tuyệt đối trung bình.
$$ R² = 1 − Σᵢ(yᵢ−ŷᵢ)² / Σᵢ(yᵢ−ȳ)²
R² test có thể âm, nghĩa là kém hơn dự đoán bằng trung bình test theo định nghĩa này. R² không phân rã phần chưa giải thích thành nguyên nhân di truyền hay môi trường.
## Giả định và độ bất định
Tuyến tính theo tham số, sai số có kỳ vọng 0 có điều kiện và xử lý phụ thuộc giữa quan sát là quan trọng cho suy luận. Đồng phương sai liên quan sai số chuẩn OLS thường dùng. Phân phối chuẩn không phải điều kiện Gauss–Markov để BLUE; có ích cho suy luận chính xác ở mẫu nhỏ. Có thể cần sai số chuẩn robust hoặc mô hình đo lặp.
## Liên hệ y khoa
Dự báo một số đo ở người trưởng thành không tự áp dụng cho trẻ em hoặc nơi đo khác. Ridge/Lasso có thể giảm phương sai nhưng không chứng minh biến được chọn là nguyên nhân bệnh.

## Quy trình học và giới hạn
Mô phỏng web dùng ví dụ đơn giản; lab bảng chia theo dòng, chưa tự tách lần khám cùng bệnh nhân. Khi đánh giá trên người mới, cần split/CV theo bệnh nhân và giữ các bước học tham số trong train. Khi chuyển thời gian hoặc nơi khám, cần kiểm tra lại quần thể và quy trình đo.
Chỉ thay một yếu tố mỗi lần, ghi cấu hình, tập đo và loại sai sót. Dữ liệu tổng hợp kiểm tra quy trình, không chứng minh hiệu quả chẩn đoán hay lợi ích điều trị. Không tải thông tin sức khỏe người thật vào công cụ học tập này.
## Đọc thêm
- Thuật toán và đánh giá: https://scikit-learn.org/stable/user_guide.html
- Tránh rò rỉ dữ liệu: https://scikit-learn.org/stable/common_pitfalls.html
`,

FOREST: `
Random Forest tổng hợp nhiều cây, thường dùng bootstrap và lấy tập con biến tại mỗi phép chia. Các cây có tương quan, không phải những chuyên gia độc lập.
## Bagging và dự báo
Nếu lấy n lần có hoàn lại từ n mẫu, xác suất một mẫu không được chọn là (1−1/n)^n, tiến tới khoảng 0,368 khi n lớn.
Phân loại có thể lấy trung bình điểm lá hoặc bỏ phiếu tùy cài đặt. Nhiều cây thường giảm dao động do lấy mẫu nhưng không loại bỏ lỗi nhãn, leakage hoặc domain shift.
## OOB và thẩm định
OOB dùng các cây chưa thấy một mẫu để đánh giá mẫu đó. Không tự là đánh giá lâm sàng không thiên vị. Nếu nhiều dòng cùng bệnh nhân, cây có thể đã thấy dòng khác của người đó; cách bootstrap và đánh giá cần phù hợp đơn vị độc lập.
## Importance
Giảm Gini có thể ưu tiên biến nhiều mức. Permutation importance đo giảm hiệu năng khi xáo một biến, phụ thuộc metric và dữ liệu; biến tương quan có thể che khuất nhau. Không suy ra nguyên nhân hoặc danh sách xét nghiệm cần chỉ định.
## Liên hệ y khoa
Lớp kết cuộc hiếm cần xem sensitivity, PPV và calibration thay vì chỉ accuracy. Class weights là một lựa chọn phải thẩm định, không cách bảo đảm bắt đủ ca hiếm. So sánh forest với baseline trên cùng split; không mặc định luôn tốt hơn cây hay logistic.

## Quy trình học và giới hạn
Mô phỏng web dùng ví dụ đơn giản; lab bảng chia theo dòng, chưa tự tách lần khám cùng bệnh nhân. Khi đánh giá trên người mới, cần split/CV theo bệnh nhân và giữ các bước học tham số trong train. Khi chuyển thời gian hoặc nơi khám, cần kiểm tra lại quần thể và quy trình đo.
Chỉ thay một yếu tố mỗi lần, ghi cấu hình, tập đo và loại sai sót. Dữ liệu tổng hợp kiểm tra quy trình, không chứng minh hiệu quả chẩn đoán hay lợi ích điều trị. Không tải thông tin sức khỏe người thật vào công cụ học tập này.
## Đọc thêm
- Thuật toán và đánh giá: https://scikit-learn.org/stable/user_guide.html
- Tránh rò rỉ dữ liệu: https://scikit-learn.org/stable/common_pitfalls.html
`,

SVM: `
SVM tìm ranh giới với margin toán học và mức phạt vi phạm. Margin không phải biên an toàn điều trị.
## Biên mềm
Với nhãn y ∈ {−1,+1}, ranh giới tuyến tính là w·x+b = 0; bề rộng giữa hai mặt phẳng chuẩn hóa là 2/‖w‖.
$$ min ½‖w‖² + CΣᵢ max(0,1 − yᵢ(w·xᵢ+b))
C lớn coi vi phạm tốn kém hơn; C nhỏ điều chuẩn mạnh hơn. Không bảo đảm C nhỏ luôn tổng quát hóa tốt hơn. Chọn bằng validation hoặc CV phù hợp.
## Kernel
$$ K_RBF(x,z) = exp(−γ‖x−z‖²)
Kernel cho phép ranh giới phi tuyến mà không tính tường minh mọi tọa độ không gian mới. γ lớn thường tạo ảnh hưởng cục bộ hơn; chọn C và γ cùng với tiền xử lý. Scaling thường hữu ích vì khoảng cách nhạy thang đo.
## Điểm số và xác suất
decision_function không trực tiếp là xác suất. Platt scaling hoặc isotonic có thể hiệu chỉnh trên dữ liệu phù hợp, không dùng chính test để fit. Điểm đã hiệu chỉnh vẫn cần kiểm tra ở quần thể mới.
## Liên hệ y khoa
Nhiều biến gen và ít mẫu dễ có overfit, đặc biệt nếu chọn biến trước CV trên toàn bộ bảng. Fit chọn biến và scaling trong từng fold. Các support vector góp phần xác định nghiệm nhưng thêm nhiều mẫu có thể vẫn đổi nghiệm.

## Quy trình học và giới hạn
Mô phỏng web dùng ví dụ đơn giản; lab bảng chia theo dòng, chưa tự tách lần khám cùng bệnh nhân. Khi đánh giá trên người mới, cần split/CV theo bệnh nhân và giữ các bước học tham số trong train. Khi chuyển thời gian hoặc nơi khám, cần kiểm tra lại quần thể và quy trình đo.
Chỉ thay một yếu tố mỗi lần, ghi cấu hình, tập đo và loại sai sót. Dữ liệu tổng hợp kiểm tra quy trình, không chứng minh hiệu quả chẩn đoán hay lợi ích điều trị. Không tải thông tin sức khỏe người thật vào công cụ học tập này.
## Đọc thêm
- Thuật toán và đánh giá: https://scikit-learn.org/stable/user_guide.html
- Tránh rò rỉ dữ liệu: https://scikit-learn.org/stable/common_pitfalls.html
`,

COMPARE: `
So sánh mô hình cần cùng mục tiêu, dữ liệu, split và metric. TRIPOD+AI hỗ trợ báo cáo; PROBAST đánh giá nguy cơ sai lệch/tính áp dụng. Chúng không cấp chứng nhận an toàn.
## Train, validation và test
Train học tham số, validation/CV chọn cấu hình. Giữ test cho đánh giá lựa chọn cuối. Random test từ cùng nguồn là đánh giá nội bộ, không tự là thẩm định ngoài hoặc thử nghiệm lâm sàng.
Nếu dùng test để điều chỉnh mô hình, nó đã tham gia lựa chọn; cần dữ liệu độc lập mới để báo hiệu năng ngoài lựa chọn đó. Không đánh đồng mọi lần đọc test với gian lận.
## Cross-validation
Pipeline fit lại trong từng fold. Stratification giữ tương đối tỷ lệ nhãn nhưng không giải quyết phụ thuộc giữa lần khám. Dùng nhóm bệnh nhân hoặc thời gian phù hợp câu hỏi. SD giữa fold không tự là khoảng tin cậy 95%; cần phương pháp độ bất định có giả định phù hợp.
## Ba khía cạnh
Discrimination đo xếp hạng như AUROC; calibration so điểm xác suất với tần suất kết cuộc; utility hỏi lợi ích/hại của quyết định. Brier gồm nhiều khía cạnh sai số xác suất. Net benefit cần ngưỡng và đánh đổi có ý nghĩa.
## Liên hệ y khoa
Accuracy 95% khi kết cuộc 5% có thể chỉ là đoán tất cả âm. Báo FP/FN, sensitivity, specificity, PPV/NPV và số mẫu theo nhóm. Không kết luận bệnh viện khác dùng được chỉ vì điểm tổng cao. So với baseline đơn giản và quy trình hiện hành; chênh AUROC 0,01 không tự đủ hay không đủ để triển khai.

## Quy trình học và giới hạn
Mô phỏng web dùng ví dụ đơn giản; lab bảng chia theo dòng, chưa tự tách lần khám cùng bệnh nhân. Khi đánh giá trên người mới, cần split/CV theo bệnh nhân và giữ các bước học tham số trong train. Khi chuyển thời gian hoặc nơi khám, cần kiểm tra lại quần thể và quy trình đo.
Chỉ thay một yếu tố mỗi lần, ghi cấu hình, tập đo và loại sai sót. Dữ liệu tổng hợp kiểm tra quy trình, không chứng minh hiệu quả chẩn đoán hay lợi ích điều trị. Không tải thông tin sức khỏe người thật vào công cụ học tập này.
## Đọc thêm
- Thuật toán và đánh giá: https://scikit-learn.org/stable/user_guide.html
- Tránh rò rỉ dữ liệu: https://scikit-learn.org/stable/common_pitfalls.html
`,

TEACHABLE: `
Học từ ảnh mẫu giúp thấy dữ liệu huấn luyện ảnh hưởng dự đoán. Trong lab này, hãy dùng đồ vật để học, không dùng ảnh bệnh nhân hoặc thử chẩn đoán.
## Học chuyển giao và cài đặt thực tế
Transfer learning tái sử dụng một mô hình đã học, rồi fit đầu phân loại hoặc fine-tune. Lab này dùng runtime Teachable Machine, checkpoint trích xuất đặc trưng và đầu phân loại học từ ảnh mẫu. Kết quả chuyển giao cần kiểm tra trên ảnh mới; không mặc định đặc trưng học ở miền khác phù hợp mọi ảnh y khoa.
## Dữ liệu và lối tắt
Chụp mỗi lớp trên nền riêng khiến mô hình học nền thay vì vật. Chia ảnh mới theo phiên chụp/người/thiết bị phù hợp, tránh các ảnh gần trùng trong cả train và test. Thêm ảnh không bảo đảm cải thiện nếu tăng nhiễu hoặc lệch mẫu.
## Liên hệ y khoa
Ảnh y khoa có thể chứa nhãn bệnh viện, thước đo hoặc dấu thiết bị liên quan nhãn. Đây là các lối tắt cần điều tra. Bản đồ Grad-CAM hỗ trợ khảo sát nhưng không chứng minh mô hình nhìn đúng tổn thương.
## Tự suy nghĩ
Giữ vật, chỉ đổi nền của ảnh thử. Ghi dự đoán và điểm trước/sau. Điểm phân loại không tự là xác suất bệnh đã calibration. Đánh giá trên đồ vật không chuyển thành bằng chứng dùng cho da liễu hoặc X-quang.

## Quy trình học và giới hạn
Mô phỏng web dùng ví dụ đơn giản; lab bảng chia theo dòng, chưa tự tách lần khám cùng bệnh nhân. Khi đánh giá trên người mới, cần split/CV theo bệnh nhân và giữ các bước học tham số trong train. Khi chuyển thời gian hoặc nơi khám, cần kiểm tra lại quần thể và quy trình đo.
Chỉ thay một yếu tố mỗi lần, ghi cấu hình, tập đo và loại sai sót. Dữ liệu tổng hợp kiểm tra quy trình, không chứng minh hiệu quả chẩn đoán hay lợi ích điều trị. Không tải thông tin sức khỏe người thật vào công cụ học tập này.
## Đọc thêm
- Thuật toán và đánh giá: https://scikit-learn.org/stable/user_guide.html
- Tránh rò rỉ dữ liệu: https://scikit-learn.org/stable/common_pitfalls.html
`,
};
