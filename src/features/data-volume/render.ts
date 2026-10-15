import { CENTERS, G, MAX_N, QUERY, REG_W, STAT_MU, STAT_SD, TRUE_AXES, trueDensity, type Cfg, type Pt, type V3, type View } from './model';

/** Bảng màu đọc từ biến CSS của giao diện. */
export type Pal = { a: string; b: string; c: string; d: string; brand: string; sim: string; ink: string; ink2: string; mute: string; line: string; surf: string; surf2: string };
export function readPal(el: Element): Pal {
  const s = getComputedStyle(el), v = (k: string, f: string) => s.getPropertyValue(k).trim() || f;
  return { a: v('--chart-1', '#2563eb'), b: v('--chart-2', '#dc6a0b'), c: v('--chart-3', '#0f9a6c'), d: v('--chart-4', '#9333ea'), brand: v('--brand', '#2563eb'), sim: v('--sim', '#6d4bc4'),
    ink: v('--text', '#0f1729'), ink2: v('--text-2', '#334155'), mute: v('--text-3', '#64748b'), line: v('--border-strong', '#cbd5e1'), surf: v('--surface', '#fff'), surf2: v('--surface-2', '#f7f8fa') };
}
const rgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', ''), f = h.length === 3 ? h.split('').map(x => x + x).join('') : h.slice(0, 6), n = parseInt(f, 16);
  return Number.isNaN(n) ? [100, 100, 100] : [n >> 16 & 255, n >> 8 & 255, n & 255];
};
const mix = (x: string, y: string, t: number, a = 1) => { const p = rgb(x), q = rgb(y); return `rgba(${p.map((v, i) => Math.round(v + (q[i] - v) * t)).join(',')},${a})`; };
const alpha = (x: string, a: number) => mix(x, x, 0, a);
const easeOut = (t: number) => 1 - (1 - Math.min(1, Math.max(0, t))) ** 3;

export interface Paint {
  cfg: Cfg; pts: Pt[]; n: number; view: View; mode: '2d' | '3d'; pal: Pal;
  /** Tiến độ rơi của điểm i (0 = vừa đổ vào, 1 = đã nằm yên). */
  fall: (i: number) => number;
  yaw: number; pitch: number; t: number;
}

/* ---------- Đường đồng mức (marching squares) trên lưới G×G ---------- */
type Seg = [number, number, number, number];
export function contour(g: ArrayLike<number>, level: number): Seg[] {
  const out: Seg[] = [], c = (i: number) => -1 + 2 * (i + .5) / G;
  for (let j = 0; j < G - 1; j++) for (let i = 0; i < G - 1; i++) {
    const v = [g[j * G + i], g[j * G + i + 1], g[(j + 1) * G + i + 1], g[(j + 1) * G + i]];
    const xy: [number, number][] = [[c(i), c(j)], [c(i + 1), c(j)], [c(i + 1), c(j + 1)], [c(i), c(j + 1)]], cross: [number, number][] = [];
    for (let e = 0; e < 4; e++) {
      const a = v[e] - level, b = v[(e + 1) % 4] - level;
      if ((a < 0) !== (b < 0)) { const t = a / (a - b), p = xy[e], q = xy[(e + 1) % 4]; cross.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
    }
    for (let k = 0; k + 1 < cross.length; k += 2) out.push([cross[k][0], cross[k][1], cross[k + 1][0], cross[k + 1][1]]);
  }
  return out;
}
const TRUE_DEN = (() => { const g = new Float32Array(G * G); for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) g[j * G + i] = trueDensity(-1 + 2 * (i + .5) / G, -1 + 2 * (j + .5) / G); return g; })();
const TRUE_DEN_MAX = Math.max(...TRUE_DEN);
const TRUE_DEN_SEGS = [.25, .8].map(l => contour(TRUE_DEN, l));

const radius = (n: number) => n < 40 ? 5 : n < 150 ? 4 : n < 500 ? 3 : 2.4;
const pointColor = (cfg: Cfg, p: Pt, i: number, v: View, pal: Pal) => {
  const k = [pal.a, pal.b, pal.c, pal.d, pal.sim, pal.brand];
  if (cfg.family === 'classify') return p.y ? pal.b : pal.a;
  if (cfg.family === 'cluster') return k[v.assign?.[i] ?? 0];
  if (cfg.family === 'retrieve') return k[p.y % 6];
  if (cfg.family === 'regress') return mix(pal.a, pal.b, (p.x[1] + 1) / 2);
  if (cfg.family === 'density') return pal.d;
  return pal.a;
};

/* ======================= 2D ======================= */
export function paint2d(ctx: CanvasRenderingContext2D, w: number, h: number, P: Paint) {
  const { cfg, pts, n, view, pal } = P, pad = { l: 40, r: 14, t: 14, b: 30 };
  const pw = w - pad.l - pad.r, ph = h - pad.t - pad.b;
  const yr: [number, number] = cfg.family === 'regress' ? [-2.6, 2.6] : cfg.family === 'stats' ? [0, 1.9] : [-1.15, 1.15];
  const xr: [number, number] = [-1.15, 1.15];
  const sx = (x: number) => pad.l + (x - xr[0]) / (xr[1] - xr[0]) * pw, sy = (y: number) => pad.t + (1 - (y - yr[0]) / (yr[1] - yr[0])) * ph;
  ctx.clearRect(0, 0, w, h);

  // Khung và lưới
  ctx.strokeStyle = alpha(pal.line, .6); ctx.lineWidth = 1; ctx.font = '10.5px system-ui, sans-serif'; ctx.fillStyle = pal.mute;
  ctx.strokeRect(pad.l, pad.t, pw, ph);
  ctx.textAlign = 'center';
  [-1, 0, 1].forEach(x => { ctx.fillText(String(x).replace('-', '−'), sx(x), h - pad.b + 14); });
  ctx.textAlign = 'right';
  const yt = cfg.family === 'regress' ? [-2, 0, 2] : cfg.family === 'stats' ? [0, .5, 1, 1.5] : [-1, 0, 1];
  yt.forEach(y => { ctx.fillText(String(y).replace('.', ',').replace('-', '−'), pad.l - 6, sy(y) + 3); });
  ctx.textAlign = 'center'; ctx.fillStyle = pal.ink2;
  const xl = cfg.family === 'retrieve' ? 'chiều embedding 1' : 'x₁', yl = cfg.family === 'regress' ? 'y' : cfg.family === 'stats' ? 'mật độ' : cfg.family === 'retrieve' ? 'chiều 2' : 'x₂';
  ctx.fillText(xl, pad.l + pw / 2, h - 4);
  ctx.save(); ctx.translate(11, pad.t + ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(yl, 0, 0); ctx.restore();

  ctx.save(); ctx.beginPath(); ctx.rect(pad.l, pad.t, pw, ph); ctx.clip();
  const cw = (sx(1) - sx(-1)) / G, ch = (sy(-1) - sy(1)) / G;
  const segs = (ss: Seg[], color: string, lw: number, dash: number[] = []) => {
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.setLineDash(dash); ctx.beginPath();
    ss.forEach(([a, b, c, d]) => { ctx.moveTo(sx(a), sy(b)); ctx.lineTo(sx(c), sy(d)); }); ctx.stroke(); ctx.setLineDash([]);
  };

  if (view.grid && cfg.family === 'classify') {
    for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
      const p = view.grid[j * G + i]; ctx.fillStyle = p >= .5 ? pal.b : pal.a; ctx.globalAlpha = .08 + Math.abs(p - .5) * .32;
      ctx.fillRect(sx(-1) + i * cw, sy(-1) - (j + 1) * ch, cw + .5, ch + .5);
    }
    ctx.globalAlpha = 1;
    // ranh giới thật
    ctx.strokeStyle = pal.ink2; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]); ctx.beginPath();
    for (let k = 0; k <= 60; k++) { const a = -1 + k / 30; const y = .55 * Math.sin(2.5 * a); k ? ctx.lineTo(sx(a), sy(y)) : ctx.moveTo(sx(a), sy(y)); }
    ctx.stroke(); ctx.setLineDash([]);
    segs(contour(view.grid, .5), pal.ink, 2.4);
  }
  if (view.grid && cfg.family === 'density') {
    const m = Math.max(TRUE_DEN_MAX, view.gridMax ?? 1);
    for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
      ctx.fillStyle = pal.d; ctx.globalAlpha = Math.min(.75, view.grid[j * G + i] / m * .75);
      ctx.fillRect(sx(-1) + i * cw, sy(-1) - (j + 1) * ch, cw + .5, ch + .5);
    }
    ctx.globalAlpha = 1;
    TRUE_DEN_SEGS.forEach(s => segs(s, pal.ink2, 1.4, [5, 4]));
    [.25, .8].forEach(l => segs(contour(view.grid!, l), pal.ink, 2));
  }
  if (cfg.family === 'retrieve') { ctx.strokeStyle = alpha(pal.line, .9); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(sx(0), sy(0), sx(1) - sx(0), 0, Math.PI * 2); ctx.stroke(); }

  if (cfg.family === 'stats') {
    const bins = 26, lo = -1, hi = 1, bw = (hi - lo) / bins, cnt = new Array<number>(bins).fill(0);
    let settled = 0;
    for (let i = 0; i < n; i++) if (P.fall(i) >= 1) { const b = Math.floor((pts[i].x[0] - lo) / bw); if (b >= 0 && b < bins) { cnt[b]++; settled++; } }
    ctx.fillStyle = pal.a; ctx.globalAlpha = .55;
    cnt.forEach((c, b) => { const d = settled ? c / (settled * bw) : 0; ctx.fillRect(sx(lo + b * bw) + 1, sy(d), sx(lo + (b + 1) * bw) - sx(lo + b * bw) - 2, sy(0) - sy(d)); });
    ctx.globalAlpha = 1;
    // mật độ thật
    ctx.strokeStyle = pal.ink2; ctx.lineWidth = 1.6; ctx.setLineDash([5, 4]); ctx.beginPath();
    for (let k = 0; k <= 80; k++) { const x = -1 + k / 40, y = Math.exp(-((x - STAT_MU) ** 2) / (2 * STAT_SD ** 2)) / (STAT_SD * Math.sqrt(2 * Math.PI)); k ? ctx.lineTo(sx(x), sy(y)) : ctx.moveTo(sx(x), sy(y)); }
    ctx.stroke(); ctx.setLineDash([]);
    if (view.mean !== undefined) {
      const se = 1.96 * (view.sd ?? STAT_SD) / Math.sqrt(n);
      ctx.fillStyle = alpha(pal.b, .18); ctx.fillRect(sx(view.mean - se), pad.t, sx(view.mean + se) - sx(view.mean - se), ph);
      ctx.strokeStyle = pal.b; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(sx(view.mean), pad.t); ctx.lineTo(sx(view.mean), sy(0)); ctx.stroke();
      ctx.strokeStyle = pal.ink; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(sx(STAT_MU), pad.t); ctx.lineTo(sx(STAT_MU), sy(0)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = pal.b; ctx.textAlign = 'left'; ctx.font = '600 11px system-ui, sans-serif';
      ctx.fillText(`mean ± 95% CI: ${view.mean.toFixed(3).replace('.', ',')} ± ${se.toFixed(3).replace('.', ',')}`, pad.l + 8, pad.t + 14);
    }
    // điểm mới đổ vào rơi xuống trục
    for (let i = 0; i < n; i++) { const f = P.fall(i); if (f >= 1) continue;
      ctx.globalAlpha = 1 - f * .3; ctx.fillStyle = pal.a; ctx.beginPath(); ctx.arc(sx(pts[i].x[0]), pad.t + (sy(0) - pad.t) * easeOut(f), 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1; ctx.restore(); return;
  }

  if (cfg.family === 'regress' && view.plane) {
    const line = (w3: V3, color: string, lw: number, dash: number[] = [], a = 1) => { ctx.globalAlpha = a; ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(sx(-1.1), sy(w3[0] - 1.1 * w3[1])); ctx.lineTo(sx(1.1), sy(w3[0] + 1.1 * w3[1])); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; };
    view.ghosts?.forEach(g => line(g, pal.b, 1.4, [], .35));
    line(REG_W, pal.ink2, 1.5, [5, 4]);
    line(view.plane, pal.ink, 2.6);
  }

  // Điểm dữ liệu
  const r = radius(n);
  for (let i = 0; i < n; i++) {
    const p = pts[i], f = easeOut(P.fall(i));
    let x = p.x[0], y = cfg.family === 'regress' ? p.y : p.x[1];
    if (cfg.family === 'retrieve') { x = p.x[0]; y = p.x[1]; }
    const ty = sy(y), fy = pad.t - 12 + (ty - pad.t + 12) * f;
    ctx.globalAlpha = .25 + .7 * f * (cfg.family === 'retrieve' && p.x[2] < 0 ? .45 : 1);
    ctx.fillStyle = pointColor(cfg, p, i, view, pal); ctx.beginPath(); ctx.arc(sx(x), fy, r * (f < 1 ? 1.3 - .3 * f : 1), 0, Math.PI * 2); ctx.fill();
    if (n < 150) { ctx.globalAlpha = .9 * f; ctx.strokeStyle = pal.surf; ctx.lineWidth = 1; ctx.stroke(); }
  }
  ctx.globalAlpha = 1;

  if (cfg.family === 'cluster' && view.cent) {
    CENTERS.forEach(c => { ctx.strokeStyle = pal.ink2; ctx.setLineDash([3, 3]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(sx(c[0]), sy(c[1]), 11, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); });
    const k = [pal.a, pal.b, pal.c];
    view.cent.forEach((c, i) => cross(ctx, sx(c[0]), sy(c[1]), 8, k[i], pal.surf));
  }
  if (cfg.family === 'pca' && view.axes && view.mu) {
    const arrow = (v: V3, len: number, color: string, lw: number, dash: number[] = [], a = 1) => {
      ctx.globalAlpha = a; ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.setLineDash(dash); ctx.beginPath();
      ctx.moveTo(sx(view.mu![0] - v[0] * len), sy(view.mu![1] - v[1] * len)); ctx.lineTo(sx(view.mu![0] + v[0] * len), sy(view.mu![1] + v[1] * len)); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
    };
    view.ghostAxes?.forEach(g => arrow(g, 1.1, pal.b, 1.3, [], .4));
    arrow(TRUE_AXES[0], 1.15, pal.ink2, 1.5, [5, 4]);
    arrow(view.axes[0], 1.05, pal.ink, 2.8);
    arrow(view.axes[1], Math.sqrt(view.vars![1] / view.vars![0]) * 1.05, pal.ink, 1.6);
  }
  if (cfg.family === 'retrieve' && view.top) {
    const q = QUERY; ctx.strokeStyle = pal.ink; ctx.lineWidth = 1.6;
    view.top.forEach(i => { if (i >= n) return; ctx.beginPath(); ctx.moveTo(sx(q[0]), sy(q[1])); ctx.lineTo(sx(pts[i].x[0]), sy(pts[i].x[1])); ctx.stroke(); });
    star(ctx, sx(q[0]), sy(q[1]), 9, pal.ink, pal.surf);
  }
  ctx.restore();
}

function cross(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, c: string, ring: string) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = ring; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s); ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s); ctx.stroke();
  ctx.strokeStyle = c; ctx.lineWidth = 3.2; ctx.stroke(); ctx.lineCap = 'butt';
}
function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, c: string, ring: string) {
  ctx.beginPath();
  for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * .45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  ctx.closePath(); ctx.fillStyle = c; ctx.fill(); ctx.strokeStyle = ring; ctx.lineWidth = 1.5; ctx.stroke();
}

/* ======================= 3D ======================= */
type Item = { z: number; draw: () => void };
export function paint3d(ctx: CanvasRenderingContext2D, w: number, h: number, P: Paint) {
  const { cfg, pts, n, view, pal } = P, R = Math.min(w, h * 1.25) * .3, cx = w / 2, cy = h / 2 + 8;
  const cyw = Math.cos(P.yaw), syw = Math.sin(P.yaw), cp = Math.cos(P.pitch), sp = Math.sin(P.pitch);
  const pr = (x: number, y: number, z: number) => {
    const X = x * cyw - y * syw, Y = x * syw + y * cyw, D = Y * cp - z * sp, U = Y * sp + z * cp, s = 4 / (4 + D);
    return { x: cx + X * s * R, y: cy - U * s * R, d: D, s };
  };
  ctx.clearRect(0, 0, w, h);
  const surf = cfg.family === 'classify' || cfg.family === 'regress' || cfg.family === 'density';
  const zOf = (p: Pt) => cfg.family === 'classify' ? (p.y ? 1 : -1) : cfg.family === 'regress' ? p.y / 2.6 : cfg.family === 'density' ? -1 : p.x[2];

  // Hộp tọa độ
  const E: [V3, V3][] = [];
  const cs = [-1, 1];
  cs.forEach(a => cs.forEach(b => { E.push([[a, b, -1], [a, b, 1]]); E.push([[a, -1, b], [a, 1, b]]); E.push([[-1, a, b], [1, a, b]]); }));
  ctx.lineWidth = 1;
  E.forEach(([p, q]) => { const A = pr(...p), B = pr(...q); ctx.strokeStyle = alpha(pal.line, (A.d + B.d) / 2 > 0 ? .9 : .45); ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke(); });
  // lưới sàn
  ctx.strokeStyle = alpha(pal.line, .35);
  for (let k = -.5; k <= .5; k += .5) { let A = pr(k, -1, -1), B = pr(k, 1, -1); ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); A = pr(-1, k, -1); B = pr(1, k, -1); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke(); }
  ctx.fillStyle = pal.ink2; ctx.font = '600 11px system-ui, sans-serif'; ctx.textAlign = 'center';
  const lab = (p: V3, t: string) => { const q = pr(...p); ctx.fillText(t, q.x, q.y); };
  const zl = cfg.family === 'classify' ? 'P(cam)' : cfg.family === 'regress' ? 'y' : cfg.family === 'density' ? 'mật độ' : 'x₃';
  lab([1.22, -1, -1], 'x₁'); lab([-1, 1.22, -1], 'x₂'); lab([-1, -1, 1.18], zl);

  const items: Item[] = [];
  if (surf) {
    const S = 2, M = Math.floor((G - 1) / S) + 1, vx = (i: number) => -1 + 2 * (i * S + .5) / G;
    let height: (i: number, j: number) => number = () => 0, color: (h: number) => string = () => pal.brand;
    if (cfg.family === 'classify' && view.grid) { const g = view.grid; height = (i, j) => g[(j * S) * G + i * S] * 2 - 1; color = h => mix(pal.a, pal.b, (h + 1) / 2, .55); }
    if (cfg.family === 'regress' && view.plane) { const w3 = view.plane; height = (i, j) => Math.max(-1.2, Math.min(1.2, (w3[0] + w3[1] * vx(i) + w3[2] * vx(j)) / 2.6)); color = h => mix(pal.a, pal.b, (h + 1) / 2, .45); }
    if (cfg.family === 'density' && view.grid) { const g = view.grid; height = (i, j) => -1 + Math.min(2.3, g[(j * S) * G + i * S] / TRUE_DEN_MAX * 1.9); color = h => mix(pal.surf2, pal.d, Math.min(1, (h + 1) / 1.6), .78); }
    for (let j = 0; j < M - 1; j++) for (let i = 0; i < M - 1; i++) {
      const hs = [height(i, j), height(i + 1, j), height(i + 1, j + 1), height(i, j + 1)];
      const q = [pr(vx(i), vx(j), hs[0]), pr(vx(i + 1), vx(j), hs[1]), pr(vx(i + 1), vx(j + 1), hs[2]), pr(vx(i), vx(j + 1), hs[3])];
      const avg = (hs[0] + hs[1] + hs[2] + hs[3]) / 4;
      items.push({ z: (q[0].d + q[2].d) / 2, draw: () => {
        ctx.beginPath(); q.forEach((p, k) => k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
        ctx.fillStyle = color(avg); ctx.fill(); ctx.strokeStyle = alpha(pal.surf, .5); ctx.lineWidth = .6; ctx.stroke();
      } });
    }
    // Mặt thật: khung dây đứt
    ctx.setLineDash([]);
    if (cfg.family === 'regress') {
      const hh = (a: number, b: number) => (REG_W[0] + REG_W[1] * a + REG_W[2] * b) / 2.6, c4: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      items.push({ z: 0, draw: () => { ctx.setLineDash([5, 4]); ctx.strokeStyle = pal.ink2; ctx.lineWidth = 1.4; ctx.beginPath(); c4.forEach(([a, b], k) => { const p = pr(a, b, Math.max(-1.2, Math.min(1.2, hh(a, b)))); k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]); } });
    }
    if (cfg.family === 'classify') {
      items.push({ z: -.2, draw: () => { ctx.setLineDash([5, 4]); ctx.strokeStyle = pal.ink2; ctx.lineWidth = 1.4; ctx.beginPath();
        for (let k = 0; k <= 40; k++) { const a = -1 + k / 20, p = pr(a, .55 * Math.sin(2.5 * a), -1); k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); } ctx.stroke(); ctx.setLineDash([]); } });
    }
    if (cfg.family === 'density') {
      items.push({ z: 2, draw: () => { ctx.strokeStyle = alpha(pal.ink2, .5); ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
        TRUE_DEN_SEGS.forEach(ss => { ctx.beginPath(); ss.forEach(([a, b, c, d]) => { const p = pr(a, b, -1), q = pr(c, d, -1); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); }); ctx.stroke(); }); ctx.setLineDash([]); } });
    }
  }
  if (cfg.family === 'retrieve') {
    items.push({ z: 3, draw: () => { ctx.strokeStyle = alpha(pal.line, .6); ctx.lineWidth = 1;
      for (let lat = -60; lat <= 60; lat += 30) { ctx.beginPath(); for (let k = 0; k <= 48; k++) { const a = k / 48 * Math.PI * 2, c = Math.cos(lat * Math.PI / 180), p = pr(Math.cos(a) * c, Math.sin(a) * c, Math.sin(lat * Math.PI / 180)); k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); } ctx.stroke(); }
      for (let lon = 0; lon < 180; lon += 45) { ctx.beginPath(); for (let k = 0; k <= 48; k++) { const a = k / 48 * Math.PI * 2, o = lon * Math.PI / 180, p = pr(Math.cos(a) * Math.cos(o), Math.cos(a) * Math.sin(o), Math.sin(a)); k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); } ctx.stroke(); } } });
  }

  const r = radius(n) + .6;
  for (let i = 0; i < n; i++) {
    const p = pts[i], f = easeOut(P.fall(i)), z0 = zOf(p), z = 1.7 + (z0 - 1.7) * f;
    const q = pr(p.x[0], p.x[1], z), col = pointColor(cfg, p, i, view, pal);
    const dim = cfg.family === 'density' ? .45 : 1;
    items.push({ z: q.d, draw: () => { ctx.globalAlpha = (.35 + .6 * f) * (.75 + .25 * q.s) * dim; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(q.x, q.y, r * q.s, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; } });
  }
  if (cfg.family === 'cluster' && view.cent) {
    const k = [pal.a, pal.b, pal.c];
    view.cent.forEach((c, i) => { const q = pr(...c); items.push({ z: q.d - .01, draw: () => cross(ctx, q.x, q.y, 9 * q.s, k[i], pal.surf) }); });
    CENTERS.forEach(c => { const q = pr(...c); items.push({ z: q.d, draw: () => { ctx.strokeStyle = pal.ink2; ctx.setLineDash([3, 3]); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(q.x, q.y, 13 * q.s, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); } }); });
  }
  if (cfg.family === 'pca' && view.axes && view.mu && view.vars) {
    const mu = view.mu, seg = (v: V3, len: number, color: string, lw: number, dash: number[] = [], a = 1) => {
      const A = pr(mu[0] - v[0] * len, mu[1] - v[1] * len, mu[2] - v[2] * len), B = pr(mu[0] + v[0] * len, mu[1] + v[1] * len, mu[2] + v[2] * len);
      items.push({ z: -5, draw: () => { ctx.globalAlpha = a; ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; } });
    };
    view.ghostAxes?.forEach(g => seg(g, 1.1, pal.b, 1.3, [], .45));
    seg(TRUE_AXES[0], 1.2, pal.ink2, 1.5, [5, 4]);
    const cols = [pal.ink, pal.c, pal.d];
    view.axes.forEach((a, k) => seg(a, 1.1 * Math.sqrt(view.vars![k] / view.vars![0]), cols[k], k ? 2 : 3));
  }
  if (cfg.family === 'retrieve' && view.top) {
    const q = pr(...QUERY), o = pr(0, 0, 0);
    items.push({ z: -5, draw: () => {
      ctx.strokeStyle = pal.ink; ctx.lineWidth = 1.4; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(q.x, q.y); ctx.stroke(); ctx.setLineDash([]);
      view.top!.forEach(i => { if (i >= n) return; const p = pr(...pts[i].x); ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(p.x, p.y); ctx.stroke(); });
      star(ctx, q.x, q.y, 10, pal.ink, pal.surf);
    } });
  }
  items.sort((a, b) => b.z - a.z).forEach(it => it.draw());

  ctx.fillStyle = pal.mute; ctx.font = '10.5px system-ui, sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('Kéo để xoay', 10, h - 10);
  ctx.textAlign = 'right'; ctx.fillText(`${n}/${MAX_N} mẫu`, w - 10, h - 10);
}
