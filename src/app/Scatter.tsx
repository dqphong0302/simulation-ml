import type { Label, Sample } from '../core/algorithms/dataset';

interface Props {
  points: Sample[];
  names: [string, string];
  featureNames: string[];
  query?: number[];
  highlight?: number[]; // chỉ số trong `points`
  onPick?: (x: number[]) => void;
  bounds: { x: [number, number]; y: [number, number] };
  predicted?: Label;
}

const W = 560, H = 380, M = { l: 52, r: 12, t: 12, b: 44 };
const COLOR = ['#2563eb', '#dc6a0b'];

/** Nhóm phân biệt bằng cả màu lẫn hình (tròn / tam giác), không chỉ dựa vào màu. */
export function Scatter({ points, names, featureNames, query, highlight = [], onPick, bounds, predicted }: Props) {
  const X = (v: number) => M.l + ((v - bounds.x[0]) / (bounds.x[1] - bounds.x[0])) * (W - M.l - M.r);
  const Y = (v: number) => H - M.b - ((v - bounds.y[0]) / (bounds.y[1] - bounds.y[0])) * (H - M.t - M.b);
  const click = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onPick) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W, py = ((e.clientY - r.top) / r.height) * H;
    onPick([
      bounds.x[0] + ((px - M.l) / (W - M.l - M.r)) * (bounds.x[1] - bounds.x[0]),
      bounds.y[0] + ((H - M.b - py) / (H - M.t - M.b)) * (bounds.y[1] - bounds.y[0]),
    ]);
  };
  const hl = new Set(highlight);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="scatter" onClick={click} role="img"
      aria-label={`Biểu đồ phân tán ${featureNames[0]} theo ${featureNames[1]}, ${points.length} điểm`}>
      <rect width={W} height={H} fill="var(--panel)" />
      <line x1={M.l} x2={M.l} y1={M.t} y2={H - M.b} stroke="currentColor" />
      <line x1={M.l} x2={W - M.r} y1={H - M.b} y2={H - M.b} stroke="currentColor" />
      {[0, 1, 2, 3, 4].map((i) => {
        const xv = bounds.x[0] + ((bounds.x[1] - bounds.x[0]) * i) / 4, yv = bounds.y[0] + ((bounds.y[1] - bounds.y[0]) * i) / 4;
        return <g key={i} fontSize="11" fill="currentColor">
          <text x={X(xv)} y={H - M.b + 16} textAnchor="middle">{xv.toFixed(0)}</text>
          <text x={M.l - 6} y={Y(yv) + 4} textAnchor="end">{yv.toFixed(0)}</text>
        </g>;
      })}
      <text x={(M.l + W - M.r) / 2} y={H - 8} textAnchor="middle" fontSize="12" fill="currentColor">{featureNames[0]}</text>
      <text transform={`translate(14 ${(M.t + H - M.b) / 2}) rotate(-90)`} textAnchor="middle" fontSize="12" fill="currentColor">{featureNames[1]}</text>
      {query && highlight.map((i) => (
        <line key={`l${i}`} x1={X(query[0])} y1={Y(query[1])} x2={X(points[i].x[0])} y2={Y(points[i].x[1])} stroke="currentColor" strokeDasharray="4 3" opacity="0.6" />
      ))}
      {points.map((p, i) => {
        const cx = X(p.x[0]), cy = Y(p.x[1]);
        const big = hl.has(i);
        return p.y === 0
          ? <circle key={i} cx={cx} cy={cy} r={big ? 7 : 3.5} fill={COLOR[0]} opacity={big ? 1 : 0.7} stroke={big ? 'currentColor' : 'none'} strokeWidth="2" />
          : <polygon key={i} points={`${cx},${cy - (big ? 8 : 4.5)} ${cx - (big ? 7 : 4)},${cy + (big ? 6 : 3.5)} ${cx + (big ? 7 : 4)},${cy + (big ? 6 : 3.5)}`}
              fill={COLOR[1]} opacity={big ? 1 : 0.7} stroke={big ? 'currentColor' : 'none'} strokeWidth="2" />;
      })}
      {query && <g>
        <rect x={X(query[0]) - 7} y={Y(query[1]) - 7} width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" transform={`rotate(45 ${X(query[0])} ${Y(query[1])})`} />
        <text x={X(query[0]) + 12} y={Y(query[1]) - 10} fontSize="12" fontWeight="bold" fill="currentColor">
          {predicted === undefined ? 'Điểm mới' : `Điểm mới → ${names[predicted]}`}
        </text>
      </g>}
      <g fontSize="12" fill="currentColor">
        <circle cx={W - 150} cy={20} r="4" fill={COLOR[0]} /><text x={W - 140} y={24}>{names[0]}</text>
        <polygon points={`${W - 150},${34} ${W - 154},${43} ${W - 146},${43}`} fill={COLOR[1]} /><text x={W - 140} y={43}>{names[1]}</text>
      </g>
    </svg>
  );
}
