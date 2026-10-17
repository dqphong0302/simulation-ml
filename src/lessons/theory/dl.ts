/** Lý thuyết mở rộng: cơ chế deep learning, không phải chỉ dẫn lâm sàng. */
export const DL_THEORY: Record<string, string> = {
MLP: `
MLP là mạng các lớp tính toán nối nhau. Nó học quan hệ phi tuyến nhưng không mô phỏng đầy đủ tế bào thần kinh hay sinh lý bệnh.
## Một lớp và phi tuyến
$$ z = Wx + b; a = f(z)
ReLU(z)=max(0,z) là một lựa chọn phổ biến. Nếu mọi lớp chỉ là phép affine, ghép chúng vẫn là phép affine; chiều sâu khi đó không tạo ranh giới phi tuyến.
Sigmoid phù hợp cho đầu ra nhị phân; softmax cho các lớp loại trừ nhau. Các đầu ra cần calibration nếu muốn diễn giải xác suất ở quần thể cụ thể.
## Huấn luyện
Forward tính đầu ra, loss so với nhãn, backprop dùng quy tắc dây chuyền để tính gradient.
$$ W ← W − η ∂L/∂W
Learning rate quá lớn có thể dao động; quá nhỏ chậm. Adam không luôn tốt nhất. Cross-entropy phạt dự báo tự tin sai, nhưng không tự mô hình hóa hậu quả lâm sàng.
## Overfitting
Theo dõi validation, dùng patience cho early stopping; không nhất thiết dừng ngay một lần loss tăng. L2, dropout và kiến trúc nhỏ hơn là các lựa chọn cần kiểm tra, không bảo đảm an toàn.
## Liên hệ y khoa
Loss train thấp với loss validation cao gợi ý overfitting hoặc khác biệt dữ liệu; chưa xác định nguyên nhân. Leakage thường làm điểm validation đẹp giả nên cũng phải kiểm tra thiết kế, không suy ra leakage chỉ từ khoảng cách loss. Khả năng xấp xỉ hàm không bảo đảm học được hàm hữu ích từ ít bệnh nhân.

## Thực hành có giới hạn
Giữ dữ liệu và seed, chỉ thay một cấu hình rồi ghi điều quan sát được. Tách người/nguồn phù hợp nếu dữ liệu đo lặp; tiền xử lý và lựa chọn cấu hình phải nằm trong train/validation. Kiểm tra ở thời gian, thiết bị hoặc bệnh viện mới trước khi kết luận khả năng chuyển bối cảnh.
Ví dụ đồ chơi giúp hiểu phép tính, chưa chứng minh lợi ích chăm sóc bệnh nhân. Không dùng đầu ra như chẩn đoán hoặc y lệnh; không đưa hồ sơ người thật vào notebook học tập.
## Nguồn nền tảng
- Attention: https://arxiv.org/abs/1706.03762
- VAE: https://arxiv.org/abs/1312.6114
- Diffusion: https://arxiv.org/abs/2006.11239
`,

CNN: `
CNN dùng bộ lọc chia sẻ trọng số để xử lý cấu trúc cục bộ của ảnh. Lab này minh họa convolution, ReLU và pooling; không huấn luyện một bộ chẩn đoán.
## Phép tính
$$ S(i,j) = ΣₘΣₙ I(i+m,j+n)K(m,n)+b
Công thức kiểu cross-correlation này thường được thư viện gọi convolution. Kernel có thể đặt tay trong lab hoặc học khi huấn luyện mạng. Không giả định mỗi tầng tự nhận đúng cấu trúc giải phẫu.
## Kích thước
Với dilation = 1:
$$ N_out = ⌊(N+2p−k)/s⌋+1
Stride s làm thưa vị trí tính; padding p xử lý biên. Max pooling 2×2 với stride 2 giữ một giá trị mỗi vùng, giảm chiều không gian nhưng có thể mất chi tiết nhỏ.
Convolution thường có tính tương đương theo dịch chuyển trong điều kiện phù hợp, không bảo đảm toàn mạng bất biến với mọi dịch chuyển. CT/MRI có thể dùng xử lý 2D, 2.5D hoặc 3D, không bắt buộc luôn 3D.
## Grad-CAM và giới hạn
Grad-CAM tạo bản đồ liên quan của điểm lớp với feature map. Vùng sáng không tự chứng minh tổn thương hay quan hệ nhân quả; bản đồ có thể thô, thiếu ổn định. Cần khảo sát lối tắt và đánh giá độc lập.
## Liên hệ y khoa
Kiểm tra theo bệnh nhân, thiết bị và bệnh viện; ảnh cùng người không nên nằm cả train/test khi hỏi khả năng trên người mới. Ảnh nhìn sắc nét hơn chưa chứng minh giữ đúng tổn thương.

## Thực hành có giới hạn
Giữ dữ liệu và seed, chỉ thay một cấu hình rồi ghi điều quan sát được. Tách người/nguồn phù hợp nếu dữ liệu đo lặp; tiền xử lý và lựa chọn cấu hình phải nằm trong train/validation. Kiểm tra ở thời gian, thiết bị hoặc bệnh viện mới trước khi kết luận khả năng chuyển bối cảnh.
Ví dụ đồ chơi giúp hiểu phép tính, chưa chứng minh lợi ích chăm sóc bệnh nhân. Không dùng đầu ra như chẩn đoán hoặc y lệnh; không đưa hồ sơ người thật vào notebook học tập.
## Nguồn nền tảng
- Attention: https://arxiv.org/abs/1706.03762
- VAE: https://arxiv.org/abs/1312.6114
- Diffusion: https://arxiv.org/abs/2006.11239
`,

ATTN: `
Attention trộn các vector value theo trọng số được tính từ query và key. Nó là phép tính biểu diễn, không phải thước đo lý do lâm sàng.
## Công thức
$$ Attention(Q,K,V)=softmax(QKᵀ/√d_k)V
Softmax theo hàng cho trọng số không âm, tổng hàng bằng 1. Q, K, V thường là các phép chiếu đã học. Lab dùng embedding đồ chơi và trọng số ngẫu nhiên; không diễn giải các ô như mô hình hiểu bệnh sử.
## Mask và thời gian
Causal mask đặt điểm token tương lai thành −∞ trước softmax, chặn truy cập vị trí đó. Nó ngăn nhìn tương lai trong phép tính này, không chứng minh nhân quả và không sửa mọi leakage trong dữ liệu.
Với bệnh sử, phải xác định thông tin thật sự có sẵn tại mốc dự đoán; thời điểm xét nghiệm trả kết quả có thể khác thời điểm lấy mẫu.
## Nhiều head và vị trí
Các head là các phép chiếu khác nhau rồi ghép lại; không mặc định head 1 theo thuốc, head 2 theo huyết áp. Positional information giúp phân biệt thứ tự; mã vị trí token không tự đo khoảng ngày/giờ giữa lần khám.
## Liên hệ y khoa
Attention vào creatinine không tự chứng minh cơ chế tim-thận. Cần khảo sát tính ổn định và các phương pháp kiểm tra khác. Không mặc định attention tốt hơn LSTM cho mọi bài toán ICU.

## Thực hành có giới hạn
Giữ dữ liệu và seed, chỉ thay một cấu hình rồi ghi điều quan sát được. Tách người/nguồn phù hợp nếu dữ liệu đo lặp; tiền xử lý và lựa chọn cấu hình phải nằm trong train/validation. Kiểm tra ở thời gian, thiết bị hoặc bệnh viện mới trước khi kết luận khả năng chuyển bối cảnh.
Ví dụ đồ chơi giúp hiểu phép tính, chưa chứng minh lợi ích chăm sóc bệnh nhân. Không dùng đầu ra như chẩn đoán hoặc y lệnh; không đưa hồ sơ người thật vào notebook học tập.
## Nguồn nền tảng
- Attention: https://arxiv.org/abs/1706.03762
- VAE: https://arxiv.org/abs/1312.6114
- Diffusion: https://arxiv.org/abs/2006.11239
`,

GPT: `
Transformer kiểu decoder học dự báo token tiếp theo rồi sinh nối tiếp. GPT nhỏ trong lab/notebook minh họa cơ chế, không phải chuyên gia y khoa.
## Mục tiêu ngôn ngữ
$$ L = −Σᵢ log P(tᵢ | t₁,…,tᵢ₋₁)
Token là đơn vị mã hóa, không luôn là một từ. Dữ liệu pretraining có thể nhiều miền; không giả định mọi GPT được học trên bệnh án. Loss thấp chỉ đo phù hợp tác vụ token trên tập đo.
## Một khối decoder
Causal attention trộn biểu diễn quá khứ; FFN biến đổi từng vị trí. Residual và normalization giúp tối ưu.
$$ h = x + Attention(LayerNorm(x))
$$ out = h + FFN(LayerNorm(h))
Đây là một dạng pre-norm, không phải cấu trúc duy nhất. FFN không phải kho chân lý y khoa có thể đọc trực tiếp.
## Sinh và lấy mẫu
Tạo phân phối token, chọn token, nối vào ngữ cảnh và lặp. Temperature đổi phân phối lấy mẫu, không calibration nguy cơ bệnh. Instruction tuning/RLHF có thể định hướng hành vi nhưng không bảo đảm kiến thức đúng hay từ chối đầy đủ.
## Liên hệ y khoa
Mô hình có thể học thuộc thông tin nhạy cảm. Khử định danh và các kỹ thuật privacy cần thiết kế/đánh giá; không bảo đảm tuyệt đối. Không huấn luyện thử bằng bệnh án thật. Nội dung tóm tắt phải đối chiếu nguồn để phát hiện bỏ sót hoặc thêm thông tin.

## Thực hành có giới hạn
Giữ dữ liệu và seed, chỉ thay một cấu hình rồi ghi điều quan sát được. Tách người/nguồn phù hợp nếu dữ liệu đo lặp; tiền xử lý và lựa chọn cấu hình phải nằm trong train/validation. Kiểm tra ở thời gian, thiết bị hoặc bệnh viện mới trước khi kết luận khả năng chuyển bối cảnh.
Ví dụ đồ chơi giúp hiểu phép tính, chưa chứng minh lợi ích chăm sóc bệnh nhân. Không dùng đầu ra như chẩn đoán hoặc y lệnh; không đưa hồ sơ người thật vào notebook học tập.
## Nguồn nền tảng
- Attention: https://arxiv.org/abs/1706.03762
- VAE: https://arxiv.org/abs/1312.6114
- Diffusion: https://arxiv.org/abs/2006.11239
`,

AE: `
Autoencoder học tái dựng đầu vào qua biểu diễn latent. Nó dùng cho nén, khử nhiễu hoặc nghiên cứu phát hiện bất thường, không chỉ dành cho dữ liệu “bình thường”.
## Encoder và decoder
$$ z = f_enc(x); x̂ = f_dec(z)
$$ L = (1/n)Σᵢ‖xᵢ−x̂ᵢ‖²
Bottleneck nhỏ hạn chế thông tin; mạng lớn có thể gần sao chép đầu vào. Tái dựng tốt không chứng minh latent mang ý nghĩa bệnh học.
## Phát hiện bất thường
Một cách là fit dữ liệu tham chiếu rồi dùng reconstruction error như điểm bất thường. Mẫu bệnh có thể vẫn được tái dựng tốt; mẫu không bệnh khác máy đo có thể lỗi cao. Cần validation có định nghĩa nhãn phù hợp để đánh giá FN và FP.
Ngưỡng phân vị 95 hoặc 99 chỉ là lựa chọn thống kê, không “ngưỡng an toàn” cấp cứu.
## Denoising
Huấn luyện đầu vào bị nhiễu x̃ nhưng đích là x. Nhiễu giả phải phù hợp mục tiêu. Không bảo đảm bộ lọc giữ mọi chi tiết ECG hoặc không xóa tín hiệu hữu ích.
## Liên hệ y khoa
Điện cực tuột có thể làm error tăng, không tự phân biệt lỗi thiết bị với loạn nhịp. MSE thấp không tự chứng minh cảnh báo hữu ích; cần đo sai sót, thời gian phát hiện và đánh giá quy trình. Reconstruction error là điểm số, không phải xác suất; chỉ khi chuyển thành xác suất mới đặt câu hỏi calibration của xác suất đó.

## Thực hành có giới hạn
Giữ dữ liệu và seed, chỉ thay một cấu hình rồi ghi điều quan sát được. Tách người/nguồn phù hợp nếu dữ liệu đo lặp; tiền xử lý và lựa chọn cấu hình phải nằm trong train/validation. Kiểm tra ở thời gian, thiết bị hoặc bệnh viện mới trước khi kết luận khả năng chuyển bối cảnh.
Ví dụ đồ chơi giúp hiểu phép tính, chưa chứng minh lợi ích chăm sóc bệnh nhân. Không dùng đầu ra như chẩn đoán hoặc y lệnh; không đưa hồ sơ người thật vào notebook học tập.
## Nguồn nền tảng
- Attention: https://arxiv.org/abs/1706.03762
- VAE: https://arxiv.org/abs/1312.6114
- Diffusion: https://arxiv.org/abs/2006.11239
`,

VAE: `
VAE học mô hình tạo sinh với phân phối latent xấp xỉ. Nó có thể sinh dữ liệu tổng hợp, nhưng không bảo vệ tuyệt đối quyền riêng tư hoặc bảo đảm sinh học.
## Posterior và tái tham số
$$ q(z|x)=N(μ(x),diag(σ²(x)))
$$ z = μ + σ⊙ε; ε ~ N(0,I)
Encoder dự đoán μ và log-variance; độ phân tán latent không tự là độ bất định sinh học của bệnh nhân.
## ELBO
Với β=1, negative ELBO gồm reconstruction negative log-likelihood và KL. β khác 1 tạo mục tiêu β-VAE, không còn đúng negative ELBO chuẩn:
$$ L = E_q[−log p(x|z)] + β KL(q(z|x)‖p(z))
$$ KL = −½Σⱼ(1 + log σⱼ² − μⱼ² − σⱼ²)
MSE là lựa chọn tương ứng giả định Gaussian với cách scale phù hợp, không công thức ELBO chung cho mọi dữ liệu. β thay đổi đánh đổi; KL không bảo đảm latent không có vùng sinh mẫu vô nghĩa.
## Sinh và đánh giá
Lấy z từ prior rồi decode. Kiểm tra phạm vi, tương quan, độ đa dạng và hiệu năng downstream trên dữ liệu độc lập. Nội suy latent không tự mô phỏng tiến triển bệnh theo thời gian.
## Quyền riêng tư và y khoa
Mẫu sinh có thể gần train hoặc làm lộ thông tin. “Synthetic” không tự tuân thủ HIPAA/GDPR; quy định phụ thuộc phạm vi áp dụng, quy trình và rủi ro. Cần kiểm tra memorization và tái nhận diện trước chia sẻ, không dùng bệnh án thật trong lab.

## Thực hành có giới hạn
Giữ dữ liệu và seed, chỉ thay một cấu hình rồi ghi điều quan sát được. Tách người/nguồn phù hợp nếu dữ liệu đo lặp; tiền xử lý và lựa chọn cấu hình phải nằm trong train/validation. Kiểm tra ở thời gian, thiết bị hoặc bệnh viện mới trước khi kết luận khả năng chuyển bối cảnh.
Ví dụ đồ chơi giúp hiểu phép tính, chưa chứng minh lợi ích chăm sóc bệnh nhân. Không dùng đầu ra như chẩn đoán hoặc y lệnh; không đưa hồ sơ người thật vào notebook học tập.
## Nguồn nền tảng
- Attention: https://arxiv.org/abs/1706.03762
- VAE: https://arxiv.org/abs/1312.6114
- Diffusion: https://arxiv.org/abs/2006.11239
`,

GAN: `
GAN gồm generator và discriminator học đối kháng. Discriminator phân biệt mẫu train với mẫu sinh, không phải bác sĩ xác thực giải phẫu.
## Mục tiêu cổ điển
$$ min_G max_D E_x[log D(x)] + E_z[log(1−D(G(z)))]
D cố phân biệt; G cố làm mẫu sinh được D xem như train. Các phiên bản hiện đại có thể dùng loss khác. D≈0,5 chưa tự chứng minh mẫu hoàn hảo: D cũng có thể yếu hoặc chưa học.
## Huấn luyện và đa dạng
Luân phiên cập nhật hai mạng. Mất cân bằng có thể gây gradient khó học; không yêu cầu hai mạng luôn có năng lực bằng nhau. Mode collapse sinh ít kiểu mẫu, bỏ sót phần phân phối.
Đánh giá cần cả độ đa dạng và độ phù hợp, không chỉ một đường loss.
## Liên hệ y khoa
Ảnh sinh hoặc được nâng độ phân giải có thể thêm/xóa chi tiết. CycleGAN có thể dùng nghiên cứu chuyển miền không cần cặp ảnh, nhưng cycle consistency không bảo đảm giữ tổn thương hoặc mật độ mô.
## Tự suy nghĩ
So histogram thật và sinh cho dữ liệu hai đỉnh. Nếu chỉ giữ một đỉnh thì loss đẹp chưa đủ. Không dùng ảnh tổng hợp như ảnh bệnh nhân gốc; cần ghi nguồn và kiểm tra task-specific, phân nhóm, privacy.

## Thực hành có giới hạn
Giữ dữ liệu và seed, chỉ thay một cấu hình rồi ghi điều quan sát được. Tách người/nguồn phù hợp nếu dữ liệu đo lặp; tiền xử lý và lựa chọn cấu hình phải nằm trong train/validation. Kiểm tra ở thời gian, thiết bị hoặc bệnh viện mới trước khi kết luận khả năng chuyển bối cảnh.
Ví dụ đồ chơi giúp hiểu phép tính, chưa chứng minh lợi ích chăm sóc bệnh nhân. Không dùng đầu ra như chẩn đoán hoặc y lệnh; không đưa hồ sơ người thật vào notebook học tập.
## Nguồn nền tảng
- Attention: https://arxiv.org/abs/1706.03762
- VAE: https://arxiv.org/abs/1312.6114
- Diffusion: https://arxiv.org/abs/2006.11239
`,

DIFF: `
Diffusion học quá trình tạo sinh bằng cách làm nhiễu dữ liệu rồi học bước đảo ngược. Ví dụ web thêm nhiễu chỉ minh họa forward process, không chứng minh phục hồi bệnh lý.
## Quá trình thuận
$$ q(x_t|x_(t−1))=N(√(1−β_t)x_(t−1),β_t I)
$$ x_t=√ᾱ_t x₀ + √(1−ᾱ_t)ε; ε~N(0,I)
Với α_t=1−β_t, ᾱ_t là tích các α. Khi tín hiệu đủ nhỏ, x_T xấp xỉ nhiễu chuẩn; không luôn mất chính xác mọi thông tin sau một số bước cố định.
## Học dự đoán nhiễu
$$ L=E[‖ε−ε_θ(x_t,t)‖²]
Đây là một mục tiêu thường dùng, không nghĩa luôn dự đoán chính xác nhiễu. Reverse process học phân phối chứ không bảo đảm khôi phục đúng ảnh gốc từ noise không điều kiện.
## Conditioning và lấy mẫu
Điều kiện hóa và guidance định hướng mẫu nhưng không bảo đảm đúng giải phẫu. DDIM hoặc latent diffusion có thể giảm chi phí; chất lượng phụ thuộc lịch, model, dữ liệu và số bước, không có số bước 20–50 bảo toàn mọi chi tiết.
## Liên hệ y khoa
Nghiên cứu khử nhiễu CT/MRI phải kiểm tra consistency với đo gốc, tổn thương nhỏ, sai sót và nhóm người. Ảnh đẹp không đồng nghĩa chính xác; mô hình có thể thiếu đa dạng, học lệch hoặc bịa chi tiết. Không cam kết giảm liều hoặc tăng tốc khám từ demo này.

## Thực hành có giới hạn
Giữ dữ liệu và seed, chỉ thay một cấu hình rồi ghi điều quan sát được. Tách người/nguồn phù hợp nếu dữ liệu đo lặp; tiền xử lý và lựa chọn cấu hình phải nằm trong train/validation. Kiểm tra ở thời gian, thiết bị hoặc bệnh viện mới trước khi kết luận khả năng chuyển bối cảnh.
Ví dụ đồ chơi giúp hiểu phép tính, chưa chứng minh lợi ích chăm sóc bệnh nhân. Không dùng đầu ra như chẩn đoán hoặc y lệnh; không đưa hồ sơ người thật vào notebook học tập.
## Nguồn nền tảng
- Attention: https://arxiv.org/abs/1706.03762
- VAE: https://arxiv.org/abs/1312.6114
- Diffusion: https://arxiv.org/abs/2006.11239
`,
};
