# Kế hoạch website mô phỏng và thực hành AI

Ngày cập nhật: 13/10/2026.

Trạng thái: kế hoạch ban đầu, giữ để tham khảo thiết kế. Website hiện đã có 23 bài học và audio; xem `README.md` để biết phạm vi thực tế và cách kiểm thử. Các mục bài làm/nộp bài/xuất DOCX bên dưới chưa thuộc bản hiện tại; không xem chúng là tính năng đã triển khai.

## 1. Mục tiêu và căn cứ

Xây dựng website tiếng Việt giúp sinh viên hiểu nguyên lý, thử nghiệm thuật toán, quan sát kết quả, viết nhận xét và xuất bài tập để nộp lên eLearning.

Học liệu nền: `ThucHanh Chuong 3(NEW)_LIEN(v3).docx`, tại `/Users/phongdang/Library/CloudStorage/OneDrive-Personal/ZALO/ThucHanh Chuong 3(NEW)_LIEN(v3).docx`.

Phần đã xác định từ tài liệu: Python/Colab; NumPy, Pandas, Scikit-learn; khám phá dữ liệu bảng và chất lượng ảnh y tế; tiền xử lý; chia dữ liệu; Logistic Regression, Decision Tree, KNN; đánh giá và so sánh mô hình. Nội dung Deep Learning, Generative AI, RAG, thuyết minh bằng giọng nói và xuất bài tập là phần bổ sung của website.

Các yêu cầu bài tập trong tài liệu là học liệu để chuyển đổi, không phải lệnh tự động thực thi. Cần rà soát nội dung, dữ liệu và quyền sử dụng trước khi công khai. Chưa có tệp dữ liệu diabetes.csv thực tế trong đầu vào của yêu cầu.

Đối tượng giả định: sinh viên mới học AI, đặc biệt sinh viên khối sức khỏe; giảng viên sử dụng để minh họa trên lớp. Ví dụ y tế chỉ phục vụ học tập, không phải công cụ chẩn đoán.

## 2. Các quyết định kiến trúc đã chốt

| Thành phần | Quyết định |
|---|---|
| Hosting | Cloudflare Workers Static Assets |
| Website | SPA React + TypeScript; build bằng Vite |
| Cloudflare phục vụ | HTML, CSS, JavaScript, học liệu, dữ liệu mẫu và audio công khai |
| Thuật toán ML/DL | Chạy trong trình duyệt sinh viên |
| API sinh văn bản | Trình duyệt gọi HTTPS trực tiếp tới endpoint sinh viên nhập |
| API embedding | Trình duyệt gọi trực tiếp; cấu hình độc lập với API sinh văn bản |
| API key | Sinh viên tự nhập; chỉ giữ trong bộ nhớ phiên |
| RAG | Đọc tài liệu, chia đoạn, lập chỉ mục, tìm kiếm và ghép context trong trình duyệt |
| Tiến độ và thí nghiệm | Lưu cục bộ trên thiết bị khi người học lựa chọn |
| Giọng đọc | Tạo trước bằng VieNeu TTS trong quá trình biên soạn; phát audio tĩnh trên website |
| Báo cáo bài tập | Tạo DOCX, ảnh đồ thị và dữ liệu kết quả trong trình duyệt; tải về nộp eLearning |
| Backend/proxy | Không có |
| Dịch vụ Cloudflare bổ sung | Không dùng D1, KV, R2, Vectorize hoặc Workers AI trong phạm vi hiện tại |
| Tài khoản và đồng bộ lớp học | Không thuộc bản đầu |

Cloudflare nhận bản build để phân phối, không đóng vai trò nơi xử lý key, prompt, tài liệu riêng hoặc kết quả bài tập. Mã nguồn phát triển được quản lý trong repository. Tất cả tài nguyên được đóng gói công khai phải được xem là có thể tải xuống; không đưa bí mật hoặc dữ liệu sinh viên vào bản build.

## 3. Kiến trúc tổng thể và luồng dữ liệu

```text
Quy trình biên soạn của giảng viên/nhà phát triển
  Học liệu + kịch bản → VieNeu TTS → audio + phụ đề + mốc sự kiện
  Mã nguồn + học liệu đã duyệt → build → Cloudflare Static Assets

Cloudflare Static Assets
  └── Website, audio, phụ đề, dữ liệu mẫu công khai
                         ↓
                Trình duyệt sinh viên
                ├── Bài học có giọng đọc
                ├── Bộ mô phỏng ML/DL
                ├── GenAI Playground
                ├── Bộ xử lý tài liệu và RAG
                ├── Khu vực nhận xét và bài tập
                ├── Lưu cục bộ có lựa chọn
                └── Xuất DOCX/PNG/CSV/JSON → tải về → tự nộp eLearning
                         │
                   HTTPS trực tiếp
                 ┌───────┴────────┐
                 ↓                ↓
          API sinh văn bản    API embedding
          sinh viên chọn     sinh viên chọn
```

### 3.1. Ranh giới dữ liệu

- Mô phỏng, đọc file, tìm kiếm từ khóa và xuất báo cáo không cần API key.
- Chọn file không tự tải tài liệu lên Cloudflare hoặc nhà cung cấp AI.
- Embedding từ xa gửi nội dung các đoạn tới endpoint embedding sau khi người học xác nhận.
- Sinh văn bản gửi câu hỏi, lịch sử được chọn và context cuối cùng tới endpoint sinh văn bản.
- Cloudflare của website chỉ phục vụ tài nguyên; vẫn có thể ghi nhận truy cập tài nguyên thông thường.
- Không dùng analytics hoặc session replay để thu prompt, key, tài liệu hay thông tin bài nộp.
- VieNeu chỉ tham gia giai đoạn sản xuất học liệu; trình duyệt không gọi dịch vụ TTS nội bộ.

### 3.2. Hai loại Worker khác nhau

- Cloudflare Workers: hosting tài nguyên website.
- Web Workers: luồng xử lý trong trình duyệt, dùng cho tính toán thuật toán, chia đoạn và tìm kiếm để tránh làm đơ giao diện. Không phải máy chủ riêng.

## 4. Cấu trúc website và trải nghiệm học

Các khu vực chính:

1. Trang chủ và lộ trình học.
2. Nền tảng dữ liệu.
3. Machine Learning.
4. Deep Learning.
5. Generative AI Playground.
6. RAG Lab.
7. Bài tập và báo cáo của tôi.
8. Cấu hình kết nối và dữ liệu cục bộ.

Mỗi bài học gồm: mục tiêu; kiến thức cần biết; lý thuyết ngắn; ví dụ gần gũi; mô phỏng; thực nghiệm; kết quả; câu hỏi nhận xét; xuất bài nộp.

Ba nhãn trải nghiệm phải được phân biệt:

- Mô phỏng nguyên lý: thuật toán hoặc mô hình nhỏ để xem từng phép tính.
- Huấn luyện thật trên dữ liệu nhỏ: số liệu xuất phát từ lần chạy thực tế.
- Suy luận qua API: kết quả nhận từ mô hình bên ngoài.

Không trình bày animation hoặc kết quả dựng sẵn như một lần huấn luyện thật.

### 4.1. Bố cục một trang mô phỏng

- Thanh bên: bài học và tiến độ.
- Khu điều khiển: dữ liệu, tham số, seed, chạy, dừng, chạy từng bước, đặt lại.
- Vùng chính: đồ thị hoặc biểu diễn thuật toán.
- Vùng giải thích: công thức, giá trị hiện tại, diễn giải bằng tiếng Việt.
- Thanh audio: nghe bài, tạm dừng, tốc độ, phát lại đoạn, phụ đề.
- Các tab: kết quả; lý thuyết; mã Python tham khảo; nhận xét; bài nộp.

Chế độ học: có hướng dẫn, tự do thử nghiệm và trình chiếu cho giảng viên. Ưu tiên laptop; thiết bị nhỏ được bố trí tuần tự thay vì ép tất cả khung vào một màn hình.

## 5. Phạm vi nội dung

### 5.1. Nền tảng và Machine Learning

| Module | Tương tác | Sản phẩm học tập |
|---|---|---|
| Khám phá dữ liệu | Chọn biến, phân bố, tương quan, tỷ lệ nhãn | Biểu đồ và nhận xét chất lượng dữ liệu |
| Tiền xử lý | Giá trị thiếu, bất thường, chuẩn hóa | So sánh trước/sau và giải thích lựa chọn |
| Chia dữ liệu | Tỷ lệ train/validation/test và seed | Giải thích đánh giá công bằng, tránh rò rỉ |
| Logistic Regression | Sigmoid, trọng số, loss, ngưỡng | Ranh giới quyết định, xác suất, chỉ số |
| Decision Tree | Điểm chia, Gini/entropy, độ sâu | Cây và đường đi của một mẫu |
| KNN | Khoảng cách, k, chuẩn hóa, bỏ phiếu | Láng giềng, nhãn dự đoán và so sánh k |
| Đánh giá | TP/FP/TN/FN, ngưỡng, ROC | Confusion matrix, precision, recall, specificity, F1, AUC |
| So sánh | Cùng dữ liệu và cách chia | Bảng mô hình và lựa chọn có căn cứ |

Giữ rõ sự khác biệt giữa mô phỏng 2D và mô hình nhiều biến. Không coi hình chiếu 2D là toàn bộ ranh giới nhiều chiều. Các phép fit tiền xử lý chỉ sử dụng train; chọn tham số bằng validation, giữ test cho đánh giá cuối. Dữ liệu cùng bệnh nhân hoặc chuỗi thời gian cần chiến lược chia phù hợp, không mặc định chia ngẫu nhiên.

ML mở rộng sau: Linear Regression, K-means, PCA, SVM, Random Forest.

### 5.2. Deep Learning

Bản đầu: neuron; trọng số và bias; hàm kích hoạt; MLP; forward propagation; loss; gradient descent; backpropagation trên mạng nhỏ; overfitting.

Mở rộng: CNN với kernel/stride/padding/pooling; attention; Transformer thu nhỏ; autoencoder; VAE; GAN; Diffusion minh họa.

Huấn luyện mạng nhỏ có thể dùng TensorFlow.js. Bộ giải thích từng phép tính nên độc lập, có kiểm thử để đối chiếu. Không huấn luyện LLM hoặc mô hình tạo ảnh lớn trong website.

### 5.3. Generative AI

Nội dung: tokenization; embedding; dự đoán token tiếp theo; temperature/top-p; prompt; custom context; RAG; giới hạn mô hình; dẫn nguồn; hallucination; prompt injection.

Phân phối token và attention của mô hình minh họa phải gắn nhãn riêng. Không suy diễn attention hoặc xác suất nội bộ của API nếu API không trả dữ liệu đó. Tokenizer và số token phải được gắn đúng model; nếu không xác định được thì ghi rõ là ước tính.

## 6. Bài lý thuyết sinh động với VieNeu TTS

### 6.1. Mục tiêu sư phạm

Giọng đọc là một lựa chọn hỗ trợ hiểu bài, không bắt buộc người học bật âm thanh. Lời giảng thân thiện, xưng hô gần gũi, giải thích từ ví dụ đến thuật ngữ, tránh chỉ đọc lại công thức hoặc chữ trên màn hình.

Mỗi bài nên chia thành các đoạn ngắn, khoảng 20–45 giây mỗi đoạn; tổng thời lượng khởi điểm khoảng 3–6 phút, sẽ điều chỉnh khi nghe thử. Đây là mục tiêu biên soạn, không phải giới hạn kỹ thuật.

Khung bài:

1. Tình huống gần gũi và câu hỏi gợi mở.
2. Dự đoán của người học trước khi xem kết quả.
3. Giải thích nguyên lý bằng mô phỏng từng bước.
4. Một ví dụ tính toán cụ thể.
5. Thay đổi tham số để tạo tình huống bất ngờ.
6. Câu hỏi kiểm tra và tóm tắt.

### 6.2. Bài mẫu dự kiến về KNN

Tên bài: “Một điểm mới sẽ thuộc nhóm nào”.

| Cảnh | Lời dẫn dự kiến | Mô phỏng hoặc tương tác |
|---|---|---|
| 1 | “Có một điểm mới xuất hiện. Mình chưa biết nó thuộc nhóm xanh hay nhóm cam. Bạn thử đoán nhé.” | Hai nhóm điểm và một điểm chưa có nhãn; dừng chờ lựa chọn |
| 2 | “KNN sẽ nhìn những điểm gần nhất. Với k bằng ba, mình chọn ba người hàng xóm gần điểm này nhất.” | Tô sáng ba láng giềng, hiện khoảng cách |
| 3 | “Hai điểm thuộc nhóm xanh, một điểm thuộc nhóm cam. Nếu bỏ phiếu đều nhau, nhóm xanh thắng.” | Hiện bảng phiếu và nhãn dự đoán |
| 4 | “Nếu tăng k lên bảy thì sao? Bạn kéo thanh trượt trước khi xem đáp án nhé.” | Dừng audio, cho chỉnh k, tính lại thật |
| 5 | “Khoảng cách còn phụ thuộc thang đo. Một biến có số quá lớn có thể lấn át biến còn lại.” | So sánh cùng dữ liệu trước và sau chuẩn hóa |
| 6 | “k lớn hơn không phải lúc nào cũng tốt hơn. Hãy dùng kết quả validation để giải thích lựa chọn của bạn.” | Chuyển sang thực nghiệm và ô nhận xét |

Đây là kịch bản đề xuất, chưa tạo giọng đọc. Nếu đổi dữ liệu khiến kết quả khác, không phát lời dẫn có con số cố định không còn đúng; dùng preset cố định cho phần kể chuyện hoặc chọn lời dẫn phù hợp với trạng thái thực tế.

### 6.3. Quy trình sản xuất audio

1. Viết và duyệt kịch bản, thuật ngữ, công thức và cách phát âm.
2. Chốt giọng với người dùng; khi thực sự tạo audio phải kiểm tra danh sách giọng đang có của dịch vụ VieNeu.
3. Tạo từng clip bằng VieNeu trên dịch vụ hiện có, ngoài luồng sử dụng website.
4. Nghe kiểm tra phát âm, nhịp, khoảng nghỉ và độ rõ; không tự thay engine hoặc giọng.
5. Đo thời lượng thực tế của từng clip.
6. Tạo phụ đề và mốc sự kiện theo audio đã đo, không căn thời gian bằng ước lượng số chữ.
7. Tối ưu định dạng phát web; giữ bản gốc phục vụ biên tập ở ngoài gói triển khai nếu không cần phát.
8. Đưa audio đã duyệt, phụ đề và manifest bài học vào tài nguyên tĩnh.

Không khởi động lại dịch vụ hoặc đổi model/giọng hệ thống nếu chưa được yêu cầu. Không sinh audio trực tiếp khi sinh viên mở bài; không tích hợp dịch vụ VieNeu nội bộ vào website công khai.

### 6.4. Đồng bộ audio và mô phỏng

Mỗi đoạn có: mã cảnh, file audio, thời lượng thực đo, phụ đề, preset ban đầu, mốc sự kiện, điểm dừng tương tác và câu hỏi kiểm tra.

- Dùng thời gian phát audio làm mốc, không dựa duy nhất vào chuỗi timer.
- Tạm dừng/tiếp tục phải giữ trạng thái hợp lý.
- Tua về một thời điểm phải dựng lại đúng trạng thái mô phỏng.
- Đổi tốc độ vẫn giữ đúng các sự kiện theo thời gian media.
- Tại điểm tương tác: dừng lời giảng, chờ sinh viên thao tác rồi cho tiếp tục.
- Không tự phát âm thanh khi mở trang.
- Có transcript đầy đủ, phụ đề, điều khiển bàn phím và chế độ giảm chuyển động.
- Mất audio hoặc lỗi tải không chặn nội dung văn bản và mô phỏng.

## 7. GenAI Playground và cấu hình API

### 7.1. Cấu hình

- Sinh văn bản: tên cấu hình, base URL, model, key.
- Embedding: endpoint, model, key riêng; không mặc định dùng chung key.
- Tham số: temperature, top-p, giới hạn đầu ra, streaming khi model hỗ trợ.
- Nút: kiểm tra kết nối, xem URL cuối, tải model nếu hỗ trợ, dừng yêu cầu, xóa key.

Bản đầu hỗ trợ API tương thích Chat Completions với Bearer key. Những định dạng khác cần adapter riêng. Nhập model thủ công luôn có sẵn; không phụ thuộc chức năng liệt kê model.

Đổi endpoint phải yêu cầu xác nhận hoặc nhập lại key. Chỉ gửi tham số được hỗ trợ. Kiểm tra kết nối chỉ chạy khi bấm, có thông báo khả năng phát sinh phí. Không nhúng key hệ thống vào bản build.

### 7.2. CORS và kết nối

Endpoint phải hỗ trợ HTTPS và cho phép origin, phương thức, header Authorization/Content-Type và preflight cần thiết. Không dùng proxy dự phòng, không dùng no-cors để né lỗi, không yêu cầu tắt bảo mật trình duyệt.

Nếu JavaScript chỉ nhận lỗi mạng chung thì không khẳng định chắc chắn sai key hoặc lỗi CORS; hướng dẫn kiểm tra mạng, TLS, CORS và cấu hình endpoint. Từ chối URL chứa thông tin đăng nhập hoặc key trong query; không tự đi theo redirect sang đích chưa được xác nhận.

### 7.3. Chat, context và so sánh

- System prompt, context, câu hỏi và lịch sử là các khối riêng.
- Xem payload cuối trước khi gửi, luôn che key.
- Bật/tắt context và chọn phần lịch sử cần gửi.
- Cảnh báo giới hạn context; không âm thầm cắt nội dung.
- Streaming, hủy yêu cầu, ghi trạng thái lỗi, thời gian và token do API cung cấp.
- So sánh hai cấu hình cùng câu hỏi; ghi rõ chi phí có thể tăng.
- Không tự retry vô hạn; không đảm bảo bấm Stop sẽ ngừng tính phí phía nhà cung cấp.

## 8. RAG Lab trong trình duyệt

Luồng: file cục bộ → văn bản → kiểm tra văn bản → chia đoạn → lập chỉ mục → truy xuất → xem top-k → ghép context → gọi API → đối chiếu nguồn.

### 8.1. Định dạng và chia đoạn

- Bản đầu: dán văn bản, TXT, Markdown.
- Tiếp theo: PDF có lớp văn bản, DOCX, CSV với quy tắc chuyển dòng thành văn bản.
- PDF scan/OCR và bố cục phức tạp chưa thuộc bản đầu.
- Có preview văn bản để phát hiện lỗi đọc hoặc mất nội dung.
- Chia theo đoạn/tiêu đề; chỉnh kích thước và overlap; xem từng chunk.
- Giữ tên tài liệu, mã đoạn và vị trí nguồn. Chỉ dùng số trang nếu có dữ liệu vị trí đáng tin cậy; không tự suy ra trang DOCX.

### 8.2. Truy xuất

1. Từ khóa: TF-IDF hoặc BM25, chạy cục bộ, không cần API embedding.
2. Ngữ nghĩa: gửi từng batch đoạn đến API embedding đã chọn; lưu vector cục bộ; embedding câu hỏi và tính similarity trong trình duyệt.

Thông báo trước khi embedding rằng nội dung các đoạn sẽ rời thiết bị. Với API sinh văn bản, chỉ gửi context được chọn, không tự gửi toàn bộ kho tài liệu.

### 8.3. Tính đúng và khả năng quan sát

- Hiển thị các chunk, điểm truy xuất, top-k, context cuối và câu trả lời.
- Gắn mã như D2-C7 và cho mở đoạn gốc từ báo cáo nguồn.
- Kiểm tra mã dẫn nguồn có thật trong context; không coi có mã nguồn là đã kiểm chứng nội dung.
- Thiếu bằng chứng thì hướng dẫn mô hình nói rõ; không bảo đảm mô hình luôn tuân thủ.
- Chỉ mục lưu dấu vân tay tài liệu, bộ chia đoạn, endpoint/model embedding, số chiều và phiên bản.
- Đổi cấu hình embedding hoặc chunking phải tạo lại phần chỉ mục liên quan; không trộn vector chỉ vì cùng số chiều.
- Context và tài liệu không có quyền thực thi mã hoặc ghi đè cấu hình hệ thống.

## 9. Sinh viên đánh giá, nhận xét và làm bài tập

### 9.1. Phân biệt hai hình thức đánh giá

- Nhận xét kết quả thí nghiệm: giải thích dữ liệu, đồ thị, mô hình và lựa chọn của sinh viên; đây là nội dung chính của bài nộp.
- Tự đánh giá mức độ hiểu bài: thang mức độ tự tin và câu hỏi còn chưa rõ; không thay thế đánh giá của giảng viên.

Không mặc định gửi phản hồi về máy chủ vì website không có backend. Nếu cần giảng viên thu nhận thì đưa vào báo cáo để sinh viên nộp eLearning.

### 9.2. Các ô nhập trên mỗi bài

1. Dự đoán trước khi chạy: kết quả mong đợi và lý do.
2. Quan sát: dữ liệu hoặc đồ thị thay đổi như thế nào.
3. Giải thích: liên hệ với cơ chế thuật toán.
4. So sánh: cấu hình nào khác nhau, thay đổi chỉ số ra sao.
5. Kết luận: lựa chọn và căn cứ từ kết quả.
6. Hạn chế: dữ liệu, cách chia, nhiễu, độ ngẫu nhiên, bằng chứng còn thiếu.
7. Tự đánh giá: mức độ hiểu và câu hỏi muốn trao đổi.

Có hướng dẫn ngắn theo từng ô, lưu nháp có lựa chọn, báo mục bắt buộc chưa điền. Không tự dùng AI viết nhận xét thay sinh viên. Nếu sau này thêm gợi ý AI thì phải tách rõ và ghi nhận trong bài nộp.

### 9.3. Gắn kết quả vào bài làm

Sinh viên bấm “Thêm kết quả này vào bài làm” sau một lần chạy. Hệ thống chụp một snapshot bất biến gồm dữ liệu/cấu hình liên quan, chỉ số, biểu đồ và thời điểm. Thay tham số sau đó không được âm thầm làm thay đổi kết quả đã gắn.

Cho phép chọn nhiều lần chạy, đặt tên, thêm chú thích và chọn đồ thị đưa vào báo cáo. Biểu đồ xuất phải có tiêu đề, trục, đơn vị, chú giải và cấu hình tương ứng. Bảng dữ liệu trong báo cáo là bảng có thể chỉnh sửa, không chỉ là ảnh chụp.

### 9.4. Ví dụ bài tập

| Bài | Yêu cầu | Minh chứng bắt buộc |
|---|---|---|
| KNN | Thử k = 3, 5, 7, 9 với cùng cách chia dữ liệu | Bảng chỉ số, đồ thị theo k, nhận xét và lựa chọn bằng validation |
| Decision Tree | So sánh ít nhất ba độ sâu | Hình cây, kết quả train/validation, giải thích overfitting |
| Ngưỡng phân loại | So sánh các ngưỡng trên cùng mô hình | Confusion matrix, precision/recall và đánh đổi |
| MLP | Thay learning rate, giữ các yếu tố khác | Loss curve, trạng thái hội tụ và giải thích |
| Custom context | Cùng câu hỏi, có và không có context | Payload đã che thông tin nhạy cảm, câu trả lời, nhận xét |
| RAG | Thay chunk size hoặc top-k | Đoạn được truy xuất, nguồn, câu trả lời và kiểm tra hỗ trợ |

Rubric gợi ý: quy trình và khả năng tái lập 25%; minh chứng kết quả 25%; giải thích và lập luận 35%; hạn chế, nguồn và trình bày 15%. Đây là đề xuất để giảng viên điều chỉnh, không phải thang điểm tự động đã chốt.

## 10. Xuất báo cáo và nộp eLearning

### 10.1. Định dạng

- DOCX: sản phẩm nộp chính, sinh ngay trong trình duyệt bằng thư viện JavaScript được kiểm chứng.
- PNG: từng đồ thị hoặc hình mô phỏng, đủ rõ khi đưa vào báo cáo.
- CSV: bảng kết quả so sánh, không kèm dữ liệu nhạy cảm mặc định.
- JSON: cấu hình và snapshot để mở lại thí nghiệm, có schema/version, không chứa key.
- ZIP gộp tệp: tùy chọn sau khi luồng DOCX ổn định.
- PDF: chưa bắt buộc; có thể cân nhắc bản in riêng về sau, không hứa DOCX và PDF giống hệt nhau.

Không gọi dịch vụ chuyển đổi tài liệu bên ngoài. Việc xem trước báo cáo trên web không bảo đảm hoàn toàn bố cục Word; cần kiểm thử DOCX thực tế trong giai đoạn phát triển.

### 10.2. Cấu trúc báo cáo DOCX

1. Tên bài, mã bài và phiên bản học liệu.
2. Thông tin sinh viên tự nhập: họ tên, mã sinh viên, lớp/nhóm; thông tin giảng viên nếu yêu cầu.
3. Mục tiêu và câu hỏi nghiên cứu/thực hành.
4. Dữ liệu: nguồn, số mẫu, biến, cách chia; không nhúng toàn bộ dữ liệu mặc định.
5. Cấu hình thí nghiệm: tham số, seed, phiên bản thuật toán hoặc model API.
6. Kết quả: bảng chỉ số, đồ thị, hình mô phỏng, chú thích và số thứ tự.
7. Nhận xét và trả lời câu hỏi của sinh viên.
8. So sánh, kết luận và hạn chế.
9. Nguồn tham khảo hoặc nguồn RAG, khi được chọn.
10. Tự đánh giá và khai báo sử dụng AI nếu giảng viên yêu cầu.
11. Phụ lục cấu hình tái lập, không chứa key.

Riêng GenAI: không mặc định nhúng toàn bộ hội thoại hoặc tài liệu gốc; cho chọn nội dung, xem trước và loại bỏ thông tin riêng tư. Với endpoint, mặc định chỉ ghi nhãn nhà cung cấp và model; không xuất URL có thông tin xác thực, query bí mật hoặc địa chỉ nội bộ nhạy cảm.

### 10.3. Luồng sinh viên nộp bài

```text
Chọn bài → chạy thí nghiệm → gắn snapshot kết quả
 → viết nhận xét → xem mục còn thiếu
 → xem trước báo cáo và kiểm tra dữ liệu riêng tư
 → tải DOCX và tệp đính kèm nếu cần
 → sinh viên tự tải lên eLearning
```

Gợi ý tên file: `MaSV_MaBai_HoTen.docx`, chuẩn hóa ký tự không hợp lệ. Không lấy thời điểm máy sinh viên làm bằng chứng chống gian lận. Báo cáo và JSON phía client có thể chỉnh sửa; không tuyên bố tính xác thực được bảo đảm bằng checksum hoặc chữ ký không có hạ tầng tin cậy.

Không tự đăng nhập, tích hợp, chấm điểm hoặc nộp bài lên eLearning trong phạm vi hiện tại. Giới hạn dung lượng tệp và yêu cầu đặt tên cần đối chiếu với quy định eLearning thực tế trước khi chốt mẫu.

## 11. Lưu trữ và bảo mật

| Dữ liệu | Chính sách mặc định |
|---|---|
| Key | Chỉ bộ nhớ; tải lại trang phải nhập lại |
| Endpoint/model/tham số | Có thể lưu cục bộ, không kèm key |
| Tiến độ | Cục bộ |
| Nhận xét và thông tin sinh viên | Lưu nháp cục bộ khi đồng ý; có chế độ không lưu cho máy dùng chung |
| Tài liệu, vector, hội thoại | Chỉ trong phiên, lưu lâu dài khi người học chọn |
| Báo cáo | Tải xuống thiết bị; không tải lên hosting |

IndexedDB dành cho dữ liệu có cấu trúc, snapshot và chỉ mục. Cần xử lý hết dung lượng, dữ liệu bị xóa/thu hồi, phiên bản schema và di chuyển dữ liệu. Lưu cục bộ không phải bản sao lưu; có nút xuất nháp và xóa toàn bộ dữ liệu.

Biện pháp:

- Không nhúng key dùng chung hoặc biến môi trường bí mật vào frontend.
- Không log Authorization, prompt hoặc nội dung file.
- Làm sạch Markdown/HTML; không render script hoặc tự tải ảnh ngoài từ đầu ra AI.
- Không chạy code do model/tài liệu sinh ra.
- Hạn chế script bên thứ ba; đóng gói thư viện được kiểm soát.
- CSP hạn chế script; connect-src cần cân bằng giữa endpoint tùy chỉnh và giới hạn đích kết nối.
- Không đặt thông tin cá nhân vào URL hoặc liên kết chia sẻ.
- Key cá nhân nên có hạn mức thấp và khả năng thu hồi ở nhà cung cấp.
- Giới hạn client chỉ hỗ trợ trải nghiệm; không thay thế hạn mức tài chính của nhà cung cấp.

Key trong trình duyệt không an toàn tuyệt đối trước XSS, extension độc hại hoặc máy dùng chung. Giữ key trong bộ nhớ không loại bỏ các rủi ro đó. Không dùng dữ liệu bệnh nhân có định danh cho bài thực hành.

## 12. Tổ chức mã nguồn dự kiến

```text
src/
  app/                    Điều hướng, bố cục
  lessons/                Nội dung và định nghĩa bài học
  features/
    data-lab/             Khám phá và tiền xử lý
    ml-lab/               Machine Learning
    dl-lab/               Deep Learning
    genai-playground/     Chat, context, so sánh
    rag-lab/              Tài liệu và truy xuất
    narrated-lessons/     Giọng đọc, phụ đề, đồng bộ
    assignments/          Nhận xét, snapshot, rubric
    reports/              Preview và xuất DOCX/ảnh/dữ liệu
    settings/             Cấu hình API và lưu trữ
  core/
    algorithms/           Tính toán độc lập giao diện
    simulation/           Trạng thái, seed, từng bước, phát lại
    providers/            Adapter API, streaming, xử lý lỗi
    rag/                  Chunking, indexing, retrieval
    narration/            Timeline và sự kiện cảnh
    reporting/            Mô hình báo cáo và bộ xuất
    storage/              Schema, IndexedDB, nhập/xuất
    security/             Kiểm tra URL, che key, làm sạch đầu ra
  workers/                Web Workers của trình duyệt
  components/             Thành phần dùng chung
public/
  datasets/               Dữ liệu mẫu công khai
  audio/                  Audio VieNeu đã duyệt
  captions/               Phụ đề
  examples/               Preset và bài tập mẫu
tests/
```

Mô hình dữ liệu cốt lõi: Lesson, SimulationRun, NarrationSegment, ProviderProfile không chứa key, Document, Chunk, IndexManifest, AssignmentDefinition, StudentDraft, EvidenceSnapshot, ReportManifest. Key được giữ trong kho phiên riêng, không đi qua bộ serialize/export.

## 13. Hiệu năng và khả năng tiếp cận

Giới hạn khởi điểm để benchmark, chưa phải cam kết hiệu năng:

- Vài trăm đến vài nghìn điểm cho mô phỏng tùy thuật toán.
- Mạng nhỏ, giới hạn neuron/lớp/epoch.
- Kho RAG ban đầu khoảng 10 tài liệu và tối đa khoảng 1.000 đoạn.
- Giới hạn kích thước file, độ dài văn bản sau giải nén và kích thước ảnh để tránh cạn bộ nhớ.
- Embedding theo batch, ít yêu cầu đồng thời, có hủy và tiến độ.
- Giới hạn số biểu đồ trong báo cáo hoặc cảnh báo dung lượng trước khi xuất.
- Audio tải theo bài/đoạn cần nghe, không tải toàn bộ khóa học.
- Lazy load thư viện DL, đọc tài liệu và xuất DOCX theo tính năng.
- Giải phóng tensor, object URL và dữ liệu tạm sau khi dùng.

Phụ đề và transcript luôn có sẵn; không chỉ dùng màu để phân biệt lớp; biểu đồ có bảng dữ liệu thay thế; hỗ trợ bàn phím, độ tương phản và giảm chuyển động. Lỗi audio không chặn bài học. Mất mạng không làm mất phần nhận xét đang viết; API chỉ hoạt động lại khi có kết nối.

## 14. Lộ trình triển khai và tiêu chí hoàn thành

| Giai đoạn | Công việc | Điều kiện hoàn thành |
|---|---|---|
| 0. Kiểm chứng | Hosting tĩnh, endpoint thật, CORS, streaming, embedding; thử xuất DOCX với đồ thị; phát audio mẫu | Không có proxy; kết nối trực tiếp được; DOCX mở đúng; audio điều khiển được |
| 1. Chuẩn hóa học liệu | Chốt mục tiêu, dữ liệu, thuật ngữ, rubric và mẫu báo cáo | Một bài KNN có đủ lý thuyết, mô phỏng, câu hỏi, báo cáo và kịch bản voice |
| 2. Khung ứng dụng | Điều hướng, engine từng bước, lưu nháp, snapshot, báo cáo | Hoàn thành một bài từ học đến tải bài nộp |
| 3. ML cốt lõi | Dữ liệu, Logistic Regression, Decision Tree, KNN, đánh giá | Kiểm chứng chỉ số và cách chia; các bài có ô nhận xét và minh chứng |
| 4. GenAI | Cấu hình API, chat, custom context, so sánh | Xử lý lỗi và key đúng; xuất kết quả không rò dữ liệu |
| 5. RAG | TXT/Markdown, chunking, từ khóa, embedding, nguồn | Quan sát được luồng, xác nhận dữ liệu gửi ra ngoài |
| 6. DL và voice | Neuron, MLP, gradient descent; sản xuất audio từng bài | Đồng bộ đúng, có phụ đề, không phụ thuộc TTS khi sử dụng |
| 7. Hoàn thiện | PDF/DOCX input, tối ưu, kiểm thử đa trình duyệt, thí điểm lớp học | Tải và nộp được bài theo yêu cầu eLearning thực tế |

Không cần chờ cuối dự án mới thêm báo cáo và voice: bài mẫu đầu tiên phải kiểm chứng trọn luồng. Các bài sau tái sử dụng mẫu đã đạt yêu cầu. Chưa chốt thời gian và chi phí trước khi duyệt phạm vi, giọng đọc, mẫu báo cáo và endpoint thực tế.

## 15. Kiểm thử và nghiệm thu

### Kiến trúc và bảo mật

- Network log: hosting chỉ nhận tài nguyên; API sinh văn bản/embedding đi đúng endpoint.
- Không có key trong persistent storage, URL, export, console, source map hoặc bản build.
- Đổi endpoint không tự mang key cũ sang.
- Không có proxy, backend hoặc tải dữ liệu học tập ẩn.
- Nội dung tài liệu/AI không chạy script, không tự gửi mạng hoặc gọi công cụ.

### Thuật toán

- Đối chiếu bằng fixture đã kiểm chứng; kiểm tra kết quả biên, mẫu số bằng 0, nhãn đơn lớp và dữ liệu lỗi.
- Chạy từng bước và chạy toàn bộ nhất quán.
- Dữ liệu, seed và cấu hình được ghi nhận; không hứa tái lập tuyệt đối API bên ngoài.
- ROC/AUC sử dụng score phù hợp; không biến trường hợp chỉ có một lớp thành chỉ số giả.
- Snapshot không thay đổi khi tiếp tục chỉnh tham số.

### GenAI và RAG

- Kiểm tra lỗi key, model, quota, timeout, CORS/mạng, streaming ngắt và định dạng sai.
- Không âm thầm cắt context hoặc gửi toàn bộ kho tài liệu.
- Dẫn nguồn truy ngược được; phát hiện mã nguồn không tồn tại.
- Thay model embedding không tái sử dụng chỉ mục không tương thích.

### Voice

- Nghe kiểm tra từng clip; không thay giọng/engine âm thầm.
- Duration thực tế khớp manifest; pause, seek, đổi tốc độ và phát lại giữ đúng trạng thái.
- Phụ đề đúng nội dung và dấu tiếng Việt.
- Không gọi dịch vụ VieNeu từ trình duyệt sinh viên.
- Bài học vẫn dùng được khi tắt âm thanh hoặc audio lỗi.

### Báo cáo bài tập

- DOCX có tiếng Việt đúng, không cắt chữ, mất hình hoặc vỡ bảng.
- Kiểm tra báo cáo ngắn và dài, đồ thị nhiều nhãn, bảng rộng, không có kết quả và nhận xét chưa hoàn thành.
- Render và kiểm tra trực quan DOCX mẫu trong quá trình phát triển; mở thử bằng Word và một trình đọc DOCX khác.
- Số liệu trong DOCX/CSV/JSON khớp snapshot đã chọn.
- Ảnh đủ rõ, có trục, chú giải, đơn vị và caption.
- Không có key; thông tin riêng tư được xem trước; tên file phù hợp.
- Mất mạng không chặn xuất bài đã có đầy đủ dữ liệu cục bộ và module cần thiết.
- Sinh viên tải về và tự nộp thành công trên eLearning thử nghiệm; không tuyên bố đã nộp chỉ vì đã tải file.

### Thiết bị

Kiểm thử Chrome/Edge, Firefox và Safari trên laptop; ghi rõ giới hạn thiết bị. Có phương án giảm tải cho máy yếu, thông báo hết bộ nhớ/lưu trữ và không mất nháp ngoài dự kiến.

## 16. Những điểm cần xác nhận trước khi triển khai

1. Endpoint sinh văn bản và embedding thực tế để thử CORS từ tên miền triển khai.
2. Bộ dữ liệu mẫu cùng nguồn và quyền sử dụng.
3. Giọng VieNeu, cách xưng hô và tốc độ thuyết minh mong muốn.
4. Thông tin bắt buộc trên bài nộp, mẫu DOCX và rubric của giảng viên.
5. Quy định eLearning: định dạng, dung lượng và cách đặt tên.
6. Danh sách bài nằm trong đợt phát hành đầu; ưu tiên hoàn thiện một bài KNN trọn luồng.

Các mục này là điểm chốt cho giai đoạn triển khai, không ngăn việc duyệt bản kế hoạch hiện tại.

## 17. Tài liệu kỹ thuật đã đối chiếu

- Cloudflare Static Assets: https://developers.cloudflare.com/workers/static-assets/
- Cloudflare SPA routing: https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/
- React + Vite trên Cloudflare: https://developers.cloudflare.com/workers/framework-guides/web-apps/react/
- CORS: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS
- Web Workers: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
- IndexedDB: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- CSP connect-src: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/connect-src
- TensorFlow.js: https://www.tensorflow.org/js/tutorials
- Tránh data leakage: https://scikit-learn.org/stable/common_pitfalls.html

Hướng dẫn vận hành VieNeu đã được dùng để xác định quy trình tạo audio trước, kiểm tra giọng đang có khi thực hiện và đồng bộ theo thời lượng clip thực tế. Chưa kiểm tra dịch vụ đang chạy và chưa tạo audio trong công việc lập kế hoạch này.
