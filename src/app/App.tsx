import { Suspense, lazy, useEffect, useState, type ReactNode } from 'react';
import { SettingsPage } from '../features/settings/SettingsPage';
import { GROUPS, LESSONS, orderLessons } from '../lessons';
import { LabRouter } from './LabRouter';
import { Icon } from './icons';
import { ModeBadge, Toasts } from './ui';
import { Home } from './Home';
import { DataWorkspace } from './DataWorkspace';
import { matchesLesson } from './search';
import { LessonPrimer, LessonLearning } from '../learning/LessonLearning';
import { LearningPath } from '../learning/LearningPath';
import { Introduction, Capstone } from '../learning/StudyPages';
import { ExperimentBrief, Warmup } from '../learning/Warmup';
import '../teaching/teaching.css';
const NarratedLogistic = lazy(() => import('../features/narrated-lessons/NarratedLogistic').then(m => ({ default: m.NarratedLogistic })));
const NarratedTree = lazy(() => import('../features/narrated-lessons/NarratedTree').then(m => ({ default: m.NarratedTree })));
const NarratedKnn = lazy(() => import('../features/narrated-lessons/NarratedKnn').then(m => ({ default: m.NarratedKnn })));
const SlideLecture = lazy(() => import('../features/narrated-lessons/SlideLecture').then(m => ({ default: m.SlideLecture })));
const PythonGuide = lazy(() => import('../learning/PythonGuide').then(m => ({ default: m.PythonGuide })));
const Station = lazy(() => import('../teaching/Station').then(m => ({ default: m.Station })));
const TeachingDesk = lazy(() => import('../teaching/TeachingDesk').then(m => ({ default: m.TeachingDesk })));
const StudentWorkshop = lazy(() => import('../teaching/StudentWorkshop').then(m => ({ default: m.StudentWorkshop })));
const TheoryDoc = lazy(() => import('../features/narrated-lessons/TheoryDoc').then(m => ({ default: m.TheoryDoc })));


function useHashPath(): string {
  const read = () => {
    const h = location.hash.slice(1) || '/';
    const legacy: Record<string, string> = { '/ml/knn-voice': '/ml/knn', '/ml/tree-voice': '/ml/tree', '/ml/logistic-voice': '/ml/logistic' };
    return legacy[h] ?? h;
  };
  const [p, setP] = useState(read);
  useEffect(() => {
    const f = () => setP(read());
    addEventListener('hashchange', f);
    return () => removeEventListener('hashchange', f);
  }, []);
  return p;
}


function lectureFor(id: string, toLab: () => void): ReactNode {
  if (id === 'KNN') return <NarratedKnn />;
  if (id === 'TREE') return <NarratedTree />;
  if (id === 'LOGREG') return <NarratedLogistic />;
  return <SlideLecture lessonId={id} onPractice={toLab} />;
}

export function App() {
  const full = useHashPath();
  const [path, query] = full.split('?');
  const requested = new URLSearchParams(query ?? '').get('tab');
  const tab: Tab = requested === 'lab' ? 'lab' : requested === 'theory' ? 'theory' : 'lecture';
  const lesson = LESSONS.find((l) => l.path === path);
  let page: ReactNode;
  if (lesson) {
    const toLab = () => { location.hash = `#${lesson.path}?tab=lab`; };
    page = (
      <div key={`${path}-${tab}`} className="tab-panel" role="tabpanel">
        {tab !== 'lecture' && <LessonPrimer lessonId={lesson.id} />}
        {tab === 'lab' && <ExperimentBrief lessonId={lesson.id} />}
        {tab === 'lab' && <Warmup lessonId={lesson.id} mode="lab" />}
        {tab === 'lab' && <div className="lab-anim" id={`lab-${lesson.id}`}><LabRouter path={path} /></div>}
        {tab === 'lecture' && <Suspense fallback={<p className="loading">Đang mở bài giảng…</p>}>{lectureFor(lesson.id, toLab)}</Suspense>}
        {tab === 'lecture' && <LessonPrimer lessonId={lesson.id} />}
        {tab === 'lecture' && <Warmup lessonId={lesson.id} mode="lecture" />}
        {tab === 'theory' && <Suspense fallback={<p className="loading">Đang mở tài liệu lý thuyết…</p>}><TheoryDoc lessonId={lesson.id} title={lesson.title} group={lesson.group} /></Suspense>}
        <LessonLearning key={`${lesson.id}-${tab}`} lessonId={lesson.id} practice={tab === 'lab'} />
      </div>
    );
  } else if (path === '/intro') page = <Introduction />;
  else if (path === '/station') page = <Suspense fallback={<p className="loading">Đang mở trạm giảng dạy…</p>}><Station groupId={new URLSearchParams(query ?? '').get('group')} /></Suspense>;
  else if (path === '/teaching') page = <Suspense fallback={<p className="loading">Đang mở bàn giảng viên…</p>}><TeachingDesk key={query ?? ''} groupId={new URLSearchParams(query ?? '').get('group')} topic={new URLSearchParams(query ?? '').get('topic')} /></Suspense>;
  else if (path === '/workshop') page = <Suspense fallback={<p className="loading">Đang mở xưởng thực hành…</p>}><StudentWorkshop key={query ?? ''} topic={new URLSearchParams(query ?? '').get('topic') ?? 'EDA'} /></Suspense>;
  else if (path === '/learning') page = <LearningPath />;
  else if (path === '/project') page = <Capstone />;
  else if (path === '/datasets') page = <DataWorkspace />;
  else if (path === '/python') page = <Suspense fallback={<p className="loading">Đang mở Python & Colab…</p>}><PythonGuide /></Suspense>;
  else if (path === '/settings') page = <SettingsPage />;
  else page = <Home />;
  return <Shell path={path} tab={tab} lesson={lesson}>{page}</Shell>;
}

/** Ba mặt của một bài: nghe giảng, đọc lý thuyết, rồi thực hành. */
export type Tab = 'lecture' | 'theory' | 'lab';
export const TABS: { id: Tab; label: string; icon: string; hint: string }[] = [
  { id: 'lecture', label: 'Bài giảng', icon: 'headphones', hint: 'Slide có giọng đọc, đồng bộ theo từng cảnh.' },
  { id: 'theory', label: 'Lý thuyết', icon: 'file', hint: 'Tài liệu chữ đầy đủ: công thức, mục lục, tải về.' },
  { id: 'lab', label: 'Thực hành', icon: 'chart', hint: 'Chạy mô phỏng, chỉnh tham số, tải CSV của bạn.' },
];

function Shell({ path, tab, lesson, children }: { path: string; tab: string; lesson?: (typeof LESSONS)[number]; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 900px)').matches);
  const [q, setQ] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    return lesson ? { [lesson.group]: true } : {};
  });
  useEffect(() => {
    setOpen(false);
    window.scrollTo({ top: 0 });
    if (lesson?.group) {
      setExpanded(prev => ({ ...prev, [lesson.group]: true }));
    }
  }, [path, lesson?.group]);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 900px)');
    const update = () => { setMobile(media.matches); setOpen(false); };
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const group = GROUPS.find((g) => g.id === lesson?.group);
  const link = (href: string, label: string, icon?: string) => (
    <a key={href} href={`#${href}`} className="nav-link" aria-current={path === href ? 'page' : undefined}>{icon && <Icon name={icon} size={15} />}<span>{label}</span></a>
  );
  const ordered = orderLessons(LESSONS);
  const idx = lesson ? ordered.indexOf(lesson) : -1;
  const prev = idx > 0 ? ordered[idx - 1] : null, next = idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : null;
  return (
    <div className={`shell${open ? ' nav-open' : ''}`}>
      <a className="skip" href="#main" onClick={e => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Bỏ qua điều hướng</a>
      <header className="topbar">
        <button id="menu-toggle" className="icon-btn only-mobile" aria-label={open ? 'Đóng menu' : 'Mở menu'} aria-controls="lesson-sidebar" aria-expanded={open} onClick={() => setOpen(!open)}><Icon name={open ? 'close' : 'menu'} /></button>
        <a href="#/" className="brand"><span className="logo" aria-hidden="true"><Icon name="brain" size={17} /></span><span>Simulation ML<small>AI Y tế & Y sinh Studio</small></span></a>
        <nav className="crumbs" aria-label="Vị trí">
          {group && <><span>{group.title}</span><Icon name="chevron" size={14} /></>}
          {lesson && <span className="cur">{lesson.title.split(':')[0]}</span>}
        </nav>
        <div className="top-actions">
          <a href="#/settings" className="icon-btn" aria-label="Cấu hình API" title="Cấu hình API"><Icon name="settings" /></a>
        </div>
      </header>
      <aside id="lesson-sidebar" className="sidebar" aria-label="Bài học" inert={mobile && !open} onClick={e => { if ((e.target as HTMLElement).closest('a')) setOpen(false); }} onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); document.getElementById('menu-toggle')?.focus(); } }}>
        <label className="search"><Icon name="search" size={15} /><input placeholder="Tìm bài…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Tìm bài" /></label>
        {link('/', 'Trang chủ', 'home')}
        {link('/station', 'Trạm Tin học Y khoa', 'cpu')}
        {link('/teaching', 'Bàn giảng viên', 'clipboard')}
        {link('/workshop', 'Xưởng thực hành nhóm', 'chart')}
        {link('/learning', 'Lộ trình học tập', 'file')}
        {link('/python', 'Python & Colab', 'file')}
        {link('/datasets', 'Nhập dữ liệu', 'database')}
        {GROUPS.map((g) => {
          const items = orderLessons(LESSONS.filter((l) => l.group === g.id && matchesLesson(l, q)));
          if (!items.length) return null;
          const isExpanded = q.trim().length > 0 || !!expanded[g.id];
          const shut = !isExpanded;
          return (
            <div className="nav-group" key={g.id}>
              <button
                className="nav-head"
                aria-expanded={isExpanded}
                onClick={() => setExpanded(prev => ({ ...prev, [g.id]: !prev[g.id] }))}
              >
                <Icon name={g.icon} size={15} />
                <span>{g.title}</span>
                <span className="n">{items.length}</span>
                <Icon name="chevron" size={14} className="chev" />
              </button>
              <div className={`nav-items${shut ? ' shut' : ''}`}>
                {items.filter(l => !l.exploration).map((l) => link(l.path, l.title.split(':')[0]))}
                {items.some(l => l.exploration) && <p className="nav-exploration">Khám phá thêm · Không bắt buộc</p>}
                {items.filter(l => l.exploration).map((l) => link(l.path, l.title.split(':')[0]))}
              </div>
            </div>
          );
        })}
        {!LESSONS.some(l => matchesLesson(l, q)) && <p className="muted" role="status">Không tìm thấy bài học.</p>}
        {link('/settings', 'Cấu hình API', 'settings')}
      </aside>
      <div className="scrim only-mobile" onClick={() => setOpen(false)} aria-hidden="true" />
      <main id="main" tabIndex={-1}>
        <div className="page-anim" key={path}>
          {lesson && (
            <header className="lesson-head">
              <div className="lh-row">
                <div className="lh-title">
                  <p className="eyebrow">{group?.title}{lesson.exploration ? ' · Khám phá thêm · Không bắt buộc' : ''}</p>
                  <h1>{lesson.title}</h1>
                  <p className="lead" title={lesson.goal}>{lesson.goal}</p>
                </div>
                <ModeBadge mode={lesson.mode} />
              </div>
              <nav className="mode-tabs" role="tablist" aria-label="Chế độ học">
                {TABS.map((t) => (
                  <a
                    key={t.id}
                    role="tab"
                    aria-selected={tab === t.id}
                    href={t.id === 'lecture' ? `#${lesson.path}` : `#${lesson.path}?tab=${t.id}`}
                    className={tab === t.id ? 'on' : ''}
                  >
                    <span className="mt-ic"><Icon name={t.icon} size={20} /></span>
                    <span className="mt-txt"><b>{t.label}</b><small>{t.id === 'lab' && lesson.group === 'genai' ? 'Thử với mô hình và tài liệu của bạn' : t.hint}</small></span>
                  </a>
                ))}
              </nav>
            </header>
          )}
          {children}
          {lesson && (
            <nav className="pager" aria-label="Bài trước và sau">
              {prev ? <a href={`#${prev.path}`} className="pg prev"><small>Bài trước</small><b>{prev.title.split(':')[0]}</b></a> : <span />}
              {next ? <a href={`#${next.path}`} className="pg next"><small>Bài tiếp theo</small><b>{next.title.split(':')[0]}</b></a> : <span />}
            </nav>
          )}
        </div>
        <Toasts />
        <footer className="foot">Mô phỏng và dữ liệu xử lý trên thiết bị. Khi dùng AI, nội dung bạn chọn được gửi trực tiếp đến API đã cấu hình. Học liệu {LESSONS[0].version}.</footer>
      </main>
    </div>
  );
}
