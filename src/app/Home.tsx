import { Fragment, useState } from 'react';
import { GROUPS, LESSONS, orderLessons, type Group } from '../lessons';
import { Icon } from './icons';
import { ModeBadge } from './ui';
import { matchesLesson } from './search';
import { LibraryTabs } from './DataWorkspace';
import { LessonVisual } from './LessonVisual';
import { LearningPath } from '../learning/LearningPath';
import { CORE_LESSONS } from '../learning/model';

export function Home() {
  const [group, setGroup] = useState<Group | 'all'>('all');
  const [query, setQuery] = useState('');

  const lessons = GROUPS.flatMap((g) => LESSONS.filter((l) => l.group === g.id))
    .filter((l) => (group === 'all' || l.group === group) && matchesLesson(l, query));
  const current = GROUPS.find((g) => g.id === group);

  return (
    <div className="home">
      <header className="library-intro">
        <p className="eyebrow">AI · Y tế &amp; Y sinh</p>
        <h1 id="home-title">Học từ nguyên lý, hiểu qua thực hành.</h1>
        <p>{LESSONS.length} bài học · {GROUPS.length} chuyên đề · Bài giảng, lý thuyết và Python trên Colab.</p>
      </header>
      <LibraryTabs active="library" />
      <aside className="station-home-entry" aria-label="Trạm giảng dạy bộ môn"><div><b>Trạm Tin học Y khoa</b><p>Học theo nhóm năng lực · Soạn buổi học · Phiếu thực hành nhóm</p></div><a id="home-open-station" className="btn" href="#/station">Mở trạm giảng dạy →</a></aside>
      <LearningPath compact />

      <section className="lesson-catalog" aria-labelledby="catalog-title">
        <div className="catalog-toolbar">
          <div className="ct-head">
            <h2 id="catalog-title">Thư viện bài học</h2>
            <p>{current ? current.blurb : 'Bài cơ bản trước, phần mở rộng sau. Không cần học hết để bắt đầu.'}</p>
          </div>
          <label className="search catalog-search" htmlFor="home-search">
            <Icon name="search" size={16} />
            <input
              id="home-search"
              type="search"
              placeholder="Tìm bài học, mục tiêu…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Tìm bài học trên trang chủ"
            />
          </label>
        </div>

        <div className="catalog-filters" role="group" aria-label="Lọc theo chủ đề">
          <span className="filter-label">Chuyên đề</span>
          <button id="filter-all" type="button" className="chip" aria-pressed={group === 'all'} onClick={() => setGroup('all')}>
            Tất cả <span className="count">{LESSONS.length}</span>
          </button>
          {GROUPS.map((g) => (
            <button
              id={`filter-${g.id}`}
              key={g.id}
              type="button"
              className="chip"
              aria-pressed={group === g.id}
              onClick={() => setGroup(g.id)}
            >
              <Icon name={g.icon} size={14} />
              {g.title}
              <span className="count">{LESSONS.filter((l) => l.group === g.id).length}</span>
            </button>
          ))}
        </div>

        <p className="catalog-result" role="status">{lessons.length} bài học{query.trim() ? ` phù hợp với “${query.trim()}”` : ' · Chọn một bài để bắt đầu'}</p>
        {GROUPS.map((section, index) => {
          const items = lessons.filter(l => l.group === section.id);
          if (!items.length) return null;
          return <section className={`catalog-group catalog-group-${section.id}`} key={section.id} aria-labelledby={`group-${section.id}`}>
            <header className="catalog-group-head">
              <span className="group-icon" aria-hidden="true"><Icon name={section.icon} size={22} /></span>
              <div><p className="group-number">Chuyên đề 0{index + 1}</p><h3 id={`group-${section.id}`}>{section.title}</h3><p>{section.blurb}</p></div>
              <span className="group-count">{items.length} bài học</span>
            </header>
            <div className="lesson-list sleek-list">
          {orderLessons(items).map((l, i, ordered) => (
            <Fragment key={l.id}>
            {l.exploration && !ordered[i - 1]?.exploration && <div id="explore-dl" className="catalog-explore-heading" role="heading" aria-level={4}><b>Khám phá thêm</b><p>VAE, GAN và Diffusion · Không bắt buộc với sinh viên năm nhất. Học các bài ứng dụng trước.</p></div>}
            <article className="lesson-row" data-exploration={l.exploration || undefined}>
              <a className="lesson-thumbnail" href={`#${l.path}`} aria-label={`Xem bài ${l.title}`}>
                <LessonVisual group={l.group} lessonId={l.id} label={l.title.split(':')[0]} />
              </a>
              <div className="lesson-meta">
                <ModeBadge mode={l.mode} short />
                <span className="lesson-level">{String(orderLessons(LESSONS.filter(x => x.group === l.group)).findIndex(x => x.id === l.id) + 1).padStart(2, '0')} · {l.exploration ? 'Khám phá thêm · Không bắt buộc' : CORE_LESSONS.includes(l.id) ? 'Cơ bản' : ['BOOST', 'TRANSFER', 'SEG'].includes(l.id) ? 'Ứng dụng · Có hướng dẫn' : 'Mở rộng · Tùy chọn'}</span>
              </div>
              <div className="lesson-row-copy">
                <h4>
                  <a id={`lesson-${l.id}`} href={`#${l.path}`}>
                    {l.title.split(':')[0]}
                  </a>
                </h4>
                <p className="lesson-goal">{l.goal}</p>
              </div>
              <div className="lesson-row-actions">
                <a
                  id={`lecture-${l.id}`}
                  href={`#${l.path}`}
                  className="btn-action"
                  aria-label={`Bài giảng ${l.title.split(':')[0]}`}
                >
                  <Icon name="headphones" size={15} />
                  <span>Giảng</span>
                </a>
                <a
                  id={`theory-${l.id}`}
                  href={`#${l.path}?tab=theory`}
                  className="btn-action"
                  aria-label={`Lý thuyết và Python ${l.title.split(':')[0]}`}
                  title="Lý thuyết · notebook Python"
                >
                  <Icon name="file" size={15} />
                  <span>Lý thuyết</span>
                </a>
                <a
                  id={`practice-${l.id}`}
                  href={`#${l.path}?tab=lab`}
                  className="btn-action practice"
                  aria-label={`Thực hành ${l.title.split(':')[0]}`}
                >
                  <span>Thực hành</span>
                  <Icon name="arrow" size={15} />
                </a>
              </div>
            </article>
            </Fragment>
          ))}
            </div>
          </section>;
        })}

        {!lessons.length && (
          <div className="catalog-empty">
            <Icon name="search" size={26} />
            <h3>Không tìm thấy bài học</h3>
            <p>Thử từ khóa khác hoặc chuyển sang chuyên đề khác.</p>
            <button id="home-reset" className="btn primary sm" onClick={() => { setQuery(''); setGroup('all'); }}>
              Đặt lại bộ lọc
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
