import { DataImport } from './DataImport';
import { Icon } from './icons';
import { DataFit } from '../learning/DataFit';

export function LibraryTabs({ active }: { active: 'library' | 'data' | 'python' }) {
  return <nav className="library-tabs" aria-label="Thư viện và dữ liệu">
    <a href="#/" aria-current={active === 'library' ? 'page' : undefined}><Icon name="file" size={16} /> Thư viện bài học</a>
    <a id="library-python-tab" href="#/python" aria-current={active === 'python' ? 'page' : undefined}><Icon name="file" size={16} /> Python &amp; Colab</a>
    <a href="#/datasets" aria-current={active === 'data' ? 'page' : undefined}><Icon name="database" size={16} /> Nhập dữ liệu</a>
  </nav>;
}

export function DataWorkspace() {
  return <div className="data-workspace">
    <header className="library-intro"><p className="eyebrow">Dữ liệu của bạn</p><h1>Nhập dữ liệu</h1>
      <p>Chọn tệp, kiểm tra bản xem trước rồi dùng trong các bài thực hành.</p></header>
    <LibraryTabs active="data" />
    <section className="data-workspace-panel" aria-label="Tải lên và kiểm tra dữ liệu">
      <DataImport />
      <DataFit />
      <a id="home-explore-data" className="btn primary" href="#/eda?tab=lab">Khám phá dữ liệu đã nhập <Icon name="arrow" size={15} /></a>
    </section>
  </div>;
}
