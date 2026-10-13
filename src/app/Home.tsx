import { useState } from 'react';
import { GROUPS, LESSONS, type Group } from '../lessons';
import { Icon } from './icons';
import { ModeBadge } from './ui';
import { matchesLesson } from './search';
import { DataImport } from './DataImport';

export function Home() {
  const [group, setGroup] = useState<Group | 'all'>('all');
  const [query, setQuery] = useState('');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'compact'>('grid');

  const lessons = GROUPS.flatMap((g) => LESSONS.filter((l) => l.group === g.id))
    .filter((l) => (group === 'all' || l.group === group) && matchesLesson(l, query));

  return (
    <div className="home compact-home modern-home">
      <section className="home-intro" aria-labelledby="home-title">
        <div className="home-intro-content">
          <div className="badge-pill">
            <span className="dot pulse" />
            <span>Nền tảng Thực hành AI Y tế & Y học Dựa trên Bằng chứng</span>
          </div>
          <h1 id="home-title">Hiểu AI, từng bước một.</h1>
          <p className="lead">
            Nghe bài giảng đa phương tiện, trực quan hóa cơ chế sinh lý bệnh và thực nghiệm thuật toán máy học
            với dữ liệu của bạn ngay trên trình duyệt.
          </p>
          <div className="home-intro-actions">
            <a id="home-start" className="btn primary glow" href="#/eda">
              Bắt đầu với Khám phá dữ liệu <Icon name="arrow" size={16} />
            </a>
            <a className="btn outline" href="#/ml/compare?tab=lab">
              Đối đầu mô hình <Icon name="chart" size={16} />
            </a>
          </div>
          <div className="intro-meta-tags">
            <span className="meta-tag"><Icon name="database" size={13} /> 23 Phòng Lab</span>
            <span className="meta-tag"><Icon name="brain" size={13} /> 4 Trục Kiến Thức</span>
            <span className="meta-tag"><Icon name="sparkles" size={13} /> Chuẩn TRIPOD-AI</span>
            <span className="meta-tag"><Icon name="cpu" size={13} /> 100% In-Browser</span>
          </div>
        </div>
        <div className="home-intro-visual">
          <div className="visual-halo" />
          <img
            src="/images/ai-learning-studio.png"
            alt="Góc học AI với laptop và đồ thị dữ liệu y sinh"
            width="420"
            height="420"
            fetchPriority="high"
          />
        </div>
      </section>

      <section className="home-shortcuts" aria-label="Gợi ý bắt đầu">
        <a id="home-knn" href="#/ml/knn" className="shortcut-card">
          <div className="sc-icon sc-blue"><Icon name="headphones" size={22} /></div>
          <div className="sc-body">
            <b>Mới học Machine Learning?</b>
            <small>Hiểu KNN qua một ví dụ đơn giản và trực quan</small>
          </div>
          <span className="sc-arrow"><Icon name="arrow" size={16} /></span>
        </a>
        <a id="home-teachable" href="#/ml/teachable?tab=lab" className="shortcut-card">
          <div className="sc-icon sc-purple"><Icon name="cpu" size={22} /></div>
          <div className="sc-body">
            <b>Dạy máy nhận diện ảnh</b>
            <small>Thử chuyển giao học MobileNet qua ảnh hoặc webcam</small>
          </div>
          <span className="sc-arrow"><Icon name="arrow" size={16} /></span>
        </a>
      </section>

      <details className="home-data">
        <summary>
          Thử với dữ liệu của bạn <span>Hỗ trợ CSV · TSV · Excel (XLSX) · JSON mảng phẳng</span>
        </summary>
        <div className="data-box-inner">
          <DataImport />
          <div className="data-box-footer">
            <a id="home-explore-data" className="btn primary sm" href="#/eda?tab=lab">
              Khám phá dữ liệu đã nhập <Icon name="arrow" size={15} />
            </a>
          </div>
        </div>
      </details>

      <section className="lesson-catalog" aria-labelledby="catalog-title">
        <div className="catalog-heading">
          <div className="catalog-title-wrap">
            <h2 id="catalog-title">Khám phá bài học & Lab</h2>
            <p className="catalog-subtitle">Lựa chọn bài học theo chuyên đề hoặc tìm kiếm nhanh thuật toán</p>
          </div>
          <div className="catalog-controls">
            <label className="search catalog-search" htmlFor="home-search">
              <Icon name="search" size={16} />
              <input
                id="home-search"
                type="search"
                placeholder="Tìm tên bài, thuật toán, ROC, RAG…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Tìm bài học trên trang chủ"
              />
            </label>
            <div className="view-mode-toggle" role="group" aria-label="Chế độ xem">
              <button
                type="button"
                className={`vm-btn ${layoutMode === 'grid' ? 'active' : ''}`}
                onClick={() => setLayoutMode('grid')}
                title="Xem dạng Lưới thẻ"
                aria-pressed={layoutMode === 'grid'}
              >
                <Icon name="chart" size={15} /> Lưới thẻ
              </button>
              <button
                type="button"
                className={`vm-btn ${layoutMode === 'compact' ? 'active' : ''}`}
                onClick={() => setLayoutMode('compact')}
                title="Xem dạng Danh sách"
                aria-pressed={layoutMode === 'compact'}
              >
                <Icon name="menu" size={15} /> Danh sách
              </button>
            </div>
          </div>
        </div>

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
              <Icon name={g.icon} size={15} />
              {g.title}
              <span>{LESSONS.filter((l) => l.group === g.id).length}</span>
            </button>
          ))}
        </div>

        <div className="catalog-summary-bar">
          <p className="catalog-summary" role="status">
            Đang hiển thị <b>{lessons.length}</b> bài học
            {group !== 'all' ? ` · ${GROUPS.find((g) => g.id === group)?.blurb}` : ' · Chọn bài giảng lý thuyết hoặc vào thẳng thực hành.'}
          </p>
        </div>

        <div className={`lesson-list ${layoutMode === 'grid' ? 'is-grid' : 'is-compact'}`}>
          {lessons.map((l) => (
            <article className="lesson-row" key={l.id}>
              <div className="lesson-row-top">
                <span className={`lesson-symbol lesson-symbol-${l.group}`} aria-hidden="true">
                  <Icon name={GROUPS.find((g) => g.id === l.group)!.icon} size={22} />
                </span>
                <ModeBadge mode={l.mode} />
              </div>
              <div className="lesson-row-copy">
                <h3>
                  <a id={`lesson-${l.id}`} href={`#${l.path}`}>
                    {l.title.split(':')[0]}
                  </a>
                </h3>
                <p className="lesson-desc">{l.goal}</p>
              </div>
              <div className="lesson-row-actions">
                <a
                  id={`lecture-${l.id}`}
                  href={`#${l.path}`}
                  className="btn-action lecture"
                  aria-label={`Bài giảng ${l.title.split(':')[0]}`}
                >
                  <Icon name="headphones" size={15} />
                  <span>Bài giảng</span>
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
          ))}
        </div>

        {!lessons.length && (
          <div className="catalog-empty">
            <div className="empty-icon"><Icon name="search" size={32} /></div>
            <h3>Không tìm thấy bài học phù hợp</h3>
            <p>Thử tìm kiếm với từ khóa khác hoặc chuyển sang danh mục khác.</p>
            <button id="home-reset" className="btn primary sm" onClick={() => { setQuery(''); setGroup('all'); }}>
              Đặt lại bộ lọc
            </button>
          </div>
        )}
      </section>
      <p className="muted disclaimer">
        ⚕️ Ví dụ y tế và hồ sơ lâm sàng phục vụ mục đích nghiên cứu & học tập phương pháp học máy, không thay thế chẩn đoán chuyên khoa.
      </p>
    </div>
  );
}
