import { useEffect, useRef, useState } from 'react';
import './sim.css';
import { Icon } from '../../app/icons';
import { LESSONS } from '../../lessons';
import { ease, H, W, type Scene } from './kit';
import { ML_SCENES } from './scenesMl';
import { DL_SCENES } from './scenesDl';
import { GENAI_SCENES } from './scenesGenai';

export const SCENES: Record<string, Scene> = { ...ML_SCENES, ...DL_SCENES, ...GENAI_SCENES };
const STEP_SECONDS = 3.2;
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Mô phỏng hoạt hình cơ chế của một bài. Chế độ "theory" tự chạy để xem cơ chế;
 * chế độ "lab" dừng sẵn, yêu cầu dự đoán rồi kéo tham số để kiểm chứng.
 * Mọi số liệu là dữ liệu tổng hợp có seed, chỉ để minh họa.
 */
export function ConceptSim({ lessonId, mode }: { lessonId: string; mode: 'theory' | 'lab' }) {
  const scene = SCENES[lessonId];
  const n = scene?.steps.length ?? 1;
  const [pos, setPos] = useState(() => (mode === 'lab' || reduced() ? n - .001 : 0));
  const [playing, setPlaying] = useState(() => mode === 'theory' && !reduced());
  const [speed, setSpeed] = useState(1);
  const [v, setV] = useState(scene?.param?.value ?? 0);
  const [t, setT] = useState(0);
  const [visible, setVisible] = useState(true);
  const root = useRef<HTMLElement>(null);

  // Chỉ chạy khi khối mô phỏng đang trên màn hình, để không tốn CPU khi đọc phần khác.
  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver !== 'function') return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: .15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || !visible) return;
    let raf = 0, last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(.1, (now - last) / 1000); last = now;
      setT(x => x + dt);
      setPos(x => {
        const next = x + (dt * speed) / STEP_SECONDS;
        if (next >= n) { setPlaying(false); return n - .001; }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, visible, speed, n]);

  if (!scene) return null;
  const s = Math.min(n - 1, Math.floor(pos)), p = Math.min(1, pos - s), [label, note] = scene.steps[s];
  const goto = (i: number) => { const j = Math.max(0, Math.min(n - 1, i)); if (reduced()) { setPos(j + .999); setPlaying(false); } else { setPos(j); setPlaying(true); } };
  const ended = !playing && pos >= n - .01;
  const prm = scene.param;
  const id = `sim-${mode}-${lessonId}`;

  return <section ref={root} className={`concept-sim sim-${mode}`} aria-labelledby={id}>
    <header className="sim-head">
      <div>
        <p className="eyebrow">{mode === 'theory' ? 'Mô phỏng lý thuyết · hoạt hình từng bước' : 'Mô phỏng thực hành · dự đoán → kéo → quan sát'}</p>
        <h2 id={id}>{mode === 'theory' ? 'Xem cơ chế chạy' : 'Khởi động trước khi vào lab'}</h2>
      </div>
      <span className="sim-badge">Dữ liệu tổng hợp</span>
    </header>
    {mode === 'lab' && <p className="sim-predict"><strong>Dự đoán trước: </strong>{scene.predict}</p>}
    <div className="sim-body">
      <div className="sim-stage">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Bước ${s + 1}/${n}: ${label}. ${note}`}>
          {scene.draw({ s, p, e: ease(p), t, v })}
        </svg>
        <div className="sim-progress" aria-hidden="true">{scene.steps.map((_, i) => <span key={i}><i style={{ width: `${(i < s ? 1 : i > s ? 0 : p) * 100}%` }} /></span>)}</div>
      </div>
      <div className="sim-side">
        <ol className="sim-steps">
          {scene.steps.map(([l], i) => <li key={l}>
            <button type="button" className={i === s ? 'on' : i < s ? 'done' : ''} aria-current={i === s ? 'step' : undefined} onClick={() => goto(i)}>
              <span className="sim-n">{i + 1}</span><span>{l}</span>
            </button>
          </li>)}
        </ol>
        <p className="sim-note" aria-live="polite" key={s}>{note}</p>
        {prm && <label className="sim-param">
          <span>{prm.label}: <b>{prm.fmt ? prm.fmt(v) : v}</b></span>
          <input type="range" min={prm.min} max={prm.max} step={prm.step} value={v} onChange={e => setV(Number(e.target.value))} />
        </label>}
        <div className="sim-controls">
          <button type="button" className="btn sm" onClick={() => goto(s - 1)} disabled={s === 0} aria-label="Bước trước">‹</button>
          <button type="button" className="btn primary sm" onClick={() => { if (ended) { setPos(0); setPlaying(true); } else setPlaying(!playing); }}>
            {playing ? '❚❚ Tạm dừng' : ended ? '↻ Chạy lại' : '▶ Chạy'}
          </button>
          <button type="button" className="btn sm" onClick={() => goto(s + 1)} disabled={s === n - 1} aria-label="Bước sau">›</button>
          <label className="sim-speed">Tốc độ
            <select value={speed} onChange={e => setSpeed(Number(e.target.value))}>
              {[.5, 1, 1.5, 2].map(x => <option key={x} value={x}>{String(x).replace('.', ',')}×</option>)}
            </select>
          </label>
        </div>
        {mode === 'theory'
          ? <a className="sim-link" href={`#${LESSONS.find(l => l.id === lessonId)?.path}?tab=lab`}>Tự tay thử trong lab <Icon name="arrow" size={13} /></a>
          : <p className="sim-tip">Giữ mọi thứ khác cố định, chỉ kéo thanh trượt. Kết quả có khớp dự đoán? Ghi vào phần thí nghiệm bên dưới.</p>}
      </div>
    </div>
  </section>;
}
