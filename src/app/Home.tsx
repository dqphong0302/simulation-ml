import { useState } from 'react';
import { GROUPS, LESSONS, type Group } from '../lessons';
import { Icon } from './icons';
import { ModeBadge } from './ui';
import { matchesLesson } from './search';
import { DataImport } from './DataImport';

export function Home() {
  const [group, setGroup] = useState<Group | 'all'>('all');
  const [query, setQuery] = useState('');
  const lessons = GROUPS.flatMap(g => LESSONS.filter(l => l.group === g.id))
    .filter(l => (group === 'all' || l.group === group) && matchesLesson(l, query));
  return <div className="home compact-home">
    <section className="home-intro" aria-labelledby="home-title">
      <div>
        <p className="eyebrow">Học bằng thực nghiệm</p>
        <h1 id="home-title">Hiểu AI, từng bước một.</h1>
        <p className="lead">Nghe bài giảng, thử mô phỏng và khám phá với dữ liệu của bạn.</p>
        <a id="home-start" className="btn primary" href="#/eda">Bắt đầu với dữ liệu <Icon name="arrow" size={16} /></a>
        <p className="home-meta">{LESSONS.length} bài học · {GROUPS.length} chủ đề · Tiếng Việt</p>
      </div>
      <img src="/images/ai-learning-studio.png" alt="Góc học AI với laptop và đồ thị dữ liệu" width="420" height="420" fetchPriority="high" />
    </section>

    <section className="home-shortcuts" aria-label="Gợi ý bắt đầu">
      <a id="home-knn" href="#/ml/knn"><Icon name="headphones" size={20} /><span><b>Mới học Machine Learning?</b><small>Hiểu KNN qua một ví dụ đơn giản</small></span><Icon name="arrow" size={16} /></a>
      <a id="home-teachable" href="#/ml/teachable?tab=lab"><Icon name="cpu" size={20} /><span><b>Dạy máy nhận diện ảnh</b><small>Thử ngay với ảnh hoặc webcam</small></span><Icon name="arrow" size={16} /></a>
    </section>

    <details className="home-data"><summary>Thử với dữ liệu của bạn <span>CSV · Excel · JSON</span></summary><DataImport /><a id="home-explore-data" className="btn" href="#/eda?tab=lab">Khám phá dữ liệu đã nhập <Icon name="arrow" size={16} /></a></details>
    <section className="lesson-catalog" aria-labelledby="catalog-title">
      <div className="catalog-heading">
        <h2 id="catalog-title">Khám phá bài học</h2>
        <label className="search catalog-search" htmlFor="home-search"><Icon name="search" size={16} /><input id="home-search" type="search" placeholder="Tìm tên bài, thuật toán…" value={query} onChange={e => setQuery(e.target.value)} aria-label="Tìm bài học trên trang chủ" /></label>
      </div>
      <div className="catalog-filters" role="group" aria-label="Lọc theo chủ đề">
        <button id="filter-all" type="button" aria-pressed={group === 'all'} onClick={() => setGroup('all')}>Tất cả <span>{LESSONS.length}</span></button>
        {GROUPS.map(g => <button id={`filter-${g.id}`} key={g.id} type="button" aria-pressed={group === g.id} onClick={() => setGroup(g.id)}><Icon name={g.icon} size={15} />{g.title}<span>{LESSONS.filter(l => l.group === g.id).length}</span></button>)}
      </div>
      <p className="catalog-summary" role="status">{lessons.length} bài học{group !== 'all' ? ` · ${GROUPS.find(g => g.id === group)?.blurb}` : ' · Chọn bài giảng hoặc vào thẳng thực hành.'}</p>
      <div className="lesson-list">
        {lessons.map(l => <article className="lesson-row" key={l.id}>
          <span className={`lesson-symbol lesson-symbol-${l.group}`} aria-hidden="true"><Icon name={GROUPS.find(g => g.id === l.group)!.icon} size={20} /></span>
          <div className="lesson-row-copy">
            <h3><a id={`lesson-${l.id}`} href={`#${l.path}`}>{l.title.split(':')[0]}</a></h3>
            <p>{l.goal}</p>
            <ModeBadge mode={l.mode} />
          </div>
          <div className="lesson-row-actions">
            <a id={`lecture-${l.id}`} href={`#${l.path}`} aria-label={`Bài giảng ${l.title.split(':')[0]}`}><Icon name="headphones" size={15} />Bài giảng</a>
            <a id={`practice-${l.id}`} href={`#${l.path}?tab=lab`} aria-label={`Thực hành ${l.title.split(':')[0]}`}>Thực hành<Icon name="arrow" size={15} /></a>
          </div>
        </article>)}
      </div>
      {!lessons.length && <div className="catalog-empty"><Icon name="search" size={26} /><h3>Không tìm thấy bài học</h3><p>Thử từ khóa khác hoặc mở lại tất cả chủ đề.</p><button id="home-reset" className="btn" onClick={() => { setQuery(''); setGroup('all'); }}>Xóa bộ lọc</button></div>}
    </section>
    <p className="muted disclaimer">Ví dụ y tế chỉ phục vụ học tập, không phải công cụ chẩn đoán.</p>
  </div>;
}
