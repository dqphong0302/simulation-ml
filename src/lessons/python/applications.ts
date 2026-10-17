import { SCIENCE, TORCH, type PythonLesson } from './types';

const shapes = `import torch
from torch import nn
torch.set_num_threads(1)
torch.manual_seed(42)
def shapes(n, seed, shifted=False):
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[:16, :16]
    images, labels = [], []
    for i in range(n):
        label = i % 2
        cx, cy = rng.integers(5, 11, 2)
        r = rng.integers(3, 5)
        mask = ((xx-cx)**2 + (yy-cy)**2 <= r*r) if label == 0 else ((abs(xx-cx) <= r) & (abs(yy-cy) <= r))
        noise = 0.12 if shifted else 0.05
        image = (0.2 if shifted else 0.05) + mask * (0.55 if shifted else 0.85) + rng.normal(0, noise, (16, 16))
        images.append(np.clip(image, 0, 1))
        labels.append(label)
    return torch.tensor(np.array(images)[:, None], dtype=torch.float32), torch.tensor(labels)
class SmallCNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.features = nn.Sequential(nn.Conv2d(1, 4, 3, padding=1), nn.ReLU(),
            nn.Conv2d(4, 8, 3, padding=1), nn.ReLU(), nn.AdaptiveAvgPool2d(1), nn.Flatten())
        self.head = nn.Linear(8, 2)
    def forward(self, x): return self.head(self.features(x))
source_x, source_y = shapes(160, 101)
train_x, train_y = shapes(80, 202, True)
val_x, val_y = shapes(40, 303, True)
test_x, test_y = shapes(40, 404, True)
model = SmallCNN()
def fit(model, x, y, epochs, lr, freeze_backbone=False):
    optimizer = torch.optim.Adam([p for p in model.parameters() if p.requires_grad], lr=lr)
    for epoch in range(epochs):
        model.train()
        if freeze_backbone: model.features.eval()
        optimizer.zero_grad()
        loss = nn.functional.cross_entropy(model(x), y)
        loss.backward(); optimizer.step()
    return float(loss.detach())
def accuracy(model, x, y):
    model.eval()
    with torch.no_grad(): return float((model(x).argmax(1) == y).float().mean())
fit(model, source_x, source_y, 40, 0.01)
print("Pretraining nguồn đã xong; không phải ImageNet hoặc dữ liệu y khoa.")
fig, ax = plt.subplots(1, 2)
ax[0].imshow(source_x[0, 0], cmap="gray"); ax[0].set_title("Nguồn giả")
ax[1].imshow(train_x[0, 0], cmap="gray"); ax[1].set_title("Đích giả")
plt.show()`;

export const APPLICATION_PYTHON: Record<string, PythonLesson> = {
  BOOST: {
    summary: 'Học Boosting và so Forest trên cùng dữ liệu tổng hợp, dùng validation chọn số cây trước khi đánh giá test.',
    level: 'Cơ bản', packages: SCIENCE,
    steps: [{ title: 'Dữ liệu giả và ba tập độc lập', explanation: 'Nhãn do công thức sinh dữ liệu, không là chẩn đoán. Một dòng là một quan sát tổng hợp độc lập; với bệnh nhân đo lặp cần group split thay cho chia dòng.', code: `from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.metrics import log_loss, roc_auc_score
X, y = make_classification(n_samples=600, n_features=6, n_informative=4, random_state=42)
X_train, X_rest, y_train, y_rest = train_test_split(X, y, test_size=0.4, stratify=y, random_state=1)
X_val, X_test, y_val, y_test = train_test_split(X_rest, y_rest, test_size=0.5, stratify=y_rest, random_state=2)
print("Train/validation/test:", len(y_train), len(y_val), len(y_test))` },
    { title: 'Chọn số cây bằng validation', explanation: 'Fit cây chỉ trên train. Staged prediction cho phép kiểm tra các tiền tố của chuỗi; không cần fit bằng validation. learning_rate được cố định trước trong ví dụ này.', code: `model = GradientBoostingClassifier(n_estimators=60, max_depth=1, learning_rate=0.1, random_state=42)
model.fit(X_train, y_train)
train_loss = [log_loss(y_train, p) for p in model.staged_predict_proba(X_train)]
val_loss = [log_loss(y_val, p) for p in model.staged_predict_proba(X_val)]
best_n = int(np.argmin(val_loss)) + 1
print("Số cây chọn bằng validation:", best_n)
plt.plot(range(1, 61), train_loss, label="train")
plt.plot(range(1, 61), val_loss, label="validation")
plt.axvline(best_n, color="gray"); plt.xlabel("Số cây"); plt.ylabel("Log-loss"); plt.legend(); plt.show()
model = GradientBoostingClassifier(n_estimators=best_n, max_depth=1, learning_rate=0.1, random_state=42).fit(X_train, y_train)
forest = RandomForestClassifier(n_estimators=60, max_depth=3, random_state=42).fit(X_train, y_train)
print("Forest validation log-loss:", log_loss(y_val, forest.predict_proba(X_val)))` },
    { title: 'Đánh giá cuối và giới hạn so sánh', explanation: 'Cấu hình đã cố định trước khi xem test. So sánh này có độ sâu và ngân sách chọn khác nhau, không chứng minh họ mô hình nào tốt nhất cho mọi bảng hoặc bệnh viện.', code: `for name, fitted in [("Boosting", model), ("Forest", forest)]:
    p = fitted.predict_proba(X_test)[:, 1]
    print(name, "test log-loss:", log_loss(y_test, p), "AUROC:", roc_auc_score(y_test, p))
print("Không đổi cấu hình sau khi xem test rồi báo cùng test như kiểm tra độc lập.")` }],
    exercises: ['Giữ split, chỉ đổi learning_rate rồi chọn số cây bằng validation.', 'So depth=1 với depth=2; ghi ngân sách chọn cấu hình.', 'Đưa điền thiếu vào Pipeline nếu bảng có ô thiếu; fit mỗi fold train.'],
    limitation: 'Dữ liệu tổng hợp độc lập, không đại diện bệnh nhân. Web dùng stump gradient bước cố định, sklearn có chi tiết cập nhật lá khác; không kỳ vọng số loss bằng nhau. Không có quy tắc Boosting luôn hơn Forest.',
  },
  TRANSFER: {
    summary: 'Pretrain CNN nhỏ trên hình học nguồn, học đầu mới trên miền đích, sau đó mở khối cuối để fine-tune; đo trọng số thay đổi thật.',
    level: 'Cơ bản', packages: TORCH,
    steps: [{ title: 'Tạo nguồn/đích và học checkpoint nguồn', explanation: 'Mọi ảnh hình tròn/hình vuông là tổng hợp. Các seed nguồn, train/validation/test đích khác nhau. Checkpoint được học trong phiên, không tải ImageNet và không dùng dữ liệu bệnh nhân.', code: shapes },
    { title: 'Đóng băng và học đầu phân loại mới', explanation: 'Thay đầu ra, đặt requires_grad=False cho backbone và tạo optimizer chỉ chứa tham số được mở. Snapshot và assert xác nhận backbone không đổi; eval dùng riêng để điều khiển trạng thái mạng.', code: `for p in model.features.parameters(): p.requires_grad = False
model.head = nn.Linear(8, 2)
frozen_before = [p.detach().clone() for p in model.features.parameters()]
fit(model, train_x, train_y, 40, 0.01, freeze_backbone=True)
assert all(torch.equal(a, b) for a, b in zip(frozen_before, model.features.parameters()))
print("Backbone không đổi. Validation sau học đầu:", accuracy(model, val_x, val_y))` },
    { title: 'Mở khối cuối rồi kiểm tra', explanation: 'Chỉ convolution cuối được mở, lớp đầu vẫn đóng băng. Tạo optimizer mới và giảm learning rate. Số epoch và ngưỡng đã đặt trước; test chỉ được xem cuối cùng, không lựa cấu hình theo kết quả đó.', code: `last_before = model.features[2].weight.detach().clone()
for p in model.features[2].parameters(): p.requires_grad = True
fit(model, train_x, train_y, 20, 0.001)
delta = float((model.features[2].weight.detach() - last_before).abs().max())
assert delta > 0
assert torch.equal(frozen_before[0], model.features[0].weight)
print("Thay đổi tối đa khối cuối:", delta)
print("Validation sau fine-tune:", accuracy(model, val_x, val_y))
print("Test đích cuối:", accuracy(model, test_x, test_y))
print("Không kết luận fine-tuning luôn tốt hơn chỉ từ một seed.")` }],
    exercises: ['So với CNN khởi tạo mới trên đúng split đích, công bố cả ngân sách pretrain.', 'Giữ checkpoint nguồn; chỉ đổi số lớp được mở.', 'Dùng đồ vật trong Teachable Machine để thử MobileNet học sẵn; không dùng ảnh bệnh nhân.'],
    limitation: 'Ví dụ học chuyển giao thật trên CNN rất nhỏ và ảnh tổng hợp do người viết thiết kế, không là pretrained ImageNet hoặc nghiên cứu y khoa. Mạng này không có BatchNorm; khi đổi sang mạng có BatchNorm cần quản lý running statistics. Chưa chứng minh lợi ích trên miền khác.',
  },
  SEG: {
    summary: 'Huấn luyện U-Net rút gọn có encoder, decoder và skip connection trên ảnh tròn giả; đánh giá mask thay vì chỉ nhãn toàn ảnh.',
    level: 'Cơ bản', packages: TORCH,
    steps: [{ title: 'Ảnh và mặt nạ tổng hợp, tách ba tập', explanation: 'Mỗi mask tạo cùng ảnh tương ứng, không dùng ảnh làm mask bằng ngưỡng cố định. Các tập được sinh bằng seed khác nhau; đây không thay cho chia bệnh nhân trong ảnh y khoa.', code: `import torch
from torch import nn
torch.set_num_threads(1); torch.manual_seed(42)
def dataset(n, seed):
    rng = np.random.default_rng(seed); yy, xx = np.mgrid[:16, :16]
    images, masks = [], []
    for i in range(n):
        cx, cy = rng.integers(4, 12, 2); r = rng.integers(2, 5)
        mask = ((xx-cx)**2 + (yy-cy)**2 <= r*r).astype(float)
        image = np.clip(0.15 + 0.6*mask + rng.normal(0, 0.15, (16, 16)), 0, 1)
        images.append(image); masks.append(mask)
    return (torch.tensor(np.array(images)[:, None], dtype=torch.float32),
            torch.tensor(np.array(masks)[:, None], dtype=torch.float32))
train_x, train_y = dataset(96, 11)
val_x, val_y = dataset(24, 22)
test_x, test_y = dataset(24, 33)
print("Ảnh/mask train:", train_x.shape, train_y.shape)` },
    { title: 'U-Net một tầng xuống/lên', explanation: 'Convolution encoder giữ đặc trưng, pooling giảm kích thước, decoder upsample rồi nối skip theo kênh. Đây là U-Net rút gọn, không tái tạo kiến trúc gốc đầy đủ hoặc checkpoint y khoa.', code: `class TinyUNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.enc = nn.Sequential(nn.Conv2d(1, 4, 3, padding=1), nn.ReLU())
        self.pool = nn.MaxPool2d(2)
        self.bridge = nn.Sequential(nn.Conv2d(4, 8, 3, padding=1), nn.ReLU())
        self.up = nn.Upsample(scale_factor=2, mode="nearest")
        self.dec = nn.Sequential(nn.Conv2d(12, 4, 3, padding=1), nn.ReLU(), nn.Conv2d(4, 1, 1))
    def forward(self, x):
        skip = self.enc(x)
        up = self.up(self.bridge(self.pool(skip)))
        return self.dec(torch.cat([up, skip], dim=1))
model = TinyUNet()
optimizer = torch.optim.Adam(model.parameters(), lr=0.02)
criterion = nn.BCEWithLogitsLoss()
history = []
for epoch in range(60):
    model.train(); optimizer.zero_grad()
    loss = criterion(model(train_x), train_y)
    loss.backward(); optimizer.step()
    model.eval()
    with torch.no_grad(): validation_loss = float(criterion(model(val_x), val_y))
    history.append((float(loss.detach()), validation_loss))
plt.plot(history); plt.legend(["train BCE", "validation BCE"]); plt.xlabel("Epoch"); plt.show()` },
    { title: 'Dice, IoU và vùng sai trên test', explanation: 'Giữ ngưỡng minh họa 0,5 và 60 epoch đã đặt trước. Gộp TP/FP/FN toàn bộ pixel test (micro); nếu cả hai mask rỗng quy ước điểm bằng 1. Không chọn lại ngưỡng theo test.', code: `model.eval()
with torch.no_grad(): probability = model(test_x).sigmoid().numpy()
pred = probability >= 0.5; truth = test_y.numpy().astype(bool)
tp = int((pred & truth).sum()); fp = int((pred & ~truth).sum()); fn = int((~pred & truth).sum())
dice = 2*tp/(2*tp+fp+fn) if 2*tp+fp+fn else 1.0
iou = tp/(tp+fp+fn) if tp+fp+fn else 1.0
print("Micro Dice / IoU:", dice, iou, "TP/FP/FN:", tp, fp, fn)
print("Pixel accuracy:", float((pred == truth).mean()))
fig, ax = plt.subplots(1, 4, figsize=(10, 3))
for a, image, title in zip(ax, [test_x[0, 0], truth[0, 0], pred[0, 0], pred[0, 0] != truth[0, 0]], ["Ảnh giả", "Tham chiếu", "Dự đoán", "Pixel sai"]):
    a.imshow(image, cmap="gray"); a.set_title(title); a.axis("off")
plt.show()
assert probability.shape == test_y.shape
assert np.isfinite(probability).all()` }],
    exercises: ['Chọn ngưỡng bằng validation trong một lần thử mới rồi giữ test độc lập.', 'Tính macro Dice từng ảnh và so với micro Dice.', 'Tạo ảnh không có vùng đích, công bố quy ước điểm rỗng và xem FP.', 'Giải thích vì sao chia theo lát CT khác chia theo bệnh nhân.'],
    limitation: 'U-Net rút gọn học thật nhưng chỉ trên hình tổng hợp 16×16. Điểm không đại diện ảnh y khoa, không chứng minh đúng giải phẫu hoặc an toàn. Web dùng bản đồ điểm đặt tay, nên điểm web không khớp model notebook.',
  },
};
