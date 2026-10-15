import { Fragment, Suspense, lazy, useEffect, useState, type ReactNode } from 'react';
import { AutoencoderLab, DiffusionLab, GanLab, VaeLab } from '../features/dl-lab/GenLabs';
import { SvmLab, ForestLab, KmeansLab, PcaLab, RegressionLab } from '../features/ml-lab/ExtraLabs';
import { CompareLab } from '../features/ml-lab/CompareLab';
import { DataLab } from '../features/data-lab/DataLab';
import { DlLab } from '../features/dl-lab/DlLab';
import { TransformerLab } from '../features/dl-lab/TransformerLab';
import { AttentionLab } from '../features/dl-lab/AttentionLab';
import { CnnLab } from '../features/dl-lab/CnnLab';
import { Concepts } from '../features/genai-playground/Concepts';
import { Playground } from '../features/genai-playground/Playground';
import { RagLab } from '../features/rag-lab/RagLab';
import { NarratedLogistic } from '../features/narrated-lessons/NarratedLogistic';
import { NarratedTree } from '../features/narrated-lessons/NarratedTree';
import { NarratedKnn } from '../features/narrated-lessons/NarratedKnn';
import { KnnLab } from '../features/ml-lab/KnnLab';
import { LogisticLab } from '../features/ml-lab/LogisticLab';
import { TreeLab } from '../features/ml-lab/TreeLab';
import { SettingsPage } from '../features/settings/SettingsPage';
import { GROUPS, LESSONS, orderLessons } from '../lessons';
import { SlideLecture } from '../features/narrated-lessons/SlideLecture';
import { DataGate } from './DataGate';
import { Icon } from './icons';
import { ModeBadge, Toasts } from './ui';
import { Home } from './Home';
import { DataWorkspace } from './DataWorkspace';
import { matchesLesson } from './search';
import { LessonPrimer, LessonLearning } from '../learning/LessonLearning';
import { LearningPath } from '../learning/LearningPath';
import { Introduction, Capstone } from '../learning/StudyPages';
import { ExperimentBrief, Warmup } from '../learning/Warmup';
const TheoryDoc = lazy(() => import('../features/narrated-lessons/TheoryDoc').then(m => ({ default: m.TheoryDoc })));
const EdaLab = lazy(() => import('../features/eda/EdaLab').then(m => ({ default: m.EdaLab })));
const TeachableLab = lazy(() => import('../features/teachable-lab/TeachableLab').then(m => ({ default: m.TeachableLab })));


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


const gate = (key: string, f: (d: Parameters<Parameters<typeof DataGate>[0]['render']>[0]) => ReactNode) =>
  <DataGate render={(d) => <Fragment key={key + d.source + d.ds.featureNames.join()}>{f(d)}</Fragment>} />;

function labFor(path: string): ReactNode {
  switch (path) {
    case '/eda': return <Suspense fallback={<p className="loading">Đang mở trang thống kê…</p>}><EdaLab /></Suspense>;
    case '/data': return gate(path, (d) => <DataLab d={d} />);
    case '/ml/knn': return gate(path, (d) => <KnnLab d={d} />);
    case '/ml/tree': return gate(path, (d) => <TreeLab d={d} />);
    case '/ml/logistic': return gate(path, (d) => <LogisticLab d={d} />);
    case '/ml/kmeans': return gate(path, (d) => <KmeansLab d={d} />);
    case '/ml/pca': return gate(path, (d) => <PcaLab d={d} />);
    case '/ml/regression': return gate(path, (d) => <RegressionLab d={d} />);
    case '/ml/forest': return gate(path, (d) => <ForestLab d={d} />);
    case '/ml/svm': return gate(path, (d) => <SvmLab d={d} />);
    case '/ml/compare': return gate(path, (d) => <CompareLab d={d} />);
    case '/ml/teachable': return <Suspense fallback={<p className="loading">Đang mở phòng nhận diện ảnh…</p>}><TeachableLab /></Suspense>;
    case '/dl/mlp': return gate(path, (d) => <DlLab d={d} />);
    case '/dl/autoencoder': return gate(path, (d) => <AutoencoderLab d={d} />);
    case '/dl/vae': return gate(path, (d) => <VaeLab d={d} />);
    case '/dl/cnn': return <CnnLab />;
    case '/dl/attention': return <AttentionLab />;
    case '/dl/transformer': return <TransformerLab />;
    case '/dl/gan': return <GanLab />;
    case '/dl/diffusion': return <DiffusionLab />;
    case '/genai/concepts': return <Concepts />;
    case '/genai': return <Playground />;
    case '/rag': return <RagLab />;
    default: return null;
  }
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
        <LessonPrimer lessonId={lesson.id} />
        {tab === 'lab' && <ExperimentBrief lessonId={lesson.id} />}
        {tab === 'lab' && <Warmup lessonId={lesson.id} mode="lab" />}
        {tab === 'lab' && <div className="lab-anim" id={`lab-${lesson.id}`}>{labFor(path)}</div>}
        {tab === 'lecture' && lectureFor(lesson.id, toLab)}
        {tab === 'lecture' && <Warmup lessonId={lesson.id} mode="lecture" />}
        {tab === 'theory' && <Suspense fallback={<p className="loading">Đang mở tài liệu lý thuyết…</p>}><TheoryDoc lessonId={lesson.id} title={lesson.title} group={lesson.group} /></Suspense>}
        <LessonLearning key={`${lesson.id}-${tab}`} lessonId={lesson.id} practice={tab === 'lab'} />
      </div>
    );
  } else if (path === '/intro') page = <Introduction />;
  else if (path === '/learning') page = <LearningPath />;
  else if (path === '/project') page = <Capstone />;
  else if (path === '/datasets') page = <DataWorkspace />;
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
        {link('/learning', 'Lộ trình học tập', 'file')}
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
                {items.map((l) => link(l.path, l.title.split(':')[0]))}
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
                  <p className="eyebrow">{group?.title}</p>
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
