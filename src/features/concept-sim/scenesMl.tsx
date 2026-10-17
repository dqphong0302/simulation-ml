import { gaussian, makeRng } from '../../core/algorithms/rng';
import { quantile } from '../../core/algorithms/dataset';
import { Axes, Bx, C, CLASS, Dot, Ln, Path, Tx, at, blobs, clamp, ease, fmt, lerp, poly, softmax, stagger, type P, type Scene } from './kit';

/* ---------- Dữ liệu dùng chung (tổng hợp, có seed) ---------- */
const TWO = blobs(11, [[120, 85, 30, 16, 0], [235, 135, 30, 16, 1]]);
const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;

/* ---------- EDA ---------- */
const GLU = (() => { const r = makeRng(3); return Array.from({ length: 40 }, () => 105 + gaussian(r) * 16); })();
const EDA: Scene = {
  steps: [['Dữ liệu thô', 'Mỗi chấm là glucose của một lần đo (giả lập). Nhìn danh sách số chưa thấy hình dạng.'],
    ['Histogram', 'Gom các giá trị vào từng khoảng: cột cao là khoảng có nhiều lần đo.'],
    ['Mean và median', 'Mean (trung bình) và median (trung vị) gần nhau khi phân phối cân đối.'],
    ['Ngoại lai', 'Một giá trị cực đoan (lỗi nhập, đơn vị sai hoặc ca thật) kéo mean đi xa, median gần như đứng yên.']],
  param: { label: 'Giá trị ngoại lai (mg/dL)', min: 140, max: 400, step: 5, value: 330 },
  predict: 'Kéo ngoại lai lên 400: mean hay median sẽ dịch xa hơn?',
  draw: (f) => {
    const sx = (v: number) => 30 + (v - 40) / 380 * 310, bins = new Map<number, number>();
    GLU.forEach(g => { const b = Math.floor(g / 10) * 10; bins.set(b, (bins.get(b) ?? 0) + 1); });
    const out = f.s === 3, all = out ? [...GLU, f.v] : GLU, mu0 = mean(GLU), mu = lerp(mu0, mean(all), out ? f.e : 0), md = median(all);
    const show = at(f, 1), lines = at(f, 2);
    return <>
      <Axes x0={30} y0={150} x1={340} y1={20} />
      {[50, 100, 150, 200, 250, 300, 350, 400].map(v => <Tx key={v} x={sx(v)} y={164} s={9} c={C.mute}>{v}</Tx>)}
      {[...bins].map(([b, n]) => <Bx key={b} x={sx(b) + 1} y={150 - n * 11 * show} w={sx(b + 10) - sx(b) - 2} h={n * 11 * show} c={C.a} o={.75} r={2} />)}
      {f.s === 0 && GLU.map((g, i) => <Dot key={i} x={sx(g)} y={lerp(10, 140 - (i % 6) * 9, stagger(f.p, i, GLU.length))} r={3.5} c={C.a} />)}
      {f.s >= 2 && <>
        <Ln x1={sx(mu)} y1={150} x2={sx(mu)} y2={150 - 125 * lines} c={C.b} w={2.5} />
        <Ln x1={sx(md)} y1={150} x2={sx(md)} y2={150 - 125 * lines} c={C.c} w={2.5} dash="5 4" />
        <Tx x={sx(mu) + 4} y={36} a="start" c={C.b} w={700} o={lines}>mean {fmt(mu, 0)}</Tx>
        <Tx x={sx(md) - 4} y={52} a="end" c={C.c} w={700} o={lines}>median {fmt(md, 0)}</Tx>
        {/* Box plot thu gọn */}
        {(() => { const s = [...all].sort((x, y) => x - y), q1 = quantile(s, .25), q3 = quantile(s, .75), iqr = q3 - q1;
          const inside = s.filter(x => x >= q1 - 1.5 * iqr && x <= q3 + 1.5 * iqr);
          return <g style={{ opacity: lines }}><Ln x1={sx(inside[0])} y1={195} x2={sx(inside[inside.length - 1])} y2={195} c={C.ink2} />
            <Bx x={sx(q1)} y={185} w={sx(q3) - sx(q1)} h={20} c={C.surf} stroke={C.ink2} r={2} /><Ln x1={sx(md)} y1={185} x2={sx(md)} y2={205} c={C.c} w={2.5} />
            {s.filter(x => x < q1 - 1.5 * iqr || x > q3 + 1.5 * iqr).map((x, i) => <Dot key={i} x={sx(x)} y={195} r={3} c={C.bad} />)}
            <Tx x={36} y={213} a="start" s={9} c={C.mute}>box plot Tukey</Tx></g>; })()}
      </>}
      {out && <><Dot x={sx(f.v)} y={lerp(10, 140, f.e)} r={6 + Math.sin(f.t * 6) * 1.2} c={C.bad} /><Tx x={sx(f.v)} y={lerp(4, 128, f.e)} c={C.bad} w={700}>ngoại lai</Tx></>}
    </>;
  },
};

/* ---------- DATA ---------- */
const ROWS = [[45, 132, 27], [61, null, 31], [38, 98, null], [72, 160, 29], [29, 88, 22], [55, 141, 34], [null, 120, 26], [66, 175, 30]] as (number | null)[][];
const COLS = ['Tuổi', 'Glucose', 'BMI'];
const DATA: Scene = {
  steps: [['Tìm ô thiếu', 'Ô trống nhấp nháy: thiếu do không đo, do mất hồ sơ hay do quy trình? Lý do thiếu quan trọng hơn con số.'],
    ['Chia train/test', 'Minh họa giữ các dòng cuối làm test, không phải cách chia mặc định cho mọi dữ liệu. Chia trước khi học median và min-max.'],
    ['Điền median của train', 'Chỉ học median từ train, dùng cùng median điền cho cả train và test. Cờ thiếu có thể giữ thông tin về quy trình đo.'],
    ['Chuẩn hóa thang đo', 'Học min/max từ train rồi áp dụng cho cả hai tập. Test có thể ngoài [0,1]; không tính lại thang bằng test.']],
  param: { label: 'Tỷ lệ test', min: .125, max: .5, step: .125, value: .25, fmt: v => `${Math.round(v * 100)}%` },
  predict: 'Nếu tính median trên cả bảng (gồm test), điều gì bị rò rỉ sang lúc đánh giá?',
  draw: (f) => {
    const nTest = Math.round(f.v * ROWS.length), train = ROWS.slice(0, ROWS.length - nTest);
    const med = COLS.map((_, j) => median(train.map(r => r[j]).filter((x): x is number => x !== null)));
    const split = at(f, 1), fillIn = at(f, 2), norm = at(f, 3);
    const yOf = (i: number) => { const test = i >= ROWS.length - nTest; return 34 + i * 19 + (test ? 14 * split : 0); };
    const lo = COLS.map((_, j) => Math.min(...train.map(r => r[j] ?? med[j])));
    const hi = COLS.map((_, j) => Math.max(...train.map(r => r[j] ?? med[j])));
    return <>
      {COLS.map((c, j) => <Tx key={c} x={50 + j * 52} y={24} w={700} c={C.ink}>{c}</Tx>)}
      {ROWS.map((r, i) => <g key={i}>{r.map((v, j) => {
        const miss = v === null;
        return <g key={j}><Bx x={26 + j * 52} y={yOf(i)} w={48} h={16} r={3} c={miss ? (fillIn > 0 ? C.ok : C.bad) : C.soft} o={miss ? (fillIn > 0 ? .25 : .25 + .35 * (Math.sin(f.t * 7) + 1) / 2) : 1} />
          <Tx x={50 + j * 52} y={yOf(i) + 12} s={10} c={miss ? (fillIn > 0 ? C.ok : C.bad) : C.ink2} w={miss ? 700 : 500} o={miss ? Math.max(fillIn, f.s === 0 ? 1 : 0) : 1}>{miss ? (fillIn > 0 ? med[j] : '—') : v}</Tx></g>;
      })}</g>)}
      {split > 0 && <>
        <Tx x={186} y={yOf(0) + 12} a="start" s={10} c={C.a} w={700} o={split}>train</Tx>
        <Tx x={186} y={yOf(ROWS.length - nTest) + 12} a="start" s={10} c={C.b} w={700} o={split}>test</Tx>
        <Ln x1={26} y1={yOf(ROWS.length - nTest) - 8} x2={180} y2={yOf(ROWS.length - nTest) - 8} c={C.b} dash="4 3" o={split} /></>}
      {f.s >= 2 && <g>
        <Tx x={290} y={24} w={700} c={C.ink}>{norm < .5 ? 'Thang gốc' : 'Sau min-max'}</Tx>
        {ROWS.map((r, i) => [0, 1].map(j => {
          const raw = (r[j] ?? med[j]) / 200, sc = (((r[j] ?? med[j]) - lo[j]) / (hi[j] - lo[j]));
          return <Bx key={`${i}${j}`} x={232} y={34 + i * 19 + j * 8} w={lerp(raw, sc, norm) * 110} h={6} r={2} c={j ? C.b : C.a} o={.85} />;
        }))}
        <Tx x={234} y={200} a="start" s={9} c={C.a}>■ tuổi</Tx><Tx x={284} y={200} a="start" s={9} c={C.b}>■ glucose</Tx>
      </g>}
    </>;
  },
};

/* ---------- KNN ---------- */
const Q = { x: 182, y: 110 };
const BYDIST = TWO.map(p => ({ ...p, d: Math.hypot(p.x - Q.x, p.y - Q.y) })).sort((a, b) => a.d - b.d);
const KNN: Scene = {
  steps: [['Mẫu mới', 'Một người mới (chấm cam viền đậm) chưa có nhãn.'],
    ['Đo khoảng cách', 'Tính khoảng cách tới mọi mẫu đã có nhãn trong train.'],
    ['Chọn k gần nhất', 'Vòng tròn mở rộng tới láng giềng thứ k.'],
    ['Bỏ phiếu', 'Nhãn chiếm đa số trong k láng giềng là dự đoán. Tỷ lệ phiếu chưa phải xác suất đã hiệu chỉnh.']],
  param: { label: 'k (số láng giềng)', min: 1, max: 15, step: 2, value: 5 },
  predict: 'Tăng k từ 1 lên 15: dự đoán ở điểm giữa hai nhóm sẽ ổn định hơn hay dễ đổi hơn?',
  draw: (f) => {
    const k = f.v, near = BYDIST.slice(0, k), votes = [0, 1].map(c => near.filter(p => p.c === c).length);
    const win = votes[1] > votes[0] ? 1 : votes[0] > votes[1] ? 0 : near[0].c;
    const r = BYDIST[k - 1].d * at(f, 2), vote = at(f, 3);
    return <>
      {f.s >= 1 && BYDIST.map((p, i) => <Ln key={i} x1={Q.x} y1={Q.y} x2={lerp(Q.x, p.x, stagger(f.s === 1 ? f.p : 1, i, BYDIST.length))} y2={lerp(Q.y, p.y, stagger(f.s === 1 ? f.p : 1, i, BYDIST.length))} c={i < k && f.s >= 2 ? C.ink2 : C.line} w={i < k && f.s >= 2 ? 1.8 : .8} o={f.s >= 2 && i >= k ? .25 : .8} />)}
      {f.s >= 2 && <circle cx={Q.x} cy={Q.y} r={r} style={{ fill: 'none', stroke: C.ink2, strokeDasharray: '5 4', strokeWidth: 1.5 }} />}
      {TWO.map((p, i) => { const isN = f.s >= 2 && near.includes(BYDIST.find(b => b.x === p.x)!); return <Dot key={i} x={p.x} y={p.y} r={isN ? 6 : 4.5} c={CLASS[p.c]} o={f.s >= 2 && !isN ? .35 : 1} />; })}
      <Dot x={Q.x} y={Q.y} r={9 * ease(f.s === 0 ? f.p * 2 : 1) + (f.s === 0 ? Math.sin(f.t * 6) : 0)} c={vote > .9 ? CLASS[win] : 'var(--surface)'} ring={C.ink} />
      {f.s === 3 && <g>
        {[0, 1].map(c => <g key={c}><Bx x={250} y={22 + c * 20} w={(votes[c] / k) * 90 * vote} h={13} c={CLASS[c]} r={3} /><Tx x={246} y={33 + c * 20} a="end" s={10}>{c ? 'Nhóm B' : 'Nhóm A'}</Tx><Tx x={254 + (votes[c] / k) * 90 * vote} y={33 + c * 20} a="start" s={10} w={700}>{votes[c]}</Tx></g>)}
        <Tx x={300} y={74} s={11} w={700} c={CLASS[win]} o={vote}>→ {win ? 'Nhóm B' : 'Nhóm A'} ({votes[win]}/{k})</Tx></g>}
    </>;
  },
};

/* ---------- TREE ---------- */
type TN = { x0: number; y0: number; x1: number; y1: number; depth: number; axis?: 0 | 1; thr?: number; maj: number; g: number };
const TREEPTS = blobs(21, [[95, 70, 22, 10, 0], [250, 160, 24, 10, 0], [245, 70, 24, 11, 1], [110, 160, 22, 9, 1]]);
const gini = (ps: P[]) => { if (!ps.length) return 0; const q = ps.filter(p => p.c === 1).length / ps.length; return 1 - q * q - (1 - q) * (1 - q); };
function grow(ps: P[], b: [number, number, number, number], depth: number, out: TN[]) {
  const node: TN = { x0: b[0], y0: b[1], x1: b[2], y1: b[3], depth, maj: ps.filter(p => p.c === 1).length * 2 > ps.length ? 1 : 0, g: gini(ps) };
  out.push(node);
  if (depth >= 4 || node.g === 0 || ps.length < 4) return;
  let best = { s: node.g - 1e-9, axis: 0 as 0 | 1, thr: 0 };
  for (const axis of [0, 1] as const) {
    const vs = ps.map(p => axis ? p.y : p.x).sort((a, c) => a - c);
    for (let i = 1; i < vs.length; i++) {
      const thr = (vs[i - 1] + vs[i]) / 2, L = ps.filter(p => (axis ? p.y : p.x) <= thr), R = ps.filter(p => (axis ? p.y : p.x) > thr);
      const s = (L.length * gini(L) + R.length * gini(R)) / ps.length;
      if (L.length && R.length && s < best.s) best = { s, axis, thr };
    }
  }
  if (best.s >= node.g - 1e-9) return;
  node.axis = best.axis; node.thr = best.thr;
  const key = (p: P) => (best.axis ? p.y : p.x) <= best.thr;
  grow(ps.filter(key), best.axis ? [b[0], b[1], b[2], best.thr] : [b[0], b[1], best.thr, b[3]], depth + 1, out);
  grow(ps.filter(p => !key(p)), best.axis ? [b[0], best.thr, b[2], b[3]] : [best.thr, b[1], b[2], b[3]], depth + 1, out);
}
const TNODES: TN[] = []; grow(TREEPTS, [20, 15, 340, 205], 0, TNODES);
const TREE: Scene = {
  steps: [['Nút gốc', 'Mọi mẫu ở cùng một nút, hai nhóm trộn lẫn: Gini cao.'],
    ['Quét ngưỡng', 'Thuật toán thử nhiều ngưỡng trên mỗi biến, tìm phép chia giảm Gini nhiều nhất.'],
    ['Chia đệ quy', 'Mỗi nhánh con lại được chia tiếp cho tới độ sâu tối đa.'],
    ['Vùng dự đoán', 'Mỗi lá dự đoán theo nhãn đa số. Lá ít mẫu → độ bất định lớn.']],
  param: { label: 'Độ sâu tối đa', min: 1, max: 4, step: 1, value: 2 },
  predict: 'Tăng độ sâu từ 2 lên 4: số vùng tăng thế nào? Có vùng nào chỉ vì vài điểm nhiễu?',
  draw: (f) => {
    const maxD = f.v, splits = TNODES.filter(n => n.axis !== undefined && n.depth < maxD);
    const leaves = TNODES.filter(n => n.depth <= maxD && (n.axis === undefined || n.depth === maxD));
    const sweep = f.s === 1 ? lerp(40, 320, (Math.sin(f.p * Math.PI * 2 - Math.PI / 2) + 1) / 2) : 0, region = at(f, 3);
    const nShow = f.s < 1 ? 0 : f.s === 1 ? (f.p > .85 ? 1 : 0) : f.s === 2 ? Math.ceil(f.e * splits.length) : splits.length;
    return <>
      <Bx x={20} y={15} w={320} h={190} c={C.soft} o={.5} r={6} />
      {leaves.map((n, i) => <Bx key={i} x={n.x0 + 1} y={n.y0 + 1} w={n.x1 - n.x0 - 2} h={n.y1 - n.y0 - 2} c={CLASS[n.maj]} o={.16 * region} r={3} />)}
      {f.s === 1 && <Ln x1={sweep} y1={15} x2={sweep} y2={205} c={C.ink} w={1.5} dash="4 4" />}
      {splits.slice(0, nShow).map((n, i) => n.axis ? <Ln key={i} x1={n.x0} y1={n.thr!} x2={n.x1} y2={n.thr!} c={C.ink} w={3 - n.depth * .5} /> : <Ln key={i} x1={n.thr!} y1={n.y0} x2={n.thr!} y2={n.y1} c={C.ink} w={3 - n.depth * .5} />)}
      {TREEPTS.map((p, i) => <Dot key={i} x={p.x} y={p.y} r={4.5} c={CLASS[p.c]} />)}
      <Tx x={26} y={30} a="start" s={10} w={700} c={C.ink}>Gini gốc {fmt(TNODES[0].g)} · {splits.length} phép chia · {leaves.length} lá</Tx>
    </>;
  },
};

/* ---------- LOGREG ---------- */
const LR = (() => { const r = makeRng(5); return [...Array.from({ length: 14 }, () => ({ x: 140 + gaussian(r) * 35, c: 0 })), ...Array.from({ length: 14 }, () => ({ x: 220 + gaussian(r) * 35, c: 1 }))]; })();
const sig = (x: number) => 1 / (1 + Math.exp(-(x - 180) / 22));
const LOGREG: Scene = {
  steps: [['Điểm z tuyến tính', 'z = β₀ + β₁x: một đường thẳng, có thể ra ngoài [0,1].'],
    ['Qua sigmoid', 'Sigmoid ép z về (0,1) để đọc như điểm nguy cơ — cần kiểm tra calibration.'],
    ['Đặt ngưỡng', 'Điểm vượt ngưỡng → dự đoán dương (viền đậm). Ngưỡng là quyết định lâm sàng, không phải tham số học.'],
    ['Đếm sai sót', 'TP, FP, FN, TN đổi theo ngưỡng: hạ ngưỡng thì bớt bỏ sót nhưng thêm cảnh báo thừa.']],
  param: { label: 'Ngưỡng', min: .1, max: .9, step: .05, value: .5, fmt: v => fmt(v) },
  predict: 'Hạ ngưỡng từ 0,5 xuống 0,2: Sensitivity và Specificity đổi theo hướng nào?',
  draw: (f) => {
    const X = (x: number) => x, Y = (p: number) => 185 - p * 160, m = at(f, 1), thr = f.v;
    const cut = 180 + 22 * Math.log(thr / (1 - thr)), th = at(f, 2), cnt = at(f, 3);
    const curve = poly(Array.from({ length: 61 }, (_, i) => { const x = 30 + i * 5, lin = clamp((x - 180) / 220 + .5, -.15, 1.15); return [X(x), Y(lerp(lin, sig(x), m))]; }));
    const cm = { TP: 0, FP: 0, FN: 0, TN: 0 };
    LR.forEach(p => { const pos = sig(p.x) >= thr; cm[p.c ? (pos ? 'TP' : 'FN') : (pos ? 'FP' : 'TN')]++; });
    return <>
      <Axes x0={30} y0={185} x1={335} y1={20} />
      <Tx x={26} y={29} a="end" s={9} c={C.mute}>1</Tx><Tx x={26} y={188} a="end" s={9} c={C.mute}>0</Tx><Tx x={330} y={203} a="end" s={9} c={C.mute}>glucose →</Tx>
      <Path d={curve} c={C.d} w={3} len={f.s === 0 ? f.e : 1} />
      {LR.map((p, i) => { const y = p.c ? Y(1) + 6 + (i % 3) * 5 : Y(0) - 6 - (i % 3) * 5, pos = sig(p.x) >= thr && th > .5;
        return <Dot key={i} x={p.x} y={y} r={pos ? 6 : 4.5} c={CLASS[p.c]} ring={pos ? C.ink : undefined} />; })}
      {th > 0 && <><Ln x1={30} y1={Y(thr)} x2={lerp(30, 335, th)} y2={Y(thr)} c={C.bad} dash="6 4" w={1.8} />
        <Ln x1={cut} y1={185} x2={cut} y2={lerp(185, 20, th)} c={C.bad} w={1.2} o={.6} /><Tx x={334} y={Y(thr) - 5} a="end" c={C.bad} w={700} s={10}>ngưỡng {fmt(thr)}</Tx></>}
      {cnt > 0 && <g style={{ opacity: cnt }}>
        {(['TP', 'FN', 'FP', 'TN'] as const).map((k, i) => <g key={k}><Bx x={40 + (i % 2) * 52} y={48 + Math.floor(i / 2) * 30} w={48} h={26} c={k === 'TP' || k === 'TN' ? 'var(--ok-soft)' : 'var(--danger-soft)'} stroke={C.line} />
          <Tx x={64 + (i % 2) * 52} y={66 + Math.floor(i / 2) * 30} w={700} c={C.ink}>{k} {cm[k]}</Tx></g>)}
        <Tx x={40} y={124} a="start" s={10} w={700}>Se {fmt(cm.TP / (cm.TP + cm.FN))} · Sp {fmt(cm.TN / (cm.TN + cm.FP))}</Tx></g>}
    </>;
  },
};

/* ---------- KMEANS ---------- */
const KMP = blobs(31, [[90, 70, 20, 14, 0], [250, 75, 22, 14, 0], [170, 160, 22, 14, 0]]);
function lloyd(k: number) {
  let cs = Array.from({ length: k }, (_, i) => ({ x: 60 + i * (240 / Math.max(1, k - 1)), y: 40 + ((i * 53) % 140) }));
  const hist: { cs: { x: number; y: number }[]; as: number[]; J: number }[] = [];
  for (let it = 0; it < 8; it++) {
    const as = KMP.map(p => cs.reduce((b, c, j) => Math.hypot(p.x - c.x, p.y - c.y) < Math.hypot(p.x - cs[b].x, p.y - cs[b].y) ? j : b, 0));
    hist.push({ cs, as, J: KMP.reduce((s, p, i) => s + (p.x - cs[as[i]].x) ** 2 + (p.y - cs[as[i]].y) ** 2, 0) });
    cs = cs.map((c, j) => { const m = KMP.filter((_, i) => as[i] === j); return m.length ? { x: mean(m.map(p => p.x)), y: mean(m.map(p => p.y)) } : c; });
  }
  return hist;
}
const KHIST = new Map<number, ReturnType<typeof lloyd>>();
const KMEANS: Scene = {
  steps: [['Khởi tạo tâm', 'Đặt k tâm ban đầu (dấu +). Kết quả có thể phụ thuộc khởi tạo.'],
    ['Gán điểm', 'Mỗi điểm thuộc về tâm gần nhất.'],
    ['Dời tâm', 'Mỗi tâm dời về trung bình các điểm của nó.'],
    ['Lặp tới hội tụ', 'Lặp gán–dời tới khi tâm gần như đứng yên; J (inertia) giảm dần.']],
  param: { label: 'Số cụm k', min: 2, max: 5, step: 1, value: 3 },
  predict: 'Dữ liệu có 3 đám. Chọn k = 5 thì J giảm thêm — có nghĩa là có 5 nhóm bệnh không?',
  draw: (f) => {
    if (!KHIST.has(f.v)) KHIST.set(f.v, lloyd(f.v));
    const h = KHIST.get(f.v)!;
    const idx = f.s <= 1 ? 0 : f.s === 2 ? f.e : 1 + f.e * (h.length - 2), i0 = Math.floor(idx), fr = idx - i0, A = h[Math.min(i0, h.length - 1)], B = h[Math.min(i0 + 1, h.length - 1)];
    const cs = A.cs.map((c, j) => ({ x: lerp(c.x, B.cs[j].x, fr), y: lerp(c.y, B.cs[j].y, fr) })), as = f.s >= 2 ? B.as : A.as, show = at(f, 1);
    return <>
      {f.s >= 1 && KMP.map((p, i) => <Ln key={`l${i}`} x1={p.x} y1={p.y} x2={lerp(p.x, cs[as[i]].x, f.s === 1 ? stagger(f.p, i, KMP.length) : 1)} y2={lerp(p.y, cs[as[i]].y, f.s === 1 ? stagger(f.p, i, KMP.length) : 1)} c={CLASS[as[i] % 4]} w={.8} o={.35} />)}
      {KMP.map((p, i) => <Dot key={i} x={p.x} y={p.y} r={4.5} c={show > 0 ? CLASS[as[i] % 4] : C.mute} o={show > 0 ? .4 + .6 * show : .6} />)}
      {cs.map((c, j) => { const s = f.s === 0 ? ease(f.p * 2 - j * .2) : 1; return <g key={j} transform={`translate(${c.x} ${c.y}) scale(${s})`}><circle r={11} style={{ fill: 'var(--surface)', stroke: CLASS[j % 4], strokeWidth: 3 }} /><path d="M-6 0H6M0 -6V6" style={{ stroke: CLASS[j % 4], strokeWidth: 3 }} /></g>; })}
      <Tx x={26} y={208} a="start" s={10} w={700} c={C.ink}>Vòng {Math.min(h.length, i0 + 1)} · J = {Math.round(lerp(A.J, B.J, fr)).toLocaleString('vi-VN')}</Tx>
    </>;
  },
};

/* ---------- PCA ---------- */
const PZ = (() => { const r = makeRng(9); return Array.from({ length: 50 }, () => [gaussian(r), gaussian(r)]); })();
const PCA: Scene = {
  steps: [['Hai biến tương quan', 'Ví dụ: hai chỉ số đo cùng xu hướng. Đám mây kéo dài theo một hướng.'],
    ['Xoay trục', 'Thử nhiều hướng; độ dài thanh là phương sai sau khi chiếu lên hướng đó.'],
    ['PC1 và PC2', 'PC1 giữ phương sai lớn nhất; PC2 vuông góc. PC là tổ hợp tuyến tính, không tự là "yếu tố bệnh".'],
    ['Chiếu xuống 1 chiều', 'Giữ PC1, bỏ PC2: mất một phần thông tin, đổi lại dễ quan sát hơn.']],
  param: { label: 'Độ tương quan', min: 0, max: .95, step: .05, value: .8, fmt: v => fmt(v) },
  predict: 'Đưa tương quan về 0: PC1 còn giải thích được bao nhiêu % phương sai?',
  draw: (f) => {
    const r = f.v, pts = PZ.map(([a, b]) => { const w = r * a + Math.sqrt(1 - r * r) * b; return { x: 180 + a * 40, y: 110 - w * 40 }; });
    const mx = mean(pts.map(p => p.x)), my = mean(pts.map(p => p.y));
    let sxx = 0, syy = 0, sxy = 0; pts.forEach(p => { sxx += (p.x - mx) ** 2; syy += (p.y - my) ** 2; sxy += (p.x - mx) * (p.y - my); });
    const th = .5 * Math.atan2(2 * sxy, sxx - syy), tr = sxx + syy, l1 = tr / 2 + Math.sqrt(((sxx - syy) / 2) ** 2 + sxy ** 2), l2 = tr - l1;
    const ang = f.s === 1 ? lerp(th + 1.4, th, f.e) + Math.sin(f.p * Math.PI) * .6 : th, ux = Math.cos(ang), uy = Math.sin(ang);
    const proj = (p: { x: number; y: number }) => (p.x - mx) * ux + (p.y - my) * uy, varA = mean(pts.map(p => proj(p) ** 2));
    const flat = at(f, 3), axes = f.s >= 1;
    return <>
      {axes && <Ln x1={mx - ux * 160} y1={my - uy * 160} x2={mx + ux * 160} y2={my + uy * 160} c={C.d} w={2.5} />}
      {f.s >= 2 && <Ln x1={mx + uy * 70 * Math.sqrt(l2 / l1)} y1={my - ux * 70 * Math.sqrt(l2 / l1)} x2={mx - uy * 70 * Math.sqrt(l2 / l1)} y2={my + ux * 70 * Math.sqrt(l2 / l1)} c={C.b} w={2.5} o={1 - flat} />}
      {f.s === 1 && pts.map((p, i) => { const t = proj(p); return <Ln key={i} x1={p.x} y1={p.y} x2={mx + ux * t} y2={my + uy * t} c={C.line} w={.8} />; })}
      {pts.map((p, i) => { const t = proj(p); return <Dot key={i} x={lerp(p.x, mx + ux * t, flat)} y={lerp(p.y, my + uy * t, flat)} r={4} c={C.a} o={stagger(f.s === 0 ? f.p : 1, i, pts.length)} />; })}
      {f.s === 1 && <g><Tx x={24} y={22} a="start" s={10}>phương sai theo hướng này</Tx><Bx x={24} y={28} w={varA / l1 * pts.length * 120} h={9} c={C.d} r={2} /></g>}
      {f.s >= 2 && <Tx x={24} y={22} a="start" s={11} w={700} c={C.ink}>PC1 giải thích {Math.round(l1 / tr * 100)}% phương sai</Tx>}
      {f.s >= 2 && <><Tx x={mx + ux * 150} y={my + uy * 150 - 6} c={C.d} w={700}>PC1</Tx>{flat < .9 && <Tx x={mx - uy * 80} y={my + ux * 80} c={C.b} w={700}>PC2</Tx>}</>}
    </>;
  },
};

/* ---------- LINREG ---------- */
const LX = (() => { const r = makeRng(13); return Array.from({ length: 18 }, (_, i) => ({ x: 45 + i * 16 + r() * 6, n: gaussian(r) })); })();
const LINREG: Scene = {
  steps: [['Dữ liệu', 'Mỗi chấm là một cặp (x, y), ví dụ tuổi và huyết áp tâm thu giả lập.'],
    ['Đường ban đầu', 'Bắt đầu bằng đường nằm ngang. Đoạn đỏ là phần dư y − ŷ.'],
    ['Gradient descent', 'Mỗi vòng chỉnh hệ số theo hướng làm MSE giảm.'],
    ['Đường tốt nhất', 'Phần dư còn lại là nhiễu mô hình không giải thích được. Hệ số dốc là liên hệ, chưa là nhân quả.']],
  param: { label: 'Mức nhiễu', min: 0, max: 40, step: 2, value: 16 },
  predict: 'Tăng nhiễu lên 40: độ dốc tìm được đổi nhiều hay R² giảm nhiều?',
  draw: (f) => {
    const pts = LX.map(p => ({ x: p.x, y: 175 - (p.x - 40) * .45 + p.n * f.v }));
    const mx = mean(pts.map(p => p.x)), my = mean(pts.map(p => p.y)), b1 = pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0) / pts.reduce((s, p) => s + (p.x - mx) ** 2, 0);
    const it = f.s < 2 ? 0 : f.s === 2 ? f.e * 12 : 12, k = 1 - Math.pow(.62, it), slope = lerp(0, b1, k);
    const yh = (x: number) => my + slope * (x - mx), mse = mean(pts.map(p => (p.y - yh(p.x)) ** 2)), sst = mean(pts.map(p => (p.y - my) ** 2));
    const loss = Array.from({ length: 13 }, (_, i) => { const s2 = lerp(0, b1, 1 - Math.pow(.62, i)); return mean(pts.map(p => (p.y - (my + s2 * (p.x - mx))) ** 2)); });
    return <>
      <Axes x0={30} y0={205} x1={340} y1={15} />
      {f.s >= 1 && pts.map((p, i) => <Ln key={i} x1={p.x} y1={p.y} x2={p.x} y2={yh(p.x)} c={C.bad} w={1.4} o={.7 * at(f, 1)} />)}
      {f.s >= 1 && <Ln x1={30} y1={yh(30)} x2={lerp(30, 340, at(f, 1))} y2={yh(lerp(30, 340, at(f, 1)))} c={C.d} w={3} />}
      {pts.map((p, i) => <Dot key={i} x={p.x} y={p.y} r={4.5} c={C.a} o={stagger(f.s === 0 ? f.p : 1, i, pts.length)} />)}
      {f.s >= 2 && <g><Bx x={232} y={18} w={104} h={56} c={C.surf} stroke={C.line} /><Tx x={238} y={30} a="start" s={9} c={C.mute}>MSE theo vòng</Tx>
        <Path d={poly(loss.slice(0, Math.floor(it) + 1).map((l, i) => [240 + i * 7.5, 68 - (l / loss[0]) * 32]))} c={C.b} w={2} /></g>}
      <Tx x={36} y={24} a="start" s={11} w={700} c={C.ink}>MSE {Math.round(mse)}{f.s === 3 ? ` · R² ${fmt(1 - mse / sst)}` : ''}</Tx>
    </>;
  },
};

/* ---------- FOREST ---------- */
const VOTES = (() => { const r = makeRng(17); return Array.from({ length: 15 }, () => (r() < .7 ? 1 : 0)); })();
const binom = (n: number, p: number) => { let s = 0; for (let k = Math.floor(n / 2) + 1; k <= n; k++) { let c = 1; for (let i = 0; i < k; i++) c = c * (n - i) / (i + 1); s += c * p ** k * (1 - p) ** (n - k); } return s; };
const FOREST: Scene = {
  steps: [['Bootstrap', 'Mỗi cây nhận một mẫu rút có hoàn lại từ train: có mẫu lặp, có mẫu vắng.'],
    ['Mỗi cây học riêng', 'Mỗi cây chỉ xét một phần biến ở mỗi lần chia, nên các cây khác nhau.'],
    ['Từng cây bỏ phiếu', 'Với một ca mới, mỗi cây cho một dự đoán; vài cây sai.'],
    ['Đa số quyết định', 'Gộp phiếu giảm phương sai. Đường cong giả định cây độc lập — thực tế các cây tương quan nên lợi ích nhỏ hơn.']],
  param: { label: 'Số cây', min: 1, max: 15, step: 2, value: 7 },
  predict: 'Mỗi cây đúng 70%. Tăng từ 1 lên 15 cây: độ chính xác đa số tăng mãi hay chững lại?',
  draw: (f) => {
    const n = f.v, gap = Math.min(42, 300 / n), x0 = 180 - (gap * (n - 1)) / 2, votes = VOTES.slice(0, n), yes = votes.filter(Boolean).length;
    const r = makeRng(23), boot = at(f, 0), grow = at(f, 1), vote = at(f, 2), agg = at(f, 3);
    return <>
      {Array.from({ length: 16 }, (_, i) => <Dot key={i} x={60 + i * 16} y={18} r={4} c={CLASS[i % 2]} />)}
      <Tx x={30} y={22} a="end" s={9} c={C.mute}>train</Tx>
      {votes.map((v, i) => { const cx = x0 + i * gap, s = Math.min(1, gap / 40);
        return <g key={i}>
          {Array.from({ length: 5 }, (_, j) => { const src = Math.floor(r() * 16), t = stagger(f.s === 0 ? f.p : 1, i * 5 + j, n * 5); return <Dot key={j} x={lerp(60 + src * 16, cx - 8 * s + (j % 3) * 8 * s, t)} y={lerp(18, 50 + Math.floor(j / 3) * 8, t)} r={3 * Math.max(.6, s)} c={CLASS[src % 2]} o={boot} />; })}
          <g transform={`translate(${cx} 75) scale(${s})`} style={{ opacity: grow }}>
            <Path d="M0 0 L-14 20 M0 0 L14 20 M-14 20 L-22 40 M-14 20 L-6 40 M14 20 L6 40 M14 20 L22 40" c={C.ok} w={2.5} len={grow} />
            <Dot x={0} y={0} r={4} c={C.ok} /></g>
          {vote > 0 && <g style={{ opacity: vote }}><Bx x={cx - 10 * s} y={128} w={20 * s} h={18} c={v ? C.ok : C.bad} o={.85} /><Tx x={cx} y={141} s={10 * Math.max(.7, s)} c="#fff" w={700}>{v ? '✓' : '✗'}</Tx></g>}
        </g>; })}
      {agg > 0 && <g style={{ opacity: agg }}>
        <Tx x={30} y={170} a="start" w={700} c={C.ink}>Đa số: {yes}/{n} cây đúng → {yes * 2 > n ? 'dự đoán đúng' : 'dự đoán sai'}</Tx>
        <Path d={poly(Array.from({ length: 15 }, (_, i) => [200 + i * 9, 210 - binom(i * 2 + 1, .7) * 30]))} c={C.d} w={2} />
        <Dot x={200 + ((n - 1) / 2) * 9} y={210 - binom(n, .7) * 30} r={4} c={C.d} />
        <Tx x={30} y={192} a="start" s={10}>P(đa số đúng, cây độc lập) = {fmt(binom(n, .7))}</Tx></g>}
    </>;
  },
};

/* ---------- SVM ---------- */
const PHI = -.5, NX = Math.cos(PHI), NY = Math.sin(PHI), M = 26;
const SVP = (() => { const r = makeRng(29), out: (P & { sv?: boolean })[] = [];
  const put = (u: number, d: number, c: number, sv = false) => out.push({ x: 180 - NY * u + NX * d, y: 110 + NX * u + NY * d, c, sv });
  put(-40, M, 0, true); put(45, M, 0, true); put(5, -M, 1, true);
  for (let i = 0; i < 11; i++) { put(gaussian(r) * 55, M + 8 + Math.abs(gaussian(r)) * 30, 0); put(gaussian(r) * 55, -M - 8 - Math.abs(gaussian(r)) * 30, 1); }
  return out; })();
const SVM: Scene = {
  steps: [['Nhiều đường tách được', 'Có vô số đường tách hai nhóm trong train.'],
    ['Lề lớn nhất', 'SVM chọn đường có lề rộng nhất tới hai phía.'],
    ['Support vectors', 'Chỉ các điểm nằm trên mép lề (viền đậm) quyết định đường biên.'],
    ['Kernel', 'Dữ liệu 1 chiều không tách được bằng một ngưỡng; nâng lên x² thì một đường ngang tách được.']],
  param: { label: 'Độ mềm của lề (1/C)', min: 0, max: 1, step: .1, value: 0, fmt: v => fmt(v, 1) },
  predict: 'Lề mềm hơn (C nhỏ) cho lề rộng hơn nhưng chấp nhận điểm lấn vào — đánh đổi gì?',
  draw: (f) => {
    const L = (d: number, ang: number) => { const nx = Math.cos(ang), ny = Math.sin(ang); return { x1: 180 - ny * 200 + nx * d, y1: 110 + nx * 200 + ny * d, x2: 180 + ny * 200 + nx * d, y2: 110 - nx * 200 + ny * d }; };
    const kern = at(f, 3), m = M * (1 + f.v * .9) * at(f, 1);
    const one = [-90, -70, -55, 50, 65, 85, -20, -5, 10, 25].map((x, i) => ({ x, c: i < 6 ? 1 : 0 }));
    return <>
      <g style={{ opacity: 1 - kern }}>
        <clipPath id="svmclip"><rect x={10} y={8} width={340} height={204} /></clipPath>
        <g clipPath="url(#svmclip)">
          {f.s === 0 && [-.15, .25, .55].map((a, i) => <Ln key={i} {...L(i * 8 - 8, PHI + a * Math.sin(f.t * 1.3 + i))} c={C.mute} w={1.5} dash="5 4" />)}
          {f.s >= 1 && <><polygon points={[L(m, PHI), L(-m, PHI)].flatMap((l, i) => i ? [`${l.x2},${l.y2}`, `${l.x1},${l.y1}`] : [`${l.x1},${l.y1}`, `${l.x2},${l.y2}`]).join(' ')} style={{ fill: C.d, opacity: .1 }} />
            <Ln {...L(0, PHI)} c={C.ink} w={2.5} /><Ln {...L(m, PHI)} c={C.d} dash="5 4" /><Ln {...L(-m, PHI)} c={C.d} dash="5 4" /></>}
          {SVP.map((p, i) => { const on = p.sv && f.s >= 2; return <Dot key={i} x={p.x} y={p.y} r={on ? 6.5 + Math.sin(f.t * 5) : 4.5} c={CLASS[p.c]} ring={on ? C.ink : undefined} />; })}
        </g>
      </g>
      {kern > 0 && <g style={{ opacity: kern }}>
        <Ln x1={70} y1={190} x2={290} y2={190} c={C.line} />
        <Path d={poly(Array.from({ length: 41 }, (_, i) => { const x = -100 + i * 5; return [180 + x, 190 - (x * x) / 70 * kern]; }))} c={C.line} w={1} dash="3 3" />
        {one.map((p, i) => <Dot key={i} x={180 + p.x} y={190 - (p.x * p.x) / 70 * kern} r={5} c={CLASS[p.c]} />)}
        <Ln x1={70} y1={190 - 3000 / 70 * kern} x2={290} y2={190 - 3000 / 70 * kern} c={C.ink} w={2} o={kern} />
        <Tx x={300} y={190 - 3000 / 70 * kern + 4} a="start" s={10} w={700}>tách được</Tx>
        <Tx x={180} y={210} s={10} c={C.mute}>φ(x) = (x, x²)</Tx></g>}
    </>;
  },
};

/* ---------- COMPARE ---------- */
const MODELS = ['Logistic', 'Cây', 'Rừng'];
const SC = (() => { const r = makeRng(37); return [.78, .72, .81].map((m, j) => Array.from({ length: 10 }, () => m + gaussian(r) * (.025 + j * .012))); })();
const COMPARE: Scene = {
  steps: [['Chia k phần', 'Train được chia thành k fold; test thật để riêng, khóa lại.'],
    ['Xoay vòng fold', 'Mỗi lượt, một fold làm validation, k−1 fold còn lại để train.'],
    ['So sánh phân bố điểm', 'So trung bình và độ dao động giữa các fold, không chỉ một con số.'],
    ['Mở test một lần', 'Chọn mô hình bằng CV, rồi mới đo trên test một lần duy nhất.']],
  param: { label: 'Số fold k', min: 3, max: 10, step: 1, value: 5 },
  predict: 'Hai mô hình chênh 0,01 nhưng dao động giữa các fold là 0,04 — có nên kết luận cái nào tốt hơn?',
  draw: (f) => {
    const k = f.v, w = 240 / k, cur = f.s === 1 ? Math.min(k - 1, Math.floor(f.p * k)) : f.s > 1 ? k - 1 : -1, done = f.s === 1 ? cur : f.s > 1 ? k : -1;
    const sy = (v: number) => 205 - (v - .6) / .3 * 100, test = at(f, 3);
    return <>
      {Array.from({ length: k }, (_, i) => <Bx key={i} x={30 + i * w + 1} y={20} w={(w - 2) * stagger(f.s === 0 ? f.p : 1, i, k)} h={22} r={3} c={i === cur && f.s === 1 ? C.b : C.a} o={i === cur && f.s === 1 ? 1 : .55} />)}
      <Bx x={280} y={20} w={52} h={22} r={3} c={test > 0 ? C.ok : C.mute} o={.35 + .65 * test} />
      <Tx x={306} y={35} s={10} c="#fff" w={700}>{test > .5 ? 'TEST ✓' : 'TEST 🔒'}</Tx>
      {f.s === 1 && <Tx x={30} y={56} a="start" s={10}>Lượt {cur + 1}/{k}: fold cam = validation</Tx>}
      <Ln x1={70} y1={205} x2={330} y2={205} c={C.line} />
      {[.6, .7, .8, .9].map(v => <Tx key={v} x={66} y={sy(v) + 3} a="end" s={9} c={C.mute}>{fmt(v, 1)}</Tx>)}
      {MODELS.map((m, j) => { const cx = 120 + j * 80, sc = SC[j].slice(0, k), mu = mean(sc), sd = Math.sqrt(mean(sc.map(x => (x - mu) ** 2)));
        return <g key={m}><Tx x={cx} y={218} s={10} w={700}>{m}</Tx>
          {sc.slice(0, Math.max(0, done + 1)).map((s, i) => <Dot key={i} x={cx - 14 + (i % 5) * 7} y={sy(s)} r={3.5} c={CLASS[j]} o={.75} />)}
          {f.s >= 2 && <g style={{ opacity: at(f, 2) }}><Ln x1={cx + 20} y1={sy(mu - sd)} x2={cx + 20} y2={sy(mu + sd)} c={CLASS[j]} w={2} /><Bx x={cx + 15} y={sy(mu) - 2} w={10} h={4} c={CLASS[j]} r={1} /><Tx x={cx + 28} y={sy(mu) + 3} a="start" s={9}>{fmt(mu)}</Tx></g>}
        </g>; })}
    </>;
  },
};

/* ---------- TEACHABLE ---------- */
const TEACH = blobs(41, [[110, 80, 14, 12, 0], [240, 80, 14, 12, 1], [175, 170, 14, 12, 2]]);
const TEACHABLE: Scene = {
  steps: [['Thu mẫu ảnh', 'Chụp vài ảnh cho mỗi lớp. Ánh sáng, nền và góc chụp đều được mô hình "học".'],
    ['Trích đặc trưng', 'Một mạng đã huấn luyện sẵn biến mỗi ảnh thành vector; ảnh giống nhau nằm gần nhau.'],
    ['Huấn luyện đầu phân loại', 'Chỉ học lớp cuối để tách các cụm vector.'],
    ['Dự đoán ảnh mới', 'Ảnh mới rơi vào vùng nào thì ra lớp đó. Độ tin cậy cao vẫn có thể sai khi nền thay đổi.']],
  param: { label: 'Số ảnh mỗi lớp', min: 2, max: 12, step: 1, value: 8 },
  predict: 'Chỉ 2 ảnh mỗi lớp, đều chụp cùng nền: độ tin cậy hiển thị có đáng tin không?',
  draw: (f) => {
    const n = f.v, emb = at(f, 1), head = at(f, 2), pred = at(f, 3), q = { x: lerp(340, 135, pred), y: lerp(20, 100, pred) };
    const conf = softmax([2.2 + n * .25, 1, .4]);
    return <>
      {TEACH.filter((_, i) => i % 12 < n).map((p, i) => { const col = p.c, row = TEACH.slice(0, TEACH.indexOf(p)).filter(q2 => q2.c === col).length;
        const x0 = 30 + col * 22, y0 = 22 + row * 15, t = stagger(f.s === 0 ? f.p : 1, i, n * 3);
        return <g key={i} style={{ opacity: t }}>{emb < 1 && <Bx x={lerp(x0, p.x - 6, emb)} y={lerp(y0, p.y - 6, emb)} w={lerp(18, 12, emb)} h={lerp(12, 12, emb)} c={CLASS[col]} o={.35 * (1 - emb)} r={2} />}
          <Dot x={lerp(x0 + 9, p.x, emb)} y={lerp(y0 + 6, p.y, emb)} r={lerp(2.5, 4.5, emb)} c={CLASS[col]} /></g>; })}
      {head > 0 && <g style={{ opacity: head }}><Path d="M175 20 L175 125 M175 125 L100 210 M175 125 L250 210" c={C.ink} w={2} dash="6 4" len={head} /></g>}
      {pred > 0 && <><Bx x={q.x - 9} y={q.y - 9} w={18} h={18} c={C.a} stroke={C.ink} /><Tx x={q.x} y={q.y - 13} s={9} w={700}>ảnh mới</Tx>
        {['Lớp 1', 'Lớp 2', 'Lớp 3'].map((l, i) => <g key={l}><Tx x={285} y={150 + i * 18} a="end" s={10}>{l}</Tx><Bx x={290} y={141 + i * 18} w={conf[i] * 60 * pred} h={11} c={CLASS[i]} r={2} /></g>)}
        <Tx x={290} y={204} a="start" s={10} w={700}>{Math.round(conf[0] * 100)}%</Tx></>}
    </>;
  },
};

export const ML_SCENES: Record<string, Scene> = { EDA, DATA, KNN, TREE, LOGREG, KMEANS, PCA, LINREG, FOREST, SVM, COMPARE, TEACHABLE };
