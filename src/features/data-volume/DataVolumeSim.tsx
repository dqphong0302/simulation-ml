import { useEffect, useMemo, useRef, useState } from 'react';
import './data-volume.css';
import { LESSON_CFG, LEVELS, MAX_N, evaluate, ghostsFor, makePool, metricsFor, regime, type Cfg, type Metric, type Pool } from './model';
import { paint2d, paint3d, readPal, type Pal } from './render';

const SEEDS = 3, FALL_MS = 750, STEP_MS = 650;
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmtN = (n: number) => n.toLocaleString('vi-VN');

/** Câu hỏi dự đoán trước khi đổ dữ liệu, theo họ bài toán. */
const PREDICT: Record<Cfg['family'], string> = {
  classify: 'Với 10 mẫu, độ chính xác train và test sẽ gần nhau hay cách xa? Khi đổ tới 1.200 mẫu thì sao?',
  regress: 'Khi chỉ có 10 mẫu, các đường hồi quy từ những lần lấy mẫu khác nhau (đường mờ) sẽ chụm hay xòe? RMSE test có thể thấp hơn mức nhiễu không?',
  density: 'Ít mẫu thì mô hình "thuộc lòng" từng điểm: log-likelihood train cao hơn hay thấp hơn test?',
  cluster: 'Với 10 mẫu, tâm cụm (dấu ×) có trùng tâm thật (vòng đứt) không? Cần khoảng bao nhiêu mẫu để ổn định?',
  pca: 'Ít mẫu thì trục PC1 ước lượng (đường đậm) lệch khỏi trục thật bao nhiêu độ? Các lần lấy mẫu khác có lệch giống nhau?',
  stats: 'Muốn khoảng tin cậy của mean hẹp đi một nửa, cần gấp đôi hay gấp bốn lần dữ liệu?',
  retrieve: 'Kho tài liệu càng nhiều đoạn thì câu hỏi càng dễ tìm được đoạn khớp. Từ bao nhiêu đoạn thì gần như mọi câu hỏi đều có đoạn khớp?',
};

function insight(cfg: Cfg, n: number, v: number[], ms: Metric[]): string {
  const r = regime(n), f = (i: number) => ms[i].fmt(v[i]);
  switch (cfg.family) {
    case 'classify': {
      const gap = (v[0] - v[1]) * 100, g = `${gap.toFixed(1).replace('.', ',')} điểm %`;
      return [`Ít dữ liệu (N = ${fmtN(n)}): ranh giới bám theo từng điểm. Train ${f(0)} nhưng test chỉ ${f(1)}, chênh ${g}: mô hình học cả nhiễu (phương sai cao).`,
        `Dữ liệu vừa: ranh giới (đường đậm) bắt đầu giống ranh giới thật (đường đứt). Chênh train–test còn ${g}.`,
        `Nhiều dữ liệu: train và test sát nhau (chênh ${g}). Nếu test vẫn thấp, giới hạn nằm ở mô hình (bias, ví dụ Logistic chỉ vẽ được đường thẳng) hoặc nhiễu nhãn, không còn ở lượng dữ liệu.`][r];
    }
    case 'regress': return [`Ít dữ liệu: mỗi lần lấy mẫu khác cho một đường khác hẳn (đường mờ xòe rộng). RMSE train ${f(0)} có thể thấp hơn cả mức nhiễu ${f(2)}: đó là khớp nhiễu.`,
      `Dữ liệu vừa: các đường chụm lại quanh đường thật. RMSE test ${f(1)} đang tiến về mức nhiễu ${f(2)}.`,
      `Nhiều dữ liệu: hệ số gần như cố định, RMSE test ${f(1)} ≈ mức nhiễu ${f(2)}. Thêm dữ liệu không giảm được nhiễu, chỉ giảm sai số ước lượng.`][r];
    case 'density': return [`Ít dữ liệu: mô hình chỉ thấy vài điểm nên tạo "đồi" quanh từng điểm. Log-likelihood train ${f(0)} cao hơn hẳn test ${f(1)}: thuộc lòng, chưa khái quát.`,
      `Dữ liệu vừa: bề mặt bắt đầu có đủ 3 đỉnh như phân phối thật. Test ${f(1)}, trần lý thuyết ${f(2)}.`,
      `Nhiều dữ liệu: bề mặt học được gần trùng phân phối thật; mẫu sinh ra sẽ giống dữ liệu thật hơn. Test ${f(1)} sát trần ${f(2)}.`][r];
    case 'cluster': return [`Ít dữ liệu: một cụm có thể chỉ có 2–3 điểm, tâm × lệch xa tâm thật (sai số ${f(0)}); chạy lại với mẫu khác sẽ ra cụm khác.`,
      `Dữ liệu vừa: các tâm đã về gần đúng chỗ, sai số ${f(0)}.`,
      `Nhiều dữ liệu: tâm cụm gần như cố định (sai số ${f(0)}). Thêm dữ liệu không sửa được lựa chọn k sai.`][r];
    case 'pca': return [`Ít dữ liệu: trục PC1 lệch ${f(0)} so với trục thật, các lần lấy mẫu khác (đường mờ) chỉ mỗi hướng một kiểu.`,
      `Dữ liệu vừa: trục ước lượng ổn định hơn, lệch ${f(0)}; PC1 giải thích ${f(1)} phương sai.`,
      `Nhiều dữ liệu: trục gần như trùng trục thật (lệch ${f(0)}). Hình chiếu 2D giờ đáng tin.`][r];
    case 'stats': return [`Ít dữ liệu: histogram lởm chởm, mean lệch ${f(0)} và khoảng tin cậy 95% rất rộng. Median/mean fit trên ít mẫu này sẽ lệch khi đem điền thiếu.`,
      `Dữ liệu vừa: histogram bắt đầu có hình chuông như đường thật; sai số mean ${f(0)} (lý thuyết ${f(1)}).`,
      `Nhiều dữ liệu: sai số giảm theo 1/√N. Gấp 4 lần dữ liệu chỉ thu hẹp khoảng tin cậy một nửa.`][r];
    case 'retrieve': return [`Kho nhỏ: nhiều câu hỏi không có đoạn nào thật sự khớp (chỉ ${f(1)} có đoạn cos > 0,97); mô hình dễ trả lời bằng đoạn lạc đề.`,
      `Kho vừa: độ tương đồng top-1 ${f(0)}, ${f(1)} câu hỏi đã có đoạn khớp.`,
      `Kho lớn: gần như câu hỏi nào cũng có đoạn khớp (${f(1)}). Lúc này chất lượng chia đoạn và lọc nhiễu quan trọng hơn số lượng.`][r];
  }
}

/** Đường học: chỉ số theo cỡ mẫu (thang log), dải mờ là min–max qua 3 lần lấy mẫu. */
function Curve({ ms, curves, li, done }: { ms: Metric[]; curves: (number[] | undefined)[][]; li: number; done: number }) {
  const W = 320, H = 168, L = 38, R = 8, T = 10, B = 26, cols = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];
  const all: number[] = []; curves.forEach(s => s.forEach(v => v && v.forEach((x, k) => ms[k].chart !== false && all.push(x))));
  if (!all.length) return <p className="dv-wait">Đang tính đường học…</p>;
  let lo = Math.min(...all), hi = Math.max(...all); const padY = (hi - lo) * .08 || .05; lo -= padY; hi += padY;
  const sx = (i: number) => L + (i / (LEVELS.length - 1)) * (W - L - R), sy = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const stat = (k: number, i: number) => { const vs = curves.map(s => s[i]?.[k]).filter((x): x is number => x !== undefined); return vs.length ? { m: vs.reduce((a, b) => a + b, 0) / vs.length, lo: Math.min(...vs), hi: Math.max(...vs) } : null; };
  const ticks = [10, 30, 100, 300, 1000].map(n => ({ n, i: Math.log(n / LEVELS[0]) / Math.log(MAX_N / LEVELS[0]) * (LEVELS.length - 1) }));
  return <svg className="dv-curve" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Đường học theo số mẫu">
    {ticks.map(t => <g key={t.n}><line x1={sx(t.i)} x2={sx(t.i)} y1={T} y2={H - B} className="dv-grid" /><text x={sx(t.i)} y={H - B + 13} className="dv-tick" textAnchor="middle">{fmtN(t.n)}</text></g>)}
    {[lo + padY, (lo + hi) / 2, hi - padY].map((v, i) => <text key={i} x={L - 5} y={sy(v) + 3} className="dv-tick" textAnchor="end">{ms[0].fmt(v)}</text>)}
    <text x={(L + W - R) / 2} y={H - 3} className="dv-tick" textAnchor="middle">số mẫu N (thang log)</text>
    {ms.map((m, k) => {
      if (m.chart === false) return null;
      const pts = LEVELS.map((_, i) => ({ i, s: stat(k, i) })).filter(p => p.s);
      if (!pts.length) return null;
      const line = pts.map((p, j) => `${j ? 'L' : 'M'}${sx(p.i).toFixed(1)} ${sy(p.s!.m).toFixed(1)}`).join('');
      const band = m.kind === 'ref' ? '' : `${pts.map((p, j) => `${j ? 'L' : 'M'}${sx(p.i).toFixed(1)} ${sy(p.s!.hi).toFixed(1)}`).join('')}${[...pts].reverse().map(p => `L${sx(p.i).toFixed(1)} ${sy(p.s!.lo).toFixed(1)}`).join('')}Z`;
      return <g key={k}>
        {band && <path d={band} style={{ fill: cols[m.color], opacity: .14 }} />}
        <path d={line} style={{ stroke: cols[m.color], strokeWidth: m.kind === 'ref' ? 1.4 : 2.2, fill: 'none', strokeDasharray: m.kind === 'ref' ? '4 3' : m.kind === 'train' ? '6 3' : undefined }} />
      </g>;
    })}
    <line x1={sx(li)} x2={sx(li)} y1={T} y2={H - B} className="dv-now" />
    {ms.map((m, k) => { const s = m.chart !== false && stat(k, li); return s && <circle key={k} cx={sx(li)} cy={sy(s.m)} r={4} style={{ fill: cols[m.color], stroke: 'var(--surface)', strokeWidth: 1.5 }} />; })}
    {done < LEVELS.length * SEEDS && <text x={W - R} y={T + 10} className="dv-tick" textAnchor="end">đang tính {Math.round(done / (LEVELS.length * SEEDS) * 100)}%</text>}
  </svg>;
}

/**
 * Mô phỏng "dữ liệu đổ vào ít hay nhiều": điểm dữ liệu rơi dần vào khung 2D/3D,
 * mô hình fit lại ở mỗi mốc N, đường học cho thấy train/test hội tụ thế nào.
 */
export function DataVolumeSim({ lessonId, mode }: { lessonId: string; mode: 'lecture' | 'lab' }) {
  const cfg = LESSON_CFG[lessonId];
  const [dim, setDim] = useState<'2d' | '3d'>(mode === 'lab' ? '3d' : '2d');
  const [li, setLi] = useState(0);
  const [pouring, setPouring] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [seed, setSeed] = useState(1);
  const [autoRot, setAutoRot] = useState(() => !reduced());
  const [visible, setVisible] = useState(false);
  const [curves, setCurves] = useState<(number[] | undefined)[][]>([]);
  const [done, setDone] = useState(0);
  const root = useRef<HTMLElement>(null), canvas = useRef<HTMLCanvasElement>(null), wrap = useRef<HTMLDivElement>(null);
  const born = useRef(new Float64Array(MAX_N)), cam = useRef({ yaw: -.75, pitch: .5, drag: null as null | { x: number; y: number; yaw: number; pitch: number } });
  const pal = useRef<Pal | null>(null), started = useRef(false);

  const pools = useMemo(() => cfg ? Array.from({ length: SEEDS }, (_, k) => makePool(cfg.family, seed + k)) : [], [cfg, seed]);
  const ms = useMemo(() => cfg ? metricsFor(cfg) : [], [cfg]);
  const n = LEVELS[li];
  const cur = useMemo(() => {
    if (!cfg) return null;
    const r = evaluate(cfg, pools[0], n, seed, true);
    return { values: r.values, view: { ...r.view, ...ghostsFor(cfg, n, [seed + 11, seed + 12, seed + 13, seed + 14]) } };
  }, [cfg, pools, n, seed]);

  // Chỉ chạy khi đang nằm trên màn hình.
  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver !== 'function') { setVisible(true); return; }
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: .2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  // Bài giảng: lần đầu cuộn tới thì tự đổ dữ liệu.
  useEffect(() => { if (visible && !started.current && mode === 'lecture' && !reduced()) { started.current = true; setPouring(true); } }, [visible, mode]);

  // Tính đường học dần dần để không chặn giao diện.
  useEffect(() => {
    if (!cfg) return;
    const res: (number[] | undefined)[][] = Array.from({ length: SEEDS }, () => new Array(LEVELS.length).fill(undefined));
    setCurves(res.map(r => [...r])); setDone(0);
    let job = 0, timer = 0, cancelled = false;
    const total = LEVELS.length * SEEDS;
    const run = () => {
      const t0 = performance.now();
      while (job < total && performance.now() - t0 < 14) {
        const i = Math.floor(job / SEEDS), k = job % SEEDS;
        res[k][i] = evaluate(cfg, pools[k] as Pool, LEVELS[i], seed + k, false).values; job++;
      }
      if (cancelled) return;
      setCurves(res.map(r => [...r])); setDone(job);
      if (job < total) timer = window.setTimeout(run, 0);
    };
    timer = window.setTimeout(run, 30);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [cfg, pools, seed]);

  // Đổ dữ liệu: tăng mốc N theo nhịp.
  useEffect(() => {
    if (!pouring || !visible) return;
    if (li >= LEVELS.length - 1) { setPouring(false); return; }
    const id = window.setTimeout(() => setLi(i => Math.min(LEVELS.length - 1, i + 1)), STEP_MS / speed);
    return () => clearTimeout(id);
  }, [pouring, visible, li, speed]);

  // Ghi thời điểm các điểm mới xuất hiện để chúng rơi vào khung.
  const prevN = useRef(0);
  useEffect(() => {
    const now = performance.now(), b = born.current, p = prevN.current, add = n - p;
    if (n > p) for (let i = p; i < n; i++) b[i] = reduced() ? 0 : now + ((i - p) / Math.max(1, add)) * Math.min(STEP_MS / speed, 600);
    else for (let i = n; i < p; i++) b[i] = 0;
    prevN.current = n;
  }, [n, speed]);
  useEffect(() => { born.current.fill(0); prevN.current = 0; }, [seed]);

  // Vòng vẽ canvas.
  useEffect(() => {
    const cv = canvas.current, wr = wrap.current;
    if (!cv || !wr || !cfg || !cur) return;
    let raf = 0, last = performance.now(), size = { w: 0, h: 0 };
    const frame = (now: number) => {
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      if (dim === '3d' && autoRot && !cam.current.drag && visible) cam.current.yaw += dt * .35;
      const ctx = cv.getContext('2d'); if (!ctx || !pal.current) return;
      const b = born.current, fall = (i: number) => b[i] === 0 ? 1 : Math.max(0, Math.min(1, (now - b[i]) / FALL_MS));
      (dim === '3d' ? paint3d : paint2d)(ctx, size.w, size.h, { cfg, pts: pools[0].train, n, view: cur.view, mode: dim, pal: pal.current, fall, yaw: cam.current.yaw, pitch: cam.current.pitch, t: now / 1000 });
      let moving = dim === '3d' && (autoRot || !!cam.current.drag);
      for (let i = Math.max(0, n - 400); i < n && !moving; i++) if (b[i] !== 0 && now - b[i] < FALL_MS) moving = true;
      if (moving && visible) raf = requestAnimationFrame(frame);
    };
    const kick = () => { cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(frame); };
    // Đổi kích thước canvas sẽ xóa hình, nên luôn vẽ lại sau khi fit.
    const fit = () => {
      const w = wr.clientWidth, h = Math.round(Math.max(260, Math.min(460, w * .66))), dpr = Math.min(2, window.devicePixelRatio || 1);
      if (w === size.w && h === size.h && pal.current) return;
      cv.width = w * dpr; cv.height = h * dpr; cv.style.height = `${h}px`; size = { w, h };
      cv.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0); pal.current = readPal(cv);
      kick();
    };
    size = { w: 0, h: 0 }; fit();
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(fit) : null; ro?.observe(wr);
    cv.addEventListener('dv-kick', kick);
    return () => { cancelAnimationFrame(raf); ro?.disconnect(); cv.removeEventListener('dv-kick', kick); };
  }, [cfg, cur, dim, autoRot, visible, n, pools]);

  if (!cfg || !cur) return null;
  const id = `dv-${mode}-${lessonId}`, full = Math.log(n / LEVELS[0]) / Math.log(MAX_N / LEVELS[0]);
  const ended = li >= LEVELS.length - 1;
  const onDown = (e: React.PointerEvent) => { if (dim !== '3d') return; (e.target as Element).setPointerCapture(e.pointerId); cam.current.drag = { x: e.clientX, y: e.clientY, yaw: cam.current.yaw, pitch: cam.current.pitch }; canvas.current?.dispatchEvent(new Event('dv-kick')); };
  const onMove = (e: React.PointerEvent) => { const d = cam.current.drag; if (!d) return; cam.current.yaw = d.yaw - (e.clientX - d.x) * .01; cam.current.pitch = Math.max(-.2, Math.min(1.35, d.pitch + (e.clientY - d.y) * .008)); };
  const onUp = () => { if (cam.current.drag) { cam.current.drag = null; setAutoRot(false); } };
  const togglePour = () => { if (ended) { setLi(0); setPouring(true); } else setPouring(p => !p); };
  const gapIdx = ms.findIndex(m => m.kind === 'train'), testIdx = ms.findIndex(m => m.kind === 'test');

  return <section ref={root} className={`dv-sim dv-${mode}`} aria-labelledby={id}>
    <header className="dv-head">
      <div>
        <p className="eyebrow">{mode === 'lab' ? 'Mô phỏng thực hành 2D · 3D' : 'Mô phỏng trong bài giảng'} · lượng dữ liệu</p>
        <h2 id={id}>Đổ dữ liệu vào: ít hay nhiều thì mô hình khác gì?</h2>
        <p className="dv-sub"><b>{cfg.model}.</b> {cfg.data}</p>
      </div>
      <div className="dv-seg" role="group" aria-label="Chế độ hiển thị">
        {(['2d', '3d'] as const).map(d => <button key={d} type="button" className={dim === d ? 'on' : ''} aria-pressed={dim === d} onClick={() => setDim(d)}>{d.toUpperCase()}</button>)}
      </div>
    </header>
    {mode === 'lab' && <p className="sim-predict"><strong>Dự đoán trước: </strong>{PREDICT[cfg.family]}</p>}
    <div className="dv-body">
      <div className="dv-stage" ref={wrap}>
        <canvas ref={canvas} className={dim === '3d' ? 'grab' : ''} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
          role="img" aria-label={`Khung ${dim.toUpperCase()} với ${n} mẫu dữ liệu. ${insight(cfg, n, cur.values, ms)}`} />
        <div className="dv-legend">
          {cfg.family === 'classify' && <><span><i style={{ background: 'var(--chart-1)' }} />Nhóm xanh</span><span><i style={{ background: 'var(--chart-2)' }} />Nhóm cam</span><span><i className="ln" />Ranh giới mô hình</span><span><i className="ln dash" />Ranh giới thật</span></>}
          {cfg.family === 'regress' && <><span><i className="ln" />Đường/mặt fit</span><span><i className="ln dash" />Quan hệ thật</span><span><i className="ln ghost" />4 lần lấy mẫu khác cùng N</span></>}
          {cfg.family === 'density' && <><span><i style={{ background: 'var(--chart-4)' }} />Phân phối học được</span><span><i className="ln dash" />Đồng mức phân phối thật</span></>}
          {cfg.family === 'cluster' && <><span>× Tâm cụm ước lượng</span><span>◌ Tâm thật</span></>}
          {cfg.family === 'pca' && <><span><i className="ln" />PC1 ước lượng</span><span><i className="ln dash" />PC1 thật</span><span><i className="ln ghost" />4 lần lấy mẫu khác</span></>}
          {cfg.family === 'stats' && <><span><i style={{ background: 'var(--chart-1)' }} />Histogram</span><span><i className="ln dash" />Phân phối thật</span><span><i style={{ background: 'var(--chart-2)' }} />mean ± 95% CI</span></>}
          {cfg.family === 'retrieve' && <><span>★ Câu hỏi</span><span><i className="ln" />3 đoạn gần nhất</span><span>Màu = chủ đề</span></>}
          {dim === '3d' && <button type="button" className="dv-rot" onClick={() => { setAutoRot(a => !a); canvas.current?.dispatchEvent(new Event('dv-kick')); }}>{autoRot ? '❚❚ Dừng xoay' : '⟳ Tự xoay'}</button>}
        </div>
      </div>
      <div className="dv-side">
        <div className="dv-tankrow">
          <div className={`dv-tank${pouring ? ' pouring' : ''}`} aria-hidden="true">
            <span className="dv-drop" /><span className="dv-drop" /><span className="dv-drop" />
            <div className="dv-liquid" style={{ height: `${8 + full * 88}%` }} />
          </div>
          <div className="dv-count">
            <span>Dữ liệu đã đổ vào</span>
            <b>{fmtN(n)} <small>mẫu</small></b>
            <span className={`dv-regime r${regime(n)}`}>{['Ít dữ liệu', 'Vừa phải', 'Nhiều dữ liệu'][regime(n)]}</span>
          </div>
        </div>
        <div className="dv-metrics">
          {ms.map((m, k) => <div key={k} className={`dv-m k-${m.kind}`}><span>{m.label}</span><b>{m.fmt(cur.values[k])}</b></div>)}
          {gapIdx >= 0 && testIdx >= 0 && cfg.family !== 'pca' && cfg.family !== 'retrieve' && <div className="dv-m gap"><span>Chênh train – test</span><b>{ms[gapIdx].fmt(Math.abs(cur.values[gapIdx] - cur.values[testIdx]))}</b></div>}
        </div>
        <Curve ms={ms} curves={curves} li={li} done={done} />
        <p className="dv-note" aria-live="polite">{insight(cfg, n, cur.values, ms)}</p>
        <label className="sim-param">
          <span>Số mẫu N: <b>{fmtN(n)}</b></span>
          <input type="range" min={0} max={LEVELS.length - 1} step={1} value={li} onChange={e => { setPouring(false); setLi(Number(e.target.value)); }} aria-valuetext={`${n} mẫu`} />
        </label>
        <div className="sim-controls">
          <button type="button" className="btn primary sm" onClick={togglePour}>{pouring ? '❚❚ Tạm dừng' : ended ? '↻ Đổ lại từ đầu' : '▶ Đổ dữ liệu'}</button>
          <button type="button" className="btn sm" onClick={() => { setPouring(false); setLi(0); }} disabled={li === 0}>Về 8 mẫu</button>
          <button type="button" className="btn sm" onClick={() => { setSeed(s => s + SEEDS); setLi(0); setPouring(true); }} title="Lấy một luồng dữ liệu khác cùng phân phối">Lấy mẫu khác</button>
          <label className="sim-speed">Tốc độ
            <select value={speed} onChange={e => setSpeed(Number(e.target.value))}>
              {[.5, 1, 2, 4].map(x => <option key={x} value={x}>{String(x).replace('.', ',')}×</option>)}
            </select>
          </label>
        </div>
        <p className="sim-tip">Đường liền là test, đường gạch là train, dải mờ là dao động giữa 3 lần lấy mẫu. Sai số thống kê giảm theo 1/√N: gấp 4 lần dữ liệu chỉ giảm sai số khoảng một nửa.</p>
      </div>
    </div>
  </section>;
}
