import type { ReactNode } from 'react';

/**
 * Hình minh họa riêng cho từng slide (khóa theo tiêu đề slide). Vẽ SVG 360×240, cùng một bảng màu:
 * xanh = dữ liệu/nhóm A, cam = nhóm B / cảnh báo, xám = khung. Slide nào không có ở đây dùng hình chung của bài.
 */
const C = { a: '#0b5cab', a2: '#094d90', soft: '#e7f0fa', b: '#dc6a0b', bSoft: '#fff6ec', ink: '#0f1729', mute: '#6b7689', line: '#cdd3dc', ok: '#0f9a6c', bad: '#c0392b', bg: '#f4f6f9' };
const T = ({ x, y, children, s = 13, w = 500, c = C.ink, a = 'middle' }: { x: number; y: number; children: ReactNode; s?: number; w?: number; c?: string; a?: 'start' | 'middle' | 'end' }) =>
  <text x={x} y={y} fontSize={s * 1.12} fontWeight={w} fill={c} textAnchor={a} fontFamily="Be Vietnam Pro, Inter, system-ui, sans-serif">{children}</text>;
const Arrow = ({ x1, y1, x2, y2, c = C.mute }: { x1: number; y1: number; x2: number; y2: number; c?: string }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 7;
  return <g stroke={c} strokeWidth="2" fill="none" strokeLinecap="round"><line x1={x1} y1={y1} x2={x2} y2={y2} /><path d={`M${x2 - h * Math.cos(a - 0.5)} ${y2 - h * Math.sin(a - 0.5)} L${x2} ${y2} L${x2 - h * Math.cos(a + 0.5)} ${y2 - h * Math.sin(a + 0.5)}`} /></g>;
};
/** Histogram từ danh sách chiều cao (0–1). */
const Hist = ({ x, y, w, h, v, c = C.a, o = 0.9 }: { x: number; y: number; w: number; h: number; v: number[]; c?: string; o?: number }) => {
  const bw = w / v.length;
  return <g>{v.map((t, i) => <rect key={i} x={x + i * bw + 1} y={y + h - t * h} width={bw - 2} height={t * h} rx="2" fill={c} opacity={o} />)}<line x1={x} x2={x + w} y1={y + h} y2={y + h} stroke={C.line} /></g>;
};
const bell = (n: number, mu: number, sd: number, k = 1) => Array.from({ length: n }, (_, i) => k * Math.exp(-(((i + 0.5) / n - mu) ** 2) / (2 * sd * sd)));

/** Bảng nhỏ: hàng × cột với ô tô màu tùy chọn. */
const Grid = ({ x, y, cols, rows, cw, rh, head, cell }: { x: number; y: number; cols: number; rows: number; cw: number; rh: number; head?: string[]; cell?: (r: number, c: number) => { fill?: string; text?: string; tc?: string } | undefined }) => (
  <g>
    {head && head.map((h, c) => <g key={c}><rect x={x + c * cw} y={y} width={cw} height={rh} fill={C.a2} /><T x={x + c * cw + cw / 2} y={y + rh / 2 + 4} s={10} w={650} c="#fff">{h}</T></g>)}
    {Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => {
      const d = cell?.(r, c), yy = y + (head ? rh : 0) + r * rh;
      return <g key={`${r}-${c}`}><rect x={x + c * cw} y={yy} width={cw} height={rh} fill={d?.fill ?? '#fff'} stroke={C.line} />{d?.text && <T x={x + c * cw + cw / 2} y={yy + rh / 2 + 4} s={10} c={d.tc ?? C.ink}>{d.text}</T>}</g>;
    }))}
  </g>
);

const FIG: Record<string, () => ReactNode> = {
  // ---------- Tiền xử lý dữ liệu (DATA) ----------
  'Dữ liệu tốt bắt đầu từ câu hỏi rõ': () => <>
    <Grid x={40} y={40} cols={4} rows={4} cw={62} rh={26} head={['Glucose', 'BMI', 'Tuổi', 'Outcome']}
      cell={(r, c) => ({ fill: r === 1 ? C.soft : c === 3 ? C.bSoft : undefined, text: [['148', '33,6', '50', '1'], ['85', '26,6', '31', '0'], ['183', '23,3', '32', '1'], ['89', '28,1', '21', '0']][r][c] })} />
    <Arrow x1={20} y1={105} x2={38} y2={105} c={C.a} /><T x={14} y={96} s={10} c={C.a} a="start">1 hàng</T>
    <T x={40} y={186} s={11} c={C.a2} a="start" w={650}>■ Đơn vị quan sát: 1 bệnh nhân</T>
    <T x={40} y={204} s={11} c={C.b} a="start" w={650}>■ Biến mục tiêu: Outcome</T>
    <T x={40} y={222} s={10.5} c={C.mute} a="start">mg/dL · kg/m² · năm — kiểm tra đơn vị trước khi dùng</T>
  </>,
  'Làm quen trước khi học': () => <>
    <Grid x={30} y={40} cols={3} rows={5} cw={46} rh={22} cell={(r, c) => ({ fill: c === 1 ? C.soft : undefined, text: String([[6, 148, 33], [1, 85, 26], [8, 183, 23], [1, 89, 28], [0, 137, 43]][r][c]) })} />
    <T x={99} y={32} s={10.5} c={C.a2} w={650}>một cột</T>
    <Arrow x1={180} y1={95} x2={210} y2={95} c={C.a} />
    <Hist x={220} y={46} w={120} h={90} v={bell(10, 0.45, 0.2)} />
    <T x={280} y={156} s={11} c={C.mute}>phân bố của cột</T>
    <T x={180} y={200} s={12} w={650}>Mỗi hàng = một mẫu · mỗi cột = một đặc điểm</T>
  </>,
  'Làm sạch mà không nhìn trộm': () => <>
    <Grid x={10} y={36} cols={3} rows={3} cw={60} rh={26} head={['trống', 'số 0', 'lạ']}
      cell={(r, c) => (r === 1 ? { fill: [C.bSoft, C.bSoft, C.bSoft][c], text: ['', '0', '999'][c], tc: C.b } : { text: [['72', '35', '33'], ['', '', ''], ['66', '29', '26']][r][c] })} />
    <T x={100} y={160} s={10.5} c={C.mute}>ba thứ khác nhau</T>
    <rect x={200} y={44} width={84} height={22} rx="4" fill={C.a} /><T x={242} y={59} s={10} c="#fff" w={650}>train</T>
    <rect x={284} y={44} width={28} height={22} fill={C.b} opacity=".75" /><rect x={312} y={44} width={28} height={22} fill={C.mute} opacity=".6" rx="0" />
    <T x={298} y={80} s={9.5} c={C.b}>val</T><T x={326} y={80} s={9.5} c={C.mute}>test</T>
    <Arrow x1={240} y1={70} x2={240} y2={108} c={C.a} />
    <rect x={196} y={112} width={92} height={28} rx="6" fill={C.soft} stroke={C.a} /><T x={242} y={130} s={11} w={650} c={C.a2}>median, μ, σ</T>
    <Arrow x1={290} y1={126} x2={326} y2={96} c={C.a} />
    <T x={270} y={170} s={11} c={C.ink}>Fit trên train →</T><T x={270} y={186} s={11} c={C.ink}>áp dụng cho val & test</T>
  </>,
  'Ví dụ: chuẩn hóa một giá trị': () => {
    const ax = (y: number, lo: number, hi: number, ticks: number[], lab: string) => <g>
      <line x1={40} x2={320} y1={y} y2={y} stroke={C.line} strokeWidth="2" />
      {ticks.map((t) => { const x = 40 + ((t - lo) / (hi - lo)) * 280; return <g key={t}><line x1={x} x2={x} y1={y - 5} y2={y + 5} stroke={C.mute} /><T x={x} y={y + 18} s={10.5} c={C.mute}>{String(t).replace('.', ',')}</T></g>; })}
      <T x={40} y={y - 14} s={11} w={650} a="start" c={C.a2}>{lab}</T></g>;
    return <>
      {ax(70, 40, 160, [60, 80, 100, 120, 140], 'Giá trị gốc')}
      <rect x={133} y={56} width={94} height={28} fill={C.soft} opacity=".6" /><T x={180} y={52} s={9.5} c={C.mute}>μ ± σ</T>
      <circle cx={273} cy={70} r={7} fill={C.b} />
      {ax(170, -3, 3, [-2, -1, 0, 1, 2], 'Sau chuẩn hóa (z)')}
      <circle cx={273} cy={170} r={7} fill={C.b} />
      <Arrow x1={273} y1={80} x2={273} y2={160} c={C.b} />
      <T x={180} y={226} s={12.5} w={650}>z = (140 − 100) / 20 = 2</T>
    </>;
  },
  'Thử, quan sát và kể lại': () => <>
    <T x={95} y={32} s={11} w={650} c={C.mute}>Trước</T><T x={265} y={32} s={11} w={650} c={C.mute}>Sau</T>
    <Hist x={30} y={44} w={130} h={100} v={[0.1, 0.25, 0.6, 1, 0.8, 0.45, 0.25, 0.12, 0.06, 0.04, 0.02, 0.05]} c={C.b} />
    <Hist x={200} y={44} w={130} h={100} v={[0.08, 0.2, 0.5, 0.85, 1, 0.8, 0.5, 0.25, 0.1]} />
    <Arrow x1={164} y1={95} x2={196} y2={95} c={C.a} />
    <T x={95} y={162} s={10} c={C.mute}>0–846 µU/mL</T><T x={265} y={162} s={10} c={C.mute}>−2 … 2</T>
    <rect x={70} y={182} width={220} height={36} rx="8" fill={C.bg} stroke={C.line} />
    <T x={180} y={205} s={11.5} c={C.ink}>✍ Hình dạng đổi ra sao? Ghi lại.</T>
  </>,
  'Thí nghiệm: trước và sau xử lý': () => {
    const steps = [['Chia', 'cùng seed', C.mute], ['Xử lý', 'đổi 1 thứ', C.b], ['Mô hình', 'giữ nguyên', C.mute], ['So sánh', 'trên val', C.a]] as const;
    return <>
      {steps.map(([t, s, c], i) => <g key={t}>
        <rect x={14 + i * 86} y={70} width={72} height={56} rx="10" fill={i === 1 ? C.bSoft : i === 3 ? C.soft : '#fff'} stroke={c} strokeWidth="1.5" />
        <T x={50 + i * 86} y={95} s={12} w={700}>{t}</T><T x={50 + i * 86} y={113} s={9.5} c={C.mute}>{s}</T>
        {i < 3 && <Arrow x1={88 + i * 86} y1={98} x2={98 + i * 86} y2={98} />}
      </g>)}
      <T x={180} y={170} s={12} w={650}>Mỗi lần chỉ thay một thứ</T>
      <T x={180} y={190} s={10.5} c={C.mute}>để biết thay đổi nào gây ra khác biệt</T>
    </>;
  },
  'Ba bẫy cần tránh': () => <>
    {[0, 1, 2].map((i) => <rect key={i} x={12 + i * 116} y={34} width={104} height={160} rx="12" fill={C.bg} stroke={C.line} />)}
    <rect x={34} y={64} width={30} height={26} fill="#fff" stroke={C.line} /><T x={74} y={82} s={16} w={700} c={C.bad}>≠</T><rect x={84} y={64} width={30} height={26} fill="#fff" stroke={C.line} /><T x={99} y={82} s={13}>0</T>
    <T x={64} y={130} s={10.5} w={650}>Ô trống</T><T x={64} y={145} s={10.5} w={650}>không phải 0</T>
    {[[150, 80], [160, 72], [168, 86], [176, 76], [158, 92], [172, 70]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={4} fill={C.a} />)}
    <circle cx={208} cy={56} r={5} fill={C.b} /><T x={208} y={46} s={12} w={800} c={C.b}>?</T>
    <T x={180} y={130} s={10.5} w={650}>Ngoại lai:</T><T x={180} y={145} s={10.5} w={650}>kiểm tra nguồn</T>
    <rect x={250} y={60} width={34} height={30} rx="4" fill={C.a} /><T x={267} y={79} s={9} c="#fff" w={650}>train</T>
    <rect x={296} y={60} width={34} height={30} rx="4" fill={C.mute} /><T x={313} y={79} s={9} c="#fff" w={650}>test</T>
    <circle cx={267} cy={104} r={6} fill={C.b} /><circle cx={313} cy={104} r={6} fill={C.b} /><path d="M273 104 Q290 118 307 104" stroke={C.bad} strokeWidth="2" fill="none" strokeDasharray="3 3" />
    <T x={296} y={130} s={10.5} w={650}>Một người</T><T x={296} y={145} s={10.5} w={650}>ở cả hai tập</T>
    <T x={180} y={222} s={11} c={C.mute}>Ba lỗi làm kết quả đẹp giả hoặc sai lệch</T>
  </>,
  'Tổng kết: mỗi thao tác cần một lý do': () => <>
    <rect x={70} y={20} width={220} height={210} rx="12" fill="#fff" stroke={C.line} strokeWidth="1.5" />
    <T x={180} y={42} s={11.5} w={700}>Tự kiểm tra</T>
    <Hist x={86} y={52} w={84} h={48} v={[0.2, 0.5, 1, 0.6, 0.3, 0.15]} c={C.b} /><Hist x={190} y={52} w={84} h={48} v={[0.2, 0.6, 1, 0.6, 0.2]} />
    <Arrow x1={172} y1={78} x2={186} y2={78} c={C.a} />
    <T x={128} y={114} s={9} c={C.mute}>trước</T><T x={232} y={114} s={9} c={C.mute}>sau</T>
    {['Đã xử lý điều gì?', 'Vì sao chọn cách đó?', 'Phân bố đổi ra sao?', 'Còn hạn chế nào?'].map((t, i) => <g key={t}><circle cx={94} cy={136 + i * 22} r={6} fill={i === 3 ? C.b : C.ok} /><T x={94} y={140 + i * 22} s={8.5} c="#fff" w={800}>{i === 3 ? '!' : '?'}</T><T x={108} y={140 + i * 22} s={10.5} a="start">{t}</T></g>)}
  </>,

  // ---------- Khám phá dữ liệu: thống kê mô tả (EDA) ----------
  'Thống kê mô tả là gì?': () => <>
    <Grid x={36} y={34} cols={1} rows={6} cw={70} rh={22} head={['Glucose']} cell={(r) => ({ text: r === 5 ? '…' : String([148, 85, 183, 89, 137][r]) })} />
    <Arrow x1={118} y1={106} x2={158} y2={106} c={C.a} />
    {[['n', '768'], ['Trung bình', '120,9'], ['Median', '117'], ['Độ lệch chuẩn', '32,0'], ['Min – Max', '0 – 199']].map(([k, v], i) => <g key={k}>
      <rect x={170} y={36 + i * 32} width={168} height={26} rx="6" fill={i % 2 ? '#fff' : C.soft} stroke={C.line} />
      <T x={180} y={53 + i * 32} s={11} a="start" c={C.mute}>{k}</T><T x={328} y={53 + i * 32} s={12} a="end" w={700}>{v}</T></g>)}
    <T x={180} y={218} s={11} c={C.mute}>Vài con số tóm tắt hàng trăm giá trị</T>
  </>,
  'Trung tâm: trung bình và median': () => <>
    <Hist x={30} y={40} w={300} h={130} v={[0.55, 1, 0.85, 0.6, 0.4, 0.28, 0.18, 0.12, 0.08, 0.06, 0.04, 0.03, 0.05, 0.02]} />
    <line x1={102} x2={102} y1={34} y2={172} stroke={C.ink} strokeWidth="2.5" /><T x={102} y={28} s={11} w={700}>median</T>
    <line x1={134} x2={134} y1={44} y2={172} stroke={C.bad} strokeWidth="2.5" strokeDasharray="6 4" /><T x={150} y={42} s={11} w={700} c={C.bad} a="start">trung bình</T>
    <Arrow x1={210} y1={130} x2={300} y2={130} c={C.b} /><T x={256} y={122} s={10} c={C.b}>đuôi dài kéo trung bình</T>
    <T x={180} y={200} s={11.5} w={650}>Lệch phải: trung bình &gt; median</T>
    <T x={180} y={218} s={10.5} c={C.mute}>Median bền với ngoại lai hơn trung bình</T>
  </>,
  'Độ phân tán: độ lệch chuẩn và IQR': () => {
    const X = (v: number) => 40 + v * 2.8;
    return <>
      <line x1={X(5)} x2={X(30)} y1={100} y2={100} stroke={C.mute} strokeWidth="2" /><line x1={X(70)} x2={X(88)} y1={100} y2={100} stroke={C.mute} strokeWidth="2" />
      <line x1={X(5)} x2={X(5)} y1={88} y2={112} stroke={C.mute} strokeWidth="2" /><line x1={X(88)} x2={X(88)} y1={88} y2={112} stroke={C.mute} strokeWidth="2" />
      <rect x={X(30)} y={76} width={X(70) - X(30)} height={48} fill={C.soft} stroke={C.a} strokeWidth="2" rx="3" />
      <line x1={X(46)} x2={X(46)} y1={76} y2={124} stroke={C.ink} strokeWidth="3" />
      <circle cx={X(96)} cy={100} r={5} fill={C.b} /><circle cx={X(99)} cy={100} r={5} fill={C.b} />
      <T x={X(30)} y={66} s={10.5} w={650}>Q1</T><T x={X(46)} y={66} s={10.5} w={650}>median</T><T x={X(70)} y={66} s={10.5} w={650}>Q3</T>
      <T x={X(97)} y={86} s={10} c={C.b} w={650}>ngoại lai</T>
      <line x1={X(30)} x2={X(70)} y1={140} y2={140} stroke={C.a} strokeWidth="2" /><line x1={X(30)} x2={X(30)} y1={134} y2={146} stroke={C.a} strokeWidth="2" /><line x1={X(70)} x2={X(70)} y1={134} y2={146} stroke={C.a} strokeWidth="2" />
      <T x={X(50)} y={160} s={11} w={700} c={C.a2}>IQR = Q3 − Q1 (50% ở giữa)</T>
      <T x={180} y={200} s={11} c={C.mute}>Râu: tới giá trị xa nhất trong 1,5·IQR</T>
      <T x={180} y={218} s={11} c={C.mute}>σ: khoảng cách trung bình tới trung bình</T>
    </>;
  },
  'Hình dạng phân bố': () => <>
    {[['Đối xứng', bell(9, 0.5, 0.18)], ['Lệch phải', [0.5, 1, 0.8, 0.5, 0.3, 0.18, 0.1, 0.06, 0.03]], ['Hai đỉnh', [0.2, 0.7, 1, 0.5, 0.15, 0.4, 0.9, 0.7, 0.2]]].map(([t, v], i) => <g key={t as string}>
      <rect x={10 + i * 116} y={40} width={108} height={130} rx="10" fill={C.bg} stroke={C.line} />
      <Hist x={20 + i * 116} y={56} w={88} h={80} v={v as number[]} c={i === 2 ? C.b : C.a} />
      <T x={64 + i * 116} y={156} s={11.5} w={700}>{t as string}</T></g>)}
    <T x={180} y={200} s={11} c={C.mute}>Hai đỉnh thường gợi ý hai nhóm khác nhau</T>
    <T x={180} y={218} s={11} c={C.mute}>Lệch mạnh: cân nhắc biến đổi log</T>
  </>,
  'Biến phân loại: đếm tần suất': () => <>
    {[['Nam', 0.9], ['Nữ', 0.75], ['Khác', 0.12]].map(([t, v], i) => <g key={t as string}>
      <T x={70} y={74 + i * 46} s={12} a="end" w={650}>{t as string}</T>
      <rect x={80} y={58 + i * 46} width={(v as number) * 180} height={24} rx="5" fill={[C.a, C.b, C.mute][i]} />
      <T x={86 + (v as number) * 180} y={75 + i * 46} s={11} a="start" c={C.mute}>{[412, 340, 16][i]} · {[54, 44, 2][i]}%</T></g>)}
    <T x={180} y={210} s={11} c={C.mute}>Mức hiếm (2%) dễ bị gộp hoặc thiếu khi chia train/test</T>
  </>,
  'Quan hệ hai biến: tương quan': () => <>
    {[['r ≈ 0,8', 1], ['r ≈ 0', 0], ['r ≈ −0,8', -1]].map(([t, s], i) => {
      const noise = [0.08, -0.12, 0.15, -0.05, 0.1, -0.15, 0.02, 0.12, -0.1, 0.06, -0.08, 0.14, -0.02, 0.09, -0.13, 0.04];
      const flat = [0.2, 0.75, 0.45, 0.9, 0.15, 0.6, 0.35, 0.8, 0.1, 0.5, 0.7, 0.3, 0.95, 0.25, 0.55, 0.4];
      const pts = Array.from({ length: 16 }, (_, k) => { const u = k / 15; return [u, s === 0 ? flat[k] : 0.5 + (s as number) * (u - 0.5) * 0.85 + noise[k]]; });
      return <g key={t as string}>
        <rect x={10 + i * 116} y={40} width={108} height={120} rx="10" fill={C.bg} stroke={C.line} />
        {pts.map(([u, v], k) => <circle key={k} cx={22 + i * 116 + u * 84} cy={146 - Math.max(0, Math.min(1, v)) * 92} r={3.5} fill={C.a} />)}
        <T x={64 + i * 116} y={182} s={12} w={700}>{t as string}</T></g>;
    })}
    <T x={180} y={218} s={11} c={C.mute}>Tương quan đo quan hệ tuyến tính — không phải nhân quả</T>
  </>,
  'So sánh theo nhóm': () => <>
    <Hist x={30} y={40} w={300} h={120} v={bell(14, 0.35, 0.13)} c={C.a} o={0.55} />
    <Hist x={30} y={40} w={300} h={120} v={bell(14, 0.62, 0.15, 0.75)} c={C.b} o={0.55} />
    <rect x={40} y={176} width={12} height={12} fill={C.a} /><T x={58} y={186} s={11} a="start">Outcome = 0</T>
    <rect x={160} y={176} width={12} height={12} fill={C.b} /><T x={178} y={186} s={11} a="start">Outcome = 1</T>
    <T x={180} y={216} s={11} c={C.mute}>Hai phân bố tách nhau → biến có ích cho phân loại</T>
  </>,
  'Kiểm tra chất lượng dữ liệu': () => <>
    {[['Ô thiếu', '0,0%', C.ok], ['Dòng trùng lặp', '0', C.ok], ['Cột giống mã ID', 'không', C.ok], ['0 nghi là thiếu', '5 cột', C.b], ['Lệch mạnh', 'Insulin', C.b]].map(([k, v, c], i) => <g key={k}>
      <rect x={40} y={30 + i * 36} width={280} height={28} rx="7" fill="#fff" stroke={C.line} />
      <circle cx={58} cy={44 + i * 36} r={7} fill={c} /><T x={58} y={48 + i * 36} s={10} c="#fff" w={800}>{c === C.ok ? '✓' : '!'}</T>
      <T x={74} y={48 + i * 36} s={11.5} a="start">{k}</T><T x={308} y={48 + i * 36} s={11.5} a="end" w={700} c={c}>{v}</T></g>)}
    <T x={180} y={222} s={11} c={C.mute}>Phát hiện ở đây → xử lý ở bài Tiền xử lý</T>
  </>,
};

export function SlideFigure({ title }: { title: string }): ReactNode | null {
  const f = FIG[title];
  return f ? <svg className="slide-figure" viewBox="0 0 360 240" role="img" aria-label={`Minh họa: ${title}`}>{f()}</svg> : null;
}
