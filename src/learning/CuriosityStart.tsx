import { useState } from 'react';

const MISSIONS = [
  {
    id: 'data', label: 'Khám phá dữ liệu', hook: 'Một con số có kể hết câu chuyện?',
    intro: 'Thời gian ôn bài trong 5 buổi giả lập: 10, 15, 15, 20 và 120 phút.',
    question: 'Sau khi xếp tăng dần, giá trị đứng giữa là bao nhiêu?',
    choices: ['15 phút', '36 phút', '120 phút'], answer: 0,
    explanation: 'Trung vị là 15 phút, còn trung bình là 36 phút. Một buổi 120 phút kéo trung bình lên. Hai con số trả lời những câu hỏi khác nhau — xem cả phân bố sẽ hiểu rõ hơn.',
    takeaway: 'Bạn vừa dùng tin học để đọc dữ liệu, thay vì chỉ tin một con số tóm tắt.',
    href: '#/eda?tab=lab', action: 'Thử biểu đồ và thống kê',
  },
  {
    id: 'ai', label: 'Thử thách AI', hook: 'AI đúng 95% — đã đáng tin chưa?',
    intro: 'Có 100 hồ sơ giả: 95 không có nhãn đích, 5 có nhãn đích. Máy luôn dự đoán “không có”. Đây chỉ là ví dụ học tập, không phải hồ sơ bệnh nhân.',
    question: 'Máy đúng 95/100 hồ sơ. Ta nên kết luận gì?',
    choices: ['Đủ để dùng trong y khoa', 'Cần xem máy bỏ sót ai', 'Máy nhận ra mọi ca có nhãn đích'], answer: 1,
    explanation: 'Máy bỏ sót cả 5 hồ sơ có nhãn đích: recall của lớp này bằng 0. Accuracy 95% không kể hết sai sót; còn phải xem FP/FN, ngưỡng và cách đánh giá độc lập.',
    takeaway: 'Bạn không cần biết lập trình mới đặt được một câu hỏi quan trọng cho AI.',
    href: '#/ml/logistic?tab=lab', action: 'Thử đổi ngưỡng dự đoán',
  },
  {
    id: 'python', label: 'Đọc một dòng Python', hook: 'Code cũng có thể đọc như một câu ngắn.',
    intro: 'phut là danh sách thời gian ôn bài. sum cộng các số trong danh sách; print hiển thị kết quả.',
    question: 'Đoạn code bên dưới sẽ in ra số nào?',
    choices: ['4', '15', '60'], answer: 2,
    explanation: '10 + 15 + 15 + 20 = 60. sum(phut) thực hiện phép cộng và print hiển thị 60. Đây là giải thích kết quả của ví dụ, chưa phải trình chạy Python trong trình duyệt.',
    takeaway: 'Bạn vừa đọc hiểu một đoạn Python. Bước tiếp theo là tự đổi số và chạy trên Colab.',
    href: '#/python', action: 'Mở hướng dẫn Python & Colab',
  },
] as const;

/** Ungraded, session-only warm-up; deliberately separate from course completion. */
export function CuriosityStart() {
  const [active, setActive] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const mission = MISSIONS[active];
  return <section className="curiosity-start" aria-labelledby="curiosity-title">
    <header className="curiosity-heading">
      <div><p className="eyebrow">Góc tò mò · Khoảng 5 phút</p><h2 id="curiosity-title">Chưa thích tin học? Thử một điều nhỏ trước.</h2></div>
      <p>Không cần biết code. Không tính điểm. Chọn điều bạn muốn khám phá.</p>
    </header>
    <div className="curiosity-choices" role="group" aria-label="Chọn thử thách">
      {MISSIONS.map((item, i) => <button id={`curiosity-pick-${item.id}`} key={item.id} type="button" aria-pressed={i === active}
        onClick={() => { setActive(i); setChoice(null); }}>
        <span aria-hidden="true">0{i + 1}</span>{item.label}
      </button>)}
    </div>
    <article className="curiosity-task" aria-labelledby="curiosity-task-title">
      <h3 id="curiosity-task-title">{mission.hook}</h3><p>{mission.intro}</p>
      {mission.id === 'data' && <figure className="curiosity-bars"><figcaption>Phút ôn bài mỗi buổi · Dữ liệu giả</figcaption>
        {[10, 15, 15, 20, 120].map((value, i) => <div key={i}><span>Buổi {i + 1}</span><div aria-hidden="true"><i style={{ width: `${value / 120 * 100}%` }} /></div><b>{value}</b></div>)}
      </figure>}
      {mission.id === 'ai' && <div className="curiosity-counts" aria-label="Kết quả dự đoán giả lập">
        <div><b>95</b><span>Hồ sơ không có nhãn đích<br />Máy đoán đúng</span></div>
        <div><b>5</b><span>Hồ sơ có nhãn đích<br />Máy bỏ sót tất cả</span></div>
      </div>}
      {mission.id === 'python' && <pre className="curiosity-code" aria-label="Ví dụ Python"><code>{'phut = [10, 15, 15, 20]\nprint(sum(phut))'}</code></pre>}
      <fieldset className="curiosity-answers"><legend>{mission.question}</legend>
        {mission.choices.map((answer, i) => <button id={`curiosity-answer-${mission.id}-${i}`} key={answer} type="button"
          aria-pressed={choice === i} onClick={() => setChoice(i)}>{answer}</button>)}
      </fieldset>
      <div className="curiosity-feedback" role="status" aria-live="polite" aria-atomic="true">
        {choice !== null && <><strong>{choice === mission.answer ? 'Bạn đã tìm ra rồi!' : 'Chưa trúng lần này — cùng xem vì sao.'}</strong>
          <p>{mission.explanation}</p><p>{mission.takeaway}</p></>}
      </div>
      <footer><a id={`curiosity-go-${mission.id}`} className="btn primary" href={mission.href}>{mission.action} →</a>
        {choice !== null && <button id="curiosity-retry" className="btn" type="button" onClick={() => setChoice(null)}>Thử lại</button>}
      </footer>
    </article>
    <p className="curiosity-reassurance">Chưa hiểu ngay cũng không sao. Hãy đoán → thử → quan sát → giải thích bằng lời của bạn. Mỗi lần chỉ cần một điều mới; các thử thách này không thay đổi tiến độ lộ trình.</p>
  </section>;
}
