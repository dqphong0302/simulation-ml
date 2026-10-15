import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { chartToSvg } from '../core/reporting/chart';
import type { ChartSpec, TableData } from '../core/types';

export function Table({ data, caption }: { data: TableData; caption?: string }) {
  return (
    <div className="tbl-wrap"><table className="tbl">
      {caption && <caption>{caption}</caption>}
      <thead><tr>{data.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
      <tbody>{data.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
    </table></div>
  );
}

export function Chart({ spec }: { spec: ChartSpec }) {
  return (
    <figure className="chart">
      <div role="img" aria-label={`${spec.title}. Trục x: ${spec.xLabel}. Trục y: ${spec.yLabel}.`} dangerouslySetInnerHTML={{ __html: chartToSvg(spec) }} />
      <details>
        <summary>Bảng dữ liệu thay thế</summary>
        <Table data={{
          columns: [spec.xLabel, ...spec.series.map((s) => s.name)],
          rows: Array.from(new Set(spec.series.flatMap((s) => s.points.map((p) => p[0])))).sort((a, b) => a - b)
            .map((x) => [String(x), ...spec.series.map((s) => { const p = s.points.find((q) => q[0] === x); return p ? p[1].toFixed(3) : '–'; })]),
        }} />
      </details>
    </figure>
  );
}

export function ModeBadge({ mode, short }: { mode: string; short?: boolean }) {
  const cls = mode.startsWith('Mô phỏng') ? 'sim' : mode.startsWith('Suy luận') ? 'api' : 'real';
  const label = short
    ? (cls === 'sim' ? 'Mô phỏng' : cls === 'api' ? 'API' : 'Client')
    : mode;
  return <span className={`chip chip-${cls}`} title={mode}><span className="dot" />{label}</span>;
}

export function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

// ----- Thông báo nổi (toast) -----
interface ToastItem { id: number; text: string; sub?: string; href?: string }
let toasts: ToastItem[] = [];
let tid = 0;
const tsubs = new Set<() => void>();
const notify = () => tsubs.forEach((f) => f());
export function toast(text: string, sub?: string, href?: string): void {
  const id = ++tid;
  toasts = [...toasts, { id, text, sub, href }].slice(-4); notify();
  setTimeout(() => { toasts = toasts.filter((t) => t.id !== id); notify(); }, 3800);
}
export function Toasts() {
  const list = useSyncExternalStore((f) => { tsubs.add(f); return () => tsubs.delete(f); }, () => toasts);
  return (
    <div className="toasts" role="status" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className="toast">
          <span className="t-check" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
          <span><b>{t.text}</b>{t.sub && <small>{t.sub}</small>}</span>
          {t.href && <a href={t.href} className="t-link">Xem</a>}
        </div>
      ))}
    </div>
  );
}

/** Ô kết quả có hiệu ứng nháy nhẹ mỗi khi nội dung thay đổi. */
export function Flash({ children, className = 'result' }: { children: ReactNode; className?: string }) {
  const [k, setK] = useState(0);
  const text = typeof children === 'string' ? children : JSON.stringify(children, (_, v) => (v && v.$$typeof ? undefined : v));
  useEffect(() => { setK((x) => x + 1); }, [text]);
  return <p role="status" className={`${className} flash`} key={k}>{children}</p>;
}

