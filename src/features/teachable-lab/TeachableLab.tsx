import { useEffect, useRef, useState } from 'react';
import { Chart, Table } from '../../app/ui';
import { download } from '../../core/reporting/files';
import { canvasFromUrl, cropSquare, disposeImageModel, exportImageModel, loadImageRuntime, readImage, type EpochLog, type ImageModel, type Prediction } from './runtime';

interface Sample { id: string; url: string }
interface ImageClass { id: string; name: string; samples: Sample[] }
interface Run { labels: string[]; counts: number[]; epochs: number; learningRate: number; backend: string; history: EpochLog[] }
const makeClass = (name: string): ImageClass => ({ id: crypto.randomUUID(), name, samples: [] });
const MAX_SAMPLES = 60;

export function TeachableLab() {
  const [classes, setClasses] = useState<ImageClass[]>(() => [makeClass('Lớp A'), makeClass('Lớp B')]);
  const [epochs, setEpochs] = useState(10);
  const [learningRate, setLearningRate] = useState(0.001);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Thêm ít nhất 8 ảnh cho mỗi lớp để bắt đầu.');
  const [error, setError] = useState('');
  const [history, setHistory] = useState<EpochLog[]>([]);
  const [run, setRun] = useState<Run | null>(null);
  const [prediction, setPrediction] = useState<Prediction[]>([]);
  const [testImage, setTestImage] = useState('');
  const [camera, setCamera] = useState(false);
  const [cameraPending, setCameraPending] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const model = useRef<ImageModel | null>(null);
  const joined = useRef(false);
  const alive = useRef(true);
  const cancelled = useRef(false);
  const locked = useRef(false);
  const training = useRef(false);
  const cameraToken = useRef(0);

  const stopCamera = () => {
    cameraToken.current++;
    stream.current?.getTracks().forEach(t => t.stop()); stream.current = null;
    if (video.current) video.current.srcObject = null;
    setCamera(false); setCameraPending(false);
  };
  const clearModel = () => {
    disposeImageModel(model.current, joined.current); model.current = null; joined.current = false;
    setRun(null); setPrediction([]); setHistory([]); setTestImage('');
  };
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false; cancelled.current = true; cameraToken.current++;
      stream.current?.getTracks().forEach(t => t.stop());
      if (training.current && model.current?.trainingModel) model.current.trainingModel.stopTraining = true;
      if (!locked.current) { disposeImageModel(model.current, joined.current); model.current = null; }
    };
  }, []);
  const action = async (fn: () => Promise<void>) => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError('');
    try { await fn(); } catch (e) { if (alive.current) setError(e instanceof Error ? e.message : 'Thao tác chưa thành công.'); }
    finally {
      locked.current = false;
      if (alive.current) setBusy(false);
      else { disposeImageModel(model.current, joined.current); model.current = null; }
    }
  };
  const editClasses = (next: ImageClass[]) => { clearModel(); setClasses(next); setStatus('Dữ liệu đã thay đổi. Hãy huấn luyện lại trước khi dự đoán.'); };
  const addFiles = (classId: string, files: File[]) => action(async () => {
    const current = classes.find(c => c.id === classId)!;
    if (files.length + current.samples.length > MAX_SAMPLES) throw new Error(`Tối đa ${MAX_SAMPLES} ảnh/lớp. Hãy chọn ít ảnh hơn.`);
    const samples: Sample[] = [];
    for (const file of files) {
      const canvas = await readImage(file);
      if (!alive.current) return;
      samples.push({ id: crypto.randomUUID(), url: canvas.toDataURL('image/jpeg', 0.85) });
    }
    editClasses(classes.map(c => c.id === classId ? { ...c, samples: [...c.samples, ...samples] } : c));
  });
  const startCamera = async () => {
    const token = ++cameraToken.current; setCameraPending(true); setError('');
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Webcam cần HTTPS hoặc localhost và trình duyệt hỗ trợ.');
      const media = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
      if (!alive.current || token !== cameraToken.current) { media.getTracks().forEach(t => t.stop()); return; }
      stream.current = media;
      if (!video.current) throw new Error('Không mở được khung xem camera.');
      video.current.srcObject = media; await video.current.play();
      if (alive.current && token === cameraToken.current) setCamera(true);
    } catch (e) {
      if (alive.current && token === cameraToken.current) {
        stopCamera(); setError(e instanceof Error ? `Không mở được webcam: ${e.message}` : 'Không mở được webcam. Bạn vẫn có thể chọn ảnh từ máy.');
      }
    } finally { if (alive.current && token === cameraToken.current) setCameraPending(false); }
  };
  const capture = (classId: string) => {
    try {
      const v = video.current; if (!v || v.readyState < 2) throw new Error('Camera chưa có khung hình.');
      const current = classes.find(c => c.id === classId)!;
      if (current.samples.length >= MAX_SAMPLES) throw new Error('Lớp đã đủ 60 ảnh.');
      const url = cropSquare(v, v.videoWidth, v.videoHeight).toDataURL('image/jpeg', 0.85);
      editClasses(classes.map(c => c.id === classId ? { ...c, samples: [...c.samples, { id: crypto.randomUUID(), url }] } : c));
    } catch (e) { setError(e instanceof Error ? e.message : 'Không chụp được ảnh.'); }
  };
  const validNames = classes.every(c => c.name.trim()) && new Set(classes.map(c => c.name.trim().toLocaleLowerCase())).size === classes.length;
  const enough = classes.every(c => c.samples.length >= 8) && validNames;
  const train = () => action(async () => {
    if (!enough) throw new Error('Cần ít nhất 8 ảnh/lớp và tên lớp khác nhau, không bỏ trống.');
    clearModel(); cancelled.current = false; stopCamera();
    setStatus('Đang tải thư viện và MobileNet từ website này…');
    const rt = await loadImageRuntime();
    if (!alive.current || cancelled.current) return;
    const created = await rt.tmImage.createTeachable({ labels: classes.map(c => c.name.trim()), modelName: 'Lớp học AI — mô hình ảnh' },
      { checkpointUrl: `${location.origin}/models/mobilenet/model.json`, trainingLayer: 'conv_pw_13_relu' });
    model.current = created;
    if (!alive.current || cancelled.current) { disposeImageModel(created, false); model.current = null; return; }
    created.setLabels(classes.map(c => c.name.trim())); created.setSeed('classroom-42');
    let n = 0; const total = classes.reduce((sum,c) => sum+c.samples.length,0);
    for (let i = 0; i < classes.length; i++) for (const sample of classes[i].samples) {
      if (!alive.current || cancelled.current) { disposeImageModel(created, false); model.current = null; return; }
      await created.addExample(i, await canvasFromUrl(sample.url));
      setStatus(`Trích đặc trưng ảnh ${++n}/${total} · ${rt.tf.getBackend()}`); await rt.tf.nextFrame();
    }
    const logs: EpochLog[] = [];
    training.current = true;
    try {
      await created.train({ epochs, learningRate, batchSize: 8, denseUnits: 32 }, { onEpochEnd: async (epoch, log) => {
        logs.push({ ...log });
        if (alive.current) { setHistory([...logs]); setStatus(`Huấn luyện epoch ${epoch+1}/${epochs}`); }
        if (cancelled.current || !alive.current) if (created.trainingModel) created.trainingModel.stopTraining = true;
        await rt.tf.nextFrame();
      } });
      joined.current = true;
    } finally { training.current = false; }
    if (!alive.current || cancelled.current) { disposeImageModel(created, joined.current); model.current = null; joined.current = false; if (alive.current) setStatus('Đã dừng. Chưa công bố mô hình; bạn có thể huấn luyện lại.'); return; }
    setRun({ labels: classes.map(c => c.name.trim()), counts: classes.map(c => c.samples.length), epochs: logs.length, learningRate, backend: rt.tf.getBackend(), history: logs });
    setStatus('Huấn luyện xong. Hãy thử ảnh mới chưa dùng để huấn luyện.');
  });
  const predict = (getCanvas: () => Promise<HTMLCanvasElement>) => action(async () => {
    if (!model.current || !run) throw new Error('Hãy huấn luyện trước.');
    const canvas = await getCanvas(); const result = await model.current.predict(canvas);
    if (alive.current) { setTestImage(canvas.toDataURL('image/jpeg', 0.85)); setPrediction(result); }
  });
  const lossChart = { title: 'Loss theo epoch — train và validation nội bộ', xLabel: 'Epoch', yLabel: 'Loss', series: [
    { name: 'Train', points: history.flatMap((h,i) => Number.isFinite(h.loss) ? [[i+1,h.loss!] as [number,number]] : []) },
    { name: 'Validation', points: history.flatMap((h,i) => Number.isFinite(h.val_loss) ? [[i+1,h.val_loss!] as [number,number]] : []) },
  ] };
  const last = run?.history.at(-1);
  const pct = (n?: number) => Number.isFinite(n) ? `${(n!*100).toFixed(1)}%` : 'Chưa có';
  const table = { columns: ['Đại lượng', 'Giá trị'], rows: [
    ['Accuracy train (epoch cuối)', pct(last?.acc)], ['Accuracy validation nội bộ (epoch cuối)', pct(last?.val_acc)],
    ['Test độc lập', 'Chưa đánh giá; dự đoán một ảnh không phải accuracy'],
    ...prediction.map(p => [`Điểm dự đoán: ${p.className}`, pct(p.probability)]),
  ] };

  return <div className="teachable-lab">
    <div className="result"><strong>Huấn luyện thật, ngay trong trình duyệt.</strong> Dùng thư viện chính thức @teachablemachine/image + TensorFlow.js. Không iframe, không API key, không gửi ảnh/webcam lên máy chủ. Hiện hỗ trợ hình ảnh, chưa có âm thanh hoặc tư thế.</div>
    <div className="tm-workspace">
      <section className="tm-data">
        <h2>1. Dạy bằng ví dụ</h2>
        <p className="muted">2–5 lớp, 8–60 ảnh/lớp. Nên có nhiều góc, ánh sáng và nền khác nhau; tránh chụp liên tiếp những ảnh gần như giống hệt. Ảnh được cắt vuông ở giữa, 224 × 224.</p>
        <div className="box tm-camera">
          <video ref={video} muted playsInline aria-label="Xem trước webcam" hidden={!camera} />
          <div className="row">{camera || cameraPending ? <button id="tm-stop-camera" onClick={stopCamera}>Tắt webcam</button> : <button id="tm-start-camera" disabled={busy} onClick={() => void startCamera()}>Bật webcam</button>}</div>
          {cameraPending && <p role="status">Đang chờ quyền camera…</p>}
          <p className="muted">Webcam chỉ bật khi bạn cho phép; tắt khi rời bài hoặc bắt đầu huấn luyện. Không dùng ảnh người bệnh hay thông tin riêng tư.</p>
        </div>
        {classes.map((c,i) => <article className="box tm-class" key={c.id}>
          <div className="row"><label className="field"><span>Tên lớp {i+1}</span><input id={`tm-name-${i}`} maxLength={40} disabled={busy} value={c.name} onChange={e=>editClasses(classes.map(x=>x.id===c.id?{...x,name:e.target.value}:x))} /></label><span className="badge">{c.samples.length}/{MAX_SAMPLES} ảnh</span><button aria-label={`Xóa lớp ${i+1}`} disabled={busy || classes.length<=2} onClick={()=>editClasses(classes.filter(x=>x.id!==c.id))}>Xóa lớp</button></div>
          <label className="field"><span>Thêm ảnh cho lớp {i+1}</span><input id={`tm-files-${i}`} type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} onChange={e=>{ const files=Array.from(e.target.files??[]); e.target.value=''; if(files.length) void addFiles(c.id,files); }} /></label>
          {camera && <button disabled={busy || c.samples.length>=MAX_SAMPLES} onClick={()=>capture(c.id)}>Chụp vào lớp {i+1}</button>}
          <div className="tm-samples">{c.samples.map((s,j)=><div key={s.id}><img src={s.url} alt={`Mẫu ${j+1} của ${c.name}`} width="64" height="64"/><button disabled={busy} aria-label={`Xóa mẫu ${j+1} lớp ${i+1}`} onClick={()=>editClasses(classes.map(x=>x.id===c.id?{...x,samples:x.samples.filter(y=>y.id!==s.id)}:x))}>×</button></div>)}</div>
        </article>)}
        <button id="tm-add-class" disabled={busy || classes.length>=5} onClick={()=>editClasses([...classes,makeClass(`Lớp ${classes.length+1}`)])}>+ Thêm lớp</button>
      </section>
      <section className="tm-training">
        <h2>2. Huấn luyện</h2>
        <div className="box">
          <p>MobileNet trích đặc trưng; bạn huấn luyện lớp phân loại mới (transfer learning), không huấn luyện lại toàn bộ mạng.</p>
          <label className="field"><span>Số epoch</span><select id="tm-epochs" value={epochs} disabled={busy} onChange={e=>setEpochs(Number(e.target.value))}>{[5,10,20,30].map(n=><option key={n}>{n}</option>)}</select></label>
          <label className="field"><span>Learning rate</span><select id="tm-rate" value={learningRate} disabled={busy} onChange={e=>setLearningRate(Number(e.target.value))}>{[0.0001,0.001,0.01].map(n=><option key={n}>{n}</option>)}</select></label>
          <p className="muted">Thư viện giữ khoảng 15% ảnh mỗi lớp làm validation (làm tròn lên). Đây không phải test độc lập; ảnh gần trùng có thể làm điểm số quá lạc quan.</p>
          {!validNames && <p className="warn">Tên lớp phải khác nhau và không để trống.</p>}
          <div className="row"><button id="tm-train" className="primary" disabled={busy || !enough} onClick={()=>void train()}>Huấn luyện mô hình</button>{busy && <button id="tm-cancel" onClick={()=>{ cancelled.current=true; if(training.current && model.current?.trainingModel) model.current.trainingModel.stopTraining=true; setStatus('Đang dừng an toàn…'); }}>Dừng tác vụ</button>}</div>
          <p role="status" className="tm-status">{status}</p>
          {error && <p role="alert" className="warn">{error}</p>}
        </div>
        {history.length>0 && <Chart spec={lossChart}/>}
      </section>
      <section className="tm-preview">
        <h2>3. Thử và ghi nhận</h2>
        <div className="box">
          <label className="field"><span>Ảnh mới để dự đoán</span><input id="tm-test-file" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy || !run} onChange={e=>{ const file=e.target.files?.[0];e.target.value='';if(file) void predict(()=>readImage(file)); }}/></label>
          {camera && <button disabled={busy || !run} onClick={()=>void predict(async()=>{const v=video.current!;return cropSquare(v,v.videoWidth,v.videoHeight);})}>Dự đoán khung webcam</button>}
          {testImage && <img className="tm-test-image" src={testImage} alt="Ảnh đang dự đoán" width="224" height="224"/>}
          <div className="tm-predictions" aria-live="polite">{prediction.map(p=><div key={p.className}><span>{p.className} <b>{pct(p.probability)}</b></span><progress max={1} value={p.probability} aria-label={`Điểm ${p.className}`}/></div>)}</div>
          <p className="muted">Điểm softmax không phải độ chính xác hay bảo đảm mô hình đúng. Thử ảnh có nền mới để phát hiện việc học nhầm nền.</p>
          {run && <><Table data={table}/><button id="tm-export" disabled={busy} onClick={()=>void action(async()=>download(await exportImageModel(model.current!), 'teachable-image-model.zip'))}>Tải mô hình ZIP</button></>}
        </div>
      </section>
    </div>
    <p className="muted">Ảnh và mô hình chỉ giữ trong phiên bài này; chuyển tab bài giảng hoặc tải lại trang sẽ mất dữ liệu. Hãy tải mô hình và thêm kết quả vào bài làm trước khi rời trang. Website không lưu ảnh vào báo cáo.</p>
    <details className="box"><summary>Bài tập gợi ý và thư viện sử dụng</summary><p>Phân biệt hai đồ vật thông thường. Huấn luyện bằng nhiều góc chụp, thử nền mới và ghi lại trường hợp sai. Nộp đường loss, số mẫu, cấu hình, nhận xét về lệch dữ liệu và giới hạn. Mô hình ZIP là tùy chọn, không chứa ảnh gốc.</p><p>Giao diện do dự án xây dựng; phần học và suy luận dùng thư viện Apache-2.0 của Google Creative Lab, không phải bản sao đầy đủ hay sản phẩm được Google bảo trợ. <a href="https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image" target="_blank" rel="noopener noreferrer">Mã nguồn thư viện</a>.</p></details>
  </div>;
}
