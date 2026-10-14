export interface LessonMeta {
  id: string;
  title: string;
  path: string;
  group: 'foundation' | 'ml' | 'dl' | 'genai';
  mode: 'Mô phỏng nguyên lý' | 'Huấn luyện thật trên dữ liệu nhỏ' | 'Suy luận qua API';
  version: string;
  goal: string;
}

export const LESSON_VERSION = '2026.10-draft1';

export type Group = LessonMeta['group'];
export const GROUPS: { id: Group; title: string; icon: string; blurb: string }[] = [
  { id: 'foundation', title: 'Nền tảng dữ liệu', icon: 'database', blurb: 'Khám phá, làm sạch và chia dữ liệu đúng cách.' },
  { id: 'ml', title: 'Machine Learning', icon: 'chart', blurb: 'Phân loại, hồi quy, phân cụm và đánh giá mô hình.' },
  { id: 'dl', title: 'Deep Learning', icon: 'brain', blurb: 'Neuron, lan truyền ngược, CNN, attention và mô hình sinh.' },
  { id: 'genai', title: 'Generative AI', icon: 'sparkles', blurb: 'Token, prompt, custom context và RAG.' },
];

/** Các bài có bài giảng kèm mô phỏng đồng bộ theo cảnh; các bài còn lại có bài giảng dạng slide. */
export const STAGED_LECTURES = new Set(['KNN', 'TREE', 'LOGREG']);
/** Explicit teaching order, shared by the library, sidebar and lesson pager. */
const TEACHING_ORDER = ['EDA', 'DATA', 'KNN', 'TREE', 'LOGREG', 'COMPARE', 'TEACHABLE', 'LINREG', 'KMEANS', 'PCA', 'FOREST', 'SVM', 'MLP', 'CNN', 'ATTN', 'GPT', 'AE', 'VAE', 'GAN', 'DIFF', 'GENCON', 'GENAI', 'RAG'];
export function orderLessons<T extends { id: string }>(lessons: readonly T[]): T[] {
  const rank = (id: string) => { const i = TEACHING_ORDER.indexOf(id); return i < 0 ? TEACHING_ORDER.length : i; };
  return [...lessons].sort((a, b) => rank(a.id) - rank(b.id));
}

export const MODE_CLASS: Record<LessonMeta['mode'], string> = {
  'Mô phỏng nguyên lý': 'sim',
  'Huấn luyện thật trên dữ liệu nhỏ': 'real',
  'Suy luận qua API': 'api',
};

export const LESSONS: LessonMeta[] = [
  { id: 'KNN', title: 'KNN: một điểm mới sẽ thuộc nhóm nào', path: '/ml/knn', group: 'ml', mode: 'Huấn luyện thật trên dữ liệu nhỏ', version: LESSON_VERSION,
    goal: 'Hiểu bỏ phiếu láng giềng, vai trò của k và chuẩn hóa; chọn k bằng validation.' },
  { id: 'TREE', title: 'Decision Tree: độ sâu và overfitting', path: '/ml/tree', group: 'ml', mode: 'Huấn luyện thật trên dữ liệu nhỏ', version: LESSON_VERSION,
    goal: 'Quan sát điểm chia Gini/entropy và so sánh train/validation theo độ sâu.' },
  { id: 'LOGREG', title: 'Logistic Regression: ngưỡng và đánh giá', path: '/ml/logistic', group: 'ml', mode: 'Huấn luyện thật trên dữ liệu nhỏ', version: LESSON_VERSION,
    goal: 'Hiểu xác suất, ngưỡng phân loại, confusion matrix, ROC/AUC.' },
  { id: 'KMEANS', title: 'K-means: phân cụm', path: '/ml/kmeans', group: 'ml', mode: 'Huấn luyện thật trên dữ liệu nhỏ', version: LESSON_VERSION,
    goal: 'Hiểu Lloyd từng vòng, khởi tạo, chọn k bằng elbow; phân biệt học không giám sát.' },
  { id: 'PCA', title: 'PCA: giảm chiều', path: '/ml/pca', group: 'ml', mode: 'Huấn luyện thật trên dữ liệu nhỏ', version: LESSON_VERSION,
    goal: 'Xem thành phần chính, phương sai giải thích và hình chiếu 2D.' },
  { id: 'LINREG', title: 'Linear Regression: đường thẳng hồi quy', path: '/ml/regression', group: 'ml', mode: 'Huấn luyện thật trên dữ liệu nhỏ', version: LESSON_VERSION,
    goal: 'Khớp đường thẳng, MSE/RMSE/R² và giới hạn diễn giải.' },
  { id: 'FOREST', title: 'Random Forest: nhiều cây', path: '/ml/forest', group: 'ml', mode: 'Huấn luyện thật trên dữ liệu nhỏ', version: LESSON_VERSION,
    goal: 'So sánh một cây với rừng bootstrap + chọn biến ngẫu nhiên.' },
  { id: 'SVM', title: 'SVM: tuyến tính và kernel', path: '/ml/svm', group: 'ml', mode: 'Huấn luyện thật trên dữ liệu nhỏ', version: LESSON_VERSION,
    goal: 'Hiểu lề, tham số C và kernel (RBF, đa thức) tạo ranh giới cong.' },
  { id: 'COMPARE', title: 'So sánh mô hình', path: '/ml/compare', group: 'ml', mode: 'Huấn luyện thật trên dữ liệu nhỏ', version: LESSON_VERSION,
    goal: 'So sánh KNN, Decision Tree, Logistic Regression và MLP trên cùng dữ liệu, cùng cách chia.' },
  { id: 'TEACHABLE', title: 'Teachable Machine: dạy máy nhận diện ảnh', path: '/ml/teachable', group: 'ml', mode: 'Huấn luyện thật trên dữ liệu nhỏ', version: LESSON_VERSION,
    goal: 'Tạo lớp ảnh từ tệp hoặc webcam, học chuyển giao với MobileNet ngay trên máy, thử ảnh mới và xuất mô hình.' },
  { id: 'EDA', title: 'Khám phá dữ liệu: thống kê mô tả', path: '/eda', group: 'foundation', mode: 'Huấn luyện thật trên dữ liệu nhỏ', version: LESSON_VERSION,
    goal: 'Tải CSV, đọc thống kê mô tả, histogram, biểu đồ hộp, phân tán, tương quan và kiểm tra chất lượng dữ liệu.' },
  { id: 'DATA', title: 'Tiền xử lý dữ liệu: thiếu, ngoại lai, chuẩn hóa', path: '/data', group: 'foundation', mode: 'Huấn luyện thật trên dữ liệu nhỏ', version: LESSON_VERSION,
    goal: 'Điền giá trị thiếu, xử lý ngoại lai, chuẩn hóa và so sánh trước/sau — mọi phép fit chỉ trên tập train.' },
  { id: 'MLP', title: 'MLP: huấn luyện mạng nơ-ron nhỏ', path: '/dl/mlp', group: 'dl', mode: 'Huấn luyện thật trên dữ liệu nhỏ', version: LESSON_VERSION,
    goal: 'Neuron, kích hoạt, forward, loss, gradient descent, backpropagation và overfitting.' },
  { id: 'CNN', title: 'CNN: convolution và pooling', path: '/dl/cnn', group: 'dl', mode: 'Mô phỏng nguyên lý', version: LESSON_VERSION,
    goal: 'Hiểu kernel, stride, padding, feature map, ReLU và pooling qua từng phép tính.' },
  { id: 'ATTN', title: 'Attention: trọng số chú ý', path: '/dl/attention', group: 'dl', mode: 'Mô phỏng nguyên lý', version: LESSON_VERSION,
    goal: 'Xem scaled dot-product attention, softmax và causal mask bằng ví dụ nhỏ.' },
  { id: 'GPT', title: 'Transformer nhỏ: tự huấn luyện mô hình ngôn ngữ', path: '/dl/transformer', group: 'dl', mode: 'Huấn luyện thật trên dữ liệu nhỏ', version: LESSON_VERSION,
    goal: 'Huấn luyện một khối Transformer decoder trên vài câu, sinh văn bản và xem attention đã học.' },
  { id: 'AE', title: 'Autoencoder: nén và tái dựng', path: '/dl/autoencoder', group: 'dl', mode: 'Huấn luyện thật trên dữ liệu nhỏ', version: LESSON_VERSION,
    goal: 'Nén 2 biến qua bottleneck 1 chiều và đo lỗi tái dựng.' },
  { id: 'DIFF', title: 'Diffusion: thêm nhiễu', path: '/dl/diffusion', group: 'dl', mode: 'Mô phỏng nguyên lý', version: LESSON_VERSION,
    goal: 'Xem quá trình thêm nhiễu thuận theo công thức x_t = √ᾱ·x₀ + √(1−ᾱ)·ε.' },
  { id: 'VAE', title: 'VAE: sinh mẫu từ latent', path: '/dl/vae', group: 'dl', mode: 'Huấn luyện thật trên dữ liệu nhỏ', version: LESSON_VERSION,
    goal: 'Hiểu reparameterization, KL và đánh đổi tái dựng–sinh mẫu.' },
  { id: 'GAN', title: 'GAN: sinh và phân biệt', path: '/dl/gan', group: 'dl', mode: 'Huấn luyện thật trên dữ liệu nhỏ', version: LESSON_VERSION,
    goal: 'Quan sát generator và discriminator đối kháng trên dữ liệu 1 chiều.' },
  { id: 'GENCON', title: 'GenAI cơ bản: token, temperature, embedding', path: '/genai/concepts', group: 'genai', mode: 'Mô phỏng nguyên lý', version: LESSON_VERSION,
    goal: 'Hiểu token hóa, softmax/temperature/top-p và độ tương tự embedding bằng ví dụ nhỏ.' },
  { id: 'GENAI', title: 'GenAI Playground: custom context', path: '/genai', group: 'genai', mode: 'Suy luận qua API', version: LESSON_VERSION,
    goal: 'Gọi API Chat Completions trực tiếp, xem payload, so sánh có/không context.' },
  { id: 'RAG', title: 'RAG Lab: truy xuất và dẫn nguồn', path: '/rag', group: 'genai', mode: 'Suy luận qua API', version: LESSON_VERSION,
    goal: 'Chia đoạn, BM25/embedding, ghép context và kiểm tra mã dẫn nguồn.' },
];
