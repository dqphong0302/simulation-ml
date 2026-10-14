export interface PythonStep { title: string; explanation: string; code: string }
export interface PythonLesson {
  summary: string;
  level: 'Cơ bản' | 'Nâng cao';
  packages: string[];
  steps: PythonStep[];
  exercises: string[];
  limitation: string;
}
export const SCIENCE = ['numpy', 'pandas', 'matplotlib', 'scikit-learn'];
export const TORCH = [...SCIENCE, 'torch'];
export const classificationData: PythonStep = {
  title: 'Chuẩn bị dữ liệu và tách tập kiểm tra',
  explanation: 'Dữ liệu Iris có 4 số đo của hoa và 3 loài. Giữ riêng 25% để kiểm tra cuối cùng; không dùng tập này để chọn tham số. random_state giúp tái lập phép chia.',
  code: `from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, ConfusionMatrixDisplay

X, y = load_iris(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.25, stratify=y, random_state=42)
print("Train / test:", X_train.shape, X_test.shape)`,
};
export const evaluateClassifier: PythonStep = {
  title: 'Đánh giá trên dữ liệu chưa học',
  explanation: 'Accuracy là tỷ lệ đoán đúng; ma trận nhầm lẫn cho biết loài nào bị nhầm với loài nào. Điểm cao trên bộ dữ liệu nhỏ này không đảm bảo hiệu quả trên dữ liệu thực tế.',
  code: `prediction = model.predict(X_test)
print("Test accuracy:", round(accuracy_score(y_test, prediction), 3))
ConfusionMatrixDisplay.from_predictions(y_test, prediction)
plt.title("Hàng: nhãn thật — Cột: dự đoán")
plt.show()`,
};
