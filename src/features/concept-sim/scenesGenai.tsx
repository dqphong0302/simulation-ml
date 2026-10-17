import { Bx, C, CLASS, Dot, Ln, Path, Tx, at, clamp, fmt, lerp, softmax, stagger, type Scene } from './kit';

/* ---------- GENCON ---------- */
const PIECES = ['Bệnh', ' nhân', ' tiểu', ' đư', 'ờng', ' type', ' 2'];
const IDS = [18342, 2291, 30117, 9921, 512, 4302, 220];
const EMB: [string, number, number, number][] = [['Bệnh', 220, 92, 0], ['nhân', 240, 110, 0], ['tiểu', 285, 150, 1], ['đường', 305, 168, 1], ['insulin', 322, 140, 1], ['glucose', 278, 184, 1], ['type', 215, 190, 2], ['2', 238, 200, 2]];
const NEXT: [string, number][] = [['và', 2.0], ['có', 1.5], ['đang', 1.1], ['kèm', .4]];
const GENCON: Scene = {
  steps: [['Tách token', 'Văn bản được cắt thành token; từ ít gặp có thể bị cắt thành nhiều mảnh ("đư" + "ờng").'],
    ['Token → ID → embedding', 'Mỗi token là một số ID, rồi thành vector. Từ dùng trong ngữ cảnh giống nhau thường nằm gần nhau.'],
    ['Xác suất token kế tiếp', 'Mô hình cho xác suất mọi token kế tiếp.'],
    ['Temperature', 'Chia logit cho T trước softmax: T thấp → tập trung, T cao → trải đều.']],
  param: { label: 'Temperature', min: .2, max: 2.5, step: .1, value: .5, fmt: v => fmt(v, 1) },
  predict: 'T = 0,2 và T = 2,5: token "kèm" có xác suất khác nhau bao nhiêu lần?',
  draw: (f) => {
    const split = at(f, 0), emb = at(f, 1), T = f.s === 3 ? lerp(1, f.v, f.e) : 1, pr = softmax(NEXT.map(n => n[1]), T), bars = at(f, 2);
    let x = 14; const boxes = PIECES.map((t, i) => { const w = t.trim().length * 7 + 12, b = { t, x: x + i * 6 * split, w }; x += w; return b; });
    return <>
      {boxes.map((b, i) => <g key={i}><Bx x={b.x} y={16} w={b.w} h={24} c={CLASS[i % 4]} o={.12 + .18 * split} stroke={split > .3 ? CLASS[i % 4] : undefined} />
        <Tx x={b.x + b.w / 2} y={32} s={11} w={600} c={C.ink}>{b.t.trim()}</Tx>
        {f.s >= 1 && <Tx x={b.x + b.w / 2} y={54} s={9} c={C.mute} o={stagger(f.s === 1 ? f.p * 2 : 1, i, 7)}>{IDS[i]}</Tx>}</g>)}
      {f.s >= 1 && <g>
        <Bx x={196} y={62} w={150} h={150} c={C.surf} stroke={C.line} /><Tx x={271} y={76} s={9} c={C.mute}>không gian embedding (2D minh họa)</Tx>
        {EMB.map(([w, ex, ey, g], i) => { const src = boxes[Math.min(i, 6)], t = i < 6 ? stagger(clamp(f.s === 1 ? f.p * 1.4 - .3 : 1), i, 6) : emb;
          return <g key={w}><Dot x={lerp(src.x + src.w / 2, ex, t)} y={lerp(40, ey, t)} r={4.5} c={CLASS[g]} o={t} /><Tx x={ex + 7} y={ey + 3} a="start" s={9} o={t}>{w}</Tx></g>; })}</g>}
      {bars > 0 && <g><Tx x={14} y={96} a="start" s={10} w={700}>…type 2 → ?</Tx>
        {NEXT.map(([t], i) => <g key={t}><Tx x={46} y={120 + i * 24} a="end" s={11}>{t}</Tx><Bx x={52} y={109 + i * 24} w={pr[i] * 120 * bars} h={15} c={C.d} r={3} o={.4 + pr[i] * .6} />
          <Tx x={56 + pr[i] * 120 * bars} y={120 + i * 24} a="start" s={10}>{Math.round(pr[i] * 100)}%</Tx></g>)}
        <Tx x={14} y={214} a="start" s={10} w={700} c={C.ink}>T = {fmt(T, 1)}</Tx></g>}
    </>;
  },
};

/* ---------- GENAI ---------- */
const WORDS = 'Theo đoạn giả lập [1], nhóm A có 20 mẫu. Cần mở nguồn để kiểm tra lại.'.split(' ');
const GENAI: Scene = {
  steps: [['System prompt', 'Chỉ dẫn vai trò và giới hạn: ví dụ "chỉ trả lời từ tài liệu, nói rõ khi không biết".'],
    ['Ngữ cảnh tùy chỉnh', 'Tài liệu bạn dán vào chiếm chỗ trong cửa sổ ngữ cảnh có giới hạn.'],
    ['Câu hỏi', 'Câu hỏi đi sau cùng; phải còn chỗ cho câu trả lời.'],
    ['Sinh câu trả lời', 'Mô hình sinh từng token. Hình minh họa giả định cắt phần đầu khi tràn; dịch vụ thực có thể báo lỗi hoặc xử lý khác.']],
  param: { label: 'Độ dài tài liệu (% cửa sổ)', min: 10, max: 90, step: 5, value: 45, fmt: v => `${v}%` },
  predict: 'Tài liệu chiếm 90% cửa sổ: phần nào sẽ bị cắt, và câu trả lời còn dựa được vào [1] không?',
  draw: (f) => {
    const Hh = 146, top = 62, sys = 12, q = 8, ans = 20, ctx = f.v;
    const segs: [string, number, string, number][] = [['System', sys, C.d, at(f, 0)], ['Tài liệu', ctx, C.a, at(f, 1)], ['Câu hỏi', q, C.b, at(f, 2)], ['Trả lời', ans, C.c, at(f, 3)]];
    const used = segs.reduce((t, [, p, , a]) => t + p * a, 0), shift = Math.max(0, used - 100) / 100 * Hh;
    let y = top - shift; const out = segs.map(([l, p, c, a]) => { const h = p / 100 * Hh * a, b = { l, y, h, c, a }; y += h; return b; });
    const nW = f.s === 3 ? Math.min(WORDS.length, Math.floor(f.p * (WORDS.length + 1))) : 0;
    const lines: string[] = []; WORDS.slice(0, nW).forEach(w => { const last = lines[lines.length - 1]; if (!last || (last + ' ' + w).length > 28) lines.push(w); else lines[lines.length - 1] = last + ' ' + w; });
    return <>
      <Bx x={40} y={top} w={80} h={Hh} c="none" stroke={C.ink2} />
      <Tx x={80} y={top + Hh + 11} s={9} w={700}>cửa sổ ngữ cảnh</Tx>
      {out.map(b => <g key={b.l} style={{ opacity: b.a > 0 ? 1 : 0 }}><Bx x={lerp(150, 42, b.a)} y={b.y} w={76} h={b.h} r={2} c={b.c} o={b.y + b.h <= top ? .25 : .8} />
        {b.h > 10 && <Tx x={lerp(188, 80, b.a)} y={b.y + b.h / 2 + 4} s={10} c={b.y + b.h <= top ? C.bad : '#fff'} w={700}>{b.l}</Tx>}</g>)}
      {shift > 0 && <g><Bx x={36} y={top - shift} w={88} h={shift} c={C.bad} o={.12} r={2} /><Ln x1={30} y1={top} x2={130} y2={top} c={C.bad} w={2} />
        <Tx x={80} y={top - shift - 5} s={10} w={700} c={C.bad}>tràn {Math.round(shift / Hh * 100)}% → bị cắt</Tx></g>}
      <Bx x={164} y={40} w={186} h={150} c={C.surf} stroke={C.line} />
      {f.s >= 2 && <Tx x={172} y={60} a="start" s={10} c={C.b} w={700}>Hỏi: nhóm A có bao nhiêu mẫu?</Tx>}
      {lines.map((l, i) => <Tx key={i} x={172} y={84 + i * 16} a="start" s={10} c={C.ink}>{l}</Tx>)}
      {f.s === 3 && nW < WORDS.length && <Bx x={174 + (lines[lines.length - 1]?.length ?? 0) * 5.2} y={74 + Math.max(0, lines.length - 1) * 16} w={6} h={13} c={C.c} o={(Math.sin(f.t * 10) + 1) / 2} r={1} />}
      {f.s === 3 && shift > 0 && f.p > .9 && <Tx x={172} y={180} a="start" s={9} c={C.bad} w={700}>⚠ system prompt có thể đã bị cắt</Tx>}
    </>;
  },
};

/* ---------- RAG ---------- */
const CH = [[205, 60], [230, 80], [300, 55], [320, 90], [215, 160], [250, 185]] as const;
const QP = { x: 238, y: 98 };
const RANK = CH.map(([x, y], i) => ({ i, d: Math.hypot(x - QP.x, y - QP.y) })).sort((a, b) => a.d - b.d);
const RAG: Scene = {
  steps: [['Chia nhỏ tài liệu', 'Mỗi tài liệu được cắt thành các đoạn (chunk) có đánh dấu nguồn.'],
    ['Nhúng vector (minh họa)', 'Hình dùng tọa độ đồ chơi, không phải embedding đã học. Lab thật cho chọn BM25 cục bộ hoặc embedding qua API.'],
    ['Truy xuất top-k', 'Ví dụ vector lấy k chunk gần câu hỏi. BM25 xếp theo từ khóa, không dùng khoảng cách 2D này. Gần không bảo đảm đúng ý.'],
    ['Sinh có dẫn nguồn', 'Chỉ các chunk truy xuất được đưa vào prompt. Kiểm tra trích dẫn có thật sự hỗ trợ câu trả lời.']],
  param: { label: 'Số chunk truy xuất k', min: 1, max: 4, step: 1, value: 2 },
  predict: 'k = 4 đưa thêm chunk xa chủ đề vào prompt — câu trả lời chắc chắn hơn hay dễ lạc hơn?',
  draw: (f) => {
    const k = f.v, top = RANK.slice(0, k).map(r => r.i), chunk = at(f, 0), emb = at(f, 1), ret = at(f, 2), gen = at(f, 3);
    return <>
      {[0, 1, 2].map(d => <g key={d} style={{ opacity: 1 - gen * .85 }}><Bx x={16} y={20 + d * 62} w={44} h={52} c={C.soft} stroke={C.line} /><Tx x={38} y={50 + d * 62} s={10} w={700}>TL{d + 1}</Tx></g>)}
      <Bx x={180} y={30} w={166} h={180} c={C.surf} stroke={C.line} o={emb} />
      {CH.map(([ex, ey], i) => { const d = Math.floor(i / 2), sx = 70 + (i % 2) * 44, sy = 28 + d * 62 + (i % 2) * 18;
        const x = lerp(lerp(38, sx, chunk), ex - 18, emb), y = lerp(lerp(46 + d * 62, sy, chunk), ey - 8, emb), on = top.includes(i) && f.s >= 2, rank = top.indexOf(i);
        return <g key={i}>
          <Bx x={lerp(x, ex - 4, emb)} y={lerp(y, ey - 4, emb)} w={lerp(36, 8, emb)} h={lerp(14, 8, emb)} r={lerp(2, 4, emb)} c={CLASS[d]} o={chunk * (on ? 1 : .7)} stroke={on ? C.ink : undefined} />
          {emb < .5 && chunk > .5 && <Tx x={x + 18 + (ex - 18 - x) * emb} y={y + 11} s={8} c={C.ink}>{d + 1}.{(i % 2) + 1}</Tx>}
          {on && <><Ln x1={QP.x} y1={QP.y} x2={lerp(QP.x, ex, stagger(f.s === 2 ? f.p : 1, rank, k))} y2={lerp(QP.y, ey, stagger(f.s === 2 ? f.p : 1, rank, k))} c={C.ink} w={1.5} dash="3 3" />
            <Tx x={ex + 9} y={ey - 6} a="start" s={9} w={700} o={ret}>[{rank + 1}]</Tx></>}</g>; })}
      {f.s >= 2 && <><circle cx={QP.x} cy={QP.y} r={RANK[k - 1].d * ret} style={{ fill: C.d, opacity: .08, stroke: C.d, strokeDasharray: '4 3' }} />
        <Path d={`M${QP.x} ${QP.y - 8} l2.4 5 5.4 .6-4 3.8 1 5.4-4.8-2.6-4.8 2.6 1-5.4-4-3.8 5.4-.6z`} c={C.d} f="var(--chart-4)" w={1} />
        <Tx x={QP.x} y={QP.y + 20} s={9} w={700} c={C.d}>câu hỏi</Tx></>}
      {gen > 0 && <g style={{ opacity: gen }}><Bx x={14} y={150} w={160} h={62} c="var(--ok-soft)" stroke={C.ok} />
        <Tx x={20} y={166} a="start" s={10} w={700} c={C.ink}>Prompt = câu hỏi + {k} chunk</Tx>
        <Tx x={20} y={184} a="start" s={10} c={C.ink2}>Trả lời: … {top.map((_, i) => `[${i + 1}]`).join('')}</Tx>
        <Tx x={20} y={202} a="start" s={9} c={C.mute}>đối chiếu từng [n] với chunk gốc</Tx></g>}
    </>;
  },
};

export const GENAI_SCENES: Record<string, Scene> = { GENCON, GENAI, RAG };
