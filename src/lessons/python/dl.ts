import { SCIENCE, TORCH, type PythonLesson, type PythonStep } from './types';
const torchSetup: PythonStep = { title: 'Chuẩn bị PyTorch trên CPU', explanation: 'Các ví dụ rất nhỏ, không cần GPU. Seed cố định giúp so sánh các lần chạy trên cùng môi trường.', code: `import torch
from torch import nn
torch.manual_seed(42)
torch.set_num_threads(2)` };
const curveData: PythonStep = { title: 'Tạo đường cong 2D', explanation: 'Điểm nằm gần một đường cong một chiều trong không gian hai chiều. Giữ một phần riêng để kiểm tra tái dựng.', code: `t = torch.linspace(-2, 2, 400)
X = torch.stack([t / 2, torch.sin(t)], dim=1) + 0.03 * torch.randn(400, 2)
order = torch.randperm(len(X))
train, test = X[order[:300]], X[order[300:]]` };
export const DL_PYTHON: Record<string, PythonLesson> = {
  CNN: { summary: 'Quan sát convolution và max pooling trực tiếp trên một ảnh nhỏ, trước khi xây dựng mạng CNN lớn.', level: 'Cơ bản', packages: TORCH,
    steps: [torchSetup, { title: 'Ảnh đầu vào và kernel phát hiện biên', explanation: 'Ảnh có một hình vuông sáng. Kernel quét lân cận 3×3, làm nổi các vị trí thay đổi độ sáng.', code: `import torch.nn.functional as F
image = torch.zeros(1, 1, 16, 16)
image[:, :, 4:12, 4:12] = 1
kernel = torch.tensor([[-1., 0., 1.], [-2., 0., 2.], [-1., 0., 1.]]).reshape(1, 1, 3, 3)
feature = F.conv2d(image, kernel, padding=1)
pooled = F.max_pool2d(F.relu(feature), 2)
fig, axes = plt.subplots(1, 3, figsize=(10, 3))
for ax, data, title in zip(axes, [image, feature, pooled], ["Ảnh", "Convolution", "ReLU + Pooling"]):
    ax.imshow(data[0, 0].numpy(), cmap="gray"); ax.set_title(title)
plt.show()
print("Kích thước:", image.shape, feature.shape, pooled.shape)` }], exercises: ['Chuyển kernel sang phát hiện biên ngang bằng transpose.', 'Thử stride=2 và padding=0.'], limitation: 'Kernel đặt bằng tay, chưa huấn luyện mạng phân loại ảnh.' },
  ATTN: { summary: 'Attention tính độ phù hợp giữa query và key, chuẩn hóa bằng softmax rồi trộn các value.', level: 'Cơ bản', packages: SCIENCE,
    steps: [{ title: 'Tính scaled dot-product attention', explanation: 'Chia cho căn bậc hai của số chiều để kiểm soát độ lớn logits. Causal mask ngăn token nhìn token tương lai.', code: `rng = np.random.default_rng(42)
Q, K, V = [rng.normal(size=(4, 3)) for _ in range(3)]
scores = Q @ K.T / np.sqrt(Q.shape[1])
scores[np.triu_indices(4, k=1)] = -np.inf
weights = np.exp(scores - scores.max(axis=1, keepdims=True))
weights /= weights.sum(axis=1, keepdims=True)
output = weights @ V
assert np.allclose(weights.sum(axis=1), 1)
assert np.allclose(np.triu(weights, k=1), 0)
print("Output:", output.round(3))
plt.imshow(weights, vmin=0, vmax=1); plt.colorbar()
plt.xlabel("Key"); plt.ylabel("Query"); plt.show()` }], exercises: ['Bỏ causal mask và so ma trận.', 'Nhân Q với 5 để quan sát độ tập trung của softmax.'], limitation: 'Q/K/V ngẫu nhiên để minh họa phép toán, không phải attention của mô hình đã học.' },
  AE: { summary: 'Autoencoder nén dữ liệu qua bottleneck rồi tái dựng; loss đo độ khác biệt giữa đầu vào và đầu ra.', level: 'Nâng cao', packages: TORCH,
    steps: [torchSetup, curveData, { title: 'Huấn luyện bộ nén 2 → 1 → 2', explanation: 'Học trên train; chỉ dùng test sau khi huấn luyện. Bottleneck buộc mô hình giữ thông tin hữu ích.', code: `encoder = nn.Sequential(nn.Linear(2, 12), nn.Tanh(), nn.Linear(12, 1))
decoder = nn.Sequential(nn.Linear(1, 12), nn.Tanh(), nn.Linear(12, 2))
model = nn.Sequential(encoder, decoder)
optimizer = torch.optim.Adam(model.parameters(), lr=0.02)
losses = []
for epoch in range(250):
    loss = ((model(train) - train) ** 2).mean()
    optimizer.zero_grad(); loss.backward(); optimizer.step()
    losses.append(loss.item())
with torch.no_grad():
    reconstructed = model(test)
print("Test MSE:", ((reconstructed - test) ** 2).mean().item())
plt.plot(losses); plt.title("Training loss"); plt.show()
plt.scatter(*test.numpy().T, label="Gốc")
plt.scatter(*reconstructed.numpy().T, label="Tái dựng", alpha=0.6)
plt.legend(); plt.show()` }], exercises: ['Đổi bottleneck thành 2.', 'Thêm nhiễu vào đầu vào nhưng dùng dữ liệu sạch làm đích.'], limitation: 'Tái dựng tốt không đảm bảo latent có thể sinh mẫu mới hợp lý.' },
  VAE: { summary: 'VAE học phân phối latent, dùng reparameterization để lan truyền gradient và KL để regularize phân phối.', level: 'Nâng cao', packages: TORCH,
    steps: [torchSetup, curveData, { title: 'Học mean, log variance và tái dựng', explanation: 'z = mu + std × noise. Loss gồm MSE tái dựng và beta × KL với chuẩn tắc N(0,1). Đây là phiên bản nhỏ, MSE thay cho mô hình likelihood đầy đủ.', code: `enc = nn.Sequential(nn.Linear(2, 16), nn.Tanh(), nn.Linear(16, 2))
dec = nn.Sequential(nn.Linear(1, 16), nn.Tanh(), nn.Linear(16, 2))
optimizer = torch.optim.Adam(list(enc.parameters()) + list(dec.parameters()), lr=0.01)
beta = 0.02
for epoch in range(300):
    mu, logvar = enc(train).chunk(2, dim=1)
    logvar = logvar.clamp(-8, 8)
    z = mu + torch.exp(0.5 * logvar) * torch.randn_like(mu)
    reconstruction = ((dec(z) - train) ** 2).mean()
    kl = -0.5 * (1 + logvar - mu.square() - logvar.exp()).mean()
    loss = reconstruction + beta * kl
    optimizer.zero_grad(); loss.backward(); optimizer.step()
with torch.no_grad():
    samples = dec(torch.randn(200, 1))
    mu_test, _ = enc(test).chunk(2, dim=1)
    print("Test MSE (dùng mean latent):", ((dec(mu_test) - test) ** 2).mean().item())
plt.scatter(*train.numpy().T, label="Train", alpha=0.3)
plt.scatter(*samples.numpy().T, label="Sinh từ latent", alpha=0.5)
plt.legend(); plt.show()` }], exercises: ['So beta=0, 0.02 và 0.5.', 'Quan sát đánh đổi giữa tái dựng và sinh mẫu.'], limitation: 'VAE 2D nhập môn, không phải mô hình sinh ảnh; kết quả phụ thuộc khởi tạo và hệ số loss.' },
  DIFF: { summary: 'Diffusion thuận dần trộn dữ liệu với nhiễu Gaussian theo lịch beta. Thực hành này chỉ minh họa thêm nhiễu.', level: 'Cơ bản', packages: SCIENCE,
    steps: [{ title: 'Tạo ảnh và lịch nhiễu', explanation: 'alpha_bar là tích các (1-beta) đến thời điểm t. Hệ số này giảm thì tín hiệu gốc yếu dần.', code: `rng = np.random.default_rng(42)
image = np.zeros((28, 28))
image[7:21, 7:21] = 1
x0 = image * 2 - 1
betas = np.linspace(0.0001, 0.02, 500)
alpha_bar = np.cumprod(1 - betas)
noise = rng.normal(size=x0.shape)
fig, axes = plt.subplots(1, 4, figsize=(12, 3))
for ax, t in zip(axes, [0, 50, 200, 499]):
    xt = np.sqrt(alpha_bar[t]) * x0 + np.sqrt(1 - alpha_bar[t]) * noise
    ax.imshow(xt, cmap="gray", vmin=-2, vmax=2); ax.set_title(f"t={t}")
plt.show()` }], exercises: ['Đổi beta cuối từ 0.02 sang 0.005.', 'Sinh noise riêng ở mỗi mốc và so với dùng cùng noise.'], limitation: 'Các hình là mẫu biên tại từng t với cùng noise để dễ so sánh, không phải mô phỏng chuỗi Markov. Chưa học khử nhiễu hay sinh ảnh.' },
  GAN: { summary: 'Generator sinh mẫu giả; discriminator phân biệt thật/giả. Hai mạng được cập nhật luân phiên.', level: 'Nâng cao', packages: TORCH,
    steps: [torchSetup, { title: 'Xây hai mạng và học phân phối 1D', explanation: 'Dữ liệu thật theo N(2,0.5²). Khi học discriminator phải detach mẫu giả; khi học generator cần giữ gradient qua discriminator.', code: `G = nn.Sequential(nn.Linear(1, 16), nn.Tanh(), nn.Linear(16, 1))
D = nn.Sequential(nn.Linear(1, 16), nn.Tanh(), nn.Linear(16, 1))
gopt = torch.optim.Adam(G.parameters(), lr=0.003)
dopt = torch.optim.Adam(D.parameters(), lr=0.003)
bce = nn.BCEWithLogitsLoss()
for step in range(600):
    real = 2 + 0.5 * torch.randn(64, 1)
    fake = G(torch.randn(64, 1))
    dloss = bce(D(real), torch.ones(64, 1)) + bce(D(fake.detach()), torch.zeros(64, 1))
    dopt.zero_grad(); dloss.backward(); dopt.step()
    for p in D.parameters(): p.requires_grad_(False)
    gloss = bce(D(G(torch.randn(64, 1))), torch.ones(64, 1))
    gopt.zero_grad(); gloss.backward(); gopt.step()
    for p in D.parameters(): p.requires_grad_(True)
with torch.no_grad(): samples = G(torch.randn(1000, 1)).numpy().ravel()
plt.hist(samples, bins=30, alpha=0.6, density=True, label="Sinh")
plt.hist(np.random.default_rng(42).normal(2, 0.5, 1000), bins=30, alpha=0.5, density=True, label="Thật")
plt.legend(); plt.show()
print("Mean/std mẫu sinh:", samples.mean(), samples.std())` }], exercises: ['Thay dữ liệu thật bằng hỗn hợp hai Gaussian.', 'Đổi learning rate và xem mode collapse có xuất hiện không.'], limitation: 'GAN có thể học không ổn định hoặc sụp mode; không đảm bảo phân phối sinh khớp sau số bước cố định.' },
  GPT: { summary: 'Huấn luyện Transformer nhân quả rất nhỏ để dự đoán ký tự kế tiếp. Có embedding vị trí, attention mask và lấy mẫu theo temperature.', level: 'Nâng cao', packages: TORCH,
    steps: [torchSetup, { title: 'Mã hóa văn bản thành chỉ số', explanation: 'Dùng ký tự làm token để dễ đọc code. Bộ dữ liệu quá nhỏ để học ngôn ngữ tổng quát.', code: `text = ("hoc may tu du lieu. tri tue nhan tao ho tro hoc tap. " * 20)
chars = sorted(set(text))
stoi = {c: i for i, c in enumerate(chars)}
data = torch.tensor([stoi[c] for c in text])
context = 16
def batch():
    starts = torch.randint(0, len(data) - context - 1, (16,))
    x = torch.stack([data[i:i+context] for i in starts])
    y = torch.stack([data[i+1:i+context+1] for i in starts])
    return x, y` },
    { title: 'Huấn luyện với causal mask', explanation: 'Mỗi vị trí chỉ nhìn chính nó và quá khứ. Cross entropy so logits với ký tự kế tiếp, không phải ký tự hiện tại.', code: `class TinyTransformer(nn.Module):
    def __init__(self):
        super().__init__()
        self.token = nn.Embedding(len(chars), 32)
        self.position = nn.Embedding(context, 32)
        self.block = nn.TransformerEncoderLayer(32, 4, 64, dropout=0.0, batch_first=True)
        self.head = nn.Linear(32, len(chars))
    def forward(self, x):
        n = x.shape[1]
        h = self.token(x) + self.position(torch.arange(n))
        mask = torch.triu(torch.ones(n, n, dtype=torch.bool), diagonal=1)
        return self.head(self.block(h, src_mask=mask))
model = TinyTransformer()
optimizer = torch.optim.Adam(model.parameters(), lr=0.003)
losses = []
for step in range(100):
    x, y = batch()
    loss = nn.functional.cross_entropy(model(x).reshape(-1, len(chars)), y.reshape(-1))
    optimizer.zero_grad(); loss.backward(); optimizer.step()
    losses.append(loss.item())
plt.plot(losses); plt.title("Training cross entropy"); plt.show()` },
    { title: 'Sinh chuỗi mới', explanation: 'Chỉ giữ context ký tự cuối. Temperature thấp làm phân phối tập trung hơn; đầu ra vẫn có thể vô nghĩa.', code: `model.eval()
tokens = torch.tensor([[stoi["h"]]])
temperature = 0.8
assert temperature > 0
with torch.no_grad():
    for _ in range(120):
        logits = model(tokens[:, -context:])[:, -1, :] / temperature
        next_token = torch.multinomial(torch.softmax(logits, dim=-1), 1)
        tokens = torch.cat([tokens, next_token], dim=1)
print("".join(chars[i] for i in tokens[0].tolist()))` }], exercises: ['So temperature 0.3, 0.8, 1.5.', 'Tạo tập văn bản kiểm tra riêng và đo loss trước khi kết luận mô hình học tốt.'], limitation: 'Mô hình đồ chơi có thể ghi nhớ câu lặp; chưa có đánh giá tổng quát hóa. Không phải GPT thương mại.' },
};
