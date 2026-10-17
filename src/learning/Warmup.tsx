import { useState } from 'react';
import './learn-ui.css';
import { ConceptSim } from '../features/concept-sim/ConceptSim';
import { DataVolumeSim } from '../features/data-volume/DataVolumeSim';
import { GUIDES } from './guides';
import { adaptGuide } from './dataContext';
import { useSessionData } from '../core/datasets/session';
import { STUDY_PROMPTS } from './model';
import { LESSON_CFG } from '../features/data-volume/model';

const KEY = 'warmup-collapsed';
const readCollapsed = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } };

/**
 * Hai mô phỏng gộp trong một khung có tab: chỉ một mô phỏng hiện cùng lúc để trang ngắn lại.
 * Có thể thu gọn; lựa chọn thu gọn được nhớ trên thiết bị này.
 */
export function Warmup({ lessonId, mode }: { lessonId: string; mode: 'lecture' | 'lab' }) {
  const [tab, setTab] = useState<'mech' | 'volume'>('mech');
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const toggle = () => { const next = !collapsed; setCollapsed(next); try { localStorage.setItem(KEY, next ? '1' : '0'); } catch { /* không lưu được thì chỉ áp dụng cho lần này */ } };
  const skip = () => document.getElementById(mode === 'lab' ? `lab-${lessonId}` : `guided-${lessonId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const tabs = [['mech', 'Cơ chế từng bước'], ['volume', 'Ít hay nhiều dữ liệu · 2D/3D']] as const;
  return <section className={`warmup${collapsed ? ' collapsed' : ''}`} aria-label={mode === 'lab' ? 'Khởi động trước khi thực hành' : 'Mô phỏng minh họa'}>
    <header className="warmup-head">
      <div>
        <p className="eyebrow">{mode === 'lab' ? 'Khởi động · khoảng 3 phút · không bắt buộc' : 'Mô phỏng minh họa bài giảng'}</p>
        <div className="warmup-tabs" role="tablist" aria-label="Chọn mô phỏng">
          {tabs.filter(([id]) => id !== 'volume' || !!LESSON_CFG[lessonId]).map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''}
            onClick={() => { setTab(id); if (collapsed) toggle(); }}>{label}</button>)}
        </div>
      </div>
      <div className="warmup-actions">
        <button type="button" className="btn sm" onClick={toggle} aria-expanded={!collapsed}>{collapsed ? 'Mở mô phỏng' : 'Thu gọn'}</button>
        <button type="button" className="btn primary sm" onClick={skip}>{mode === 'lab' ? 'Vào lab ↓' : 'Làm thí nghiệm ↓'}</button>
      </div>
    </header>
    {!collapsed && <div className="warmup-body" role="tabpanel">
      {tab === 'mech'
        ? <ConceptSim key="mech" lessonId={lessonId} mode={mode === 'lab' ? 'lab' : 'theory'} />
        : <DataVolumeSim key="volume" lessonId={lessonId} mode={mode} />}
    </div>}
  </section>;
}

/** Bốn bước thí nghiệm hiện ngay đầu trang Thực hành; ô ghi chép vẫn ở cuối trang. */
export function ExperimentBrief({ lessonId }: { lessonId: string }) {
  const data = useSessionData();
  const guide = GUIDES[lessonId] && adaptGuide(lessonId, GUIDES[lessonId], data);
  if (!guide) return null;
  const go = () => document.getElementById(`guided-${lessonId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return <section className="experiment-brief" aria-label="Thí nghiệm của bài">
    <p className="eyebrow">Việc cần làm trong bài này</p>
    <ol>{guide.experiment.map((s, i) => <li key={s}><b>{STUDY_PROMPTS[i]}</b> {s}</li>)}</ol>
    <p className="muted">Đổi một yếu tố mỗi lần. <button type="button" className="linklike" onClick={go}>Ghi kết quả ở cuối trang ↓</button></p>
  </section>;
}
