/** Lý thuyết nhóm Deep Learning trong Chẩn đoán Hình ảnh, Tín hiệu Y sinh và Mô hình Tạo sinh Y tế. */
export const DL_THEORY: Record<string, string> = {
MLP: `
Multi-Layer Perceptron (MLP - Mạng nơ-ron nhiều lớp) trong y học là kiến trúc học sâu kinh điển có khả năng mô hình hóa các mối quan hệ **sinh lý bệnh học phi tuyến tính phức tạp** giữa các yếu tố nguy cơ, dấu ấn sinh học và biến cố sức khỏe mà các mô hình hồi quy tuyến tính truyền thống không thể nắm bắt được.

## Đơn vị Nơ-ron Tính toán và Tương quan Sinh học
Một nơ-ron nhân tạo mô phỏng quá trình tích hợp điện thế hoạt động của nơ-ron sinh học:
$$ z = w₁x₁ + w₂x₂ + … + w_dx_d + b
$$ a = f(z)
- xⱼ: các chỉ số xét nghiệm đầu vào (như huyết áp, nồng độ enzym, tiền sử bệnh).
- wⱼ: trọng số liên kết (synaptic weights) đo lường tầm quan trọng tương đối của từng chỉ số.
- b: ngưỡng phân cực nền (bias).
- f: hàm kích hoạt phi tuyến (activation function). Nếu không có f, việc xếp chồng hàng chục lớp nơ-ron vẫn chỉ tương đương với một phép biến đổi tuyến tính đơn thuần — mạng hoàn toàn bất lực trước các ranh giới bệnh lý phi tuyến.

## Các Hàm Kích hoạt Cốt lõi trong Y sinh học
- **Sigmoid σ(z) = 1 / (1 + e^(−z))**: Ánh xạ đầu ra vào khoảng (0, 1), lý tưởng cho tầng xuất xác suất mắc bệnh nhị phân (như Sống / Tử vong). Tuy nhiên, hàm bị bão hòa ở hai đầu khiến đạo hàm triệt tiêu về 0, gây ra vấn đề biến mất gradient (Vanishing Gradient) ở các tầng ẩn sâu.
- **tanh(z)**: Ánh xạ vào khoảng (−1, 1), có tâm đối xứng tại 0, thường dùng trong chuẩn hóa tín hiệu sinh lý.
- **ReLU (Rectified Linear Unit) max(0, z)**: Tiêu chuẩn vàng cho các tầng ẩn; đạo hàm bằng 1 ở miền dương giúp dòng gradient truyền sâu qua nhiều tầng mà không bị suy giảm. Chú ý hiện tượng "ReLU chết" khi nơ-ron nhận giá trị âm liên tục.
- **Softmax**: Ánh xạ tầng ra cho bài toán phân loại nhiều bệnh lý loại trừ lẫn nhau (tổng xác suất các nhóm bệnh bằng 1).

## Lan truyền Xuôi (Forward Propagation) và Đo lường Sai số
Tín hiệu bệnh nhân được truyền tuần tự qua từng tầng ẩn:
$$ a⁽ˡ⁾ = f( W⁽ˡ⁾ a⁽ˡ⁻¹⁾ + b⁽ˡ⁾ )
Tầng cuối cùng xuất ra dự báo ŷ, được so sánh với kết cuộc thực tế y thông qua hàm mất mát:
- Cross-Entropy (cho phân loại bệnh tật): phạt rất nặng các trường hợp mô hình tự tin dự đoán sai lệch sinh mạng.
- Mean Squared Error (cho định lượng chỉ số sinh học liên tục).

## Lan truyền Ngược (Backpropagation) và Tối ưu hóa Gradient
Thuật toán sử dụng quy tắc dây chuyền (Chain Rule) của giải tích vi tích phân để tính toán độ dốc (gradient) của hàm mất mát theo từng trọng số liên kết, lan truyền ngược từ tầng kết quả về tầng đầu vào:
$$ δ⁽ᴸ⁾ = ŷ − y    (với Softmax và Cross-Entropy)
$$ δ⁽ˡ⁾ = (W⁽ˡ⁺¹⁾ᵀ δ⁽ˡ⁺¹⁾) ⊙ f′(z⁽ˡ⁾)
$$ ∂L / ∂W⁽ˡ⁾ = δ⁽ˡ⁾ · (a⁽ˡ⁻¹⁾)ᵀ
Trọng số được cập nhật theo hướng làm giảm sai số chẩn đoán:
$$ W ← W − η · ∂L/∂W
- Tốc độ học η (Learning Rate): Quá lớn sẽ khiến hàm mất mát dao động mất kiểm soát; quá nhỏ sẽ khiến mô hình học rất chậm và dễ kẹt ở cực tiểu địa phương.
- Thuật toán tối ưu Adam: Tự động điều chỉnh bước học thích ứng cho từng trọng số dựa trên mô-men bậc một và bậc hai của gradient, là lựa chọn mặc định ổn định nhất.

## Định lý Xấp xỉ Phổ quát (Universal Approximation Theorem)
Một mạng MLP chỉ cần duy nhất một tầng ẩn với đủ số lượng nơ-ron phi tuyến có khả năng xấp xỉ bất kỳ hàm số liên tục nào trong y sinh học. Tuy nhiên, việc tăng chiều sâu của mạng (Deep MLP) giúp mạng học được các biểu diễn đặc trưng phân tầng trừu tượng với số lượng tham số ít hơn nhiều so với việc mở rộng chiều rộng của một tầng duy nhất.

## Kiểm soát Overfitting trong Dữ liệu Bệnh án Điện tử
Dữ liệu y tế thường có số lượng mẫu bệnh nhân hữu hạn nhưng số chiều đặc trưng lớn, khiến MLP rất dễ học thuộc lòng từng ca bệnh. Các chốt chặn an toàn:
- Dừng sớm (Early Stopping): Theo dõi loss trên tập Validation độc lập; dừng huấn luyện ngay khi loss Validation bắt đầu tăng trở lại dù loss Train vẫn đang giảm.
- Điều chuẩn L2 (Weight Decay): Phạt các trọng số liên kết có độ lớn quá mức.
- Dropout: Ngẫu nhiên vô hiệu hóa một tỷ lệ nơ-ron (ví dụ 20–50%) trong mỗi lượt huấn luyện, buộc mạng không được phụ thuộc vào một con đường tín hiệu duy nhất.

## Tự kiểm tra tư duy lâm sàng
- Tại sao việc khởi tạo toàn bộ trọng số mạng nơ-ron bằng số 0 lại khiến mạng mất hoàn toàn khả năng học các tương tác bệnh học phức tạp?
- Một mạng MLP dự báo biến chứng sau phẫu thuật đạt loss Train = 0,02 nhưng loss Validation = 0,75. Bạn cần can thiệp những kỹ thuật nào để khắc phục?
`,

CNN: `
Mạng Nơ-ron Tích Chập (Convolutional Neural Networks - CNN) là trụ cột cách mạng trong **Chẩn đoán Hình ảnh Y khoa (Medical Imaging)**: phân tích tự động phim chụp X-quang lồng ngực, cắt lớp vi tính (CT scan), cộng hưởng từ (MRI), ảnh soi đáy mắt tiểu đường và tiêu bản giải phẫu bệnh kỹ thuật số (WSI).

## Thách thức của Dữ liệu Ảnh Y tế và Giải pháp CNN
Một phim chụp X-quang độ phân giải cao 2048×2048 nếu kết nối đầy đủ (Dense) với 1.000 nơ-ron sẽ đòi hỏi hơn 4 tỷ tham số — điều bất khả thi về mặt tính toán và chắc chắn gây Overfitting tức thì.
CNN giải quyết bài toán này nhờ hai nguyên lý sinh học mô phỏng vỏ não thị giác:
1. **Kết nối Cục bộ (Local Receptive Fields)**: Mỗi nơ-ron chỉ quan sát một vùng vi thể nhỏ của ảnh.
2. **Chia sẻ Trọng số (Weight Sharing)**: Cùng một bộ lọc trượt trên toàn bộ phim chụp, giúp một đặc trưng bệnh lý (như nốt mờ phổi hay ổ vi vôi hóa) được nhận diện nhất quán dù nó nằm ở đỉnh phổi hay đáy phổi (tính bất biến trước phép tịnh tiến - Translation Invariance).

## Phép Tích Chập (Convolution Operation) và Bộ Lọc Lâm sàng
Bộ lọc (Kernel) K kích thước k×k (thường là 3×3 hoặc 5×5) trượt trên ảnh y tế I; tại mỗi tọa độ, tính tổng tích từng điểm ảnh:
$$ S(i, j) = Σₘ Σₙ I(i+m, j+n) · K(m, n) + b
Kết quả sinh ra một **Bản đồ Đặc trưng (Feature Map)**:
- Tầng đầu: Bộ lọc trích xuất các đường bờ xương, bờ cơ hoành, ranh giới bóng tim.
- Tầng giữa: Tổ hợp thành các hình thái giải phẫu như vân phổi, cấu trúc mô mỡ, đường viền nang.
- Tầng sâu: Nhận diện các tổn thương bệnh học vi thể phức tạp như thâm nhiễm phế nang, tổn thương dạng kính mờ (Ground-glass opacity), khối u ác tính xâm lấn.

## Stride, Padding và Động học Kích thước Ảnh
- **Bước trượt (Stride - s)**: Khoảng cách trượt của bộ lọc. s = 2 làm giảm kích thước bản đồ đặc trưng xuống một nửa, đóng vai trò giảm cỡ mẫu không gian.
- **Đệm biên (Padding - p)**: Thêm các viền giá trị 0 quanh ảnh để bảo tồn thông tin các tổn thương nằm sát rìa phim chụp.
$$ Kích thước đầu ra = ⌊(N + 2p − k) / s⌋ + 1

## Kênh Màu và Ảnh Thể tích Y tế (3D Convolutions)
- Ảnh X-quang thường là ảnh đa mức xám (1 kênh màu).
- Tiêu bản giải phẫu bệnh nhuộm H&E có 3 kênh màu RGB (phân biệt nhân tế bào bắt màu xanh tím hematoxylin và bào tương bắt màu hồng eosin).
- Ảnh cắt lớp CT/MRI là chuỗi các lát cắt thể tích 3 chiều (Voxel), đòi hỏi các bộ lọc tích chập 3D (k×k×k) để nắm bắt tính liên tục không gian ba chiều của khối u.

## Lớp Kích hoạt ReLU và Tầng Gom cụm (Max Pooling)
- ReLU đưa tính phi tuyến vào sau phép tích chập.
- **Max Pooling (Gom cụm Cực đại)** kích thước 2×2: Giữ lại giá trị tín hiệu mạnh nhất trong mỗi ô 2×2, giảm 75% khối lượng dữ liệu, mở rộng trường tiếp nhận (Receptive Field) của các tầng sau và tăng tính bền vững trước các rung lắc nhỏ của bệnh nhân khi chụp.

## Bản đồ Nhiệt Grad-CAM: Minh bạch Hóa Quyết định Chẩn đoán
Trong y khoa, một mô hình kết luận *"Viêm phổi với xác suất 95%"* là chưa đủ. Bác sĩ bắt buộc phải biết AI đang nhìn vào vị trí giải phẫu nào để đưa ra kết luận đó. Kỹ thuật Grad-CAM (Gradient-weighted Class Activation Mapping) tính toán gradient của điểm số chẩn đoán ngược về bản đồ đặc trưng tích chập cuối cùng để tạo ra bản đồ nhiệt trực quan: vùng tổn thương thâm nhiễm thực sự sẽ phát sáng màu đỏ, giúp bác sĩ phát hiện ngay nếu AI đang "nhìn nhầm" vào nhãn mác kim loại trên phim chụp.

## Tự kiểm tra tư duy lâm sàng
- Tại sao việc sử dụng phép Max Pooling quá nhiều lần trong mạng CNN có thể gây nguy cơ bỏ sót các tổn thương nốt phổi kích thước dưới 3 mm trên phim CT?
- Nếu bản đồ nhiệt Grad-CAM của một ca chẩn đoán u xương lại tập trung sáng rực ở góc dưới của phim nơi ghi tên bệnh viện, bạn đánh giá thế nào về độ tin cậy của mô hình đó?
`,

ATTN: `
Cơ chế Tự Chú Ý (Self-Attention) là bước đột phá cách mạng đứng sau kiến trúc Transformer, cho phép hệ thống phân tích đồng thời toàn bộ chuỗi **Tín hiệu Y sinh Thời gian thực (ECG, EEG) và Chuỗi Sự kiện Bệnh án Điện tử (Longitudinal EHR)**, tự động lượng hóa mức độ liên quan giữa các biến cố y tế cách xa nhau trong quá khứ mà không bị nghẽn thông tin như các mạng hồi quy RNN/LSTM kinh điển.

## Bối cảnh Lâm sàng: Dòng thời gian Bệnh sử
Bệnh sử của một bệnh nhân là một chuỗi thời gian kéo dài nhiều năm: một đợt dùng thuốc giảm đau kháng viêm NSAIDs cách đây 5 năm có thể là nguyên nhân tiềm ẩn trực tiếp dẫn đến đợt xuất huyết tiêu hóa hoặc suy thận cấp hiện tại. Các mô hình tuần tự cũ (RNN) thường "quên" các sự kiện xa xôi do hiện tượng suy giảm thông tin qua thời gian. Self-Attention kết nối trực tiếp mọi sự kiện y tế với nhau bất kể khoảng cách thời gian.

## Bộ ba Vector Query, Key, Value trong Y tế
Mỗi sự kiện bệnh án x (một chẩn đoán, một chỉ số cận lâm sàng, một toa thuốc) được chiếu tuyến tính thành 3 không gian biểu diễn:
$$ q = x · W_Q    (Query - Câu hỏi chẩn đoán lâm sàng hiện tại)
$$ k = x · W_K    (Key - Nhãn định danh bệnh học của sự kiện quá khứ)
$$ v = x · W_V    (Value - Thông tin nội dung y khoa chi tiết của sự kiện)
Hình dung tương tự việc bác sĩ lật mở hồ sơ bệnh án cũ: Query là vấn đề cấp cứu hiện tại (ví dụ: *"Bệnh nhân tụt huyết áp chưa rõ nguyên nhân"*), Key là tiêu đề các trang bệnh án cũ, và Value là chi tiết các xét nghiệm dị ứng thuốc hay tiền sử can thiệp mạch vành trong quá khứ.

## Công thức Scaled Dot-Product Attention
$$ Attention(Q, K, V) = Softmax( [Q · Kᵀ] / √d_k ) · V
1. **Tính điểm tương đồng (Attention Scores)**: Tích vô hướng qᵢ·kⱼ đo lường mức độ liên quan giữa sự kiện hiện tại i và biến cố quá khứ j.
2. **Hệ số co giãn √d_k**: Chia cho căn bậc hai của số chiều vector để ngăn điểm số quá lớn làm bão hòa hàm Softmax khi số chiều lớn, bảo vệ dòng gradient.
3. **Chuẩn hóa Softmax**: Chuyển đổi các điểm số thành ma trận trọng số phân phối xác suất αᵢⱼ ≥ 0 có tổng bằng 1.
4. **Tổng hợp Thông tin có Trọng số**: Vector ngữ cảnh đầu ra của sự kiện i là trung bình cộng có trọng số của toàn bộ các vector Value: Σⱼ αᵢⱼ · vⱼ.

## Mặt nạ Nguyên nhân (Causal Masking) trong Dự báo Tiến triển Bệnh
Khi dự báo nguy cơ tử vong hoặc sốc nhiễm trùng trong 24 giờ tới tại phòng hồi sức tích cực (ICU), mô hình tại thời điểm t tuyệt đối không được phép nhìn thấy dữ liệu cận lâm sàng của thời điểm t+1 trong tương lai. Causal Masking gán điểm −∞ cho toàn bộ các vị trí tương lai (j > i) trước khi qua Softmax, đảm bảo tính nhân quả thời gian nghiêm ngặt trong phân tích y học.

## Đa đầu Chú ý (Multi-Head Attention) và Đa góc nhìn Bệnh học
Thay vì chỉ dùng một góc nhìn chú ý duy nhất, Multi-Head Attention phân chia không gian thành h đầu độc lập:
- Head 1: Tập trung theo dõi động học của các xét nghiệm huyết học (Hgb, Bạch cầu).
- Head 2: Tập trung theo dõi các tương tác thuốc bất lợi giữa đơn thuốc mới và đơn thuốc cũ.
- Head 3: Tập trung nắm bắt sự biến thiên của các chỉ số huyết động (Huyết áp, Nhịp tim).
Kết quả của tất cả các đầu được nối lại và chiếu tuyến tính về không gian chung, cung cấp một bức tranh toàn diện về thể trạng bệnh nhân.

## Mã hóa Vị trí Thời gian (Positional Encoding)
Vì cơ chế Self-Attention bản chất là một phép tính toán song song không phụ thuộc vào thứ tự (hoán vị chuỗi đầu vào thì kết quả hoán vị theo), ta bắt buộc phải cộng thêm vector mã hóa vị trí thời gian (sin/cos hoặc học được) vào vector embedding ban đầu để mô hình phân biệt được khoảng cách ngày/giờ giữa các đợt khám bệnh.

## Tự kiểm tra tư duy lâm sàng
- Trong việc theo dõi bệnh nhân ICU, tại sao cơ chế Scaled Dot-Product Attention lại vượt trội hơn mạng LSTM khi dự đoán cơn ngừng tim xảy ra sau 12 giờ?
- Nếu ma trận trọng số Attention cho thấy nơ-ron dự báo suy tim tập trung chú ý rất mạnh vào chỉ số Creatinine máu thay vì Troponin, điều này gợi ý cơ chế bệnh sinh liên quan đến hội chứng tim - thận (Cardiorenal Syndrome) như thế nào?
`,

GPT: `
Mô hình Ngôn ngữ Transformer Chỉ-Decoder (Clinical GPT Architecture) trong Y tế được thiết kế để xử lý bài toán **Tự Động Hóa Văn Bản Y Khoa (Clinical NLP)**: hỗ trợ bác sĩ soạn thảo tóm tắt bệnh án xuất viện, chuẩn hóa ghi chú lâm sàng theo cấu trúc SOAP, và trích xuất thông tin tự động từ văn bản tự do của hồ sơ bệnh án điện tử.

## Mục tiêu Huấn luyện Tự Giám sát (Causal Language Modeling)
Mô hình học tập từ hàng triệu bệnh án lâm sàng ẩn danh mà không cần con người phải gán nhãn thủ công từng từ. Với chuỗi token văn bản y khoa t₁ … t_n, mục tiêu là tối đa hóa xác suất dự đoán token y khoa tiếp theo khi biết toàn bộ tiền sử câu phía trước:
$$ L = − Σᵢ log P( tᵢ | t₁, t₂, …, tᵢ₋₁ )
Nhờ cơ chế Causal Masking, mô hình có thể tính toán hàm mất mát và huấn luyện đồng thời trên toàn bộ các vị trí từ vựng trong chuỗi bệnh án cùng một lúc.

## Cấu trúc Một Khối Transformer Chuẩn Y sinh
Một khối Transformer bao gồm hai tầng con cốt lõi:
1. **Multi-Head Causal Self-Attention**: Nắm bắt mối liên hệ ngữ pháp và ngữ nghĩa giữa các thuật ngữ y học trong câu.
2. **Mạng Feed-Forward (FFN)**: Gồm 2 lớp Dense có độ rộng thường gấp 4 lần kích thước embedding, lưu trữ tri thức bệnh học tĩnh sâu sắc.
3. **Kết nối Tắt (Residual Connections) & Chuẩn hóa Tầng (LayerNorm)**:
$$ h = x + MultiHeadAttention( LayerNorm(x) )
$$ out = h + FeedForward( LayerNorm(h) )
Residual connection đóng vai trò đường cao tốc thông suốt cho dòng gradient chảy ngược qua hàng chục khối Transformer mà không bị triệt tiêu.

## Quy trình Sinh Văn bản Tự Hồi quy (Autoregressive Generation)
1. Bác sĩ nhập phần đầu của bệnh án (Prompt): *"Bệnh nhân nam, 62 tuổi, nhập viện vì đau ngực trái kéo dài 30 phút..."*.
2. Mô hình xử lý ngữ cảnh và xuất ra phân phối xác suất trên toàn bộ từ điển y khoa cho từ tiếp theo.
3. Giải mã và chọn ra token tiếp theo (ví dụ: *"lan"*).
4. Ghép token mới vào cuối chuỗi và lặp lại quá trình để sinh tiếp các từ (*"lên"*, *"cổ"*, *"và"*, *"tay"*, *"trái"*).

## Hiện tượng Học Thuộc Lòng Thông tin Sức khỏe Cá nhân (PHI Memorization Danger)
Khi huấn luyện mô hình GPT trên các tập dữ liệu bệnh án quy mô nhỏ, mô hình có xu hướng **học thuộc lòng từng từ ngữ (Overfitting cực đoan)**.
Nguy cơ an toàn đạo đức y tế nghiêm trọng: Mô hình có thể "phun ra" nguyên vẹn tên tuổi, số chứng minh nhân dân, số điện thoại hoặc tiền sử bệnh nhạy cảm (như tình trạng nhiễm HIV) của một bệnh nhân có thật khi người dùng thử nghiệm các câu gợi ý tương tự. Bắt buộc phải thực hiện khử định danh toàn diện (De-identification) trước khi huấn luyện và áp dụng các kỹ thuật bảo mật vi sai (Differential Privacy).

## Từ Tiền Huấn luyện Tổng quát đến Chuyên gia Lâm sàng (Instruction Tuning & RLHF)
- Giai đoạn 1: Tiền huấn luyện trên kho văn bản y sinh khổng lồ (PubMed, sách giáo khoa y học) để nắm vững thuật ngữ bệnh học.
- Giai đoạn 2: Tinh chỉnh có giám sát (Supervised Fine-Tuning - SFT) trên các bộ câu hỏi - đáp bệnh học chuẩn mực do các bác sĩ đầu ngành biên soạn.
- Giai đoạn 3: Học tăng cường từ phản hồi của chuyên gia y tế (RLHF), định hướng mô hình tuân thủ quy tắc đạo đức "Trước hết là không làm hại" (Primum non nocere), từ chối đưa ra các chẩn đoán vượt quá thẩm quyền dữ liệu.

## Tự kiểm tra tư duy lâm sàng
- Tại sao một mô hình GPT đạt loss huấn luyện cực kỳ thấp (gần bằng 0) trên 20 bệnh án mẫu lại là dấu hiệu cảnh báo nguy hiểm thay vì là một mô hình thành công?
- Trong việc tạo tóm tắt bệnh án xuất viện, tại sao việc kết hợp con người kiểm duyệt (Human-in-the-Loop) là bắt buộc và không thể tự động hóa 100%?
`,

AE: `
Autoencoder (Mạng Tự Mã Hóa) trong y học là kỹ thuật **học không giám sát chuyên biệt cho bài toán Phát hiện Bất thường Tín hiệu Y sinh (Biomedical Anomaly Detection)** và Giám sát Bệnh nhân Cấp cứu: học cách nén dữ liệu sinh lý bình thường qua một nút cổ chai hẹp (Bottleneck) và tái dựng lại bản thân nó, dùng sai số tái dựng làm chỉ dấu cảnh báo sớm các biến cố nguy kịch.

## Cấu trúc Bộ Mã hóa - Giải mã và Nút Cổ Chai Sinh học
- **Encoder (Bộ mã hóa)**: Ánh xạ vector dữ liệu sinh lý đầu vào x (ví dụ: một chu kỳ sóng điện tâm đồ ECG 12 chuyển đạo gồm hàng nghìn điểm đo) thành một biểu diễn cô đọng z trong không gian ẩn: z = f_enc(x).
- **Bottleneck (Nút cổ chai)**: Chiều của z nhỏ hơn rất nhiều so với chiều của x (dim(z) ≪ dim(x)). Do không gian bị bóp hẹp, mạng buộc phải loại bỏ các dao động nhiễu ngẫu nhiên và chỉ giữ lại các hình thái sinh lý cốt lõi của sóng P-QRS-T bình thường.
- **Decoder (Bộ giải mã)**: Khôi phục lại tín hiệu từ vector z: x̂ = f_dec(z).

## Hàm Mất mát Tái dựng (Reconstruction Loss)
$$ L = (1/n) Σᵢ ‖xᵢ − x̂ᵢ‖²    (MSE Tái dựng)
Mô hình được huấn luyện **độc quyền trên các bệnh nhân có tín hiệu sinh lý hoàn toàn bình thường**. Mạng sẽ học cách tái dựng cực kỳ hoàn hảo các đoạn sóng bình thường với sai số MSE rất nhỏ.

## Cơ chế Phát hiện Loạn nhịp Tim và Biến cố Cấp cứu Bất thường
Khi bệnh nhân đột ngột xuất hiện một cơn rối loạn nhịp tim nguy hiểm (như Cơn nhịp nhanh thất, Rung thất, Rung nhĩ kịch phát) hoặc đoạn ST chênh lên trong nhồi máu cơ tim cấp:
- Do Decoder chưa từng được học cách khôi phục các dạng sóng bệnh lý dị thường này qua nút cổ chai hẹp, nó sẽ cố gắng tái dựng lại dạng sóng đó thành một dạng sóng bình thường.
- Hậu quả: Sai số chênh lệch giữa tín hiệu thực tế x và tín hiệu tái dựng x̂ (Lỗi tái dựng) sẽ **tăng vọt đột biến**.
- Hệ thống phát tín hiệu cảnh báo động đỏ khi lỗi tái dựng vượt quá ngưỡng phân vị an toàn (ví dụ: bách phân vị 95 hoặc 99 tính từ tập dữ liệu bình thường).

## Khử Nhiễu Tín hiệu Y sinh (Denoising Autoencoder)
Trong môi trường phòng cấp cứu hoặc chuyển viện, tín hiệu ECG/EEG luôn bị nhiễu do rung cơ bệnh nhân (Electromyogram artifact) hoặc nhiễu tần số điện lưới 50/60 Hz.
Denoising Autoencoder được huấn luyện bằng cách chủ động cộng thêm nhiễu nhân tạo vào đầu vào x̃ = x + ε, nhưng bắt buộc Decoder phải tái dựng lại bản tín hiệu x hoàn toàn sạch sẽ ban đầu. Mô hình trở thành một bộ lọc số học thông minh bảo toàn hình thái giải phẫu của các đỉnh sóng y học.

## Đánh giá Kích thước Nút Cổ Chai (Bottleneck Dimension)
- Nút cổ chai quá hẹp: Mất mát cả các chi tiết sinh lý bình thường tinh tế (như sóng P nhỏ hoặc rãnh khuyết bình thường), làm tăng tỷ lệ báo động giả (False Positive).
- Nút cổ chai quá rộng: Mạng có thể học hàm đồng nhất (Identity Function), chỉ đơn thuần sao chép nguyên vẹn đầu vào sang đầu ra mà không học được quy luật phân bố sinh học, làm mất khả năng phát hiện ca bệnh bất thường.

## Tự kiểm tra tư duy lâm sàng
- Tại sao một mô hình Autoencoder phát hiện bất thường ECG chỉ cần huấn luyện trên dữ liệu của người bình thường mà không nhất thiết phải thu thập đủ tất cả các loại bệnh lý loạn nhịp tim hiếm gặp?
- Nếu bệnh nhân bị tuột một điện cực đo trên ngực, chỉ số lỗi tái dựng của Autoencoder sẽ phản ứng như thế nào? Bác sĩ cần phân biệt lỗi kỹ thuật này với biến cố tim mạch ra sao?
`,

VAE: `
Variational Autoencoder (VAE - Mạng Tự Mã Hóa Biến Phân) là mô hình **Tạo Sinh Xác Suất (Probabilistic Generative Model)** mang tính đột phá trong Y học Tính toán: cho phép tổng hợp các mẫu **Dữ liệu Bệnh nhân Nhân tạo (Synthetic Patient Data)** có độ chân thực sinh học cao nhằm giải quyết bài toán thiếu hụt mẫu bệnh hiếm, đồng thời bảo vệ tuyệt đối quyền riêng tư và bí mật bệnh án theo luật pháp quốc tế.

## Từ Điểm Cố định sang Phân phối Xác suất Không gian Ẩn
Khác với Autoencoder thông thường ánh xạ bệnh nhân thành một điểm vector cố định đơn lẻ (khiến không gian ẩn có nhiều "khoảng trống" vô nghĩa không thể lấy mẫu sinh dữ liệu), VAE giả định mỗi bệnh nhân là một vùng phân phối xác suất trong không gian tiềm ẩn:
$$ q_θ(z | x) = N( μ(x), σ²(x) )
Encoder dự đoán hai đại lượng thống kê cho từng bệnh nhân:
- Vector kỳ vọng trung bình μ(x) (tọa độ trung tâm kiểu hình).
- Vector log-phương sai log σ²(x) (độ không chắc chắn sinh học quanh kiểu hình đó).

## Thủ thuật Tái Tham Số Hóa (Reparameterization Trick)
Để dòng gradient của thuật toán Backpropagation có thể chảy ngược qua tầng lấy mẫu ngẫu nhiên z ~ N(μ, σ²), ta tách thành phần ngẫu nhiên sang một biến độc lập ε:
$$ z = μ + σ ⊙ ε,    với  ε ~ N(0, I)
Ngẫu nhiên hoàn toàn nằm ở biến ε độc lập với tham số mô hình, trong khi μ và σ vẫn bảo toàn dòng đạo hàm liên tục phục vụ tối ưu hóa mạng nơ-ron.

## Hàm Mất mát ELBO (Evidence Lower Bound) và Cân bằng β-VAE
Hàm mất mát của VAE bao gồm hai số hạng có ý nghĩa y sinh học đối trọng nhau:
$$ L = E_{q}[ ‖x − Decoder(z)‖² ] + β · KL( N(μ, σ²) ‖ N(0, I) )
1. **Sai số Tái dựng (Reconstruction Loss)**: Thúc đẩy Decoder khôi phục chính xác các xét nghiệm và dấu hiệu sinh tồn của bệnh nhân.
2. **Độ phân kỳ Kullback-Leibler (KL Divergence)**:
$$ KL = −½ Σⱼ ( 1 + log σⱼ² − μⱼ² − σⱼ² )
Kéo phân phối của mọi bệnh nhân về gần phân phối chuẩn tắc N(0, I), đảm bảo không gian ẩn liên tục, trơn tru, không có lỗ hổng rỗng.
- Tham số β (β-VAE): Nếu β quá lớn, mô hình ưu tiên làm phẳng không gian ẩn và bỏ qua dữ liệu thực (hiện tượng sụp đổ hậu nghiệm - Posterior Collapse, tái dựng bị mờ nhòe); nếu β quá nhỏ, không gian ẩn bị rời rạc, làm giảm chất lượng dữ liệu bệnh nhân nhân tạo sinh ra.

## Sinh Dữ liệu Bệnh nhân Nhân tạo và Chia sẻ Nghiên cứu An toàn
1. Lấy mẫu một vector bất kỳ từ phân phối chuẩn: z ~ N(0, I).
2. Đưa qua Decoder: Bệnh nhân mới = Decoder(z).
Dữ liệu sinh ra sở hữu đầy đủ các mối tương quan sinh lý chân thực giữa các chỉ số xét nghiệm (như người có đường huyết cao thì HbA1c cũng cao tương ứng), nhưng **hoàn toàn không tương ứng với bất kỳ cá nhân bệnh nhân có thật nào ngoài đời thực**. Điều này mở ra cơ hội chia sẻ dữ liệu nghiên cứu y học xuyên biên giới mà không vi phạm quy định bảo mật HIPAA/GDPR.

## Nội suy Không gian Ẩn (Latent Space Interpolation)
Bằng cách di chuyển tuyến tính giữa hai điểm z_bình_thường và z_bệnh_nặng trong không gian ẩn, VAE cho phép các nhà khoa học mô phỏng tiến trình diễn tiến bệnh sinh liên tục theo thời gian, giúp quan sát các chỉ số sinh học thay đổi như thế nào trước khi biến cố lâm sàng bùng phát.

## Tự kiểm tra tư duy lâm sàng
- Tại sao việc sử dụng dữ liệu bệnh nhân nhân tạo do VAE sinh ra lại giúp cải thiện độ nhạy của mô hình chẩn đoán đối với các căn bệnh hiếm gặp?
- Nếu kiểm tra dữ liệu nhân tạo sinh ra và phát hiện có trường hợp một "bệnh nhân" có nhịp tim 80 nhưng huyết áp bằng 0, điều này phản ánh hạn chế gì trong quá trình huấn luyện VAE?
`,

GAN: `
Generative Adversarial Networks (GAN - Mạng Đối Kháng Tạo Sinh) trong Y học là kiến trúc tạo sinh gồm hai mạng nơ-ron đối đầu trực tiếp, được ứng dụng rộng rãi trong **Tăng Cường Dữ Liệu Hình Ảnh Y Khoa (Medical Image Augmentation)**, chuyển đổi định dạng ảnh (như biến đổi ảnh chụp cộng hưởng từ MRI sang ảnh cắt lớp vi tính CT tương đương) và nâng cao độ phân giải ảnh siêu âm/nội soi.

## Đấu Trường Sinh Tử: Generator vs Discriminator
GAN hoạt động như một cuộc đấu trí liên tục giữa hai chuyên gia y tế giả lập:
- **Mạng Sinh (Generator - G)**: Đóng vai trò như một kỹ thuật viên làm giả phim chụp X-quang, nhận vector nhiễu ngẫu nhiên z ~ N(0, I) và cố gắng tạo ra các hình ảnh bệnh học x_giả trông giống hệt như phim chụp thật của bệnh nhân.
- **Mạng Phân biệt (Discriminator - D)**: Đóng vai trò như một bác sĩ chẩn đoán hình ảnh kỳ cựu, nhận vào cả phim chụp thật từ bệnh viện và phim chụp giả do G tạo ra, cố gắng vạch trần đâu là ảnh giả và đâu là ảnh thật.

## Trò chơi Cực Tiểu - Cực Đại (Minimax Game)
$$ min_G max_D  V(D, G) = E_{x~p_{data}}[log D(x)] + E_{z~p_z}[log(1 − D(G(z)))]
- D tìm cách tối đa hóa hàm mục tiêu: Gán nhãn 1 (Thật) cho ảnh bệnh nhân thực tế D(x) → 1, và gán nhãn 0 (Giả) cho ảnh do máy sinh ra D(G(z)) → 0.
- G tìm cách tối thiểu hóa hàm mục tiêu: Đánh lừa hoàn hảo bác sĩ D sao cho D(G(z)) → 1.
Tại điểm cân bằng Nash lý tưởng, G tạo ra các phim chụp X-quang hoàn hảo đến mức bác sĩ D chỉ có thể đoán mò với xác suất 50% (D = 0,5) cho mọi hình ảnh.

## Huấn luyện Cân bằng Xen kẽ (Alternating Optimization)
1. Bước 1: Đóng băng Generator, cập nhật Discriminator bằng gradient descent để rèn luyện khả năng phát hiện các chi tiết giải phẫu giả mạo.
2. Bước 2: Đóng băng Discriminator, cập nhật Generator để cải thiện độ chân thực của cấu trúc mô bệnh học.
Hai mạng phải phát triển năng lực tương đương nhau. Nếu Discriminator quá mạnh ngay từ đầu, gradient truyền về cho Generator sẽ biến mất hoàn toàn, khiến quá trình học bị tê liệt.

## Bẫy Sụp Đổ Mốt (Mode Collapse) và Bệnh lý Ảo giác (Hallucinatory Pathology)
Các rủi ro nghiêm trọng trong y tế:
- **Mode Collapse (Sụp đổ phân bố)**: Generator phát hiện ra một kiểu ảnh X-quang viêm phổi duy nhất đánh lừa được Discriminator, và từ đó nó chỉ sinh đi sinh lại đúng một bức ảnh đó, hoàn toàn bỏ qua các dạng tổn thương phong phú khác trong bệnh học.
- **Ảo giác Bệnh học (Hallucinatory Pathology - Nguy hiểm nhất)**: Khi dùng GAN để nâng cao độ phân giải ảnh hoặc tổng hợp phim CT từ MRI, Generator có thể tự ý "vẽ thêm" một khối u không có thật vào phổi của bệnh nhân hoặc ngược lại "xóa mất" một ổ vi xuất huyết não thực sự nhằm làm mịn ảnh. Đây là lý do GAN đòi hỏi sự kiểm định giải phẫu học cực kỳ khắt khe trước khi ứng dụng lâm sàng.

## Ứng dụng CycleGAN: Chuyển đổi Xuyên Định dạng Không Cần Cặp Ảnh
Trong xạ trị ung thư, việc chụp CT giúp tính toán liều lượng hấp thụ phóng xạ nhưng lại khiến bệnh nhân nhiễm xạ thêm. Mô hình CycleGAN cho phép chuyển đổi trực tiếp ảnh chụp MRI (không nhiễm xạ) sang ảnh giả lập CT (Synthetic CT) có độ chính xác cao về mặt mật độ điện tử mô mà không cần bệnh nhân phải chụp cả hai máy cùng lúc.

## Tự kiểm tra tư duy lâm sàng
- Tại sao việc đường loss của Discriminator giảm về mức 0 tuyệt đối lại là tin xấu trong quá trình huấn luyện mạng GAN y tế?
- Nếu một hệ thống GAN tạo ra các tiêu bản giải phẫu bệnh nhân tạo trông rất đẹp mắt nhưng không tuân thủ quy luật phân chia tế bào tự nhiên, rủi ro nào sẽ xảy ra nếu dùng dữ liệu này để huấn luyện AI chẩn đoán ung thư?
`,

DIFF: `
Mô hình Khuếch Tán (Diffusion Models) đại diện cho đỉnh cao công nghệ tạo sinh hiện đại nhất trong **Tái Dựng Hình Ảnh Y Khoa Liều Thấp (Low-Dose Medical Imaging)**: khử nhiễu lượng tử trên phim chụp CT liều thấp (bảo vệ bệnh nhân khỏi nguy cơ ung thư do tia X), tăng tốc độ chụp cộng hưởng từ MRI gấp nhiều lần và tái tạo hình thái giải phẫu học độ phân giải siêu cao với độ ổn định toán học vượt trội hơn hẳn GAN.

## Cơ sở Vật lý: Quá trình Khuếch tán Nhiệt động học
Mô hình hoạt động dựa trên nguyên lý khuếch tán phân tử: dần dần phá hủy cấu trúc thông tin của một hình ảnh y tế bằng cách thêm nhiễu ngẫu nhiên từng bước nhỏ theo thời gian, sau đó huấn luyện một mạng nơ-ron học cách đảo ngược chính xác quá trình đó để khôi phục lại hình thái giải phẫu ban đầu từ vùng nhiễu trắng thuần túy.

## Quá trình Khuếch tán Thuận (Forward Diffusion Process)
Bắt đầu từ phim chụp X-quang gốc x₀, tại mỗi bước thời gian t (từ 1 đến T, thường T = 1.000 bước), ta chủ động thêm một lượng nhỏ nhiễu Gauss theo lịch trình phương sai βₜ tăng dần:
$$ q(xₜ | xₜ₋₁) = N( √(1 − βₜ) · xₜ₋₁, βₜ · I )
Nhờ tính chất phân phối chuẩn, ta có thể "nhảy cóc" trực tiếp từ ảnh gốc x₀ tới bất kỳ bước thời gian t nào mà không cần lặp tuần tự:
Đặt αₜ = 1 − βₜ và ᾱₜ = α₁·α₂·…·αₜ:
$$ xₜ = √ᾱₜ · x₀ + √(1 − ᾱₜ) · ε,    với  ε ~ N(0, I)
- √ᾱₜ: Tỷ lệ tín hiệu cấu trúc giải phẫu còn sót lại.
- √(1 − ᾱₜ): Tỷ lệ nhiễu đã xâm nhập.
Khi t = T, ᾱ_T ≈ 0, toàn bộ phim chụp y tế ban đầu bị biến đổi hoàn toàn thành một màn nhiễu hạt ngẫu nhiên thuần túy x_T ~ N(0, I).

## Quá trình Đảo Ngược: Mạng Nơ-ron Dự Đoán Nhiễu (Reverse Process)
Nhiệm vụ của trí tuệ nhân tạo là học cách đảo ngược bước đi: p_θ(xₜ₋₁ | xₜ).
Thay vì cố gắng dự đoán trực tiếp bức ảnh giải phẫu sạch x₀, kiến trúc mạng (thường là U-Net tích hợp các khối Residual và Attention) được huấn luyện để **dự đoán chính xác lượng nhiễu ε đã được thêm vào** tại bước t:
$$ L = E_{t, x₀, ε}[ ‖ ε − ε_θ( √ᾱₜ·x₀ + √(1−ᾱₜ)·ε, t ) ‖² ]
Hàm mất mát chỉ đơn giản là bài toán hồi quy khoảng cách L2 giữa nhiễu thật và nhiễu dự đoán — cực kỳ ổn định, không có cuộc chiến đối kháng bấp bênh và không bao giờ bị hiện tượng Sụp đổ mốt (Mode Collapse) như GAN.

## Khử Nhiễu CT Liều Thấp (Low-Dose CT Denoising) trong Thực hành Lâm sàng
- Vấn đề y khoa: Giảm liều phát tia X của máy chụp CT giúp bảo vệ sức khỏe cho trẻ em và người bệnh chụp định kỳ, nhưng lại khiến phim chụp bị bao phủ bởi nhiễu lượng tử hạt muối tiêu (Poisson-Gaussian noise), làm mờ các ổ tổn thương nhỏ.
- Giải pháp Diffusion: Đưa phim CT liều thấp vào mạng khuếch tán ở một bước thời gian t phù hợp, mạng U-Net sẽ bóc tách toàn bộ thành phần nhiễu lượng tử và hoàn trả lại một bức phim CT sắc nét tương đương với liều chụp tiêu chuẩn đầy đủ.

## Điều Kiện Hóa Tạo Sinh (Conditioning & Classifier-Free Guidance)
Trong chẩn đoán hình ảnh, ta có thể điều kiện hóa quá trình khử nhiễu bằng các thông tin y khoa đi kèm (như chẩn đoán lâm sàng, độ tuổi bệnh nhân hoặc ảnh chụp một lát cắt định vị trước đó) để định hướng mô hình tái tạo đúng cấu trúc giải phẫu mong muốn mà không sinh ra các hình thái lạ.

## Đánh Đổi Tốc Độ và Kỹ thuật Lấy Mẫu Gia Tốc (DDIM)
Nhược điểm lớn nhất của mô hình khuếch tán truyền thống là tốc độ sinh ảnh chậm do phải lặp qua hàng trăm bước khử nhiễu tuần tự (vài giây đến vài phút mỗi ca), gây khó khăn cho các ca cấp cứu đột quỵ cần đọc kết quả ngay. Các kỹ thuật mới như DDIM (Denoising Diffusion Implicit Models) hay Latent Diffusion (Stable Diffusion - khuếch tán trong không gian nén của VAE) giúp giảm số bước lấy mẫu xuống chỉ còn 20–50 bước mà vẫn bảo toàn độ phân giải hiển vi của mô học.

## Tự kiểm tra tư duy lâm sàng
- Tại sao việc mạng Diffusion dự đoán nhiễu ε thay vì dự đoán trực tiếp ảnh sạch x₀ lại giúp quá trình huấn luyện nơ-ron ổn định hơn rất nhiều về mặt giải tích?
- Trong việc tái tạo ảnh MRI tăng tốc, làm sao các kỹ sư y sinh có thể đảm bảo rằng quá trình khử nhiễu của Diffusion không vô tình xóa mất một tổn thương dị dạng mạch máu não nhỏ của bệnh nhân?
`,
};
