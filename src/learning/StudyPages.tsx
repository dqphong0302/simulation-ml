import { LessonPrimer, LessonLearning } from './LessonLearning';

export function Introduction() {
  return <div className="study-page">
    <header className="library-intro"><p className="eyebrow">Bước đầu · AI trong y khoa</p><h1>AI làm được gì, và cần kiểm tra gì?</h1><p>Không cần biết lập trình. Bắt đầu từ đầu vào, đầu ra và giới hạn.</p></header>
    <LessonPrimer lessonId="INTRO" />
    <section className="intro-examples" aria-label="Ba cách tiếp cận">
      <article><h2>Quy tắc cố định</h2><p>Đầu vào: số đo giả lập. Đầu ra: thông báo theo một quy tắc do người viết. Hệ thống không tự học từ ví dụ.</p></article>
      <article><h2>Học máy</h2><p>Đầu vào có thể là bảng, ảnh hoặc dạng dữ liệu khác. Học có giám sát dùng nhãn; học không giám sát tìm cấu trúc mà không cần nhãn đích. Huấn luyện tìm quy luật; suy luận áp dụng cho mẫu mới. Cần kiểm tra ngoài tập đã học.</p></article>
      <article><h2>AI tạo sinh</h2><p>Đầu vào: câu hỏi và ngữ cảnh. Đầu ra: nội dung mới. Văn bản nghe hợp lý vẫn có thể sai hoặc bịa nguồn; không coi đó là y lệnh.</p></article>
    </section>
    <LessonLearning lessonId="INTRO" />
    <a id="intro-next" className="btn primary" href="#/eda">Tiếp theo: đọc và hiểu dữ liệu →</a>
  </div>;
}

export function Capstone() {
  return <div className="study-page">
    <header className="library-intro"><p className="eyebrow">Bài tập tổng hợp · Dữ liệu giả lập</p><h1>Từ dữ liệu đến một kết luận có giới hạn</h1><p>Viết báo cáo ngắn bằng bốn ô ghi chép bên dưới; tải về để nộp cho giảng viên. Không dùng hồ sơ người thật.</p></header>
    <LessonPrimer lessonId="PROJECT" />
    <section className="capstone-brief"><h2>Nhiệm vụ</h2><p>Mở lab Logistic và chọn nguồn “Mô phỏng tổng hợp (2 biến)” (mặc định lab có thể đang dùng Pima hoặc bảng đã nhập). Cố định dữ liệu và mô hình; so sánh ngưỡng 0,5 với 0,3. Đây là mô phỏng hai chiều, không phải hệ thống tiên lượng bệnh nhân.</p>
      <ol><li>Nêu đầu vào, nhãn và điều bạn dự đoán khi hạ ngưỡng.</li><li>Chỉ đổi ngưỡng; ghi seed/cấu hình và cách chia tập được lab hiển thị.</li><li>Ghi TP, FP, TN, FN và sensitivity/specificity ở cả hai ngưỡng. Không dùng test để chọn ngưỡng rồi gọi đó là đánh giá độc lập.</li><li>Giải thích hậu quả bỏ sót/cảnh báo thừa, giới hạn dữ liệu giả lập và kế hoạch đánh giá theo bệnh viện/phân nhóm.</li></ol>
      <a id="capstone-lab" className="btn primary" href="#/ml/logistic?tab=lab">Mở lab Logistic</a>
    </section>
    <section className="capstone-rubric"><h2>Tiêu chí góp ý của giảng viên</h2><ul><li>Câu hỏi và nguồn dữ liệu rõ ràng; không nhận dữ liệu giả là dữ liệu bệnh nhân.</li><li>Thử nghiệm có thể lặp lại; chỉ thay một yếu tố và ghi bằng chứng cụ thể.</li><li>Đọc đúng loại sai sót; nêu đánh đổi thay vì chỉ báo accuracy.</li><li>Không suy ra nhân quả, chỉ định điều trị hoặc lợi ích lâm sàng từ mô phỏng.</li></ul><p>Điểm câu hỏi chỉ là tự kiểm tra. Giảng viên cần đọc báo cáo và trao đổi trước khi đánh giá năng lực.</p></section>
    <LessonLearning lessonId="PROJECT" practice />
    <section className="offline-case"><h2>Kiểm tra nguồn: ví dụ không cần API</h2><blockquote>Nguồn giả lập A: “Mô hình được đánh giá tại bệnh viện A. Chưa đánh giá tại bệnh viện B.”</blockquote><p>Câu trả lời AI: “Mô hình đã được chứng minh dùng tốt tại mọi bệnh viện [A].”</p><details><summary>Nhận xét gợi ý</summary><p>Trích dẫn có thật nhưng không hỗ trợ khẳng định. Không được mở rộng kết quả từ một nơi sang mọi nơi; cần đánh giá độc lập tại nơi dự kiến sử dụng.</p></details></section>
  </div>;
}
