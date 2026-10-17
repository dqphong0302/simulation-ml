# Rà soát lý thuyết — 2026-10-16

Phạm vi: toàn bộ 23 bài trong catalogue, các hướng dẫn/thuật ngữ, giải thích của notebook, mô phỏng khái niệm và slide/lời đọc đang dùng. Đối tượng: sinh viên năm nhất tiếp cận ML/AI với ví dụ y khoa. Không xây backend, không biến lab thành công cụ lâm sàng, không tự push/deploy.

## Tiêu chí chung

Mỗi bài có ba mục tiêu, cơ chế bằng lời, ví dụ có thể tính tay, lỗi dễ mắc, thí nghiệm có đáp án gợi ý, giới hạn đúng với triển khai và nguồn kiểm chứng riêng. Kiến thức cơ bản hiển thị mặc định; công thức/giả định nâng cao nằm trong phần mở rộng tùy chọn. Mục lục mở phần mở rộng khi chọn; bản tải Markdown chứa cả hai phần. Python/notebook là tùy chọn và giữ nguyên chức năng tải.

Không dùng độ dài văn bản hoặc việc vượt kiểm thử để chứng nhận mọi phát biểu là đúng. Bảng dưới ghi các điểm đã đối chiếu về nội dung; kiểm thử cấu trúc, số học và trình duyệt bổ sung bằng chứng kỹ thuật. Đây là rà soát nội dung và cài đặt, không phải thẩm định lâm sàng hay thử nghiệm sư phạm với sinh viên.

## Bảng rà soát đủ 23 bài

| Bài | Nội dung và ranh giới đã đối chiếu | Cài đặt đối chiếu |
| --- | --- | --- |
| EDA | Đơn vị quan sát; kiểu biến; mẫu số hợp lệ/thiếu; mean, median, SD mẫu; Tukey; tương quan không nhân quả; đơn vị và bệnh nhân đo lặp | DataProfile, dataset.describe, scenesMl, notebook foundation |
| DATA | Chia trước fit; median, IQR, scaling train; MAR có điều kiện; encoding và mức mới; không tự cắt ca thật; đọc Excel lạ | DataLab, preprocessDemo, scenesMl, notebook foundation/uploaded |
| KNN | Euclid và phiếu; hòa phiếu tùy cài đặt; k chọn bằng validation; scaling không đồng nghĩa importance bằng nhau | knn, KnnLab, NarratedKnn, notebook ml |
| TREE | Gini/entropy và gain có trọng số; độ sâu không có tối ưu phổ quát; luật dễ đọc không phải nhân quả | tree, TreeLab, NarratedTree, notebook ml |
| LOGREG | Sigmoid; OR khác risk ratio; mẫu số sensitivity/specificity/PPV; đổi ngưỡng không fit lại; AUC không phải calibration | logistic, metrics, LogisticLab, NarratedLogistic, notebook ml |
| COMPARE | Cùng split/metric; baseline; lựa chọn khác đánh giá; SD fold không tự là CI; TRIPOD/PROBAST không chứng nhận an toàn | CompareLab, compare worker, notebook ml/uploaded |
| TEACHABLE | MobileNet + đầu phân loại; ảnh đồ vật; lệch nền và phiên chụp; điểm không tự là xác suất đúng | TeachableLab, runtime ảnh, notebook ảnh nhỏ riêng |
| LINREG | Dự đoán số; slope và phần dư; MSE/RMSE/R²; không ngoại suy/nhân quả tùy tiện; web một biến khác notebook đa biến | regression, ExtraLabs, notebook ml |
| KMEANS | Lloyd, tổng khoảng cách bình phương; tối ưu không tăng theo k nhưng nghiệm cục bộ không bảo đảm đường thực nghiệm giảm đều; cụm không phải bệnh | kmeans, ExtraLabs, scenesMl, notebook ml |
| PCA | Center/scale đúng train; eigenvalue và phương sai; 90% variance không là accuracy; dấu trục không định nghĩa bệnh | pca, ExtraLabs, notebook ml |
| FOREST | Bootstrap; chọn biến mỗi nút; trung bình điểm cây; OOB/importance có giới hạn; cây không độc lập hoàn toàn | forest, ExtraLabs, notebook ml |
| SVM | Soft-margin phạt vi phạm lề, không chỉ sai nhãn; C/kernel/gamma; điểm không là xác suất; tối ưu web minh họa khác SVC | svm, ExtraLabs, notebook ml |
| MLP | Affine + phi tuyến; forward/loss/backprop/cập nhật; train–validation không tự xác định leakage; notebook và web khác triển khai | mlp, DlLab, notebook dl |
| CNN | Cross-correlation; kích thước stride/padding; ReLU/pooling; Grad-CAM không chứng minh tổn thương; web không train CNN | cnn, CnnLab, scenesDl, notebook dl |
| ATTN | Q/K/V; softmax theo hàng; causal mask không phải nhân quả; vector đồ chơi không diễn giải lâm sàng | attention, AttentionLab, scenesDl, notebook dl |
| GPT | Dự đoán token; web tách khoảng trắng, notebook ký tự; context không cập nhật trọng số; loss thấp không là kiến thức đúng | minigpt, TransformerLab, notebook dl |
| AE | Encoder/decoder; MSE tổng/trung bình; web dùng hai biến, latent một chiều; lỗi cao có nhiều nguyên nhân | autoencoder, GenLabs, notebook dl |
| VAE | Tái tham số; KL Gaussian; β=1 mới là negative ELBO chuẩn; latent variance không là bất định sức khỏe; synthetic không tự bảo vệ privacy | vae, GenLabs, notebook dl |
| GAN | Mục tiêu đối kháng; huấn luyện luân phiên; loss và D=0,5 chưa chứng minh hội tụ; web 1D, không sinh ảnh | gan, GanLab, notebook dl |
| DIFF | Forward/noise schedule; mẫu biên không là đầy đủ chuỗi Markov; tua ngược minh họa không là denoiser học được | autoencoder.noisify, GenLabs, scenesDl, notebook dl |
| GENCON | Token/context/embedding; T>0; top-p gồm token vượt ngưỡng; cosine không xác minh nghĩa hoặc sự thật | GenConceptLab, scenesGenai, notebook genai |
| GENAI | Prompt/context khác retraining; injection không được chặn tuyệt đối bằng delimiter; dữ liệu gửi API và chi phí; không nhập hồ sơ thật | GenAiLab, scenesGenai, notebook API opt-in |
| RAG | BM25 local khác vector API; ký tự khác token; retrieval khác generation; mã citation tồn tại chưa chứng minh support; notebook TF-IDF riêng | RagLab, scenesGenai, notebook genai |

## Sửa số học và hành vi gắn với lý thuyết

- `describe`: SD mẫu n−1, n<2 trả null; `fitScaler` vẫn SD mẫu số n theo StandardScaler. Skew g1 tính từ moment riêng, không bị đổi theo SD mẫu.
- Tukey: điểm ngoài hàng rào vẫn được đánh dấu khi IQR=0; boxplot mô phỏng có râu tới điểm trong hàng rào và điểm ngoài râu.
- Mô phỏng DATA chia train/test trước fit median/min/max, không đọc test để fit. Đây là ví dụ giữ dòng cuối làm test, không phải chia phù hợp mọi bảng y khoa.
- DataLab tắt clipping mặc định; cột hoàn toàn thiếu không bịa giá trị 0. Scaling minh họa fit sau điền thiếu trên train; báo số dòng và tỷ lệ lớp còn lại. Không sửa pipeline của các lab khác.
- Các ví dụ số và nguồn cho từng bài được lưu trong `src/lessons/theory/curriculum.ts`; mở rộng trong `ml.ts`, `dl.ts`, `other.ts`.
- Audio chỉnh bằng `scripts/theory-lecture-revisions.json` và kịch bản EDA; tái dùng giọng đã có, đo thời lượng thật, giữ clip cũ để có thể đối chiếu. Manifest fallback đồng bộ cùng clip sửa.

## Nguồn chính

- [pandas SD: ddof=1](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.std.html)
- [StandardScaler: ddof=0](https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.StandardScaler.html)
- [scikit-learn: rò rỉ và pipeline](https://scikit-learn.org/stable/common_pitfalls.html)
- [scikit-learn: thuật toán và giả định](https://scikit-learn.org/stable/user_guide.html)
- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
- [Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114)
- [GAN](https://arxiv.org/abs/1406.2661)
- [DDPM](https://arxiv.org/abs/2006.11239)
- [RAG](https://arxiv.org/abs/2005.11401)
- [Nucleus sampling](https://arxiv.org/abs/1904.09751)
- [WHO: GenAI cho sức khỏe](https://www.who.int/publications/i/item/9789240084759)

## Cổng xác minh

Các lệnh xác minh: `pnpm test` với NOTEBOOK_PYTHON (thực thi notebook CPU offline), `pnpm build`, browser `theory`, `test:ui`, `test:python`, `test:adaptive`, `test:imports`, `test:learning`, `test:python-basics`, `test:lectures`. Kiểm tra bảo mật regex chỉ là một kiểm tra bổ sung, không phải audit an toàn toàn diện. Kết quả cuối bên dưới thay thế các trạng thái trung gian trong nhật ký.

### Trạng thái trung gian — chưa đóng mục tiêu

- Lý thuyết cốt lõi và phần mở rộng: đã cập nhật đủ 23 bài; browser `theory` kiểm tra đủ 23 route, mục cơ bản hiển thị, mở rộng thu gọn/mở qua mục lục, nguồn và bản tải đầy đủ; 3 viewport đều qua.
- `test:ui`, `test:python`, `test:adaptive`, `test:imports`, `test:learning`, `test:python-basics` đã qua. `test:lectures` đã qua trên manifest tại thời điểm kiểm tra; cần chạy lại sau khi toàn bộ audio chỉnh xong.
- Bộ unit trước khi thêm cổng kiểm tra audio có 99 test đạt; khi bật NOTEBOOK_PYTHON có thêm hai bài thực thi toàn bộ notebook mẫu và notebook thích ứng offline. Cần chạy lại bộ cuối sau audio.
- Audio sửa KMEANS/SVM đã xuất bản và đồng bộ fallback. Clip GPT s1 đã tạo nhưng chưa xuất bản vì cả manifest GPT chưa hoàn tất. GPT s2 timeout hai lần 180 giây; dừng lần thử thứ ba để đổi sang tạo từng câu. Lần chạy theo câu không qua được GET `/profiles` (timeout 10 giây). Không restart hoặc đổi dịch vụ/giọng.
- `tests/theory-lectures.test.ts` là cổng còn chờ hoàn tất: đối chiếu caption/bullets đã duyệt với manifest chính và fallback, EDA với kịch bản nguồn. Không bỏ qua cổng này để tuyên bố hoàn thành.
- Lệnh tiếp tục khi dịch vụ đáp ứng: `pnpm exec node scripts/revise-lecture-audio.mjs --theory-review --keep-unused --sentences KMEANS SVM GPT GENCON RAG GAN MLP AE EDA`. Cache clip đã có; không xóa clip cũ. Sau đó chạy lại toàn bộ cổng, ghi kết quả cuối và mới đóng mục tiêu.

### Đối chiếu bổ sung ngày 16/10/2026

- Sửa phần DATA: học tham số từ test có thể làm điểm lạc quan, không khẳng định một mức hại cố định; bỏ ví dụ số lâm sàng không cần thiết và khẳng định loại ngoại lai chắc chắn làm mất khả năng nhận diện cấp cứu.
- Sửa TEACHABLE: nền riêng có thể tạo lối tắt, chưa chứng minh mô hình đã học nền. Bổ sung kiểm tra hồi quy cho các cách diễn đạt này; 10 kiểm thử lý thuyết/số học đạt.
- VieNeu vẫn là tiến trình PID 3446, unit `vieneu.service` active và cổng 8002 còn lắng nghe, nhưng GET `/voices` hết hạn sau 8 giây. Không có tiến trình tạo audio cục bộ đang chạy. Luồng chính ở trạng thái `mem_cgroup_handle_over_high`; cgroup dịch vụ có `memory.high=4294967296`, `memory.current=4504494080`, bộ đếm `high=362975`. Đây là bằng chứng áp lực/hạn chế bộ nhớ, chưa xác định đầy đủ nguyên nhân yêu cầu bị treo. Không restart, tăng hạn mức hoặc đổi giọng khi chưa có chỉ dẫn.
- Toàn bộ unit ở lần kiểm tra trước có 100 đạt, 2 chưa đạt (manifest audio GPT và EDA chưa khớp bản sửa). Không xem build thành công là bằng chứng hoàn thành audio.
- Kiểm tra lại sau các sửa bổ sung: build đạt (còn cảnh báo chunk lớn); `git diff --check` sạch; browser theory đạt cả 23 bài và 3 viewport. Chạy `NOTEBOOK_PYTHON=/tmp/simulation-notebook-check.hxXY3L/venv/bin/python pnpm test`: 102 đạt, 2 chưa đạt, gồm thực thi notebook mẫu và notebook thích ứng. Hai lỗi còn lại vẫn là đối chiếu manifest lời đọc, không bỏ qua hoặc sửa kỳ vọng cho khớp bản cũ. Kiểm tra tiến trình cục bộ không tìm thấy `revise-lecture-audio.mjs` đang chạy.

## Kết quả cuối — 16/10/2026

Người dùng đã cho phép restart VieNeu. Khởi động lại đúng `vieneu.service`, xác nhận catalog giọng và profile Duyên Hà My `6265e356b8a9`; không đổi giọng, engine hay giới hạn tài nguyên. Sau tổng hợp, `/health` trả `status=ok`, dịch vụ active; bộ nhớ dịch vụ khoảng 2,80 GB, dưới ngưỡng high 4 GiB tại thời điểm kiểm tra.

- Lệnh chỉnh audio theo câu hoàn tất với exit 0: KMEANS, SVM, GPT, GENCON, RAG, GAN, MLP, AE và EDA. Manifest chính/fallback đã đồng bộ, clip cũ giữ lại. 21 clip thuộc các cảnh được rà soát giải mã được và có tín hiệu âm thanh, không phải tệp im lặng.
- `NOTEBOOK_PYTHON=/tmp/simulation-notebook-check.hxXY3L/venv/bin/python pnpm test`: **104/104 đạt**, 12 file test. Hai lỗi manifest trước đây đã hết; kỳ vọng nội dung sửa không bị nới lỏng. Bao gồm thực thi cả 23 notebook mẫu và 12 notebook thích ứng offline CPU.
- `pnpm build`: đạt type-check và build; còn cảnh báo kích thước chunk trên 500 kB, không phải lỗi lý thuyết hay build.
- `BASE_URL=http://127.0.0.1:5175 pnpm test:lectures`: **23/23 bài đạt**, kiểm tra từng slide ở 1440×900, 768×1024, 390×844; audio play/pause, URL clip, caption, thời lượng thật, không tràn ngang và không lỗi trang.
- `BASE_URL=http://127.0.0.1:5175 pnpm exec node tests/theory.browser.mjs`: **23/23 bài đạt**; mục cơ bản hiện sẵn, mục mở rộng tùy chọn, mục lục mở được phần mở rộng, đáp án/nguồn/tải Markdown đầy đủ và notebook còn hoạt động. Kiểm tra 3 viewport, ID không trùng, clipping mặc định tắt và điều khiển scaling.
- Chạy lại `test:ui`, `test:python`, `test:adaptive`, `test:imports`, `test:learning`, `test:python-basics`: tất cả đạt. Nhập Excel nhiều sheet/XLS, CSV/JSON, kiểm tra giới hạn 200.000 dòng, bảo toàn dữ liệu khi hủy/lỗi, không gửi dữ liệu nhập ra ngoài trong các luồng kiểm tra; Python cơ bản giữ 9 clip và giao diện cell notebook.
- Đã xem ảnh chụp EDA/KMEANS trên điện thoại và lý thuyết DATA desktop; phần lời đọc và nội dung hiển thị không bị cắt/tràn. Các kiểm tra tự động không thay thế đánh giá sư phạm hoặc thẩm định lâm sàng.
- `git diff --check`: sạch. Không commit, push hoặc deploy trong đợt sửa này. Không xóa clip cũ hay các thay đổi Python/audio có sẵn của người dùng.

Phạm vi hoàn tất: rà soát và sửa lý thuyết 23 bài, phần cơ bản/mở rộng, ví dụ/đáp án/nguồn riêng, giới hạn đúng với lab, các phép tính và hình minh họa liên quan, cùng caption/audio bị sai. Các giới hạn đã công bố (không hiểu mọi file Excel, web chưa tự chia bệnh nhân/thời gian, không phải công cụ lâm sàng) vẫn được giữ rõ; không tuyên bố đã xây thêm các chức năng đó.
