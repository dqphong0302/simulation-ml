# 🤖 Simulation ML: Nền tảng Mô Phỏng & Thực Hành Trí Tuệ Nhân Tạo

<p align="center">
  <img src="https://img.shields.io/badge/React-19.3-61dafb?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178c6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8.x-646cff?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Vitest-Passing-449f2b?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest" />
  <img src="https://img.shields.io/badge/Cloudflare-Workers%20%2F%20Pages-f38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="MIT License" />
</p>

**Simulation ML** là nền tảng học tập và nghiên cứu AI/Machine Learning tương tác trực quan (Interactive AI/ML Laboratory) chạy hoàn toàn trên trình duyệt web. Nền tảng kết hợp giữa **mô phỏng toán học trực quan**, **huấn luyện trực tiếp trên trình duyệt (in-browser training)** và **hệ thống bài giảng đồng bộ âm thanh đa phương tiện (slide + audio voiceover)**.

---

## 🌟 Điểm nổi bật (Key Features)

- **23 Bài học & Thực hành Chuyên sâu**: Phủ khắp 4 trục kiến thức từ Nền tảng Dữ liệu, Machine Learning cổ điển, Deep Learning đến Generative AI / RAG.
- **Client-Side First & Bảo mật Dữ liệu**: Toàn bộ thuật toán huấn luyện, tiền xử lý và suy luận chạy 100% tại trình duyệt của người dùng thông qua **Web Workers** đa luồng. Không gửi dữ liệu người dùng về máy chủ.
- **Xử lý Dữ liệu Lớn (Worker-powered Ingestion)**: Hỗ trợ tệp CSV/TSV/TXT lên đến 100 MiB (đọc streaming theo khối), Excel (XLSX/XLS) & JSON lên đến 30 MiB với giới hạn an toàn 200.000 dòng / 2.000.000 ô dữ liệu.
- **Đa phương tiện Đồng bộ**: Toàn bộ 23 bài học đều tích hợp khung bài giảng chuẩn 16:9, hình minh họa trực quan và thuyết minh âm thanh giọng đọc tiếng Việt chất lượng cao (neural TTS).
- **RAG Lab & OCR Tài liệu**: Cho phép tải lên tệp TXT, Markdown, CSV, DOCX và PDF (có lớp văn bản hoặc ảnh scan qua client-side Tesseract.js), thực hiện chunking, truy xuất lai (BM25 + Semantic Embedding) và kiểm toán dẫn nguồn (citation check).

---

## 📚 Danh mục 23 Bài Thực hành (Curriculum Matrix)

### 📊 1. Nền tảng Dữ liệu (Data Foundation)
| Mã | Bài học | Đường dẫn | Chế độ | Mục tiêu cốt lõi |
|---|---|---|---|---|
| `EDA` | **Khám phá dữ liệu (EDA)** | `#/eda` | Huấn luyện thật | Tải bảng dữ liệu bất kỳ, thống kê mô tả, histogram phân tầng, boxplot, ma trận tương quan và cảnh báo chất lượng dữ liệu. |
| `DATA` | **Tiền xử lý dữ liệu** | `#/data` | Huấn luyện thật | Xử lý giá trị khuyết thiếu (imputation), lọc ngoại lai (outliers), chuẩn hóa (Scaler) và nguyên tắc fit độc quyền trên tập Train. |

### 🧠 2. Machine Learning Cổ điển
| Mã | Bài học | Đường dẫn | Chế độ | Mục tiêu cốt lõi |
|---|---|---|---|---|
| `KNN` | **K-Nearest Neighbors** | `#/ml/knn` | Huấn luyện thật | Bỏ phiếu láng giềng, tác động của khoảng cách & chuẩn hóa, chọn $k$ tối ưu qua validation curve. |
| `TREE` | **Decision Tree** | `#/ml/tree` | Huấn luyện thật | Điểm cắt Gini/Entropy, trực quan hóa cây quyết định, ranh giới phân loại và hiện tượng Overfitting theo độ sâu. |
| `LOGREG` | **Logistic Regression** | `#/ml/logistic` | Huấn luyện thật | Xác suất Sigmoid, tối ưu ngưỡng phân loại (threshold), Confusion Matrix, ROC/AUC. |
| `KMEANS` | **K-Means Clustering** | `#/ml/kmeans` | Huấn luyện thật | Thuật toán Lloyd từng bước, chiến lược khởi tạo tâm cụm, Elbow Method và bài toán học không giám sát. |
| `PCA` | **Principal Component Analysis** | `#/ml/pca` | Huấn luyện thật | Ma trận hiệp phương sai, véc-tơ riêng, tỉ lệ phương sai giải thích (explained variance) và chiếu giảm chiều 2D. |
| `LINREG` | **Linear Regression** | `#/ml/regression` | Huấn luyện thật | Đường hồi quy tuyến tính, hàm mất mát OLS, đánh giá sai số MSE, RMSE và hệ số xác định $R^2$. |
| `FOREST` | **Random Forest** | `#/ml/forest` | Huấn luyện thật | Kỹ thuật Ensemble: Bootstrap Aggregating (Bagging), lựa chọn đặc trưng ngẫu nhiên và giảm phương sai mô hình. |
| `SVM` | **Support Vector Machines** | `#/ml/svm` | Huấn luyện thật | Ranh giới phân chia siêu phẳng tối đa hóa biên (Margin), tham số phạt $C$, Kernel RBF và Đa thức. |
| `COMPARE` | **So sánh Mô hình (Benchmark)** | `#/ml/compare` | Huấn luyện thật | Đối đầu trực diện KNN, Decision Tree, Logistic Regression và MLP trên cùng phân đoạn Train/Test/Val. |
| `TEACHABLE`| **Teachable Machine In-Browser** | `#/ml/teachable` | Huấn luyện thật | Học chuyển giao (Transfer Learning) trực tiếp bằng MobileNet qua webcam hoặc tệp ảnh; xuất mô hình phân loại. |

### ⚡ 3. Deep Learning (Mạng Nơ-ron)
| Mã | Bài học | Đường dẫn | Chế độ | Mục tiêu cốt lõi |
|---|---|---|---|---|
| `MLP` | **Multi-Layer Perceptron** | `#/dl/mlp` | Huấn luyện thật | Tự cài đặt thuật toán Lan truyền thuận (Forward) và Lan truyền ngược (Backpropagation) bằng TypeScript thuần. |
| `CNN` | **Convolutional Neural Network** | `#/dl/cnn` | Mô phỏng nguyên lý | Khảo sát chi tiết phép tính tích chập (Kernel/Stride/Padding), bản đồ đặc trưng (Feature Map) và Max Pooling. |
| `ATTN` | **Cơ chế Tự chú ý (Attention)** | `#/dl/attention` | Mô phỏng nguyên lý | Mô phỏng Scaled Dot-Product Attention: $Q, K, V$, Softmax và Causal Masking cho chuỗi tuần tự. |
| `GPT` | **Transformer Ngôn ngữ Nhỏ** | `#/dl/transformer` | Huấn luyện thật | Huấn luyện một khối Transformer Decoder mini trực tiếp trong trình duyệt, trực quan hóa ma trận Attention. |
| `AE` | **Autoencoder** | `#/dl/autoencoder` | Huấn luyện thật | Nén dữ liệu qua nút cổ chai (Bottleneck), giải nén và đo lường sai số tái dựng (Reconstruction Loss). |
| `VAE` | **Variational Autoencoder** | `#/dl/vae` | Huấn luyện thật | Thủ thuật tái tham số hóa (Reparameterization Trick), không gian ẩn liên tục và hàm mất mát KL Divergence. |
| `GAN` | **Generative Adversarial Network** | `#/dl/gan` | Huấn luyện thật | Cuộc đối đầu minimax giữa Generator (mạng sinh) và Discriminator (mạng phân biệt) trên phân phối 1D. |
| `DIFF` | **Diffusion Model** | `#/dl/diffusion` | Mô phỏng nguyên lý | Mô phỏng quá trình khuếch tán thuận (Forward Noise Scheduling) $x_t = \sqrt{\bar{\alpha}_t}x_0 + \sqrt{1-\bar{\alpha}_t}\epsilon$. |

### ✨ 4. Generative AI & Ứng dụng Hiện đại
| Mã | Bài học | Đường dẫn | Chế độ | Mục tiêu cốt lõi |
|---|---|---|---|---|
| `GENCON` | **Nguyên lý GenAI cốt lõi** | `#/genai/concepts` | Mô phỏng nguyên lý | Phân tích giải mã Token, phân phối Softmax, Temperature, Top-p sampling và không gian Vector Embedding. |
| `GENAI` | **GenAI Playground** | `#/genai` | Suy luận qua API | Giao diện thử nghiệm Prompt Engineering, tùy biến System Prompt, Custom Context và gọi trực tiếp OpenAI-compatible API. |
| `RAG` | **RAG Lab (Truy xuất & Dẫn nguồn)** | `#/rag` | Suy luận qua API | Pipeline RAG hoàn chỉnh: phân đoạn văn bản, lập chỉ mục BM25 + Semantic Vector, truy xuất ngữ cảnh và xác thực trích dẫn nguồn. |

---

## 🛠️ Kiến trúc Kỹ thuật (Technical Architecture)

```
simulation-ml/
├── src/
│   ├── app/               # Bộ điều hướng, giao diện Khám phá dữ liệu, Trình nhập liệu
│   ├── core/              # Thuật toán ML/DL thuần: Matrix, KNN, SVM, Tree, MLP, RAG
│   ├── features/          # Các Lab tương tác chi tiết từng bài học
│   ├── lessons/           # Metadata 23 bài học, kịch bản thuyết minh, tài liệu lý thuyết
│   │   └── theory/        # Tài liệu lý thuyết chuyên sâu Markdown cho từng bài
│   ├── workers/           # Web Workers: import, huấn luyện MLP, GPT decoder, so sánh mô hình
│   └── styles.css         # Hệ thống giao diện hiện đại, tối ưu hiển thị khoa học
├── public/
│   ├── audio/             # Âm thanh thuyết minh slide bài giảng chất lượng cao (VieNeu AI)
│   ├── datasets/          # Bộ dữ liệu mẫu chuẩn (Pima Indians Diabetes, v.v.)
│   └── models/            # Trọng số MobileNet phục vụ bài học Teachable Machine
├── tests/                 # Kiểm thử tự động thuật toán (Vitest) & E2E (Playwright)
└── wrangler.jsonc         # Cấu hình triển khai Cloudflare Workers / Pages
```

### Công nghệ nền tảng:
- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build tool**: [Vite 8](https://vitejs.dev/)
- **Engine tính toán song song**: Web Worker API (không làm đơ UI khi huấn luyện hoặc xử lý file nặng)
- **Tài liệu & OCR**: [PDF.js](https://mozilla.github.io/pdf.js/), [SheetJS (xlsx)](https://sheetjs.com/), [Tesseract.js](https://tesseract.projectnaptha.com/), [JSZip](https://stuk.github.io/jszip/)
- **Kiểm thử**: [Vitest](https://vitest.dev/) (Unit test thuật toán), [Playwright](https://playwright.dev/) (Kiểm thử giao diện & Slide)

---

## 🚀 Cài đặt & Khởi chạy (Getting Started)

### Yêu cầu môi trường
- **Node.js**: Phiên bản 20.x trở lên
- **pnpm**: Đề xuất dùng `pnpm` (hoặc `npm`)

### 1. Cài đặt thư viện phụ thuộc
```bash
pnpm install
```

### 2. Khởi chạy máy chủ phát triển (Development Server)
```bash
pnpm run dev
```
Mở trình duyệt tại: `http://localhost:5173`

### 3. Kiểm thử tự động (Testing)
```bash
# Chạy bộ unit test thuật toán, logic CSV/Excel, bảo mật cấu hình
pnpm test

# Kiểm thử giao diện và điều hướng toàn bộ 23 trang thực hành (cần dev server đang chạy)
pnpm run test:ui

# Kiểm thử slide và đồng bộ audio toàn bộ bài học
pnpm run test:lectures

# Kiểm thử quy trình nạp dữ liệu (CSV, Excel, JSON, lỗi ngoại lệ, hủy tác vụ)
pnpm run test:imports
```

### 4. Đóng gói bản Production
```bash
pnpm run build
```

---

## 🌐 Triển khai (Deployment)

Dự án được cấu hình sẵn sàng để triển khai lên hạ tầng toàn cầu của **Cloudflare Pages / Workers Static Assets**:

```bash
pnpm run deploy
```
Lệnh trên sẽ tự động biên dịch ứng dụng (`pnpm run build`) và phát hành qua Cloudflare Wrangler.

---

## 📄 Bản quyền (License)

Dự án được phát hành theo giấy phép [MIT License](LICENSE). Mọi đóng góp, báo lỗi và yêu cầu tính năng đều được hoan nghênh qua GitHub Issues và Pull Requests!
