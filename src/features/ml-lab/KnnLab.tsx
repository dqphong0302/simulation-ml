import { useMemo, useState } from 'react';
import { Term } from '../../learning/Term';
import { knnPredict, knnPredictAll } from '../../core/algorithms/knn';
import { applyScaler } from '../../core/algorithms/dataset';
import { evaluate, fmt } from '../../core/algorithms/metrics';
import { Chart, Field, Table } from '../../app/ui';
import { Scatter } from '../../app/Scatter';
import type { LabData } from './useData';
import type { Label } from '../../core/algorithms/dataset';

const KS = [3, 5, 7, 9];
const STEPS = ['Chọn điểm mới', 'Tính khoảng cách tới mọi điểm train', 'Chọn k láng giềng gần nhất', 'Bỏ phiếu và dự đoán'];

export function KnnLab({ d }: { d: LabData }) {
  const [k, setK] = useState(3);
  const [scale, setScale] = useState(false);
  const [pick, setPick] = useState<[number, number] | null>(null);
  // Bấm vào biểu đồ chỉ đặt hai biến hiển thị; các biến còn lại lấy median của train.
  const query = useMemo(() => (pick ? [pick[0], pick[1], ...d.query0.slice(2)] : d.query0), [pick, d.query0]);
  const [step, setStep] = useState(0);
  const [guess, setGuess] = useState<Label | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  const space = scale ? d.scaled : d.split;
  const q = scale ? applyScaler(query, d.scaler) : query;
  const res = useMemo(() => knnPredict(space.train, q, k), [space, q, k]);
  const neighborIdx = res.neighbors.map((n) => n.index);

  const sweep = useMemo(() => KS.map((kk) => {
    const tr = evaluate(d.split.train.map((s) => s.y), knnPredictAll(space.train, space.train, kk));
    const va = evaluate(d.split.val.map((s) => s.y), knnPredictAll(space.train, space.val, kk));
    return { k: kk, tr, va };
  }), [d, space]);
  const best = sweep.reduce((a, b) => ((b.va.accuracy ?? 0) > (a.va.accuracy ?? 0) ? b : a));

  const table = { columns: ['k', 'Accuracy train', 'Accuracy validation', 'Precision val', 'Recall val', 'F1 val'],
    rows: sweep.map((r) => [String(r.k), fmt(r.tr.accuracy), fmt(r.va.accuracy), fmt(r.va.precision), fmt(r.va.recall), fmt(r.va.f1)]) };
  const chart = { title: `KNN: accuracy theo k (${scale ? 'đã chuẩn hóa' : 'chưa chuẩn hóa'})`, xLabel: 'k (số láng giềng)', yLabel: 'Accuracy',
    series: [{ name: 'Train', points: sweep.map((r) => [r.k, r.tr.accuracy ?? 0] as [number, number]) }, { name: 'Validation', points: sweep.map((r) => [r.k, r.va.accuracy ?? 0] as [number, number]) }] };

  const runTest = () => {
    const m = evaluate(d.split.test.map((s) => s.y), knnPredictAll(space.train, space.test, best.k));
    setTestResult(`k = ${best.k} (chọn theo validation): accuracy test = ${fmt(m.accuracy)}, precision = ${fmt(m.precision)}, recall = ${fmt(m.recall)}. Chỉ nên xem một lần ở bước cuối.`);
  };

  return (
    <div className="lab">
      <section className="controls">
        {d.panel}
        <div className="box">
          <Field label={<><Term k="k" /> = {k}</>}><input type="range" min={1} max={15} value={k} onChange={(e) => setK(Number(e.target.value))} /></Field>
          <label className="check"><input type="checkbox" checked={scale} onChange={(e) => setScale(e.target.checked)} /> <Term k="chuẩn hóa">Chuẩn hóa</Term> (fit trên train)</label>
          <p className="muted">Bấm vào biểu đồ để đặt điểm mới. Hiện tại: {d.ds.featureNames[0]} = {query[0].toFixed(1)}, {d.ds.featureNames[1]} = {query[1].toFixed(1)}{d.ds.featureNames.length > 2 ? '; các biến khác = median train' : ''}.</p>
        </div>
        <div className="box">
          <strong>Dự đoán trước khi xem</strong>
          <div className="row">
            {d.ds.classNames.map((n, i) => (
              <button key={n} className={guess === i ? 'primary' : ''} aria-pressed={guess === i} onClick={() => setGuess(i as Label)}>{n}</button>
            ))}
          </div>
          <div className="row">
            <button disabled={step === 0} onClick={() => setStep(step - 1)}>Lùi</button>
            <button disabled={step === STEPS.length - 1} onClick={() => setStep(step + 1)}>Bước tiếp</button>
            <button onClick={() => { setStep(0); setGuess(null); }}>Đặt lại</button>
          </div>
        </div>
      </section>

      <section className="main">
        <Scatter points={d.split.train} names={d.ds.classNames} featureNames={d.ds.featureNames} query={query} bounds={d.bounds}
          highlight={step >= 2 ? neighborIdx : []} predicted={step >= 3 ? res.label : undefined} onPick={(x) => { setPick([x[0], x[1]]); setStep(0); }} />
        <ol className="steps">{STEPS.map((s, i) => <li key={s} className={i === step ? 'cur' : i < step ? 'done' : ''}>{s}</li>)}</ol>
        {step >= 1 && (
          <Table caption={`Khoảng cách Euclid trong không gian ${scale ? 'đã chuẩn hóa' : 'gốc'} — ${step >= 2 ? `${k} điểm gần nhất` : '5 điểm gần nhất'}`}
            data={{ columns: ['Hạng', 'Nhóm', 'Khoảng cách'], rows: res.neighbors.slice(0, step >= 2 ? k : 5).map((n, i) => [String(i + 1), d.ds.classNames[n.label], n.distance.toFixed(3)]) }} />
        )}
        {step >= 3 && (
          <p role="status" className="result">
            Phiếu: {d.ds.classNames[0]} {res.votes[0]} – {d.ds.classNames[1]} {res.votes[1]}
            {res.tieBroken ? ' (hòa, chọn nhãn của láng giềng gần nhất)' : ''} → <b>{d.ds.classNames[res.label]}</b>.
            {guess !== null && (guess === res.label ? ' Dự đoán của bạn đúng.' : ' Dự đoán của bạn khác kết quả — hãy thử đổi k hoặc chuẩn hóa.')}
          </p>
        )}
        <p className="muted">
          {scale ? 'Khi chuẩn hóa, hai biến có tầm ảnh hưởng tương đương lên khoảng cách.' : 'Khi chưa chuẩn hóa, biến có thang đo lớn hơn (ví dụ Glucose ~100 so với BMI ~30) lấn át khoảng cách.'}{' '}
          Biểu đồ 2D chỉ chiếu hai biến; khoảng cách được tính trên mọi biến đã chọn.
        </p>

        <h3>Thực nghiệm: k = 3, 5, 7, 9 trên cùng cách chia</h3>
        <Table data={table} />
        <Chart spec={chart} />
        <p>Theo validation, k tốt nhất: <b>{best.k}</b> (accuracy {fmt(best.va.accuracy)}). Hãy giải thích lựa chọn bằng kết quả validation, không bằng test.</p>
        <div className="row"><button onClick={runTest}>Đánh giá cuối trên tập test</button></div>
        {testResult && <p role="status" className="result">{testResult}</p>}

      </section>
    </div>
  );
}
