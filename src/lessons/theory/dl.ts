/** Lý thuyết nhóm Deep Learning. */
export const DL_THEORY: Record<string, string> = {
MLP: `
MLP (Multi-Layer Perceptron, mạng nơ-ron nhiều lớp) là mạng nơ-ron cơ bản nhất: các lớp neuron nối đầy đủ, mỗi neuron tính tổng có trọng số rồi qua hàm kích hoạt phi tuyến.

## Một neuron
$$ z = w₁x₁ + … + w_dx_d + b      a = f(z)
Không có f phi tuyến, nhiều lớp chồng lên nhau vẫn chỉ là một phép biến đổi tuyến tính — mạng không học được ranh giới cong.

## Hàm kích hoạt
- **Sigmoid** σ(z) = 1/(1+e^(−z)): ra (0,1); bão hòa ở hai đầu → gradient gần 0 (vanishing gradient).
- **tanh**: ra (−1,1), tâm 0, vẫn bão hòa.
- **ReLU** max(0, z): đơn giản, không bão hòa phía dương, là mặc định cho lớp ẩn; có thể "chết" khi z luôn âm.
- Lớp ra: sigmoid (2 lớp), softmax (nhiều lớp), tuyến tính (hồi quy).

## Lan truyền xuôi (forward)
Từng lớp: a⁽ˡ⁾ = f(W⁽ˡ⁾·a⁽ˡ⁻¹⁾ + b⁽ˡ⁾). Lớp cuối cho dự đoán ŷ, so với nhãn bằng hàm mất mát: cross-entropy cho phân loại, MSE cho hồi quy.

## Lan truyền ngược (backpropagation)
Dùng quy tắc chuỗi để tính đạo hàm của loss theo mọi trọng số, đi từ lớp ra về lớp vào:
$$ δ⁽ᴸ⁾ = ŷ − y   (softmax + cross-entropy)
$$ δ⁽ˡ⁾ = (W⁽ˡ⁺¹⁾ᵀ δ⁽ˡ⁺¹⁾) ⊙ f′(z⁽ˡ⁾)
$$ ∂L/∂W⁽ˡ⁾ = δ⁽ˡ⁾ · a⁽ˡ⁻¹⁾ᵀ
Chi phí tính gradient chỉ cỡ hai lần forward, nhờ tái sử dụng các δ.

## Gradient descent
$$ w ← w − η · ∂L/∂w
- **Batch**: dùng toàn bộ dữ liệu mỗi bước. **Mini-batch SGD**: vài chục mẫu mỗi bước, nhanh và có nhiễu giúp thoát điểm yên ngựa.
- **Tốc độ học η**: quá lớn → loss dao động, phân kỳ; quá nhỏ → học rất chậm.
- **Adam**: tự điều chỉnh bước học từng tham số theo trung bình động của gradient và bình phương gradient; mặc định tốt cho hầu hết bài toán.
- **Epoch**: một lượt đi qua toàn bộ dữ liệu train.

## Khởi tạo
Không khởi tạo mọi trọng số bằng 0 (các neuron sẽ học giống hệt nhau). Dùng ngẫu nhiên với phương sai ~1/d (Xavier, cho tanh) hoặc ~2/d (He, cho ReLU).

## Overfitting và cách chống
Vẽ loss train và validation theo epoch: train giảm mãi nhưng validation đi lên là overfitting. Cách xử lý: dừng sớm (early stopping) ở epoch validation tốt nhất, điều chuẩn L2 (weight decay), dropout, giảm số neuron, thêm dữ liệu.

## Định lý xấp xỉ phổ quát
MLP một lớp ẩn đủ rộng xấp xỉ được mọi hàm liên tục trên miền bị chặn — nhưng không nói gì về việc học được nó từ dữ liệu hữu hạn. Mạng sâu thường cần ít tham số hơn mạng rộng cho cùng độ chính xác.

## Ví dụ tính tay
x = [1, 2], w = [0,5; −1], b = 1:
$$ z = 0,5·1 + (−1)·2 + 1 = −0,5
- ReLU: max(0; −0,5) = 0 (neuron "tắt").
- Sigmoid: 1/(1 + e^0,5) ≈ 0,378.
- tanh: tanh(−0,5) ≈ −0,462.
Cùng một z, hàm kích hoạt khác cho đầu ra khác — và gradient khác (ReLU có gradient 0 khi z < 0).

## Tự kiểm tra
- Vì sao mạng không có hàm kích hoạt không giải được bài "hai vòng tròn"?
- Loss train đi lên xuống thất thường và không giảm: nên chỉnh tham số nào trước?
`,

CNN: `
CNN (Convolutional Neural Network, mạng tích chập) là kiến trúc cho dữ liệu có cấu trúc lưới như ảnh. Thay vì nối mọi điểm ảnh với mọi neuron, CNN trượt các bộ lọc nhỏ trên ảnh.

## Phép tích chập
Bộ lọc (kernel) K kích thước k×k trượt trên ảnh I; tại mỗi vị trí tính tổng tích từng phần tử:
$$ S(i, j) = Σₘ Σₙ I(i+m, j+n) · K(m, n) + b
Kết quả là **feature map**: nơi nào giống mẫu của bộ lọc thì giá trị lớn. Ví dụ bộ lọc [−1 0 1] phát hiện cạnh dọc.

## Stride và padding
- **Stride** s: bước trượt; s = 2 làm map nhỏ đi một nửa.
- **Padding** p: thêm viền 0 để giữ kích thước biên.
$$ kích thước ra = ⌊(N + 2p − k) / s⌋ + 1

## Hai ý tưởng cốt lõi
- **Kết nối cục bộ**: mỗi neuron chỉ nhìn một vùng nhỏ (trường tiếp nhận).
- **Chia sẻ trọng số**: cùng một bộ lọc dùng cho mọi vị trí → ít tham số hơn rất nhiều, và một đặc trưng học được ở góc trái cũng nhận ra ở góc phải (đồng biến với phép tịnh tiến).
Ví dụ: ảnh 224×224×3 nối đầy đủ với 1.000 neuron cần ~150 triệu trọng số; một lớp 64 bộ lọc 3×3 chỉ cần 64·27 + 64 = 1.792.

## Nhiều kênh
Ảnh màu có 3 kênh; bộ lọc có cùng số kênh (3×3×3) và cộng qua mọi kênh. Một lớp có nhiều bộ lọc → nhiều feature map, chúng trở thành các kênh của lớp sau.

## ReLU và pooling
Sau tích chập là ReLU để giữ phi tuyến. **Max pooling** 2×2 lấy giá trị lớn nhất mỗi ô: giảm kích thước, tăng tính bền với dịch chuyển nhỏ, mở rộng trường tiếp nhận của lớp sau.

## Kiến trúc điển hình
[Conv → ReLU → (Conv → ReLU) → Pool] lặp lại vài lần, rồi làm phẳng (hoặc global average pooling) và một vài lớp dense + softmax. Lớp đầu học cạnh và màu; lớp giữa học kết cấu, chi tiết; lớp sâu học bộ phận và vật thể.

## Huấn luyện
Giống MLP: backpropagation qua phép tích chập (đạo hàm cũng là một phép tích chập). Tăng cường dữ liệu (lật, xoay, cắt, đổi sáng) giúp chống overfitting. Thực tế thường bắt đầu từ mô hình đã học sẵn (xem bài Teachable Machine).

## Ví dụ tính tay
Patch [[1, 2], [3, 4]], kernel [[1, 0], [0, −1]], bias 0:
$$ 1·1 + 2·0 + 3·0 + 4·(−1) = −3   → ReLU → 0
Kích thước: ảnh 8×8, kernel 3×3, stride 1, không padding → (8 − 3)/1 + 1 = 6 → feature map 6×6.
Max pooling 2×2 trên [[1, 3], [2, 0]] → 3.

## Giới hạn của mô phỏng
Kernel trong bài được đặt tay để minh họa phép tính; CNN thật học hàng nghìn bộ lọc từ dữ liệu. Phép "tích chập" trong thư viện học sâu thực chất là tương quan chéo (không lật kernel). Pooling làm mất một phần thông tin vị trí.

## Tự kiểm tra
- Ảnh 8×8, kernel 3×3, stride 1, không padding: feature map kích thước bao nhiêu?
- Vì sao chia sẻ trọng số giúp CNN cần ít dữ liệu hơn MLP cho ảnh?
`,

ATTN: `
Attention (cơ chế chú ý) cho phép mỗi phần tử trong một chuỗi "nhìn" vào mọi phần tử khác và tự quyết định nên lấy bao nhiêu thông tin từ mỗi phần tử. Đây là thành phần trung tâm của Transformer.

## Query, Key, Value
Mỗi token có vector x được chiếu thành ba vector:
$$ q = x·W_Q    k = x·W_K    v = x·W_V
Hình dung như tra cứu: query là câu hỏi, key là nhãn của từng ô, value là nội dung ô. Độ khớp q·k cho biết nên đọc ô nào nhiều.

## Scaled dot-product attention
$$ Attention(Q, K, V) = softmax( Q·Kᵀ / √d_k ) · V
1. Tính điểm số giữa mọi cặp (i, j): sᵢⱼ = qᵢ·kⱼ.
2. Chia √d_k để điểm số không quá lớn khi số chiều lớn (tránh softmax bão hòa, gradient gần 0).
3. Softmax theo từng hàng → trọng số αᵢⱼ ≥ 0, tổng bằng 1.
4. Đầu ra của token i là trung bình có trọng số các value: Σⱼ αᵢⱼ·vⱼ.

## Softmax và nhiệt độ
softmax(s)ⱼ = e^(sⱼ) / Σ e^(sₖ). Chênh lệch điểm số lớn → trọng số dồn gần hết vào một token (chú ý "sắc"); chênh lệch nhỏ → trải đều.

## Causal mask
Khi sinh văn bản, token i không được nhìn các token sau nó. Gán điểm −∞ cho mọi j > i trước softmax, nên trọng số tương ứng bằng 0. Ma trận attention thành tam giác dưới.

## Multi-head attention
Chạy h phép attention song song với các W_Q, W_K, W_V khác nhau (mỗi head số chiều d/h), nối kết quả và chiếu lại. Mỗi head có thể học một kiểu quan hệ: cú pháp, đồng tham chiếu, vị trí gần…

## Vì sao thay được RNN
- Mọi cặp token nối trực tiếp: phụ thuộc xa không phải truyền qua nhiều bước.
- Tính song song cho cả chuỗi khi huấn luyện.
- Đổi lại chi phí O(n²) theo độ dài chuỗi n.

## Thông tin vị trí
Attention tự nó không biết thứ tự (hoán vị đầu vào thì đầu ra hoán vị theo). Cần cộng **positional encoding** (sin/cos hoặc học được) vào embedding.

## Ví dụ tính tay
Một query có điểm số (đã chia √d_k) với hai key là [2; 0]:
$$ softmax([2; 0]) = [e² ; 1] / (e² + 1) ≈ [0,881; 0,119]
Nếu v₁ = [1, 0] và v₂ = [0, 1], đầu ra = 0,881·v₁ + 0,119·v₂ = [0,881; 0,119] — chủ yếu lấy thông tin từ token thứ nhất. Với causal mask, nếu token thứ hai nằm sau query, điểm của nó thành −∞ và trọng số thành 0.

## Đọc bản đồ attention thận trọng
Mỗi hàng là một phân phối (tổng bằng 1). Bản đồ attention giúp quan sát mô hình "nhìn" đâu, nhưng một ô đậm không chứng minh đó là nguyên nhân duy nhất của đầu ra — còn có nhiều head, nhiều lớp và các phần feed-forward.

## Tự kiểm tra
- Nếu mọi key giống hệt nhau, trọng số attention trông thế nào?
- Vì sao chia √d_k quan trọng khi d_k = 512?
`,

GPT: `
GPT là mô hình ngôn ngữ dạng **Transformer chỉ có decoder**, học dự đoán token tiếp theo. Bài này huấn luyện một phiên bản rất nhỏ trên vài câu để thấy đủ các thành phần.

## Mục tiêu huấn luyện
Với chuỗi token t₁…t_n, tối đa hóa xác suất mỗi token khi biết các token trước:
$$ L = − Σᵢ log P(tᵢ | t₁, …, tᵢ₋₁)
Mọi vị trí trong chuỗi được huấn luyện cùng lúc nhờ causal mask. Không cần nhãn thủ công: văn bản tự làm nhãn cho chính nó (tự giám sát).

## Token hóa và embedding
Văn bản → token (ký tự, từ, hoặc mảnh từ BPE) → chỉ số → vector embedding học được. Cộng thêm embedding vị trí.

## Một khối Transformer
$$ h = x + MultiHeadAttention(LayerNorm(x))     (có causal mask)
$$ out = h + FeedForward(LayerNorm(h))
- **Feed-forward**: MLP 2 lớp áp dụng riêng cho từng vị trí (thường mở rộng ×4 rồi thu lại).
- **Kết nối tắt (residual)**: giúp gradient chảy qua nhiều khối.
- **LayerNorm**: chuẩn hóa từng vector, ổn định huấn luyện.
Mô hình lớn chồng hàng chục khối; cuối cùng là lớp tuyến tính + softmax trên toàn bộ từ vựng.

## Sinh văn bản
1. Đưa prompt vào, lấy phân phối xác suất cho token tiếp theo.
2. Chọn một token (greedy, hoặc lấy mẫu với temperature / top-k / top-p).
3. Nối token vào chuỗi, lặp lại.
Mô hình sinh tự hồi quy: mỗi bước phụ thuộc mọi token đã sinh.

## Mô hình nhỏ dạy được gì
Trên vài câu, mô hình nhanh chóng **thuộc lòng** dữ liệu: loss train gần 0, sinh lại đúng câu đã thấy. Đây là overfitting rõ rệt — mô hình thật cần lượng văn bản khổng lồ để khái quát hóa. Xem bản đồ attention đã học để thấy token nào "nhìn" token nào.

## Từ GPT đến trợ lý trò chuyện
Tiền huấn luyện (dự đoán token) → tinh chỉnh có giám sát trên hội thoại mẫu → học từ phản hồi của con người (RLHF) hoặc các phương pháp tương tự để mô hình hữu ích và an toàn hơn.

## Ví dụ: đầu vào và nhãn lệch một bước
Chuỗi A B C D → đầu vào A B C, nhãn B C D. Vị trí 1 học "sau A là B", vị trí 2 học "sau A B là C"… Mọi vị trí học cùng lúc nhờ causal mask.

## Trôi chảy không có nghĩa là đúng
Câu sinh ra hợp ngữ pháp chưa chắc đúng nội dung. Với dữ liệu nhỏ, mô hình dễ lặp lại nguyên văn câu đã thấy. Chỉ dùng văn bản tự tạo hoặc được phép sử dụng, không đưa thông tin cá nhân vào dữ liệu huấn luyện.

## Tự kiểm tra
- Vì sao bỏ causal mask khi huấn luyện sẽ cho loss thấp giả tạo?
- Một mô hình có loss train 0,01 trên 5 câu có phải là mô hình ngôn ngữ tốt?
`,

AE: `
Autoencoder là mạng nơ-ron học **nén** dữ liệu xuống một biểu diễn nhỏ rồi **dựng lại** dữ liệu gốc từ biểu diễn đó. Nó học không giám sát: đích của đầu ra chính là đầu vào.

## Cấu trúc
$$ z = encoder(x)      x̂ = decoder(z)
z nằm ở **bottleneck** (nút cổ chai) có ít chiều hơn x. Vì phải đi qua chỗ hẹp, mạng buộc phải giữ lại những gì quan trọng nhất để dựng lại.

## Hàm mất mát
$$ L = (1/n) Σᵢ ‖xᵢ − x̂ᵢ‖²   (lỗi tái dựng MSE)
Với dữ liệu nhị phân có thể dùng cross-entropy.

## Liên hệ với PCA
Autoencoder tuyến tính (không hàm kích hoạt), loss MSE, học được cùng không gian con với PCA. Với lớp ẩn phi tuyến (tanh, ReLU), autoencoder nén được dữ liệu nằm trên **mặt cong** mà PCA không làm được.

## Ứng dụng
- **Giảm chiều / trực quan hóa**: dùng z (2–3 chiều) để vẽ dữ liệu.
- **Phát hiện bất thường**: học trên dữ liệu bình thường; điểm có lỗi tái dựng cao là điểm "lạ". Ngưỡng thường chọn theo phân vị (ví dụ 95%) lỗi trên train.
- **Khử nhiễu** (denoising autoencoder): đầu vào bị làm nhiễu, đích là bản sạch.
- **Tiền huấn luyện đặc trưng** cho bài toán có ít nhãn.

## Kích thước bottleneck
Quá nhỏ: mất thông tin, lỗi tái dựng cao. Quá lớn (≥ số chiều vào): mạng có thể học hàm đồng nhất, chép nguyên đầu vào mà không học được cấu trúc. Chọn bằng lỗi tái dựng trên validation.

## Hạn chế
Không gian z của autoencoder thường không đều: lấy một z ngẫu nhiên rồi giải mã có thể ra dữ liệu vô nghĩa. Muốn **sinh** dữ liệu mới, dùng VAE.

## Ví dụ tính tay
Đầu vào [2, 4], tái dựng [3, 3]: sai số bình phương từng biến 1 và 1 → MSE = 1. Lỗi phụ thuộc thang đo, nên dữ liệu cần được chuẩn hóa trước khi so lỗi giữa các biến.

## Lỗi lớn chưa chắc là bất thường
Lỗi tái dựng cao có thể do mô hình chưa học đủ, bottleneck quá nhỏ, thang đo lệch, hoặc dữ liệu khác phân bố. Nó gợi ý dòng cần xem lại, không phải kết luận (và không phải chẩn đoán).

## Tự kiểm tra
- Vì sao lỗi tái dựng cao gợi ý điểm bất thường, nhưng không chứng minh dữ liệu sai?
- Autoencoder có bottleneck 1 chiều dựng lại dữ liệu 2 chiều thì các điểm tái dựng nằm trên hình gì?
`,

VAE: `
VAE (Variational Autoencoder) là autoencoder **xác suất**: encoder không trả về một điểm z mà trả về một phân phối, và không gian ẩn được ép gần phân phối chuẩn để có thể lấy mẫu sinh dữ liệu mới.

## Encoder ra phân phối
$$ q(z | x) = N( μ(x), σ²(x) )
Encoder dự đoán μ và log σ² cho mỗi chiều ẩn.

## Reparameterization trick
Lấy mẫu z ngẫu nhiên thì không lan truyền ngược được. Viết lại:
$$ z = μ + σ ⊙ ε,    ε ~ N(0, I)
Ngẫu nhiên nằm ở ε, còn μ và σ vẫn có gradient.

## Hàm mất mát (ELBO âm)
$$ L = E[ ‖x − decoder(z)‖² ] + β · KL( N(μ, σ²) ‖ N(0, I) )
$$ KL = −½ Σⱼ (1 + log σⱼ² − μⱼ² − σⱼ²)
- **Tái dựng**: muốn x̂ giống x.
- **KL**: kéo mọi phân phối q(z|x) về gần N(0, I), làm không gian ẩn liền mạch và không có lỗ hổng.

## Đánh đổi theo β
- β nhỏ: tái dựng tốt nhưng không gian ẩn rời rạc, sinh mẫu kém.
- β lớn: không gian ẩn đều đặn, dễ sinh và nội suy, nhưng tái dựng mờ; quá lớn thì mô hình bỏ qua z (posterior collapse: KL → 0).
- β > 1 (β-VAE) đôi khi giúp các chiều ẩn tách bạch ý nghĩa hơn.

## Sinh dữ liệu mới
Lấy z ~ N(0, I) và giải mã: x_mới = decoder(z). Nội suy giữa hai điểm trong không gian z cho chuỗi dữ liệu biến đổi mượt.

## So với autoencoder thường
Autoencoder: z là điểm, không gian ẩn có thể lổn nhổn. VAE: z là vùng, được điều chuẩn → dùng làm mô hình sinh. Đổi lại, tái dựng của VAE thường kém hơn một chút.

## Kiểm tra dữ liệu sinh
So trung bình, độ lệch chuẩn, phân bố và tương quan giữa dữ liệu thật và sinh. Dữ liệu sinh là tổng hợp: không dùng thay dữ liệu thật để rút kết luận, và cẩn thận với rò rỉ thông tin cá nhân khi mô hình học thuộc.

## Ví dụ tính tay
μ = 2, σ = 0,5, lấy được ε = −1:
$$ z = μ + σ·ε = 2 + 0,5·(−1) = 1,5
KL của chiều ẩn này so với N(0, 1):
$$ KL = −½ (1 + ln 0,25 − 2² − 0,25) ≈ 2,32
Nếu μ = 0 và σ = 1 thì KL = 0 — phân phối trùng với N(0, 1).

## Tự kiểm tra
- Nếu bỏ hạng tử KL, VAE trở thành gì?
- Vì sao cần reparameterization trick?
`,

GAN: `
GAN (Generative Adversarial Network) gồm hai mạng thi đấu với nhau: **generator** G cố tạo dữ liệu giả giống thật, **discriminator** D cố phân biệt thật với giả.

## Trò chơi minimax
$$ min_G max_D  E[log D(x)] + E[log(1 − D(G(z)))]
- D nhận dữ liệu thật x (nhãn 1) và dữ liệu giả G(z) (nhãn 0), học như một bộ phân loại.
- G nhận nhiễu z ~ N(0, I), cố làm D trả về 1 cho dữ liệu giả.

## Huấn luyện xen kẽ
1. Cố định G, cập nhật D vài bước để phân biệt tốt hơn.
2. Cố định D, cập nhật G để đánh lừa D (thường tối đa log D(G(z)) — dạng "non-saturating" cho gradient mạnh hơn lúc đầu).
3. Lặp lại.
Ở điểm cân bằng lý tưởng, phân phối của G trùng phân phối dữ liệu và D đoán 0,5 cho mọi mẫu.

## Đọc đường loss
Khác bài toán thông thường, loss của GAN không giảm đều: hai mạng kéo co. Loss D quá nhỏ (D thắng tuyệt đối) → gradient cho G biến mất. Cần nhìn trực tiếp mẫu sinh ra và so phân bố, không chỉ nhìn loss.

## Khó khăn thường gặp
- **Mode collapse**: G chỉ sinh vài kiểu mẫu đánh lừa được D, bỏ qua phần còn lại của phân phối (ví dụ dữ liệu có hai đỉnh, G chỉ sinh một đỉnh).
- Không hội tụ, dao động.
- Nhạy với tốc độ học và kiến trúc. Các biến thể như WGAN, spectral normalization giúp ổn định hơn.

## So sánh mô hình sinh
- VAE: ổn định, có encoder, mẫu thường mờ hơn.
- GAN: mẫu sắc nét, huấn luyện khó.
- Diffusion: chất lượng cao và ổn định, nhưng sinh chậm (nhiều bước khử nhiễu).

## Tự kiểm tra
- Nếu D quá mạnh ngay từ đầu, G học được gì?
- Làm sao nhận ra mode collapse trên dữ liệu 1 chiều có hai đỉnh?
`,

DIFF: `
Mô hình khuếch tán (diffusion) sinh dữ liệu bằng cách học **đảo ngược** một quá trình thêm nhiễu dần dần. Bài này mô phỏng chiều thuận — quá trình thêm nhiễu — để hiểu nền tảng.

## Quá trình thuận
Bắt đầu từ dữ liệu x₀, mỗi bước thêm một chút nhiễu Gauss theo lịch βₜ (tăng dần, ví dụ từ 10⁻⁴ đến 0,02):
$$ q(xₜ | xₜ₋₁) = N( √(1 − βₜ) · xₜ₋₁, βₜ · I )
Sau T bước (vài trăm đến nghìn), xₜ gần như nhiễu chuẩn thuần túy.

## Nhảy thẳng tới bước t
Đặt αₜ = 1 − βₜ và ᾱₜ = α₁·α₂·…·αₜ. Có công thức đóng:
$$ xₜ = √ᾱₜ · x₀ + √(1 − ᾱₜ) · ε,    ε ~ N(0, I)
√ᾱₜ là phần tín hiệu còn lại, √(1 − ᾱₜ) là phần nhiễu. ᾱₜ giảm từ ~1 về ~0 theo t.

## Quá trình ngược (sinh dữ liệu)
Huấn luyện một mạng ε_θ(xₜ, t) (thường là U-Net) dự đoán nhiễu ε đã được thêm vào:
$$ L = E[ ‖ε − ε_θ(√ᾱₜ·x₀ + √(1−ᾱₜ)·ε, t)‖² ]
Khi sinh: bắt đầu từ nhiễu x_T ~ N(0, I), lặp từ t = T về 1, mỗi bước dùng ε_θ để bỏ bớt một phần nhiễu (cộng thêm một chút nhiễu ngẫu nhiên), cuối cùng thu được x₀ mới.

## Vì sao hiệu quả
Mỗi bước khử nhiễu là một bài toán hồi quy đơn giản và ổn định — không có trò chơi đối kháng như GAN. Chất lượng và độ đa dạng mẫu cao. Đổi lại cần nhiều bước khi sinh; các kỹ thuật như DDIM hay khuếch tán trong không gian ẩn (latent diffusion, Stable Diffusion) giảm chi phí.

## Điều kiện hóa
Đưa thêm văn bản (qua embedding) vào mạng khử nhiễu để sinh ảnh theo mô tả. "Classifier-free guidance" trộn dự đoán có và không có điều kiện để bám sát mô tả hơn.

## Ví dụ tính tay
Ở bước t có ᾱₜ = 0,64 → √ᾱₜ = 0,8 và √(1 − ᾱₜ) = 0,6. Với x₀ = 1 và ε = −0,5:
$$ xₜ = 0,8·1 + 0,6·(−0,5) = 0,5
Tín hiệu còn 80% "độ lớn", nhiễu chiếm 60%. Khi ᾱₜ = 1 dữ liệu còn nguyên; khi ᾱₜ gần 0, gần như chỉ còn nhiễu.

## Tự kiểm tra
- Khi t = 0 và t = T, xₜ trông thế nào?
- Vì sao mạng chỉ cần dự đoán nhiễu thay vì dự đoán thẳng ảnh sạch?
`,
};
