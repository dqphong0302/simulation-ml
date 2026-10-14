import { SCIENCE, classificationData, evaluateClassifier, type PythonLesson } from './types';

function classifier(summary: string, code: string, exercises: string[]): PythonLesson {
  return { summary, level: 'Cơ bản', packages: SCIENCE,
    steps: [classificationData, { title: 'Xây dựng và huấn luyện mô hình', explanation: summary + ' Pipeline chỉ học chuẩn hóa trên tập train. Cross-validation (nếu có) cũng chỉ dùng tập train.', code }, evaluateClassifier],
    exercises, limitation: 'Ví dụ nhập môn trên Iris, không phải mô hình chẩn đoán. Dùng validation/cross-validation để chọn tham số, giữ test cho đánh giá cuối.' };
}

export const ML_PYTHON: Record<string, PythonLesson> = {
  KNN: classifier('KNN dự đoán bằng bỏ phiếu từ các điểm gần nhất. Chuẩn hóa giúp một biến có đơn vị lớn không lấn át khoảng cách.', `from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import GridSearchCV
search = GridSearchCV(make_pipeline(StandardScaler(), KNeighborsClassifier()),
    {"kneighborsclassifier__n_neighbors": [3, 5, 9, 15]}, cv=3)
search.fit(X_train, y_train)
model = search.best_estimator_
print("Tham số tốt nhất trên CV:", search.best_params_)`, ['Thêm k=1 vào danh sách và so điểm CV.', 'Bỏ chuẩn hóa, so sánh trên cùng phép chia.']),
  TREE: classifier('Cây quyết định đặt các câu hỏi về đặc trưng để chia dữ liệu. Cây quá sâu có thể ghi nhớ tập train.', `from sklearn.tree import DecisionTreeClassifier, plot_tree
model = DecisionTreeClassifier(max_depth=3, random_state=42)
model.fit(X_train, y_train)
print("Train accuracy:", model.score(X_train, y_train))
plt.figure(figsize=(12, 5))
plot_tree(model, filled=True, feature_names=load_iris().feature_names)
plt.show()`, ['So độ sâu 1, 3, 8 bằng cross-validation trên train.', 'Đọc quy tắc ở nút gốc và giải thích bằng lời.']),
  LOGREG: classifier('Logistic Regression học xác suất lớp từ tổ hợp tuyến tính các biến. Ví dụ có ba lớp nên dùng softmax đa lớp, không phải một sigmoid nhị phân.', `from sklearn.linear_model import LogisticRegression
model = make_pipeline(StandardScaler(), LogisticRegression(C=1.0, max_iter=500))
model.fit(X_train, y_train)
print("Xác suất 3 lớp của 5 mẫu:", model.predict_proba(X_test[:5]).round(3))`, ['Thử C=0.1 và C=10 bằng CV.', 'Kiểm tra tổng xác suất mỗi hàng bằng 1.']),
  FOREST: classifier('Random Forest gộp nhiều cây học trên các mẫu bootstrap và tập biến ngẫu nhiên để giảm phương sai.', `from sklearn.ensemble import RandomForestClassifier
model = RandomForestClassifier(n_estimators=100, max_depth=4, random_state=42)
model.fit(X_train, y_train)
plt.barh(load_iris().feature_names, model.feature_importances_)
plt.title("Độ quan trọng theo giảm impurity — không phải nhân quả")
plt.show()`, ['So 10 và 100 cây bằng CV.', 'Thử permutation importance để so độ quan trọng biến.']),
  SVM: classifier('SVM tìm ranh giới có lề rộng. Kernel RBF cho phép ranh giới phi tuyến; C điều khiển mức phạt lỗi.', `from sklearn.svm import SVC
model = make_pipeline(StandardScaler(), SVC(C=1.0, kernel="rbf", gamma="scale"))
model.fit(X_train, y_train)`, ['So kernel linear với rbf.', 'Dùng GridSearchCV chọn C trong [0.1, 1, 10].']),
  MLP: classifier('MLP kết hợp các lớp tuyến tính với kích hoạt phi tuyến. Backpropagation tính gradient; optimizer cập nhật trọng số để giảm loss.', `from sklearn.neural_network import MLPClassifier
model = make_pipeline(StandardScaler(), MLPClassifier(
    hidden_layer_sizes=(16, 8), activation="relu", max_iter=1500, random_state=42))
model.fit(X_train, y_train)
plt.plot(model[-1].loss_curve_)
plt.xlabel("Vòng lặp")
plt.ylabel("Training loss")
plt.show()`, ['Thử một lớp 8 neuron và hai lớp (16, 8).', 'So loss và điểm CV khi tăng alpha (regularization).']),
  COMPARE: { ...classifier('So sánh mô hình phải dùng cùng dữ liệu, phép chia và thước đo. Chọn mô hình bằng cross-validation trên train trước khi mở test.', `from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.neural_network import MLPClassifier
from sklearn.model_selection import cross_val_score, StratifiedKFold
models = {
    "KNN": make_pipeline(StandardScaler(), KNeighborsClassifier(5)),
    "Tree": DecisionTreeClassifier(max_depth=3, random_state=42),
    "Logistic": make_pipeline(StandardScaler(), LogisticRegression(max_iter=500)),
    "MLP": make_pipeline(StandardScaler(), MLPClassifier(hidden_layer_sizes=(16,), max_iter=1500, random_state=42)),
}
cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
scores = {name: cross_val_score(m, X_train, y_train, cv=cv).mean() for name, m in models.items()}
print("CV accuracy:", scores)
best = max(scores, key=scores.get)
model = models[best].fit(X_train, y_train)
print("Chọn bằng CV:", best)`, ['Chạy lại với 5 folds.', 'Giải thích vì sao không chọn mô hình bằng điểm test.']) },
  LINREG: { summary: 'Hồi quy tuyến tính khớp đường thẳng để dự đoán một giá trị liên tục.', level: 'Cơ bản', packages: SCIENCE,
    steps: [{ title: 'Sinh dữ liệu có nhiễu', explanation: 'Ta biết quy luật gốc y=3x+2 và thêm nhiễu để quan sát sai số.', code: `from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score
rng = np.random.default_rng(42)
X = rng.uniform(0, 10, (200, 1))
y = 3 * X[:, 0] + 2 + rng.normal(0, 2, 200)
X_train, X_test, y_train, y_test = train_test_split(X, y, random_state=42)` },
    { title: 'Khớp và đánh giá', explanation: 'RMSE cùng đơn vị với y; R² so với dự đoán hằng bằng trung bình. R² có thể âm khi mô hình kém.', code: `model = LinearRegression().fit(X_train, y_train)
pred = model.predict(X_test)
print("Hệ số, intercept:", model.coef_, model.intercept_)
print("RMSE:", np.sqrt(mean_squared_error(y_test, pred)), "R²:", r2_score(y_test, pred))
plt.scatter(X_test[:, 0], y_test, label="Test")
grid = np.linspace(0, 10, 100).reshape(-1, 1)
plt.plot(grid[:, 0], model.predict(grid), color="orange", label="Hồi quy")
plt.legend(); plt.show()` }], exercises: ['Tăng nhiễu từ 2 lên 6.', 'Đổi quy luật thành y=x² và xem đường thẳng thất bại ở đâu.'], limitation: 'Dữ liệu tổng hợp; tương quan và hệ số hồi quy không chứng minh quan hệ nhân quả.' },
  KMEANS: { summary: 'K-means lặp hai bước: gán điểm vào tâm gần nhất rồi cập nhật tâm bằng trung bình.', level: 'Cơ bản', packages: SCIENCE,
    steps: [{ title: 'Tạo các cụm không nhãn', explanation: 'Dùng ba đám mây điểm; nhãn sinh dữ liệu không được đưa vào thuật toán.', code: `from sklearn.datasets import make_blobs
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
X, _ = make_blobs(n_samples=300, centers=3, cluster_std=1.2, random_state=42)
X = StandardScaler().fit_transform(X)` },
    { title: 'Tìm cụm và xem elbow', explanation: 'Inertia luôn giảm khi k tăng. Dùng elbow và silhouette cùng hiểu biết về dữ liệu, không coi cụm là lớp thật.', code: `ks = range(2, 8)
inertias = []
for k in ks:
    m = KMeans(n_clusters=k, n_init=10, random_state=42).fit(X)
    inertias.append(m.inertia_)
    print(k, "silhouette:", round(silhouette_score(X, m.labels_), 3))
plt.plot(list(ks), inertias, "o-"); plt.xlabel("k"); plt.ylabel("Inertia"); plt.show()
model = KMeans(n_clusters=3, n_init=10, random_state=42).fit(X)
plt.scatter(X[:, 0], X[:, 1], c=model.labels_)
plt.scatter(*model.cluster_centers_.T, marker="X", s=150, c="red")
plt.show()` }], exercises: ['Tăng cluster_std lên 3.', 'Thử make_moons để thấy giới hạn của cụm gần hình cầu.'], limitation: 'Phân tích không giám sát trên toàn bộ mẫu chỉ để khám phá, không báo cáo như điểm dự đoán ngoài mẫu.' },
  PCA: { summary: 'PCA tìm các trục có phương sai lớn nhất để nén dữ liệu; không sử dụng nhãn khi tìm trục.', level: 'Cơ bản', packages: SCIENCE,
    steps: [classificationData, { title: 'Học phép chiếu trên train', explanation: 'Chuẩn hóa và PCA chỉ fit trên train. Nhãn chỉ dùng để tô màu biểu đồ test.', code: `from sklearn.decomposition import PCA
projection = make_pipeline(StandardScaler(), PCA(n_components=2))
projection.fit(X_train)
Z = projection.transform(X_test)
print("Tỷ lệ phương sai:", projection[-1].explained_variance_ratio_)
plt.scatter(Z[:, 0], Z[:, 1], c=y_test)
plt.xlabel("PC1"); plt.ylabel("PC2"); plt.show()` }], exercises: ['Đổi n_components thành 1, 3.', 'So kết quả khi bỏ StandardScaler.'], limitation: 'Phương sai lớn không đồng nghĩa với khả năng phân loại tốt hoặc ý nghĩa nhân quả.' },
  TEACHABLE: { summary: 'Thử quy trình dạy máy phân loại ảnh bằng bộ chữ số 8×8 có sẵn: ảnh → vector → bộ phân loại → dự đoán.', level: 'Cơ bản', packages: SCIENCE,
    steps: [{ title: 'Đọc ảnh và chia dữ liệu', explanation: 'Mỗi ảnh có 64 giá trị pixel và nhãn từ 0 đến 9. Đây là phiên bản nhập môn, không dùng webcam hay MobileNet như lab trên web.', code: `from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
digits = load_digits()
X_train, X_test, y_train, y_test = train_test_split(digits.data, digits.target,
    test_size=0.25, stratify=digits.target, random_state=42)` },
    { title: 'Huấn luyện và xem ảnh dự đoán', explanation: 'Ảnh test chưa xuất hiện trong quá trình học. Chú ý các chữ số bị nhầm và chất lượng ảnh.', code: `model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))
model.fit(X_train, y_train)
print("Test accuracy:", model.score(X_test, y_test))
fig, axes = plt.subplots(2, 5, figsize=(10, 4))
for ax, pixels, truth in zip(axes.flat, X_test[:10], y_test[:10]):
    ax.imshow(pixels.reshape(8, 8), cmap="gray")
    ax.set_title(f"Thật {truth}, đoán {model.predict([pixels])[0]}")
    ax.axis("off")
plt.tight_layout(); plt.show()` }], exercises: ['Tìm 5 ảnh dự đoán sai.', 'Giảm lượng dữ liệu train và so độ chính xác.'], limitation: 'Không phải chuyển giao MobileNet; ảnh thật cần pipeline và đánh giá riêng. Không tải ảnh cá nhân nhạy cảm lên Colab.' },
};
