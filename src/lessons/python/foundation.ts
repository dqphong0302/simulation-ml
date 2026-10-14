import { SCIENCE, type PythonLesson, type PythonStep } from './types';

const data: PythonStep = {
  title: 'Tạo bảng y tế tổng hợp và từ điển dữ liệu',
  explanation: '300 người giả lập có hai lần khám/người. Glucose dùng hai đơn vị, có ô trống, mã thiếu 0 và một bản sao. event_30d là biến cố giả lập sau lần khám; quy luật sinh dữ liệu không phải tiêu chuẩn chẩn đoán.',
  code: `import pandas as pd
rng = np.random.default_rng(42)
n = 300
age = rng.integers(25, 81, n)
bmi = np.clip(rng.normal(27, 4, n), 16, 44)
glucose = np.clip(rng.normal(110, 25, n), 55, 240)
site = rng.choice(["A", "B"], n)
rows = []
for i in range(n):
    for visit in range(2):
        g = max(45, glucose[i] + rng.normal(0, 8))
        b = bmi[i] + rng.normal(0, 0.5)
        logit = -1.6 + 0.025 * (g - 110) + 0.025 * (age[i] - 50) + 0.08 * (b - 27)
        outcome = int(rng.random() < 1 / (1 + np.exp(-logit)))
        unit = "mmol/L" if rng.random() < 0.4 else "mg/dL"
        value = g / 18.018 if unit == "mmol/L" else g
        # MAR do chính ta tạo: khả năng thiếu phụ thuộc tuổi/site đã quan sát.
        missing_probability = 0.05 + 0.12 * (site[i] == "B") + 0.08 * (age[i] > 65)
        if rng.random() < missing_probability: value = np.nan
        elif rng.random() < 0.03: value = 0
        rows.append({"patient_id": f"P{i:04d}", "visit_id": f"P{i:04d}-V{visit}",
            "visit_date": pd.Timestamp("2025-01-01") + pd.Timedelta(days=int(rng.integers(0, 150)) + 180 * visit),
            "site": site[i], "age_years": age[i], "bmi": b,
            "glucose_value": value, "glucose_unit": unit, "event_30d": outcome})
raw = pd.DataFrame(rows)
raw = pd.concat([raw, raw.iloc[[0]]], ignore_index=True)
dictionary = pd.DataFrame([
    ["patient_id", "Mã người giả lập, chỉ để nhóm", "không", "không đưa vào model"],
    ["visit_id / visit_date", "Mã lần khám / mốc dự đoán", "ngày", "hai lần khám/người"],
    ["site", "Nơi khám giả lập", "A/B", "biến phân loại"],
    ["age_years / bmi", "Tuổi / chỉ số khối cơ thể", "năm / kg/m²", "không có mã thiếu"],
    ["glucose_value", "Xét nghiệm tại mốc khám", "xem glucose_unit", "NaN hoặc 0 là thiếu trong ví dụ này"],
    ["event_30d", "Biến cố sau lần khám, sinh ngẫu nhiên", "0/1", "kết cuộc, không đưa vào đặc trưng"],
], columns=["Cột", "Ý nghĩa", "Đơn vị", "Quy tắc"])
print(dictionary.to_string(index=False))
print("Dòng / người:", len(raw), raw.patient_id.nunique())
print(raw.head())`,
};
const clean: PythonStep = {
  title: 'Kiểm tra đơn vị, mã thiếu và bản sao',
  explanation: 'Giữ hai lần khám khác nhau, chỉ bỏ bản sao hoàn toàn. Đổi glucose 0 thành thiếu theo metadata của ví dụ; không áp dụng cho mọi cột. Đổi đơn vị theo hệ số cố định chưa phải học tham số từ dữ liệu.',
  code: `duplicates = int(raw.duplicated().sum())
df = raw.drop_duplicates().copy()
zeros = int(df.glucose_value.eq(0).sum())
df.loc[df.glucose_value.eq(0), "glucose_value"] = np.nan
assert df.glucose_unit.isin(["mg/dL", "mmol/L"]).all()
df["glucose_mg_dl"] = df.glucose_value * np.where(df.glucose_unit.eq("mmol/L"), 18.018, 1.0)
audit = pd.DataFrame({"Quy tắc": ["Bỏ bản sao", "Mã glucose 0 → NaN", "Đổi mmol/L → mg/dL"],
    "Số dòng": [duplicates, zeros, int(df.glucose_unit.eq("mmol/L").sum())]})
print(audit.to_string(index=False))
assert df.visit_id.is_unique
assert len(df) == 2 * df.patient_id.nunique()
features = ["age_years", "bmi", "glucose_mg_dl"]`,
};
export const FOUNDATION_PYTHON: Record<string, PythonLesson> = {
  EDA: { summary: 'Khám phá bảng y tế tổng hợp: bệnh nhân/lần khám, đơn vị, dữ liệu thiếu, phân bố và độ bất định.', level: 'Cơ bản', packages: SCIENCE,
    steps: [data, clean, {
      title: 'Mô tả ở cấp bệnh nhân',
      explanation: 'Chọn lần khám đầu mỗi người để không đếm lặp trong bài mô tả. Thống kê người khác thống kê lần khám. Tỷ lệ kết cuộc chỉ mô tả mẫu tổng hợp, không đại diện hiện mắc ngoài cộng đồng.',
      code: `baseline = df.sort_values("visit_date").drop_duplicates("patient_id", keep="first").copy()
assert baseline.patient_id.is_unique
print(baseline[features].describe())
print("Thiếu glucose theo site:")
print(baseline.assign(missing=baseline.glucose_mg_dl.isna()).groupby("site").missing.mean())
print("Tỷ lệ kết cuộc giả lập:", baseline.event_30d.mean())
baseline[features].hist(figsize=(10, 4), bins=15)
plt.tight_layout(); plt.show()
baseline.boxplot(column="glucose_mg_dl", by="site")
plt.suptitle(""); plt.ylabel("mg/dL"); plt.show()
print("Pearson:\\n", baseline[features].corr())
print("Spearman:\\n", baseline[features].corr(method="spearman"))
plt.scatter(baseline.age_years, baseline.glucose_mg_dl, c=baseline.event_30d, alpha=0.6)
plt.xlabel("Tuổi"); plt.ylabel("Glucose mg/dL"); plt.show()
q1, q3 = baseline.glucose_mg_dl.quantile([0.25, 0.75])
flag = (baseline.glucose_mg_dl < q1 - 1.5 * (q3 - q1)) | (baseline.glucose_mg_dl > q3 + 1.5 * (q3 - q1))
print("Ngoài hàng rào Tukey, chưa loại bỏ:", int(flag.sum()))`,
    }, {
      title: 'Bootstrap độ bất định của trung bình tuổi',
      explanation: 'Baseline có một dòng/người nên lấy mẫu dòng tương đương lấy mẫu người. Nếu giữ lần khám lặp phải lấy mẫu cả nhóm. Khoảng percentile 95% của trung bình không phải khoảng chứa 95% tuổi hoặc khoảng tham chiếu lâm sàng.',
      code: `ages = baseline.age_years.to_numpy()
bootstrap_rng = np.random.default_rng(2026)
means = np.array([bootstrap_rng.choice(ages, len(ages), replace=True).mean() for _ in range(1000)])
print("Trung bình tuổi:", ages.mean())
print("Khoảng bootstrap percentile 95%:", np.quantile(means, [0.025, 0.975]))
plt.hist(means, bins=25); plt.xlabel("Trung bình tuổi bootstrap"); plt.show()`,
    }],
    exercises: ['Đếm lần khám và người theo site; giải thích vì sao khác nhau.', 'Bỏ đổi đơn vị trong một bản sao để xem histogram sai lệch.', 'So tỷ lệ thiếu theo tuổi/site; MAR chỉ được biết ở đây vì quy trình sinh dữ liệu công bố rõ.', 'Giải thích vì sao ngoài IQR chưa phải lỗi và khoảng bootstrap chưa phải khoảng tham chiếu.'],
    limitation: 'Toàn bộ người, xét nghiệm và kết cuộc là tổng hợp. Quy luật và tỷ lệ do người viết đặt ra, không đại diện chẩn đoán. Bootstrap giả định các bệnh nhân được lấy mẫu độc lập, không sửa được thiên lệch tuyển chọn.' },
  DATA: { summary: 'Chia bệnh nhân, xử lý bảng hỗn hợp bằng pipeline, chọn cách điền trong group cross-validation và đánh giá test một lần.', level: 'Cơ bản', packages: SCIENCE,
    steps: [data, clean, {
      title: 'Chia theo bệnh nhân, kiểm tra không giao nhau',
      explanation: 'GroupShuffleSplit đánh giá trên người mới. Nó không tự phân tầng nhãn nên phải kiểm tra tỷ lệ. Patient ID, ngày khám và kết cuộc không vào đặc trưng; ví dụ chưa phải kiểm tra theo thời gian hoặc bệnh viện.',
      code: `from sklearn.model_selection import GroupShuffleSplit, GroupKFold, GridSearchCV
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, brier_score_loss, confusion_matrix
from sklearn.calibration import calibration_curve
splitter = GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=42)
tr, te = next(splitter.split(df, df.event_30d, groups=df.patient_id))
train, test = df.iloc[tr].copy(), df.iloc[te].copy()
assert set(train.patient_id).isdisjoint(set(test.patient_id))
for name, part in [("train", train), ("test", test)]:
    print(name, "người", part.patient_id.nunique(), "lần khám", len(part), "tỷ lệ", part.event_30d.mean())
    assert part.event_30d.nunique() == 2
model_features = features + ["site"]
X_train, y_train = train[model_features], train.event_30d
X_test, y_test = test[model_features], test.event_30d
assert "patient_id" not in model_features and "event_30d" not in model_features`,
    }, {
      title: 'Học tiền xử lý trong từng fold train',
      explanation: 'ColumnTransformer tách nhánh số và phân loại. GroupKFold giữ cùng người trong một fold. GridSearchCV chọn median/mean bằng Brier score trong train; mỗi fold fit lại toàn bộ pipeline. Test chưa dùng để chọn cách xử lý.',
      code: `numeric = Pipeline([("impute", SimpleImputer(add_indicator=True)), ("scale", StandardScaler())])
categorical = Pipeline([("impute", SimpleImputer(strategy="most_frequent")),
    ("encode", OneHotEncoder(handle_unknown="ignore"))])
preprocess = ColumnTransformer([("num", numeric, features), ("cat", categorical, ["site"])])
pipeline = Pipeline([("preprocess", preprocess), ("model", LogisticRegression(max_iter=500))])
cv = GroupKFold(n_splits=3)
for tr, va in cv.split(X_train, y_train, groups=train.patient_id):
    assert set(train.iloc[tr].patient_id).isdisjoint(set(train.iloc[va].patient_id))
search = GridSearchCV(pipeline, {"preprocess__num__impute__strategy": ["median", "mean"]},
    cv=cv, scoring="neg_brier_score")
search.fit(X_train, y_train, groups=train.patient_id)
model = search.best_estimator_
print("Chọn bằng CV:", search.best_params_, "CV Brier:", -search.best_score_)
print("Giá trị điền từ train:", model.named_steps["preprocess"].named_transformers_["num"].named_steps["impute"].statistics_)
assert np.isfinite(model.named_steps["preprocess"].transform(X_test)).all()`,
    }, {
      title: 'Đánh giá test và diễn giải giới hạn',
      explanation: 'AUROC đo phân biệt; Brier đo sai số xác suất. Calibration so dự báo với tần suất quan sát, bin ít mẫu dao động mạnh. Ngưỡng 0,5 chỉ minh họa, không phải ngưỡng điều trị. Chưa tính CI theo dòng vì cùng người có lần khám phụ thuộc.',
      code: `probability = model.predict_proba(X_test)[:, 1]
print("Test AUROC:", roc_auc_score(y_test, probability))
print("Test Brier:", brier_score_loss(y_test, probability))
print("Confusion matrix (ngưỡng minh họa 0.5):\\n", confusion_matrix(y_test, probability >= 0.5))
fraction_positive, mean_prediction = calibration_curve(y_test, probability, n_bins=5, strategy="quantile")
plt.plot([0, 1], [0, 1], "--", label="Khớp lý tưởng")
plt.plot(mean_prediction, fraction_positive, "o-", label="Test tổng hợp")
plt.xlabel("Xác suất dự báo"); plt.ylabel("Tỷ lệ quan sát"); plt.legend(); plt.show()
for site_name in sorted(test.site.unique()):
    selected = test.site.eq(site_name).to_numpy()
    print("Site", site_name, "n lần khám", selected.sum(), "Brier", brier_score_loss(y_test[selected], probability[selected]))
# Cả hai site có trong train: chưa phải external validation tại nơi mới.
# Không sửa model sau khi nhìn test rồi báo cùng test như đánh giá độc lập.`,
    }],
    exercises: ['Thử chia từng dòng chỉ để đếm ID giao nhau; giải thích nguy cơ leakage.', 'Vì sao cờ thiếu có thể mất tác dụng khi quy trình chỉ định xét nghiệm đổi?', 'Thiết kế giữ site B làm test, kiểm tra site này không vào train và thảo luận danh mục mới.', 'Thiết kế chia theo thời gian: kết cuộc 30 ngày của train phải được biết trước mốc test; nêu cách xử lý người lặp.', 'Phân biệt AUROC, Brier, calibration; không suy ra lợi ích điều trị từ điểm số.'],
    limitation: 'Ví dụ tổng hợp minh họa group split và group CV, chưa thẩm định theo thời gian/bệnh viện hoặc chứng minh lợi ích lâm sàng. Lab web hiện chia theo dòng/nhãn, không tự bảo đảm tách bệnh nhân hoặc thời gian.' },
};
