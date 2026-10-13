import { useEffect, useMemo, useRef, useState } from 'react';
import { guessTarget, inspectColumns, parseFreeCsv } from '../../core/datasets/freecsv';
import { getSessionData, setSessionData, useSessionData } from '../../core/datasets/session';
import { DataImport } from '../../app/DataImport';
import { Field } from '../../app/ui';
import { DataProfile } from './DataProfile';

/** EDA and lab routes share the same explicitly confirmed session table. */
export function EdaLab() {
  const data = useSessionData();
  const [err, setErr] = useState('');
  const [targetChoice, setTargetChoice] = useState<{ id: number; name: string } | null>(null);
  const cols = useMemo(() => data ? inspectColumns(data.table) : [], [data]);
  const target = targetChoice?.id === data?.id ? targetChoice?.name ?? '' : cols.length ? guessTarget(cols) : '';
  const controller = useRef<AbortController | null>(null);
  const loadDiabetes = async () => {
    controller.current?.abort();
    const request = new AbortController(); controller.current = request;
    const before = getSessionData(); setErr('');
    try {
      const response = await fetch('/datasets/diabetes.csv', { signal: request.signal });
      if (!response.ok) throw new Error('Không tải được dữ liệu mẫu.');
      const table = parseFreeCsv(await response.text());
      // An import confirmed while this request was pending must win.
      if (!request.signal.aborted && getSessionData() === before) setSessionData({ name: 'diabetes.csv', table, originalRows: table.cells.length, sampled: false });
    } catch (e) { if (!request.signal.aborted) setErr((e as Error).message); }
  };
  useEffect(() => { if (!getSessionData()) void loadDiabetes(); return () => controller.current?.abort(); }, []);
  return <div className="eda">
    <DataImport />
    <section className="box eda-bar">
      <button id="eda-sample" className="btn" onClick={() => void loadDiabetes()}>Dùng dữ liệu mẫu Pima</button>
      {data && <Field label="Cột đích / nhóm (để tô màu, so sánh)">
        <select value={target} onChange={e => setTargetChoice({ id: data.id, name: e.target.value })}>
          <option value="">(không)</option>
          {cols.map(c => <option key={c.name} value={c.name}>{c.name} · {c.kind === 'numeric' ? 'số' : 'chữ'} · {c.unique} giá trị</option>)}
        </select>
      </Field>}
      <p className="muted">{data && <>Đang xem <b>{data.name}</b>: {data.table.cells.length.toLocaleString('vi')} dòng × {data.table.names.length} cột.{data.sampled && <> Đây là mẫu từ {data.originalRows.toLocaleString('vi')} dòng; thống kê không đại diện chính xác toàn bộ tệp.</>}</>}</p>
      {err && <p className="warn" role="alert">{err}</p>}
    </section>
    {!data && !err && <p className="loading">Đang tải dữ liệu mẫu…</p>}
    {data && <DataProfile key={data.id} table={data.table} cols={cols} target={target} fileName={data.name} />}
  </div>;
}
