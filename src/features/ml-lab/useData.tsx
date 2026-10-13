import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  fitScaler, makeSyntheticDataset, scaleSamples, splitDataset, describe,
  type Dataset, type Sample, type Scaler, type Split,
} from '../../core/algorithms/dataset';
import { PIMA, parseLabelledCsv, type RawTable } from '../../core/datasets/csv';
import { labelCandidates, makeCustomCsv, patchCustomCsv, toBinaryRaw, type CustomCsv } from '../../core/datasets/customCsv';
import { sampleTable, modelLimitsFor } from '../../core/datasets/importData';
import { setSessionData, useSessionData } from '../../core/datasets/session';
import { DataImport } from '../../app/DataImport';
import { Field } from '../../app/ui';

export const N_SAMPLES = 240;
export type Source = 'diabetes' | 'synthetic' | 'custom';

export interface LabData {
  source: Source;
  /** Mô tả nguồn dữ liệu (tên tệp, cột nhãn, xử lý 0). */
  dataLabel: string;
  seed: number;
  ds: Dataset;           // featureNames = các biến đang dùng cho mô hình
  split: Split;          // đã điền thiếu bằng median của train
  scaler: Scaler;
  scaled: Split;
  bounds: { x: [number, number]; y: [number, number] };
  query0: number[];      // điểm mới mặc định (median của train)
  raw: RawTable | null;  // bảng đầy đủ, chưa xử lý (bộ diabetes hoặc CSV của bạn)
  trainRaw: Sample[] | null; // phần train của bảng gốc (đủ mọi biến, chưa đổi 0→thiếu), cùng cách chia với split
  zeroMissing: boolean;
  /** Các cột (tên gốc) mà giá trị 0 được coi là thiếu khi bật zeroMissing. */
  zeroCols: string[];
  /** Tên hiển thị của cột gốc. */
  label: (name: string) => string;
  panel: ReactNode;
}
export type DataState = { ready: false; message: string; panel: ReactNode } | ({ ready: true } & LabData);

const medianOf = (v: number[]): number => describe(v).median ?? 0;

/** Điền thiếu bằng median của train rồi trả mẫu chỉ gồm các cột được chọn. */
export function imputeSelect(split: Split, cols: number[]): Split {
  const med = cols.map((c) => medianOf(split.train.map((s) => s.x[c]).filter((v) => !Number.isNaN(v))));
  const fix = (set: Sample[]) => set.map((s) => ({ y: s.y, x: cols.map((c, i) => (Number.isNaN(s.x[c]) ? med[i] : s.x[c])) }));
  return { train: fix(split.train), val: fix(split.val), test: fix(split.test) };
}

// Tải CSV một lần cho cả phiên; các trang sau dùng lại.
let pimaCache: RawTable | null = null;
let pimaPromise: Promise<RawTable> | null = null;
function loadPima(): Promise<RawTable> {
  pimaPromise ??= fetch(PIMA.url).then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))))
    .then((t) => (pimaCache = parseLabelledCsv(t, PIMA.label)))
    .catch((e) => { pimaPromise = null; throw e; });
  return pimaPromise;
}

const pimaLabel = (n: string) => PIMA.vi[n] ?? n;
const plain = (n: string) => n;

export function useData(opts: { fixed?: Source; seed?: number } = {}): DataState {
  const session = useSessionData();
  const { rows: trainRows, columns: trainColumns } = modelLimitsFor(location.hash.slice(1).split('?')[0]);
  const numericOnly = !opts.fixed && ['/data', '/ml/kmeans', '/ml/pca', '/ml/regression', '/dl/autoencoder', '/dl/vae'].includes(location.hash.slice(1).split('?')[0]);
  const prepared = useMemo(() => {
    if (!session || opts.fixed) return { data: null, error: '' };
    try { return { data: makeCustomCsv(session.name, session.table, !numericOnly), error: '' }; }
    catch (e) { return { data: null, error: (e as Error).message }; }
  }, [session, opts.fixed, numericOnly]);
  const [override, setOverride] = useState<{ id: number; data: CustomCsv } | null>(null);
  const shared = override && override.id === session?.id ? override.data : prepared.data;
  const setCustom = (data: CustomCsv) => { if (session) setOverride({ id: session.id, data }); };
  const updateSharedCsv = (patch: Parameters<typeof patchCustomCsv>[1]) => { if (shared) setCustom(patchCustomCsv(shared, patch)); };
  const [seed, setSeed] = useState(opts.seed ?? 42);
  const [source, setSource] = useState<Source>(opts.fixed ?? (session ? 'custom' : 'diabetes'));
  useEffect(() => { if (!opts.fixed && session) setSource('custom'); }, [session, opts.fixed]);
  const [raw, setRaw] = useState<RawTable | null>(pimaCache);
  const [error, setError] = useState<string | null>(null);
  const [zeroMissing, setZeroMissing] = useState(false);
  const [selected, setSelected] = useState<string[]>(['Glucose', 'BMI']);
  const src: Source = source;
  const tooLarge = !!session && session.table.cells.length > trainRows;
  const tooWide = !!shared && shared.features.length > trainColumns;

  useEffect(() => {
    if (src !== 'diabetes' || raw) return;
    let alive = true;
    loadPima()
      .then((t) => { if (alive) setRaw(t); })
      .catch((e: Error) => { if (alive) setError(`Không tải được diabetes.csv: ${e.message}`); });
    return () => { alive = false; };
  }, [src, raw]);

  const custom = useMemo(() => (src === 'custom' && shared && !tooLarge && !tooWide ? toBinaryRaw(shared) : null), [src, shared, tooLarge, tooWide]);

  const built = useMemo<Omit<LabData, 'panel'> | null>(() => {
    if (src === 'synthetic') {
      const ds = makeSyntheticDataset(N_SAMPLES, seed);
      const split = splitDataset(ds.samples, [6, 2, 2], seed);
      return finish(ds, split, 'synthetic', 'Mô phỏng tổng hợp', seed, null, false, [], null, plain);
    }
    const table = src === 'custom' ? custom?.raw ?? null : raw;
    if (!table || table.rows.length < 10) return null;
    const names = table.names;
    const want = src === 'custom' ? shared!.features : selected;
    const cols = want.map((n) => names.indexOf(n)).filter((i) => i >= 0);
    if (cols.length < 2) return null;
    if (!numericOnly && new Set(table.y).size < 2) return null;
    const zeroList = src === 'custom' ? custom!.zeroCols : PIMA.zeroMeansMissing;
    const zeroCols = new Set(zeroList.map((n) => names.indexOf(n)));
    const samples: Sample[] = table.rows.map((r, i) => ({ x: r, y: table.y[i] }));
    const rawSplit = splitDataset(samples, [6, 2, 2], seed); // chia trước, xử lý thiếu sau để tránh rò rỉ
    const mark = (set: Sample[]) => set.map((s) => ({ y: s.y, x: s.x.map((v, j) => (zeroMissing && zeroCols.has(j) && v === 0 ? NaN : v)) }));
    const split = imputeSelect({ train: mark(rawSplit.train), val: mark(rawSplit.val), test: mark(rawSplit.test) }, cols);
    const label = src === 'custom' ? plain : pimaLabel;
    const pos = shared?.positive ?? '';
    const ds: Dataset = {
      featureNames: cols.map((c) => label(names[c])),
      classNames: src === 'custom' ? numericOnly ? ['Dữ liệu', 'Dữ liệu'] : [`Nhóm xanh (${shared!.target} ≠ ${pos})`, `Nhóm cam (${shared!.target} = ${pos})`] : ['Nhóm xanh (Outcome 0)', 'Nhóm cam (Outcome 1)'],
      samples: [...split.train, ...split.val, ...split.test],
    };
    const dataLabel = src === 'custom'
      ? `Dữ liệu của bạn: ${shared!.name} (${numericOnly ? 'dùng các biến số, không dùng nhãn phân loại' : `nhãn: ${shared!.target} = ${pos} là lớp 1`})${zeroMissing && zeroList.length ? `, 0→thiếu ở ${zeroList.join(', ')}` : ''}`
      : `Pima diabetes${zeroMissing ? ', 0→thiếu→median train' : ''}`;
    return finish(ds, split, src, dataLabel, seed, table, zeroMissing, zeroList, rawSplit.train, label);
  }, [src, seed, raw, custom, shared, selected, zeroMissing, numericOnly]);

  const tCol = shared?.cols.find((c) => c.name === shared.target);
  const panel = (
    <div className="box">
      {!opts.fixed && (
        <Field label="Bộ dữ liệu">
          <select value={src} onChange={(e) => setSource(e.target.value as Source)}>
            {session && <option value="custom">Dữ liệu của bạn: {session.name}</option>}
            <option value="diabetes">Pima diabetes (768 mẫu thật, 8 biến)</option>
            <option value="synthetic">Mô phỏng tổng hợp (2 biến)</option>
          </select>
        </Field>
      )}
      {!opts.fixed && <DataImport />}
      {src === 'custom' && prepared.error && <p className="warn" role="alert">Dữ liệu không phù hợp với bài này: {prepared.error} Bạn vẫn có thể <a href="#/eda?tab=lab">khám phá dữ liệu</a>. Chưa hỗ trợ tự động mọi kiểu nhãn/biến.</p>}
      {src === 'custom' && tooLarge && session && <div className="warn"><p>Bài mô hình giới hạn {trainRows} dòng để giảm tải tính toán. Dữ liệu phiên hiện có {session.table.cells.length} dòng.</p><button className="btn" onClick={() => setSessionData({ ...session, table: sampleTable(session.table, trainRows), sampled: true })}>Đồng ý lấy mẫu {trainRows.toLocaleString('vi')} dòng cho phiên (seed 42)</button></div>}
      {src === 'custom' && tooWide && <p className="warn" role="alert">Chỉ chọn tối đa {trainColumns} biến bên dưới trước khi chạy mô hình.</p>}
      {src === 'custom' && custom?.dropped ? <p className="warn">Loại {custom.dropped} dòng thiếu nhãn khỏi mô hình; các dòng gốc vẫn còn trong dữ liệu phiên.</p> : null}
      <Field label="Seed (cách chia)">
        <input type="number" value={seed} onChange={(e) => setSeed(Math.max(0, Math.floor(Number(e.target.value) || 0)))} />
      </Field>
      {src === 'custom' && shared && (
        <>
          {!numericOnly && <Field label="Cột nhãn">
            <select value={shared.target} onChange={(e) => updateSharedCsv({ target: e.target.value })}>
              {labelCandidates(shared.cols).map((c) => <option key={c.name} value={c.name}>{c.name} ({c.unique} giá trị)</option>)}
            </select>
          </Field>}
          {tCol && <Field label={tCol.unique > 2 ? `Lớp dương (= 1); các lớp khác gộp thành 0` : 'Lớp dương (= 1)'}>
            <select value={shared.positive} onChange={(e) => updateSharedCsv({ positive: e.target.value })}>
              {tCol.levels.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </Field>}
          <fieldset className="fs"><legend>Biến số dùng cho mô hình (≥ 2; hai biến đầu là trục biểu đồ)</legend>
            {shared.cols.filter(c => c.kind === 'numeric' && c.name !== shared.target).map(c => c.name).map((n) => (
              <label className="check" key={n}>
                <input type="checkbox" checked={shared.features.includes(n)} onChange={(e) => updateSharedCsv({ features: e.target.checked ? [...shared.features, n] : shared.features.length > 2 ? shared.features.filter((x) => x !== n) : shared.features })} />
                {n}
              </label>
            ))}
          </fieldset>
          {!!custom?.zeroCols.length && <label className="check"><input type="checkbox" checked={zeroMissing} onChange={(e) => setZeroMissing(e.target.checked)} /> Coi 0 là thiếu ở {custom.zeroCols.join(', ')} (điền median train)</label>}
          {!!custom?.dropped && <p className="muted">Bỏ {custom.dropped} dòng thiếu nhãn.</p>}
          {shared.features.length < 2 && <p className="warn">Cần ít nhất 2 biến số cho bài này.</p>}
        </>
      )}
      {src === 'diabetes' && raw && (
        <>
          <fieldset className="fs"><legend>Biến dùng cho mô hình (≥ 2; hai biến đầu là trục biểu đồ)</legend>
            {raw.names.map((n) => (
              <label className="check" key={n}>
                <input type="checkbox" checked={selected.includes(n)} onChange={(e) => setSelected((s) => (e.target.checked ? [...s, n] : s.length > 2 ? s.filter((x) => x !== n) : s))} />
                {PIMA.vi[n] ?? n}
              </label>
            ))}
          </fieldset>
          <label className="check"><input type="checkbox" checked={zeroMissing} onChange={(e) => setZeroMissing(e.target.checked)} /> Coi giá trị 0 ở Glucose, huyết áp, nếp da, Insulin, BMI là thiếu (điền median của train)</label>
        </>
      )}
      <p className="muted">
        {built ? `${built.split.train.length + built.split.val.length + built.split.test.length} mẫu, chia 60/20/20 → train ${built.split.train.length}, validation ${built.split.val.length}, test ${built.split.test.length}. ` : ''}
        {src === 'diabetes' ? 'Dữ liệu Pima Indians Diabetes dùng cho học tập; kết quả không phải chẩn đoán.' : src === 'custom' ? numericOnly ? 'Dùng các biến số, không yêu cầu nhãn phân loại.' : 'Bài này phân loại 2 lớp: lớp dương so với phần còn lại.' : 'Dữ liệu mô phỏng cho học tập.'}
        {src !== 'synthetic' && built && built.ds.featureNames.length > 2 ? ' Biểu đồ 2D chỉ chiếu hai biến đầu; mô hình dùng tất cả biến đã chọn.' : ''}
      </p>
    </div>
  );

  if (!built) {
    const msg = error ?? (src === 'custom'
      ? (prepared.error || (tooLarge ? 'Cần xác nhận lấy mẫu trước khi chạy mô hình.' : tooWide ? `Hãy chọn tối đa ${trainColumns} biến.` : custom && custom.raw.rows.length < 10 ? 'Cần ít nhất 10 dòng hợp lệ để chia train/validation/test.' : custom && !numericOnly && new Set(custom.raw.y).size < 2 ? 'Cột nhãn chỉ có một lớp sau khi gộp — hãy chọn lớp dương khác.' : 'Hãy chọn ít nhất 2 biến số.'))
      : src === 'diabetes' && raw ? 'Hãy chọn ít nhất 2 biến.' : 'Đang tải dữ liệu…');
    return { ready: false, message: msg, panel };
  }
  return { ready: true, ...built, panel };
}

function finish(ds: Dataset, split: Split, source: Source, dataLabel: string, seed: number, raw: RawTable | null, zeroMissing: boolean, zeroCols: string[], trainRaw: Sample[] | null, label: (n: string) => string): Omit<LabData, 'panel'> {
  const scaler = fitScaler(split.train); // chỉ fit trên train
  const scaled = { train: scaleSamples(split.train, scaler), val: scaleSamples(split.val, scaler), test: scaleSamples(split.test, scaler) };
  const all = [...split.train, ...split.val, ...split.test];
  const xs = all.map((s) => s.x[0]), ys = all.map((s) => s.x[1]);
  const pad = (lo: number, hi: number) => { const p = (hi - lo) * 0.05 || 1; return [lo - p, hi + p] as [number, number]; };
  const query0 = ds.featureNames.map((_, j) => medianOf(split.train.map((s) => s.x[j])));
  return { source, dataLabel, seed, ds, split, scaler, scaled, bounds: { x: pad(Math.min(...xs), Math.max(...xs)), y: pad(Math.min(...ys), Math.max(...ys)) }, query0, raw, zeroMissing, zeroCols, trainRaw, label };
}
