import { gaussian, makeRng } from '../../core/algorithms/rng';
import { Axes, Bx, C, CLASS, Dot, Ln, Path, Tx, at, clamp, fmt, lerp, poly, softmax, stagger, type Scene } from './kit';

/* ---------- MLP ---------- */
const MW = (() => { const r = makeRng(43); return { a: Array.from({ length: 6 }, () => [0, 1, 2].map(() => gaussian(r) * .9)), b: [0, 1].map(() => Array.from({ length: 6 }, () => gaussian(r) * .9)) }; })();
const MLP: Scene = {
  steps: [['Lan truyền xuôi', 'Tín hiệu đi từ đầu vào qua lớp ẩn: mỗi nút = tổng có trọng số rồi qua hàm kích hoạt.'],
    ['Tính loss', 'So xác suất đầu ra với nhãn đúng bằng cross-entropy.'],
    ['Lan truyền ngược', 'Gradient của loss chạy ngược để biết mỗi trọng số cần chỉnh bao nhiêu.'],
    ['Cập nhật qua nhiều epoch', 'Lặp xuôi–ngược–cập nhật: loss train giảm. Cần theo dõi cả validation để phát hiện overfitting.']],
  param: { label: 'Số nút ẩn', min: 2, max: 6, step: 1, value: 4 },
  predict: 'Thêm nút ẩn làm mô hình linh hoạt hơn. Loss train giảm — loss validation có chắc giảm theo?',
  draw: (f) => {
    const h = f.v, X = [.8, .3, .6], ly = (n: number, i: number) => 110 + (i - (n - 1) / 2) * Math.min(34, 170 / n);
    const upd = at(f, 3), hid = MW.a.slice(0, h).map(w => Math.tanh(w.reduce((s, wi, j) => s + wi * X[j], 0)));
    const out = softmax(MW.b.map(w => w.slice(0, h).reduce((s, wi, j) => s + wi * hid[j], 0) * (1 + upd * 1.5) + (upd * 1.2) * (w === MW.b[0] ? 1 : -1)));
    const loss = -Math.log(out[0]), L = [[60, 3], [180, h], [300, 2]] as const;
    const fwd = f.s === 0 ? f.p : 1, back = f.s === 2 ? f.p : -1;
    const edge = (l: number, i: number, j: number, w: number) => { const [x1, n1] = L[l], [x2, n2] = L[l + 1], y1 = ly(n1, i), y2 = ly(n2, j);
      const t = l === 0 ? clamp(fwd * 2) : clamp(fwd * 2 - 1), bt = l === 1 ? clamp(back * 2) : clamp(back * 2 - 1);
      return <g key={`${l}${i}${j}`}><Ln x1={x1} y1={y1} x2={x2} y2={y2} c={w > 0 ? C.a : C.b} w={.6 + Math.abs(w) * (1.6 + upd * .8 * Math.sin(i + j))} o={.45} />
        {f.s === 0 && t > 0 && t < 1 && <Dot x={lerp(x1, x2, t)} y={lerp(y1, y2, t)} r={3} c={C.a} />}
        {f.s === 2 && bt > 0 && bt < 1 && <Dot x={lerp(x2, x1, bt)} y={lerp(y2, y1, bt)} r={3} c={C.bad} />}</g>; };
    return <>
      {[0, 1, 2].map(i => MW.a.slice(0, h).map((w, j) => edge(0, i, j, w[i])))}
      {MW.b.map((w, j) => w.slice(0, h).map((wi, i) => edge(1, i, j, wi)))}
      {X.map((v, i) => <g key={i}><Dot x={60} y={ly(3, i)} r={11} c={C.a} o={.25 + v * .75} /><Tx x={36} y={ly(3, i) + 4} a="end" s={10}>x{i + 1}={fmt(v, 1)}</Tx></g>)}
      {hid.map((v, i) => <Dot key={i} x={180} y={ly(h, i)} r={11} c={v > 0 ? C.a : C.b} o={clamp(fwd * 2 - .5) * (.25 + Math.abs(v) * .75)} ring={C.line} />)}
      {out.map((v, i) => <g key={i}><Dot x={300} y={ly(2, i)} r={12} c={CLASS[i]} o={clamp(fwd * 2 - 1) * (.25 + v * .75)} ring={C.line} />
        {f.s >= 1 && <Tx x={318} y={ly(2, i) + 4} a="start" s={10} w={700}>{fmt(v)}{i === 0 ? ' ✓' : ''}</Tx>}</g>)}
      {f.s >= 1 && <Tx x={300} y={200} s={11} w={700} c={C.ink}>loss {fmt(loss)}</Tx>}
      {f.s === 3 && <g><Bx x={18} y={168} w={110} h={46} c={C.surf} stroke={C.line} /><Tx x={24} y={180} a="start" s={9} c={C.mute}>loss theo epoch</Tx>
        <Path d={poly(Array.from({ length: 20 }, (_, i) => [24 + i * 5, 208 - 22 * Math.exp(-i / 5)]))} c={C.b} w={2} len={f.e} /></g>}
    </>;
  },
};

/* ---------- CNN ---------- */
const IMG = Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_, c) => (c >= 3 && c <= 4 && r >= 1 && r <= 6) || (r >= 3 && r <= 4 && c >= 1 && c <= 6) ? 1 : 0));
const KERS = [[[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]], [[-1, -1, -1], [0, 0, 0], [1, 1, 1]]];
const CONVS = KERS.map(K => Array.from({ length: 6 }, (_, r) => Array.from({ length: 6 }, (_, c) => K.reduce((s, kr, i) => s + kr.reduce((s2, k, j) => s2 + k * IMG[r + i][c + j], 0), 0))));
const CNN: Scene = {
  steps: [['Ảnh là ma trận số', 'Mỗi ô là cường độ một pixel (ở đây 0 hoặc 1).'],
    ['Trượt kernel', 'Kernel 3×3 phát hiện cạnh: nhân từng ô rồi cộng, trượt khắp ảnh tạo feature map.'],
    ['ReLU', 'Giữ giá trị dương, đặt giá trị âm về 0.'],
    ['Max-pooling 2×2', 'Lấy giá trị lớn nhất mỗi ô 2×2: bản đồ nhỏ hơn, bớt nhạy với dịch chuyển nhỏ.']],
  param: { label: 'Kernel', min: 0, max: 1, step: 1, value: 0, fmt: v => (v ? 'cạnh ngang' : 'cạnh dọc') },
  predict: 'Đổi từ kernel cạnh dọc sang cạnh ngang: vùng sáng của feature map dời từ đâu sang đâu?',
  draw: (f) => {
    const cs = 15, ix = 14, iy = 45, ox = 160, oy = 60, px = 278, py = 75, relu = at(f, 2), pool = at(f, 3);
    const CONV = CONVS[f.v], KER = KERS[f.v], idx = f.s < 1 ? -1 : f.s === 1 ? Math.min(35, Math.floor(f.p * 36)) : 35, kr = Math.floor(Math.max(0, idx) / 6), kc = Math.max(0, idx) % 6;
    const val = (r: number, c: number) => { const v = CONV[r][c]; return lerp(v, Math.max(0, v), relu); };
    const cell = (v: number) => ({ c: v >= 0 ? C.a : C.b, o: .12 + Math.min(1, Math.abs(v) / 3) * .88 });
    return <>
      <Tx x={ix + 60} y={iy - 8} s={10} w={700}>Ảnh 8×8</Tx>
      {IMG.map((row, r) => row.map((v, c) => <Bx key={`${r}${c}`} x={ix + c * cs} y={iy + r * cs} w={cs - 1} h={cs - 1} r={1} c={v ? C.ink : C.soft} o={stagger(f.s === 0 ? f.p : 1, r * 8 + c, 64)} />))}
      {f.s === 1 && <Bx x={ix + kc * cs - 1} y={iy + kr * cs - 1} w={cs * 3 + 1} h={cs * 3 + 1} c="none" stroke={C.b} r={2} />}
      {f.s >= 1 && <><Tx x={ox + 45} y={oy - 8} s={10} w={700}>Feature map 6×6</Tx>
        {CONV.map((row, r) => row.map((_, c) => { if (r * 6 + c > idx) return null; const v = val(r, c), k = cell(v);
          return <g key={`o${r}${c}`}><Bx x={ox + c * cs} y={oy + r * cs} w={cs - 1} h={cs - 1} r={1} c={k.c} o={k.o} /><Tx x={ox + c * cs + 7} y={oy + r * cs + 11} s={8} c={C.ink}>{Math.round(v)}</Tx></g>; }))}</>}
      {f.s === 1 && idx >= 0 && <Tx x={ox + 45} y={oy + 108} s={10}>Σ(ảnh × kernel) = <tspan style={{ fontWeight: 700 }}>{CONV[kr][kc]}</tspan></Tx>}
      {f.s === 1 && <g>{KER.map((row, i) => row.map((k, j) => <g key={`k${i}${j}`}><Bx x={ix + j * 14 + 18} y={180 + i * 11 - 10} w={13} h={10} r={1} c={k > 0 ? C.a : k < 0 ? C.b : C.soft} o={.5} /><Tx x={ix + j * 14 + 24} y={178 + i * 11} s={8}>{k}</Tx></g>))}<Tx x={ix + 82} y={192} a="start" s={9} c={C.mute}>kernel</Tx></g>}
      {pool > 0 && <><Tx x={px + 30} y={py - 8} s={10} w={700} o={pool}>Pool 3×3</Tx>
        {[0, 1, 2].map(r => [0, 1, 2].map(c => { const m = Math.max(val(2 * r, 2 * c), val(2 * r + 1, 2 * c), val(2 * r, 2 * c + 1), val(2 * r + 1, 2 * c + 1)), k = cell(m), t = stagger(f.p, r * 3 + c, 9);
          return <g key={`p${r}${c}`} style={{ opacity: t }}><Bx x={px + c * 20} y={py + r * 20} w={19} h={19} r={2} c={k.c} o={k.o} /><Tx x={px + c * 20 + 10} y={py + r * 20 + 13} s={9} c={C.ink}>{Math.round(m)}</Tx>
            {t > 0 && t < 1 && <Bx x={ox + 2 * c * cs - 1} y={oy + 2 * r * cs - 1} w={cs * 2 + 1} h={cs * 2 + 1} c="none" stroke={C.d} r={2} />}</g>; }))}</>}
    </>;
  },
};

/* ---------- ATTN ---------- */
const TOK = ['Bệnh', 'nhân', 'sốt', 'cao', 'ho', 'đờm'];
const QV = [[.2, .9], [.3, .8], [1, .2], [.9, .4], [.5, -.6], [.4, -.7]], KV = [[.1, 1], [.2, .9], [.8, .3], [1, .1], [.6, -.5], [.3, -.8]];
const ATTN: Scene = {
  steps: [['Token → Q, K, V', 'Mỗi token có vector Query (đang tìm gì), Key (chứa gì) và Value (mang gì).'],
    ['So Q với từng K', 'Điểm = Q·K/√d: token "sốt" hỏi các token khác liên quan thế nào.'],
    ['Softmax → trọng số', 'Điểm thành trọng số cộng lại bằng 1; dây đậm = chú ý nhiều.'],
    ['Ma trận attention', 'Mỗi hàng là một token hỏi; mỗi cột là token được nhìn. Trọng số cao không tự là "giải thích" của mô hình.']],
  param: { label: 'Temperature', min: .2, max: 3, step: .1, value: 1, fmt: v => fmt(v, 1) },
  predict: 'Giảm temperature về 0,2: trọng số của "sốt" sẽ dồn vào một token hay trải đều?',
  draw: (f) => {
    const q = 2, xs = TOK.map((_, i) => 40 + i * 56), sc = (i: number) => KV.map(k => (QV[i][0] * k[0] + QV[i][1] * k[1]) / Math.SQRT2 * 4);
    const w = softmax(sc(q), f.v), arcs = at(f, 1), wt = at(f, 2), mat = at(f, 3);
    return <>
      {TOK.map((t, i) => <g key={t} style={{ opacity: stagger(f.s === 0 ? f.p : 1, i, 6) }}>
        <Bx x={xs[i] - 24} y={14} w={48} h={24} c={i === q && f.s >= 1 ? C.d : C.soft} o={i === q && f.s >= 1 ? .25 : 1} stroke={i === q && f.s >= 1 ? C.d : undefined} />
        <Tx x={xs[i]} y={30} s={11} w={600} c={C.ink}>{t}</Tx>
        {f.s === 0 && [QV, KV, QV].map((v, j) => <Bx key={j} x={xs[i] - 15 + j * 11} y={46} w={9} h={(Math.abs(v[i][0]) + .2) * 18} c={CLASS[j]} r={2} o={.8} />)}</g>)}
      {f.s === 0 && <Tx x={180} y={92} s={9} c={C.mute}>■ Q  ■ K  ■ V</Tx>}
      {f.s >= 1 && f.s <= 2 && TOK.map((_, j) => { const x1 = xs[q], x2 = xs[j], d = `M${x1} 40 Q${(x1 + x2) / 2} ${60 + Math.abs(x2 - x1) * .55} ${x2} 40`;
        return <g key={j}><Path d={d} c={C.d} w={lerp(1.2, 1 + w[j] * 16, wt)} o={lerp(.5, .25 + w[j] * .75, wt)} len={stagger(arcs, j, 6)} />
          <Tx x={x2} y={j === q ? 70 : 62 + Math.abs(x2 - x1) * .3} s={10} w={700} o={arcs}>{wt > .5 ? `${Math.round(w[j] * 100)}%` : fmt(sc(q)[j], 1)}</Tx></g>; })}
      {f.s === 2 && TOK.map((_, j) => <Bx key={j} x={xs[j] - 12} y={205 - w[j] * 70 * wt} w={24} h={w[j] * 70 * wt} c={C.d} r={2} />)}
      {mat > 0 && <g style={{ opacity: mat }}>{TOK.map((_, i) => { const wi = softmax(sc(i), f.v); return <g key={i}>
        <Tx x={118} y={68 + i * 22} a="end" s={10} w={i === q ? 700 : 500}>{TOK[i]}</Tx>
        {wi.map((v, j) => <Bx key={j} x={124 + j * 22} y={55 + i * 22} w={20} h={20} r={2} c={C.d} o={.08 + v * .92 * stagger(f.p, i * 6 + j, 36)} />)}</g>; })}</g>}
    </>;
  },
};

/* ---------- GPT ---------- */
const CAND: [string, number][][] = [[['sốt', 2.2], ['ho', 1.6], ['đau', 1.3], ['mệt', .6]], [['cao', 2.0], ['nhẹ', 1.4], ['kéo', .9], ['về', .3]], [['từ', 1.8], ['và', 1.5], ['nhiều', 1.0], ['sau', .6]], [['hôm', 1.9], ['hai', 1.2], ['ngày', .9], ['đêm', .5]]];
const U = [.55, .72, .4, .86];
const pick = (pos: number, T: number) => { const p = softmax(CAND[pos].map(c => c[1]), T); let s = 0; for (let i = 0; i < p.length; i++) { s += p[i]; if (U[pos] < s) return i; } return p.length - 1; };
const GPT: Scene = {
  steps: [['Ngữ cảnh', 'Mô hình chỉ thấy các token đã có (che token tương lai).'],
    ['Phân phối token kế tiếp', 'Đầu ra là xác suất cho mọi token trong từ điển; ở đây chỉ vẽ 4 ứng viên.'],
    ['Lấy mẫu', 'Rút một token theo xác suất rồi nối vào ngữ cảnh.'],
    ['Lặp tự hồi quy', 'Lặp lại từng token một. Văn bản trôi chảy không đồng nghĩa với đúng.']],
  param: { label: 'Temperature', min: .2, max: 2.5, step: .1, value: 1, fmt: v => fmt(v, 1) },
  predict: 'Temperature 2,5 thì câu sinh ra đa dạng hơn — nhưng có nhiều token hiếm/sai hơn không?',
  draw: (f) => {
    const T = f.v, picks = CAND.map((_, i) => pick(i, T)), sub = f.s === 3 ? Math.min(2, Math.floor(f.p * 3)) : 0;
    const pos = f.s < 3 ? 0 : sub + 1, subP = f.s === 3 ? clamp(f.p * 3 - sub) : f.p;
    const nGen = f.s < 2 ? 0 : f.s === 2 ? (f.p > .55 ? 1 : 0) : 1 + sub + (subP > .6 ? 1 : 0);
    const seq = ['Bệnh', 'nhân', 'bị', ...picks.slice(0, nGen).map((k, i) => CAND[i][k][0])];
    let x = 20; const boxes = seq.map((t, i) => { const w = t.length * 7.5 + 16, b = { t, x, w, gen: i >= 3 }; x += w + 5; return b; });
    const probs = softmax(CAND[pos].map(c => c[1]), T), bars = f.s === 1 ? f.e : f.s >= 2 ? 1 : 0;
    return <>
      {boxes.map((b, i) => <g key={i} style={{ opacity: f.s === 0 ? stagger(f.p, i, 3) : 1 }}><Bx x={b.x} y={20} w={b.w} h={24} c={b.gen ? C.d : C.soft} o={b.gen ? .2 : 1} stroke={b.gen ? C.d : undefined} /><Tx x={b.x + b.w / 2} y={36} s={11} w={600} c={C.ink}>{b.t}</Tx></g>)}
      {f.s >= 1 && <Bx x={x} y={20} w={30} h={24} c="none" stroke={C.d} />}
      {f.s >= 1 && <Tx x={x + 15} y={36} s={12} w={700} c={C.d}>?</Tx>}
      {bars > 0 && CAND[pos].map(([t], i) => { const on = (f.s >= 2) && i === picks[pos] && subP > .3;
        return <g key={t}><Tx x={92} y={84 + i * 30} a="end" s={11} w={on ? 700 : 500} c={on ? C.d : C.ink2}>{t}</Tx>
          <Bx x={100} y={72 + i * 30} w={probs[i] * 220 * bars} h={16} r={3} c={on ? C.d : C.a} o={on ? 1 : .55} />
          <Tx x={106 + probs[i] * 220 * bars} y={84 + i * 30} a="start" s={10}>{Math.round(probs[i] * 100)}%</Tx></g>; })}
      {f.s >= 2 && <Tx x={100} y={206} a="start" s={10} c={C.mute}>u = {fmt(U[pos])} → chọn theo xác suất tích lũy</Tx>}
    </>;
  },
};

/* ---------- AE ---------- */
const XIN = [.2, .55, .9, .75, .3, .6, .85, .4];
const dct = (x: number[]) => x.map((_, k) => x.reduce((s, v, n) => s + v * Math.cos(Math.PI / x.length * (n + .5) * k), 0));
const idct = (c: number[], keep: number) => c.map((_, n) => (c[0] / 2 + c.slice(1, keep).reduce((s, v, k) => s + v * Math.cos(Math.PI / c.length * (n + .5) * (k + 1)), 0)) * 2 / c.length);
const AE: Scene = {
  steps: [['Đầu vào 8 chiều', 'Ví dụ một tín hiệu 8 giá trị (như 8 xét nghiệm đã chuẩn hóa).'],
    ['Nén qua nút cổ chai', 'Encoder ép thông tin vào ít số hơn: buộc giữ phần quan trọng nhất.'],
    ['Giải nén', 'Decoder tái dựng lại 8 giá trị từ mã nén.'],
    ['Sai số tái dựng', 'Phần tô đỏ là chênh lệch. Sai số lớn bất thường có thể gợi ý mẫu lạ — không tự là chẩn đoán.']],
  param: { label: 'Kích thước nút cổ chai', min: 1, max: 8, step: 1, value: 3 },
  predict: 'Nút cổ chai = 1 thì tái dựng giữ được gì? = 8 thì mô hình còn "học" được gì không?',
  draw: (f) => {
    const k = f.v, coef = dct(XIN), rec = idct(coef, k), z = coef.slice(0, k), enc = at(f, 1), dec = at(f, 2), err = at(f, 3);
    const by = (i: number) => 28 + i * 21, zy = (i: number) => 110 + (i - (k - 1) / 2) * Math.min(20, 150 / k);
    const mse = XIN.reduce((s, v, i) => s + (v - rec[i]) ** 2, 0) / 8;
    return <>
      <path d={`M90 22 L150 ${zy(0) - 10} L150 ${zy(k - 1) + 10} L90 194 Z`} style={{ fill: C.a, opacity: .08 * enc }} />
      <path d={`M210 ${zy(0) - 10} L270 22 L270 194 L210 ${zy(k - 1) + 10} Z`} style={{ fill: C.c, opacity: .08 * dec }} />
      <Tx x={120} y={212} s={10} w={700} o={enc}>encoder</Tx><Tx x={240} y={212} s={10} w={700} o={dec}>decoder</Tx>
      {XIN.map((v, i) => <g key={i}><Bx x={86 - v * 70} y={by(i)} w={v * 70 * stagger(f.s === 0 ? f.p : 1, i, 8)} h={15} c={C.a} r={2} />
        {f.s === 1 && <Dot x={lerp(90, 180, f.p)} y={lerp(by(i) + 7, zy(i % k), f.p)} r={2.5} c={C.a} o={1 - f.p * .5} />}</g>)}
      {z.map((v, i) => <g key={i} style={{ opacity: enc }}><Dot x={180} y={zy(i)} r={8} c={C.d} o={.3 + Math.min(1, Math.abs(v) / 4) * .7} ring={C.line} /></g>)}
      <Tx x={180} y={zy(0) - 16} s={10} w={700} o={enc}>z ({k})</Tx>
      {rec.map((v, i) => <g key={i}>
        {err > 0 && <Bx x={274} y={by(i)} w={XIN[i] * 70} h={15} c="none" stroke={C.ink2} r={2} />}
        <Bx x={274} y={by(i)} w={Math.max(0, v) * 70 * dec} h={15} c={C.c} r={2} o={.85} />
        {err > 0 && <Bx x={274 + Math.min(v, XIN[i]) * 70} y={by(i) + 4} w={Math.abs(v - XIN[i]) * 70 * err} h={7} c={C.bad} r={1} o={.8} />}</g>)}
      {f.s === 2 && Array.from({ length: k }, (_, i) => <Dot key={i} x={lerp(180, 270, f.p)} y={lerp(zy(i), by(i * 7 % 8) + 7, f.p)} r={2.5} c={C.c} />)}
      {err > 0 && <Tx x={340} y={212} a="end" s={11} w={700} c={C.ink}>MSE {fmt(mse, 3)}</Tx>}
    </>;
  },
};

/* ---------- DIFF ---------- */
const HEART = Array.from({ length: 64 }, (_, i) => { const a = i / 64 * Math.PI * 2; return { x: 16 * Math.sin(a) ** 3, y: -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) }; });
const EPS = (() => { const r = makeRng(53); return HEART.map(() => [gaussian(r), gaussian(r)]); })();
const DIFF: Scene = {
  steps: [['Dữ liệu sạch', 'Một mẫu dữ liệu x₀ (ở đây là các điểm tạo hình trái tim).'],
    ['Thêm nhiễu dần', 'Mỗi bước trộn thêm một chút nhiễu Gauss: xₜ = √ᾱₜ·x₀ + √(1−ᾱₜ)·ε.'],
    ['Nhiễu thuần', 'Sau T bước, dữ liệu gần như nhiễu Gauss chuẩn.'],
    ['Khử nhiễu ngược', 'Mạng học dự đoán ε ở từng bước; đi ngược từ nhiễu sẽ dựng lại một mẫu.']],
  param: { label: 'Số bước T', min: 4, max: 60, step: 4, value: 20 },
  predict: 'Với T rất nhỏ, mỗi bước khử nhiễu phải "nhảy" xa — chất lượng mẫu sẽ ra sao?',
  draw: (f) => {
    const T = f.v, raw = f.s === 0 ? 0 : f.s === 1 ? f.e : f.s === 2 ? 1 : 1 - f.e, tq = Math.round(raw * T) / T;
    const ab = Math.cos(tq * Math.PI / 2) ** 2, jig = f.s === 2 ? .15 : 0;
    return <>
      {HEART.map((p, i) => <Dot key={i} x={180 + Math.sqrt(ab) * p.x * 5.5 + Math.sqrt(1 - ab) * (EPS[i][0] + Math.sin(f.t * 3 + i) * jig) * 45}
        y={100 + Math.sqrt(ab) * p.y * 5.5 + Math.sqrt(1 - ab) * (EPS[i][1] + Math.cos(f.t * 3 + i) * jig) * 45} r={3.5} c={lerp(0, 1, tq) > .5 ? C.mute : C.b} o={.85} />)}
      <Bx x={40} y={196} w={280} h={8} c={C.soft} r={4} />
      <Bx x={40} y={196} w={280 * tq} h={8} c={f.s === 3 ? C.c : C.b} r={4} />
      {T <= 40 && Array.from({ length: T + 1 }, (_, i) => <Ln key={i} x1={40 + i * 280 / T} y1={193} x2={40 + i * 280 / T} y2={207} c={C.line} w={.8} />)}
      <Tx x={36} y={204} a="end" s={10}>t=0</Tx><Tx x={324} y={204} a="start" s={10}>T</Tx>
      <Tx x={20} y={20} a="start" s={11} w={700} c={C.ink}>t = {Math.round(tq * T)}/{T} · ᾱ = {fmt(ab)}</Tx>
      <Tx x={340} y={20} a="end" s={10} c={f.s === 3 ? C.c : C.b} w={700}>{f.s === 3 ? '← khử nhiễu' : f.s >= 1 ? 'thêm nhiễu →' : ''}</Tx>
    </>;
  },
};

/* ---------- VAE ---------- */
const MU0 = [[-1.2, .6], [1.1, .8], [.1, -1.2]];
const VAE: Scene = {
  steps: [['Mã hóa thành μ, σ', 'Encoder biến mỗi mẫu thành một vùng (elip) trong không gian latent, không phải một điểm.'],
    ['Lấy mẫu z = μ + σ·ε', 'Rút ngẫu nhiên z trong vùng đó (reparameterization).'],
    ['Giải mã z', 'Decoder biến z thành một mẫu đầu ra.'],
    ['Đi trong không gian latent', 'Dịch z liên tục → đầu ra đổi liên tục. Mẫu sinh ra là tổng hợp, không phải hồ sơ người thật.']],
  param: { label: 'β (trọng số KL)', min: 0, max: 4, step: .5, value: 1, fmt: v => fmt(v, 1) },
  predict: 'Tăng β: các elip bị kéo về gốc và phình ra. Tái dựng sắc nét hơn hay mờ hơn?',
  draw: (f) => {
    const cx = 95, cy = 112, s = 38, b = f.v, mus = MU0.map(([x, y]) => [x / (1 + b * .3), y / (1 + b * .3)]), sg = lerp(.22, .85, b / 4);
    const enc = at(f, 0), k = Math.floor(f.t * 2.5), r = makeRng(61 + k), eps = [gaussian(r), gaussian(r)];
    const walk = f.s === 3 ? f.p * Math.PI * 2 : 0, z = f.s === 3 ? [Math.cos(walk) * 1.3, Math.sin(walk) * 1.3] : f.s >= 1 ? [mus[0][0] + sg * eps[0] * .8, mus[0][1] + sg * eps[1] * .8] : mus[0];
    const dec = at(f, 2), rx = 26 + z[0] * 12, ry = 26 - z[1] * 12, blur = sg * 6 * (f.s >= 2 ? 1 : 0);
    return <>
      <Bx x={cx - 85} y={cy - 92} w={170} h={184} c={C.surf} stroke={C.line} />
      {[1, 2].map(i => <circle key={i} cx={cx} cy={cy} r={s * i} style={{ fill: 'none', stroke: C.line, strokeDasharray: '3 3' }} />)}
      <Tx x={cx} y={cy + 106} s={10} w={700}>latent z (N(0, I) nét đứt)</Tx>
      {mus.map(([x, y], i) => <ellipse key={i} cx={cx + x * s} cy={cy - y * s} rx={sg * s * enc} ry={sg * s * enc} style={{ fill: CLASS[i], opacity: .25, stroke: CLASS[i] }} />)}
      {mus.map(([x, y], i) => <Dot key={i} x={cx + x * s} y={cy - y * s} r={3} c={CLASS[i]} o={enc} />)}
      {f.s >= 1 && <Dot x={cx + z[0] * s} y={cy - z[1] * s} r={6} c={C.ink} ring={C.surf} />}
      {f.s >= 2 && <Path d={`M${cx + z[0] * s + 8} ${cy - z[1] * s} C 215 ${cy - z[1] * s} 200 112 245 112`} c={C.ink2} w={1.5} dash="4 4" />}
      {f.s >= 2 && <g style={{ opacity: dec }}>
        <Bx x={240} y={52} w={110} h={120} c={C.surf} stroke={C.line} />
        <filter id="vaeblur"><feGaussianBlur stdDeviation={blur} /></filter>
        <ellipse cx={295} cy={112} rx={Math.max(8, rx)} ry={Math.max(8, ry)} filter="url(#vaeblur)" style={{ fill: C.d, opacity: .8 }} />
        <Tx x={295} y={188} s={10} w={700}>đầu ra decoder</Tx></g>}
    </>;
  },
};

/* ---------- GAN ---------- */
const GAN: Scene = {
  steps: [['Thật và giả', 'Xanh: phân phối dữ liệu thật. Cam: phân phối mẫu do Generator tạo.'],
    ['D học phân biệt', 'Discriminator D(x) cho điểm cao ở vùng dữ liệu thật, thấp ở vùng giả.'],
    ['G học lừa D', 'Generator dịch phân phối của mình về nơi D cho điểm cao.'],
    ['Cân bằng', 'Khi hai phân phối trùng, D ≈ 0,5 ở mọi nơi. Thực tế huấn luyện dễ dao động hoặc mode collapse.']],
  param: { label: 'Tốc độ học của G', min: .1, max: 1, step: .1, value: .5, fmt: v => fmt(v, 1) },
  predict: 'Tốc độ học rất nhỏ: G có kịp tới phân phối thật trong cùng số vòng không?',
  draw: (f) => {
    const real = 245, start = 95, target = lerp(start, real, 1 - (1 - f.v) ** 6), m = f.s < 2 ? start : f.s === 2 ? lerp(start, target, f.e) : target;
    const sg = f.s < 2 ? 32 : lerp(32, 24, f.s === 2 ? f.e * (target - start) / (real - start) : (target - start) / (real - start));
    const close = 1 - Math.abs(real - m) / (real - start), flat = f.s === 3 ? f.e * close : 0, mid = (m + real) / 2;
    const dens = (x: number, mu: number, s2: number) => Math.exp(-(((x - mu) / s2) ** 2) / 2);
    const xs = Array.from({ length: 101 }, (_, i) => 20 + i * 3.2), Y0 = 190;
    const D = (x: number) => lerp(1 / (1 + Math.exp(-(x - mid) / (14 + close * 25))), .5, flat);
    return <>
      <Axes x0={20} y0={Y0} x1={345} y1={20} />
      <Path d={poly(xs.map(x => [x, Y0 - dens(x, real, 24) * 130]))} c={C.a} w={2.5} f="color-mix(in srgb, var(--chart-1) 14%, transparent)" />
      <Path d={poly(xs.map(x => [x, Y0 - dens(x, m, sg) * 130 * (24 / sg)]))} c={C.b} w={2.5} f="color-mix(in srgb, var(--chart-2) 14%, transparent)" />
      {f.s >= 1 && <><Path d={poly(xs.map(x => [x, Y0 - D(x) * 160]))} c={C.d} w={2} dash="6 4" o={at(f, 1)} /><Tx x={340} y={Y0 - D(340) * 160 - 6} a="end" s={10} w={700} c={C.d} o={at(f, 1)}>D(x)</Tx></>}
      <Tx x={real} y={Y0 + 14} s={10} w={700} c={C.a}>thật</Tx><Tx x={m} y={Y0 + 26} s={10} w={700} c={C.b}>G</Tx>
      {f.s === 2 && <Path d={`M${m + 10} 60 L${m + 38} 60`} c={C.b} w={2} />}
      {f.s === 3 && <Tx x={30} y={30} a="start" s={11} w={700} c={C.ink}>{close > .9 ? 'D ≈ 0,5: không còn phân biệt được' : 'Chưa hội tụ: G còn xa dữ liệu thật'}</Tx>}
    </>;
  },
};

export const DL_SCENES: Record<string, Scene> = { MLP, CNN, ATTN, GPT, AE, DIFF, VAE, GAN };
