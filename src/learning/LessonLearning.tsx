import { useState, type FormEvent } from 'react';
import { download } from '../core/reporting/files';
import { GUIDES } from './guides';
import { STUDY_PROMPTS, PASS_SCORE } from './model';
import { useLearningProgress } from './progress';
import { useSessionData } from '../core/datasets/session';
import { adaptGuide } from './dataContext';
import { DataFit } from './DataFit';

export function LessonPrimer({ lessonId }: { lessonId: string }) {
  const data = useSessionData();
  const guide = GUIDES[lessonId] && adaptGuide(lessonId, GUIDES[lessonId], data);
  if (!guide) return null;
  return <section className="lesson-primer" aria-labelledby={`primer-${lessonId}`}>
    <p className="eyebrow">Bắt đầu ở đây · Không cần biết Python</p>
    <h2 id={`primer-${lessonId}`}>Hiểu trong 5 phút</h2>
    <p className="primer-idea">{guide.idea}</p>
    <ul>{guide.takeaways.map(s => <li key={s}>{s}</li>)}</ul>
    <p className="medical-case"><strong>Liên hệ y khoa: </strong>{guide.case}</p>
    <DataFit lessonId={lessonId} />
    <details className="lesson-glossary"><summary>Giải nghĩa {guide.vocabulary.length} thuật ngữ</summary>
      <dl>{guide.vocabulary.map(([word, meaning]) => <div key={word}><dt>{word}</dt><dd>{meaning}</dd></div>)}</dl>
    </details>
  </section>;
}

export function LessonLearning({ lessonId, practice = false }: { lessonId: string; practice?: boolean }) {
  const data = useSessionData();
  const guide = GUIDES[lessonId] && adaptGuide(lessonId, GUIDES[lessonId], data);
  const { progress, save, storageError } = useLearningProgress();
  const record = progress[lessonId] ?? {};
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [journal, setJournal] = useState<string[]>(() => record.journal ?? ['', '', '', '']);
  const [saved, setSaved] = useState(!!record.journal);
  if (!guide) return null;
  const score = answers.reduce((total, answer, i) => total + Number(answer === guide.questions[i]?.answer), 0);
  const journalReady = journal.every(s => s.trim().length > 0);
  const canComplete = (record.score ?? 0) >= PASS_SCORE && journalReady && saved;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    save(lessonId, { score, done: score < PASS_SCORE ? false : record.done });
  };
  return <div className="learning-companion">
    <section className="guided-study" aria-labelledby={`guided-${lessonId}`}>
      <p className="eyebrow">Dự đoán → Thử → Quan sát → Giải thích</p>
      <h2 id={`guided-${lessonId}`}>{practice ? 'Thực hành có hướng dẫn' : 'Một thí nghiệm nhỏ'}</h2>
      <p>Ghi ý kiến trước khi thử. Đổi một yếu tố mỗi lần, giữ các yếu tố khác để so sánh. Có thể làm trong lab hoặc notebook của bài.</p>
      <ol className="experiment-steps">{guide.experiment.map((instruction, i) => <li key={instruction}>
        <label htmlFor={`journal-${lessonId}-${i}`}><strong>{STUDY_PROMPTS[i]}</strong><span>{instruction}</span></label>
        <textarea id={`journal-${lessonId}-${i}`} rows={2} maxLength={4000} value={journal[i]} placeholder="Nhận xét của bạn…"
          onChange={e => { const next = [...journal]; next[i] = e.target.value; setJournal(next); setSaved(false); }} />
      </li>)}</ol>
      <button id={`save-journal-${lessonId}`} className="btn" onClick={() => setSaved(save(lessonId, { journal, done: record.done && journalReady }))}>Lưu ghi chép</button>
      <button id={`download-journal-${lessonId}`} className="btn" onClick={() => download(new Blob([`# Ghi chép ${lessonId}\n\n` + journal.map((s, i) => `## ${STUDY_PROMPTS[i]}\n${s}`).join('\n\n')], { type: 'text/markdown;charset=utf-8' }), `ghi-chep-${lessonId.toLowerCase()}.md`)}>Tải ghi chép</button>
      {saved && <span className="save-feedback" role="status">Đã lưu trên thiết bị.</span>}
    </section>
    <section className="lesson-quiz" aria-labelledby={`quiz-${lessonId}`}>
      <h2 id={`quiz-${lessonId}`}>Tự kiểm tra · 3 câu</h2>
      <p>Đạt ít nhất 2/3 câu và lưu đủ bốn nhận xét để đánh dấu đã học. Đây là tự kiểm tra, không chứng nhận năng lực lâm sàng.</p>
      <form onSubmit={submit}>
        {guide.questions.map((item, i) => <fieldset key={item.prompt}>
          <legend>{i + 1}. {item.prompt}</legend>
          {item.options.map((option, j) => <label className="quiz-option" key={option}>
            <input id={`answer-${lessonId}-${i}-${j}`} type="radio" required name={`quiz-${lessonId}-${i}`} value={j} checked={answers[i] === j}
              onChange={() => { const next = [...answers]; next[i] = j; setAnswers(next); setSubmitted(false); }} />{option}
          </label>)}
          {submitted && <p className={answers[i] === item.answer ? 'quiz-feedback correct' : 'quiz-feedback'}>
            <strong>{answers[i] === item.answer ? 'Đúng. ' : `Chưa đúng. Đáp án: ${item.options[item.answer]}. `}</strong>{item.explanation}
          </p>}
        </fieldset>)}
        <button id={`submit-quiz-${lessonId}`} type="submit" className="btn primary">Kiểm tra đáp án</button>
        {submitted && <p role="status">Kết quả: {score}/3. {score >= PASS_SCORE ? 'Đã đạt phần câu hỏi.' : 'Đọc giải thích rồi thử lại.'}</p>}
        {!submitted && record.score !== undefined && <p className="muted">Kết quả đã lưu: {record.score}/3.</p>}
      </form>
      <div className="lesson-completion">
        <button id={`complete-${lessonId}`} type="button" className="btn" disabled={!canComplete || !!record.done} onClick={() => save(lessonId, { done: true, journal })}>
          {record.done ? 'Đã học bài này ✓' : 'Đánh dấu đã học'}
        </button>
        <a href="#/learning">Xem lộ trình học tập →</a>
      </div>
      {storageError && <p role="alert" className="warn">Trình duyệt chưa lưu được tiến độ. Hãy tải ghi chép hoặc giữ trang này mở; trạng thái chưa được lưu.</p>}
    </section>
  </div>;
}
