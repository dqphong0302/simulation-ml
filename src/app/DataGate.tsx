import { Fragment, type ReactNode } from 'react';
import { useSessionData } from '../core/datasets/session';
import { useData, type LabData } from '../features/ml-lab/useData';

/** Giữ trạng thái dữ liệu, chỉ dựng phòng thí nghiệm khi dữ liệu đã sẵn sàng. */
export function DataGate({ render }: { render: (d: LabData) => ReactNode }) {
  const d = useData();
  const session = useSessionData();
  if (!d.ready) return <div className="lab"><section className="controls">{d.panel}</section><p role="status" className={d.message.startsWith("Đang") ? "loading" : "warn"}>{d.message}</p></div>;
  return <Fragment key={`${session?.id ?? 0}-${d.dataLabel}`}>{render(d)}</Fragment>;
}
