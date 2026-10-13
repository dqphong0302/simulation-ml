/** Lý thuyết nhóm Nền tảng dữ liệu và Generative AI. */
export const OTHER_THEORY: Record<string, string> = {
EDA: `
Thống kê mô tả là bước đầu tiên khi gặp một bộ dữ liệu: tóm tắt mỗi biến bằng vài con số và biểu đồ, xem các biến liên quan nhau ra sao, và phát hiện vấn đề chất lượng. Bước này **chỉ mô tả**, chưa suy luận hay dự đoán.

## Nhận diện cấu trúc
- **Đơn vị quan sát**: mỗi hàng là ai/cái gì (một bệnh nhân, một giao dịch, một ngày).
- **Kiểu biến**: số liên tục (glucose), số đếm (số lần mang thai), phân loại danh nghĩa (khu vực), phân loại thứ bậc (mức độ), ngày giờ, văn bản.
- **Biến mục tiêu**: cột cần dự đoán (nếu có) — mọi phân tích theo nhóm đều xoay quanh nó.
- **Đơn vị đo**: mg/dL, kg/m², năm… Cùng con số, khác đơn vị là khác hẳn ý nghĩa.

## Đo xu hướng trung tâm
$$ Trung bình x̄ = (1/n) Σ xᵢ
- **Median**: giá trị đứng giữa khi sắp xếp; một nửa dữ liệu nhỏ hơn, một nửa lớn hơn.
- **Mode**: giá trị xuất hiện nhiều nhất (hữu ích cho biến phân loại).
Trung bình bị kéo bởi giá trị cực đoan; median thì không. Phân bố lệch phải (đuôi dài bên phải, như thu nhập, insulin) có trung bình > median.

## Đo độ phân tán
$$ Độ lệch chuẩn s = √( Σ (xᵢ − x̄)² / (n − 1) )
- **Khoảng biến thiên**: max − min, rất nhạy với ngoại lai.
- **Tứ phân vị**: Q1 (25%), Q2 = median (50%), Q3 (75%).
$$ IQR = Q3 − Q1
IQR là độ rộng của 50% dữ liệu ở giữa, bền với ngoại lai. Quy tắc Tukey: giá trị ngoài [Q1 − 1,5·IQR; Q3 + 1,5·IQR] là ứng viên ngoại lai.

## Hình dạng phân bố
- **Histogram**: chia trục thành các khoảng, đếm số mẫu mỗi khoảng. Số khoảng ảnh hưởng hình dạng nhìn thấy — thử vài mức.
- **Độ lệch (skewness)**: > 0 đuôi phải dài, < 0 đuôi trái dài; |skew| > 2 là lệch mạnh.
- **Đa đỉnh**: hai đỉnh thường gợi ý dữ liệu trộn hai nhóm.
- **Biểu đồ hộp (boxplot)**: hộp từ Q1 tới Q3, vạch median, râu tới giá trị xa nhất trong 1,5·IQR, chấm là ngoại lai. Rất gọn để so sánh nhiều nhóm.

## Biến phân loại
Bảng tần suất và tỷ lệ phần trăm, vẽ bằng biểu đồ cột (không dùng histogram). Chú ý mức hiếm và cách viết không thống nhất ("Hà Nội", "Ha Noi", "HN").

## Quan hệ giữa hai biến
- Hai biến số: **biểu đồ phân tán** và hệ số tương quan Pearson:
$$ r = Σ (xᵢ − x̄)(yᵢ − ȳ) / √( Σ (xᵢ − x̄)² · Σ (yᵢ − ȳ)² )
r ∈ [−1, 1]: gần 1 cùng tăng, gần −1 ngược chiều, gần 0 không có quan hệ **tuyến tính** (có thể vẫn có quan hệ cong). Một điểm ngoại lai có thể làm r thay đổi mạnh.
- Biến số theo nhóm: so sánh trung bình, median, boxplot từng nhóm; tỷ số **η²** = phần phương sai được giải thích bởi nhóm (0–1).
- Hai biến phân loại: bảng chéo (crosstab).
> Tương quan không phải nhân quả: hai biến có thể cùng chịu ảnh hưởng của một biến thứ ba.

## So sánh theo cột đích
Tách thống kê và histogram theo nhóm của biến mục tiêu. Biến mà phân bố hai nhóm tách xa nhau thường có giá trị dự đoán. Đồng thời xem tỷ lệ các lớp: mất cân bằng mạnh khiến accuracy dễ gây hiểu lầm.

## Kiểm tra chất lượng
- **Thiếu**: bao nhiêu ô, tập trung ở cột nào, có quy luật không.
- **Trùng lặp**: dòng giống hệt nhau.
- **Cột giống mã định danh**: mỗi dòng một giá trị — không phải đặc trưng.
- **Giá trị vô lý**: 0 ở glucose, tuổi âm, ngày trong tương lai — thường là thiếu được mã hóa.
- **Tương quan quá cao** giữa hai biến, hoặc một biến gần như "biết trước" đáp án (rò rỉ).
Ghi lại các phát hiện để xử lý có lý do ở bước tiền xử lý.

## Tự kiểm tra
- Một biến có trung bình 80 và median 30. Phân bố trông thế nào?
- r = 0,02 giữa tuổi và một chỉ số. Có thể kết luận hai biến không liên quan không?
`,

DATA: `
Tiền xử lý biến dữ liệu thô thành dạng mô hình dùng được: xử lý giá trị thiếu, ngoại lai, mã hóa và chuẩn hóa — **mà không để thông tin của tập đánh giá rò rỉ vào quá trình học**. Mọi quyết định nên dựa trên những gì đã thấy ở bước khám phá dữ liệu.

## Quy tắc vàng: chia trước, fit trên train
1. Chia train / validation / test trước tiên (phân tầng theo lớp nếu là phân loại).
2. Tính mọi tham số tiền xử lý — trung bình, độ lệch chuẩn, median để điền, ngưỡng IQR, danh sách mức one-hot — **chỉ từ train**.
3. Áp dụng nguyên xi các tham số đó cho validation và test.
Tính trên toàn bộ dữ liệu là **rò rỉ dữ liệu** (data leakage): mô hình gián tiếp "thấy" tập đánh giá, kết quả đẹp giả.

## Giá trị thiếu
Ba cơ chế: thiếu hoàn toàn ngẫu nhiên (MCAR), thiếu phụ thuộc biến khác đã quan sát (MAR), thiếu phụ thuộc chính giá trị bị thiếu (MNAR). Cơ chế quyết định cách xử lý có làm lệch kết quả hay không.
- **Xóa dòng**: đơn giản, nhưng giảm n và có thể lệch mẫu nếu thiếu không ngẫu nhiên.
- **Điền trung bình**: giữ trung bình, nhưng bị kéo bởi ngoại lai và làm giảm phương sai.
- **Điền median**: bền với ngoại lai; dùng mode cho biến phân loại.
- **Thêm cột chỉ báo** "có thiếu không" khi việc thiếu mang thông tin.
- Phương pháp nâng cao: KNN imputation, mô hình dự đoán giá trị thiếu, multiple imputation.
> Ô trống khác số 0. Trong Pima diabetes, Glucose = 0 hay BMI = 0 không thể có về sinh lý, nên được coi là thiếu rồi mới điền.

## Ngoại lai
Phát hiện bằng IQR hoặc z-score (|z| > 3). Trước khi xử lý, hỏi: lỗi nhập liệu hay trường hợp hiếm có thật?
- **Sửa** nếu là lỗi rõ ràng và biết giá trị đúng.
- **Cắt (clip / winsorize)** về ngưỡng [Q1 − 1,5·IQR; Q3 + 1,5·IQR]: giữ dòng, giảm ảnh hưởng.
- **Biến đổi log** cho biến lệch phải mạnh.
- **Giữ nguyên** nếu đó là thông tin quan trọng (ca bệnh nặng, giao dịch gian lận).
Ngưỡng cắt cũng phải tính từ train.

## Chuẩn hóa thang đo
$$ Z-score: x' = (x − μ_train) / σ_train
$$ Min-max: x' = (x − min_train) / (max_train − min_train)
Ví dụ: train có μ = 100, σ = 20 → giá trị 140 thành 2; giá trị 140 ở tập test cũng thành 2 (dùng cùng μ, σ).
Cần cho mô hình dựa trên khoảng cách hoặc gradient: KNN, SVM, K-means, PCA, hồi quy có điều chuẩn, mạng nơ-ron. Cây quyết định và rừng ngẫu nhiên không cần.

## Mã hóa biến phân loại
- **One-hot**: mỗi mức một cột 0/1; bỏ một mức làm tham chiếu với mô hình tuyến tính để tránh đa cộng tuyến hoàn hảo.
- **Ordinal**: gán số theo thứ tự cho biến thứ bậc (thấp < vừa < cao).
- Mức xuất hiện ở test mà train chưa thấy → gom vào "khác".

## Thí nghiệm có kiểm soát
Mỗi lần chỉ đổi một thao tác (ví dụ: median → trung bình), giữ nguyên cách chia và mô hình, rồi so phân bố và kết quả trên validation. Đổi nhiều thứ cùng lúc thì không biết thay đổi nào gây ra khác biệt.

## Ba bẫy thường gặp
- Coi ô trống là 0, hoặc coi số 0 vô lý là giá trị thật.
- Xóa mọi điểm ngoại lai mà không kiểm tra nguồn.
- Nhiều dòng của cùng một đối tượng (cùng bệnh nhân, cùng người dùng) rơi vào cả train và test → cần chia theo nhóm (group split).

## Tự kiểm tra
- Vì sao điền median của toàn bộ dữ liệu (thay vì của train) là rò rỉ?
- Khi nào nên giữ lại ngoại lai thay vì cắt bỏ?
`,


GENCON: `
Mô hình ngôn ngữ lớn (LLM) làm việc với **token** chứ không với chữ, sinh văn bản bằng cách lấy mẫu từ một phân phối xác suất, và biểu diễn ý nghĩa bằng **embedding**.

## Token hóa
Văn bản được cắt thành token — thường là mảnh từ (subword) theo thuật toán BPE hoặc tương tự. Từ phổ biến là một token; từ hiếm bị cắt thành nhiều mảnh. Tiếng Việt có dấu thường tốn nhiều token hơn tiếng Anh cho cùng nội dung. Giới hạn ngữ cảnh và chi phí API đều tính theo token.

## Từ logit đến xác suất
Ở mỗi bước, mô hình cho một điểm số (logit) zᵢ cho mọi token trong từ vựng.
$$ P(i) = e^(zᵢ / T) / Σⱼ e^(zⱼ / T)
- **Temperature T**: T < 1 làm phân phối nhọn hơn (chắc chắn, lặp lại); T > 1 làm phẳng hơn (đa dạng, dễ lạc đề); T → 0 tương đương luôn chọn token xác suất cao nhất (greedy).
- **Top-k**: chỉ giữ k token xác suất cao nhất rồi chuẩn hóa lại.
- **Top-p (nucleus)**: giữ tập token nhỏ nhất có tổng xác suất ≥ p.

## Embedding
Mỗi đoạn văn bản được ánh xạ thành vector nhiều chiều sao cho văn bản ý nghĩa gần nhau có vector gần nhau. Đo độ tương tự bằng cosine:
$$ cos(a, b) = (a · b) / (‖a‖ · ‖b‖)
Embedding là nền tảng của tìm kiếm ngữ nghĩa và RAG.

## Vì sao mô hình "bịa"
Mô hình sinh văn bản **có vẻ hợp lý** theo thống kê, không tra cứu sự thật. Khi thiếu thông tin, nó vẫn sinh câu trôi chảy (hallucination). Cách giảm: cung cấp ngữ cảnh đáng tin (RAG), yêu cầu dẫn nguồn, giảm temperature, kiểm chứng.

## Ví dụ tính tay: temperature
Ba token có logit [2; 1; 0]:
- T = 1: P ≈ [0,665; 0,245; 0,090].
- T = 0,5 (chia logit cho 0,5 → [4; 2; 0]): P ≈ [0,867; 0,117; 0,016] — tập trung hơn.
- T = 2 ([1; 0,5; 0]): P ≈ [0,506; 0,307; 0,186] — phẳng hơn.
Không mức temperature nào tự kiểm chứng câu trả lời đúng sự thật.

## Giới hạn của ví dụ minh họa
Bộ tách token trong bài có thể khác tokenizer của nhà cung cấp thật. Độ tương tự cosine là một thước đo hình học, không phải xác suất câu trả lời đúng; hai embedding gần nhau chưa chắc đồng nghĩa trong mọi ngữ cảnh.

## Tự kiểm tra
- Đặt temperature = 0 có đảm bảo câu trả lời đúng không?
- Vì sao hai câu khác từ ngữ nhưng cùng ý vẫn có cosine cao?
`,

GENAI: `
Prompt là toàn bộ đầu vào gửi cho mô hình. Chất lượng câu trả lời phụ thuộc mạnh vào cách đặt vai trò, hướng dẫn và **ngữ cảnh** (context) đi kèm.

## Cấu trúc một lần gọi Chat Completions
- **system**: vai trò, quy tắc, giọng điệu, định dạng đầu ra.
- **user**: câu hỏi hoặc yêu cầu.
- **assistant**: các câu trả lời trước (giữ hội thoại nhiều lượt).
Mô hình không có trí nhớ giữa các lần gọi: mọi thứ cần biết phải nằm trong danh sách tin nhắn gửi lên.

## Viết prompt tốt
- Nói rõ mục tiêu, đối tượng đọc, độ dài, định dạng (bảng, danh sách, JSON).
- Đưa ví dụ mẫu (few-shot) khi cần định dạng hoặc phong cách cụ thể.
- Tách dữ liệu khỏi hướng dẫn bằng dấu phân cách rõ ràng.
- Yêu cầu nói "không biết" khi ngữ cảnh không có thông tin.
- Chia nhiệm vụ phức tạp thành nhiều bước.

## Custom context
Dán tài liệu liên quan vào prompt giúp mô hình trả lời dựa trên nội dung đó thay vì kiến thức chung. So sánh cùng câu hỏi có và không có context để thấy khác biệt. Giới hạn: cửa sổ ngữ cảnh có hạn và tốn token — với nhiều tài liệu cần chọn đúng đoạn liên quan (RAG).

## Tham số
temperature, top_p (độ đa dạng), max_tokens (độ dài tối đa). Câu trả lời có thể khác nhau giữa các lần gọi cùng prompt.

## An toàn và quyền riêng tư
Nội dung gửi đi đến nhà cung cấp API. Không gửi dữ liệu cá nhân, bí mật, khóa API. Kiểm tra lại thông tin quan trọng; **prompt injection**: văn bản trong tài liệu có thể chứa câu lệnh lừa mô hình — coi nội dung tài liệu là dữ liệu, không phải chỉ dẫn.

## Xem payload trước khi gửi
Trước khi bấm gửi, đọc toàn bộ payload: model, danh sách tin nhắn, context, tham số. Đây đúng là những gì nhà cung cấp nhận được. API key nằm trong header, không nằm trong nội dung, và không bao giờ nên xuất hiện trong ảnh chụp màn hình hay tài liệu chia sẻ.

## Thiết kế một thí nghiệm nhỏ
1. Giữ cố định model, tham số và câu hỏi.
2. Chạy ba lần: không context, context đúng, context thiếu thông tin.
3. So nội dung (không chỉ giọng văn): câu trả lời có bám context không, có thừa nhận thiếu dữ kiện không.

## Lỗi kết nối thường gặp
- **CORS**: trình duyệt bị chặn gọi trực tiếp — chính sách của nhà cung cấp; đừng "chữa" bằng cách đưa key lên proxy công cộng.
- **401/403**: key sai hoặc không có quyền với model.
- **404**: sai endpoint hoặc tên model.
- **429**: vượt hạn mức, đợi rồi thử lại.
Custom context chỉ là nội dung trong yêu cầu; nó không huấn luyện lại hay thay đổi trọng số mô hình.

## Tự kiểm tra
- Vì sao cùng một câu hỏi, có context và không có context cho câu trả lời khác nhau?
- Nếu tài liệu dán vào có câu "bỏ qua mọi hướng dẫn trước", điều gì có thể xảy ra?
`,

RAG: `
RAG (Retrieval-Augmented Generation) kết hợp **truy xuất** tài liệu liên quan với **sinh** câu trả lời: mô hình trả lời dựa trên những đoạn văn tìm được, kèm dẫn nguồn.

## Quy trình
1. **Nạp tài liệu** (TXT, MD, CSV, DOCX, PDF có lớp chữ; ảnh/scan cần OCR).
2. **Chia đoạn (chunking)**: cắt thành đoạn vài trăm token, có chồng lấn để không cắt đứt ý.
3. **Lập chỉ mục**: BM25 (từ khóa) và/hoặc embedding (ngữ nghĩa).
4. **Truy xuất**: với câu hỏi, lấy top-k đoạn liên quan nhất.
5. **Ghép prompt**: hướng dẫn + các đoạn (có mã nguồn) + câu hỏi.
6. **Sinh và kiểm tra**: mô hình trả lời, dẫn mã nguồn; kiểm tra mã dẫn có thật sự hỗ trợ câu trả lời.

## BM25
Điểm của tài liệu D cho truy vấn Q:
$$ Σ_{t∈Q} IDF(t) · f(t,D)·(k₁+1) / ( f(t,D) + k₁·(1 − b + b·|D|/avgdl) )
f(t,D): số lần xuất hiện từ t; IDF cao cho từ hiếm; k₁ (~1,2) điều chỉnh bão hòa tần suất; b (~0,75) chuẩn hóa theo độ dài đoạn. Mạnh với tên riêng, mã số, thuật ngữ chính xác.

## Truy xuất bằng embedding
Mã hóa câu hỏi và các đoạn thành vector, xếp hạng theo cosine. Bắt được từ đồng nghĩa và cách diễn đạt khác. Kết hợp BM25 + embedding (hybrid) thường tốt nhất.

## Kích thước đoạn và k
Đoạn quá nhỏ mất ngữ cảnh; quá lớn làm loãng và tốn token. k quá nhỏ bỏ sót; k quá lớn đưa nhiễu vào prompt. Đánh giá bằng một bộ câu hỏi có đáp án biết trước: đoạn đúng có nằm trong top-k không (recall@k)?

## Dẫn nguồn và kiểm chứng
Yêu cầu mô hình chỉ dùng thông tin trong các đoạn và trích mã [S1], [S2]… Sau đó kiểm tra: mã có tồn tại không, đoạn được trích có thật sự chứa ý đó không. Câu trả lời không có nguồn hỗ trợ cần được đánh dấu.

## Lỗi thường gặp
Văn bản PDF trích sai thứ tự, bảng bị vỡ; truy xuất sai đoạn nên mô hình trả lời sai một cách tự tin; tài liệu lỗi thời; prompt injection nằm trong tài liệu.

## Ví dụ: có và thiếu bằng chứng
Tài liệu có đoạn A: "Buổi thực hành bắt đầu lúc 8 giờ".
- Hỏi "Buổi thực hành bắt đầu lúc nào?" → đoạn A hỗ trợ, trả lời kèm mã [A].
- Hỏi "Buổi thực hành kéo dài bao lâu?" → không đoạn nào có thông tin; câu trả lời đúng là "tài liệu không nêu", không phải đoán.

## Tự kiểm tra
- Câu hỏi có mã hiệu "QĐ-2024/15": BM25 hay embedding dễ tìm đúng hơn?
- Mô hình trả lời đúng nhưng trích sai nguồn — vì sao đó vẫn là lỗi?
`,
};
