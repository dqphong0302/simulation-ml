import type { SessionData } from '../../core/datasets/session';
import { dataContext, TABLE_NOTEBOOKS } from '../../learning/dataContext';
import { LESSONS } from '..';

export function makeUploadedNotebook(id: string, data: SessionData) {
  if (!TABLE_NOTEBOOKS.has(id)) throw new Error('Bài này chưa có notebook cho bảng tải lên.');
  const c = dataContext(data);
  const noLabel = ['EDA','DATA','KMEANS','PCA'].includes(id);
  const target = noLabel ? '' : id === 'LINREG' ? c.numeric.filter(x => !c.flags.includes(x.name)).at(-1)?.name ?? '' : c.target;
  const numeric = c.numeric.filter(x => !c.flags.includes(x.name) && (noLabel || x.name !== target)).map(x => x.name);
  const categorical = c.columns.filter(x => x.kind === 'categorical' && x.unique > 0 && x.unique <= 30 && !c.flags.includes(x.name) && x.name !== target).map(x => x.name);
  let i = 0;
  const md = (s: string) => ({ cell_type: 'markdown', id: `md-${++i}`, metadata: {}, source: [s] });
  const code = (s: string) => ({ cell_type: 'code', id: `code-${++i}`, metadata: {}, execution_count: null, outputs: [], source: [s] });
  const config = `# Kiểm tra gợi ý trước khi chạy; không tự suy ra ý nghĩa y khoa.
CONFIG_CONFIRMED = False  # đổi True sau khi đọc cấu hình
TARGET = ${JSON.stringify(target)}
POSITIVE = None  # phân loại: nhập chính xác nhãn dương dạng chuỗi, ví dụ "1"
NUMERIC = ${JSON.stringify(numeric)}
CATEGORICAL = ${JSON.stringify(categorical)}  # chỉ dùng trong notebook, lab web hiện chỉ dùng số
GROUP_COLUMN = None  # nếu nhiều lần khám, nhập tên ID bệnh nhân để chia theo nhóm
SHEET = ${JSON.stringify(data.sheet ?? 0)}
MAX_ROWS = 3000  # dừng khi vượt; tự chọn mẫu có chủ đích, không cắt âm thầm
SEED = 42
assert CONFIG_CONFIRMED, "Hãy kiểm tra TARGET/biến/đơn vị/GROUP_COLUMN rồi đổi CONFIG_CONFIRMED=True."
`;
  const load = `from google.colab import files
from pathlib import Path
import io, csv, json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
uploaded = files.upload()  # chỉ chọn dữ liệu được phép gửi lên Colab
if len(uploaded) != 1: raise ValueError("Chọn đúng một tệp bảng.")
filename, blob = next(iter(uploaded.items()))
ext = Path(filename).suffix.lower()
delimiter = ","
if ext in [".csv", ".tsv", ".txt"]:
    text = blob.decode("utf-8-sig", errors="strict")
    try: delimiter = "\\t" if ext == ".tsv" else csv.Sniffer().sniff(text[:65536], delimiters=",;\\t|").delimiter
    except csv.Error: delimiter = ","  # bảng một cột không có dấu phân cách
    df = pd.read_csv(io.StringIO(text), sep=delimiter, dtype=str, keep_default_na=False)
elif ext in [".xlsx", ".xls"]:
    df = pd.read_excel(io.BytesIO(blob), sheet_name=SHEET, dtype=str).fillna("")
elif ext == ".json":
    rows = json.loads(blob.decode("utf-8-sig"))
    if not isinstance(rows, list) or not rows or any(not isinstance(r, dict) for r in rows):
        raise ValueError("JSON cần mảng các đối tượng phẳng.")
    if any(isinstance(v, (dict, list)) for r in rows for v in r.values()):
        raise ValueError("Làm phẳng JSON lồng nhau trước.")
    df = pd.DataFrame(rows).fillna("").astype(str)
else: raise ValueError("Dùng CSV/TSV/TXT, XLSX/XLS hoặc JSON phẳng; PDF/ảnh là tác vụ riêng.")
df.columns = df.columns.astype(str).str.strip()
for col in df.columns:
    df[col] = df[col].astype(str).str.strip()
    df[col] = df[col].mask(df[col].str.lower().isin(["", "null", "na", "nan", "n/a", "none", "?"]))
print("Kích thước:", df.shape, "Cột:", list(df.columns))
if len(df) > MAX_ROWS: raise ValueError("Vượt MAX_ROWS. Chọn mẫu có chủ đích rồi tải lại, không cắt dòng tự động.")
for col in NUMERIC:
    if col not in df: raise ValueError(f"Thiếu cột {col}; dùng bảng CSV xuất từ web hoặc sửa cấu hình.")
    raw = df[col]
    if delimiter != ",": raw = raw.str.replace(r"^(-?\\d+),(\\d+)$", r"\\1.\\2", regex=True)
    parsed = pd.to_numeric(raw, errors="coerce").replace([np.inf, -np.inf], np.nan)
    print(col, "ô không đọc thành số:", int((raw.notna() & parsed.isna()).sum()))
    df[col] = parsed
print("Tỷ lệ thiếu:\\n", df.isna().mean())
print("Dòng trùng hoàn toàn:", int(df.duplicated().sum()))
`;
  const prepare = `from sklearn.model_selection import train_test_split, GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
FEATURES = NUMERIC + CATEGORICAL
if not FEATURES or len(set(FEATURES)) != len(FEATURES): raise ValueError("Chọn biến hợp lệ, không lặp.")
if TARGET in FEATURES or GROUP_COLUMN in FEATURES: raise ValueError("Không đưa nhãn/ID nhóm vào đặc trưng.")
if any(col not in df for col in FEATURES): raise ValueError("Tên biến không có trong bảng.")
task = ${JSON.stringify(noLabel ? 'unsupervised' : id === 'LINREG' ? 'regression' : 'classification')}
work = df.copy()
if task != "unsupervised":
    if TARGET not in work: raise ValueError("Chọn TARGET có trong bảng.")
    if task == "regression":
        raw_target = work[TARGET]
        if delimiter != ",": raw_target = raw_target.str.replace(r"^(-?\\d+),(\\d+)$", r"\\1.\\2", regex=True)
        work[TARGET] = pd.to_numeric(raw_target, errors="coerce").replace([np.inf, -np.inf], np.nan)
    missing = work[TARGET].isna()
    print("Bỏ dòng thiếu/không đọc được nhãn:", int(missing.sum()))
    work = work.loc[~missing].copy()
    if task == "classification":
        labels = work[TARGET].astype(str)
        print("Nhãn gốc:", labels.value_counts().to_dict())
        if POSITIVE is None or str(POSITIVE) not in set(labels): raise ValueError("Nhập POSITIVE chính xác rồi chạy lại.")
        y = (labels == str(POSITIVE)).astype(int)
        if y.nunique() < 2 or y.value_counts().min() < 3: raise ValueError("Cần ít nhất 3 dòng mỗi nhóm dương/âm để chia ví dụ.")
    else: y = work[TARGET]
else: y = pd.Series(0, index=work.index)
if len(work) < 10: raise ValueError("Cần ít nhất 10 dòng sau kiểm tra.")
indices = np.arange(len(work))
if GROUP_COLUMN is not None:
    if GROUP_COLUMN not in work or work[GROUP_COLUMN].isna().any(): raise ValueError("ID nhóm thiếu hoặc không tồn tại.")
    groups = work[GROUP_COLUMN]
    train_idx, test_idx = next(GroupShuffleSplit(n_splits=1, test_size=.2, random_state=SEED).split(work, y, groups))
    assert set(groups.iloc[train_idx]).isdisjoint(set(groups.iloc[test_idx]))
else:
    train_idx, test_idx = train_test_split(indices, test_size=.2, random_state=SEED, stratify=y if task=="classification" else None)
    print("Chia theo dòng: chỉ phù hợp khi dòng độc lập; không đánh giá bệnh nhân mới nếu có lần khám lặp.")
X_train, X_test = work[FEATURES].iloc[train_idx], work[FEATURES].iloc[test_idx]
y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]
if task == "classification" and (y_train.nunique()<2 or y_test.nunique()<2): raise ValueError("Một tập thiếu lớp; xem lại nhóm/cỡ mẫu, không chọn split để làm đẹp điểm.")
if X_train.isna().all().any(): raise ValueError("Có biến hoàn toàn thiếu trong train; bỏ biến đó hoặc kiểm tra lại dữ liệu.")
branches = []
if NUMERIC: branches.append(("num", Pipeline([("missing", SimpleImputer(strategy="median")), ("scale", StandardScaler())]), NUMERIC))
if CATEGORICAL: branches.append(("cat", Pipeline([("missing", SimpleImputer(strategy="most_frequent")), ("encode", OneHotEncoder(handle_unknown="ignore", sparse_output=False, max_categories=20))]), CATEGORICAL))
preprocessor = ColumnTransformer(branches)
print("Train/test:", len(train_idx), len(test_idx))
`;
  const models: Record<string,string> = {
    KNN: 'from sklearn.neighbors import KNeighborsClassifier\nestimator = KNeighborsClassifier(n_neighbors=min(5, len(X_train)))',
    TREE: 'from sklearn.tree import DecisionTreeClassifier\nestimator = DecisionTreeClassifier(max_depth=3, random_state=SEED)',
    LOGREG: 'from sklearn.linear_model import LogisticRegression\nestimator = LogisticRegression(max_iter=1000)',
    FOREST: 'from sklearn.ensemble import RandomForestClassifier\nestimator = RandomForestClassifier(n_estimators=50, max_depth=5, random_state=SEED)',
    BOOST: 'from sklearn.ensemble import GradientBoostingClassifier\nestimator = GradientBoostingClassifier(n_estimators=60, max_depth=1, learning_rate=0.1, random_state=SEED)',
    SVM: 'from sklearn.svm import SVC\nestimator = SVC(kernel="rbf", probability=True, random_state=SEED)',
    MLP: 'from sklearn.neural_network import MLPClassifier\nestimator = MLPClassifier(hidden_layer_sizes=(16,), max_iter=500, random_state=SEED)',
    LINREG: 'from sklearn.linear_model import LinearRegression\nestimator = LinearRegression()',
  };
  let run = '';
  if (id === 'EDA') run = `print(df.describe(include="all").T)
if NUMERIC:
    df[NUMERIC].hist(bins=15, figsize=(10, 6)); plt.tight_layout(); plt.show()
print("Không tự xóa ngoại lai, đổi đơn vị, mã hóa ngày hoặc coi 0 là thiếu.")`;
  else if (id === 'DATA') run = `train_ready = preprocessor.fit_transform(X_train)
test_ready = preprocessor.transform(X_test)
print("Đã điền thiếu/mã hóa bằng tham số chỉ học từ train:", train_ready.shape, test_ready.shape)
print(preprocessor.get_feature_names_out())`;
  else if (id === 'PCA' || id === 'KMEANS') run = `from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
train_ready = preprocessor.fit_transform(X_train)
test_ready = preprocessor.transform(X_test)
if train_ready.shape[1] < 2: raise ValueError("Cần ít nhất 2 chiều sau tiền xử lý để vẽ PCA.")
projection = PCA(n_components=2).fit(train_ready)
points = projection.transform(test_ready)
${id === 'KMEANS' ? 'model = KMeans(n_clusters=3, n_init=10, random_state=SEED).fit(train_ready)\ncolors = model.predict(test_ready)\nprint("Inertia train:", model.inertia_)' : 'colors = None\nprint("Phương sai giữ lại:", projection.explained_variance_ratio_)'}
plt.scatter(points[:,0], points[:,1], c=colors); plt.xlabel("PC1"); plt.ylabel("PC2"); plt.show()
print("Cụm/thành phần là cấu trúc theo phép đo đã chọn, không tự là nhóm bệnh.")`;
  else if (id === 'COMPARE') run = `from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import cross_val_score, StratifiedKFold, GroupKFold
counts = y_train.value_counts()
if GROUP_COLUMN is not None:
    train_groups = work[GROUP_COLUMN].iloc[train_idx]
    if train_groups.nunique() < 3: raise ValueError("Cần ít nhất 3 nhóm train cho ví dụ CV.")
    cv = list(GroupKFold(3).split(X_train, y_train, train_groups))
else:
    if counts.min() < 3: raise ValueError("Cần ít nhất 3 mẫu mỗi lớp trong train cho CV.")
    cv = list(StratifiedKFold(3, shuffle=True, random_state=SEED).split(X_train,y_train))
for estimator in [LogisticRegression(max_iter=1000), DecisionTreeClassifier(max_depth=3, random_state=SEED)]:
    model = Pipeline([("prepare", preprocessor), ("model", estimator)])
    scores = cross_val_score(model, X_train, y_train, cv=cv, scoring="balanced_accuracy", error_score="raise")
    print(type(estimator).__name__, "CV balanced accuracy:", scores, "mean:", scores.mean())
print("Chọn cấu hình bằng CV train; chưa mở test để chọn mô hình. SD giữa fold không tự là CI 95%.")`;
  else run = `${models[id]}
model = Pipeline([("prepare", preprocessor), ("model", estimator)])
model.fit(X_train, y_train)
prediction = model.predict(X_test)
${id === 'LINREG' ? 'from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score\nprint("RMSE:", np.sqrt(mean_squared_error(y_test,prediction)), "MAE:", mean_absolute_error(y_test,prediction), "R²:", r2_score(y_test,prediction))' : 'from sklearn.metrics import confusion_matrix, classification_report, roc_auc_score\nprint("Confusion matrix [âm,dương]:\\n", confusion_matrix(y_test,prediction,labels=[0,1]))\nprint(classification_report(y_test,prediction,zero_division=0))\nprobability = model.predict_proba(X_test)[:,1]\nprint("AUROC:", roc_auc_score(y_test,probability))\nprint("Xác suất cần kiểm tra calibration; không tự là nguy cơ thật hoặc chỉ định điều trị.")'}
print("Test dành cho đánh giá cuối. Muốn thử tham số, dùng validation/CV trong train trước, không chọn theo test.")`;
  return { nbformat: 4, nbformat_minor: 5, metadata: { kernelspec: { name:'python3',display_name:'Python 3',language:'python' } }, cells: [
    md(`# ${LESSONS.find(l=>l.id===id)?.title} — bảng của bạn\n\nNotebook chỉ chứa cấu hình tên cột, KHÔNG chứa hàng dữ liệu. Tải bảng CSV hiện tại từ web hoặc upload lại CSV/TSV/TXT, Excel, JSON phẳng trên Colab. Colab xử lý trên đám mây: chỉ dùng dữ liệu tổng hợp hoặc được phép chia sẻ, không đưa hồ sơ người thật vào bài học.\n\nLab web dùng số; notebook này có thể thêm one-hot cho biến chữ. Kết quả và thuật toán cài đặt không nhất thiết giống lab. Ngày/thời gian không được mã hóa tự động; ID nghi ngờ được loại khỏi gợi ý, cần kiểm tra lại.`),
    code('%pip -q install pandas numpy matplotlib scikit-learn openpyxl xlrd\n'),
    md('## 1. Xác nhận cấu hình\nĐiền nhãn dương nếu phân loại; kiểm tra biến có sẵn tại mốc dự đoán. Đặt GROUP_COLUMN khi nhiều dòng cùng người. Với dự báo tương lai, cần thiết kế split theo thời gian riêng; notebook chưa tự làm điều đó.'),code(config),
    md('## 2. Tải bảng và kiểm tra\nKhông sửa dữ liệu gốc; giá trị đọc không thành số được đếm rõ. Kiểm tra đơn vị và mã thiếu trước khi mô hình hóa.'),code(load),
    ...(id === 'EDA' ? [] : [md('## 3. Chia tập rồi fit pipeline\nMã hóa mức mới bằng handle_unknown; chỉ fit median, scaling và one-hot trong train. Không tự loại ngoại lai hay điền nhãn.'),code(prepare)]),
    md('## Thực hành và đọc kết quả'),code(run),
    md('## Tự thử\nGhi câu hỏi, dữ liệu, biến, cấu hình và bằng chứng. Chỉ đổi một yếu tố mỗi lần; không dùng test để lựa chọn. Đánh giá theo nguồn/nhóm/thời gian phù hợp trước khi suy rộng. Điểm trên bảng này không chứng minh hiệu quả y khoa hay nhân quả.'),
  ] };
}
