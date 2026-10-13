import { useState } from 'react';
import { GROUPS, LESSONS, type Group } from '../lessons';
import { Icon } from './icons';
import { ModeBadge } from './ui';
import { matchesLesson } from './search';
import { DataImport } from './DataImport';

export function Home() {
  const [group, setGroup] = useState<Group | 'all'>('all');
  const [query, setQuery] = useState('');

  const lessons = GROUPS.flatMap((g) => LESSONS.filter((l) => l.group === g.id))
    .filter((l) => (group === 'all' || l.group === group) && matchesLesson(l, query));

  return (
    <div className="home compact-home clean-home">
      {/* Hero tối giản, gọn gàng, ít chữ */}
      <section className="home-intro" aria-labelledby="home-title">
        <div className="home-intro-content">
          <h1 id="home-title">Hiểu AI, từng bước một.</h1>
          <p className="lead">
            23 phòng lab tương tác và bài giảng audio trực quan chạy 100% trên trình duyệt.
          </p>
          <div className="home-intro-actions">
            <a id="home-start" className="btn primary sm" href="#/eda">
              Bắt đầu với EDA <Icon name="arrow" size={14} />
            </a>
            <a id="home-knn" className="btn sm" href="#/ml/knn">
              <Icon name="headphones" size={14} /> Học nhanh KNN
            </a>
            <a id="home-teachable" className="btn sm" href="#/ml/teachable?tab=lab">
              <Icon name="cpu" size={14} /> Nhận diện ảnh
            </a>
          </div>
        </div>
        <img
          src="/images/ai-learning-studio.png"
          alt="Góc học AI với laptop và đồ thị dữ liệu y sinh"
          width="160"
          height="160"
          fetchPriority="high"
        />
      </section>

      {/* Nhập dữ liệu riêng - gọn gàng 1 dòng */}
      <details className="home-data">
        <summary>
          Nhập dữ liệu riêng <span>CSV · TSV · Excel · JSON</span>
        </summary>
        <div className="data-box-inner">
          <DataImport />
          <div className="data-box-footer">
            <a id="home-explore-data" className="btn primary sm" href="#/eda?tab=lab">
              Khám phá dữ liệu đã nhập <Icon name="arrow" size={14} />
            </a>
          </div>
        </div>
      </details>

      {/* Danh mục bài học tinh gọn - không tràn chữ, cuộn cực ít */}
      <section className="lesson-catalog" aria-labelledby="catalog-title">
        <h2 id="catalog-title" className="sr-only">Khám phá bài học ({lessons.length})</h2>
        <div className="catalog-toolbar">
          <div className="catalog-filters" role="group" aria-label="Lọc theo chủ đề">
            <button id="filter-all" type="button" aria-pressed={group === 'all'} onClick={() => setGroup('all')}>
              Tất cả <span>{LESSONS.length}</span>
            </button>
            {GROUPS.map((g) => (
              <button
                id={`filter-${g.id}`}
                key={g.id}
                type="button"
                aria-pressed={group === g.id}
                onClick={() => setGroup(g.id)}
              >
                <Icon name={g.icon} size={14} />
                {g.title}
                <span>{LESSONS.filter((l) => l.group === g.id).length}</span>
              </button>
            ))}
          </div>

          <label className="search catalog-search" htmlFor="home-search">
            <Icon name="search" size={14} />
            <input
              id="home-search"
              type="search"
              placeholder="Tìm bài học…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Tìm bài học trên trang chủ"
            />
          </label>
        </div>

        <div className="lesson-list sleek-list">
          {lessons.map((l) => (
            <article className="lesson-row" key={l.id} title={l.goal}>
              <span className={`lesson-symbol lesson-symbol-${l.group}`} aria-hidden="true">
                <Icon name={GROUPS.find((g) => g.id === l.group)!.icon} size={18} />
              </span>
              <div className="lesson-row-copy">
                <h3>
                  <a id={`lesson-${l.id}`} href={`#${l.path}`}>
                    {l.title.split(':')[0]}
                  </a>
                </h3>
                <ModeBadge mode={l.mode} short />
              </div>
              <div className="lesson-row-actions">
                <a
                  id={`lecture-${l.id}`}
                  href={`#${l.path}`}
                  className="btn-action lecture"
                  aria-label={`Bài giảng ${l.title.split(':')[0]}`}
                >
                  <Icon name="headphones" size={14} />
                  <span>Bài giảng</span>
                </a>
                <a
                  id={`practice-${l.id}`}
                  href={`#${l.path}?tab=lab`}
                  className="btn-action practice"
                  aria-label={`Thực hành ${l.title.split(':')[0]}`}
                >
                  <span>Thực hành</span>
                  <Icon name="arrow" size={14} />
                </a>
              </div>
            </article>
          ))}
        </div>

        {!lessons.length && (
          <div className="catalog-empty">
            <Icon name="search" size={24} />
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
