import { useMemo, useState } from 'react';
import { conv2d, IMAGES, KERNELS, pool, relu, type Grid } from '../../core/algorithms/conv';
import { Field, Table } from '../../app/ui';

export function Heat({ g, label, onCell, mark }: { g: Grid; label: string; onCell?: (y: number, x: number) => void; mark?: [number, number] }) {
  const flat = g.flat(), max = Math.max(...flat.map(Math.abs), 1e-9);
  return (
    <figure style={{ margin: 0 }}>
      <table className="grid" aria-label={label}><tbody>{g.map((r, y) => <tr key={y}>{r.map((v, x) => (
        <td key={x} onClick={() => onCell?.(y, x)} style={{ background: v >= 0 ? `rgba(31,111,235,${Math.abs(v) / max})` : `rgba(217,72,15,${Math.abs(v) / max})`, outline: mark && mark[0] === y && mark[1] === x ? '3px solid currentColor' : undefined, cursor: onCell ? 'pointer' : 'default' }}>
          {Number.isInteger(v) ? v : v.toFixed(2)}</td>))}</tr>)}</tbody></table>
      <figcaption className="muted">{label} ({g.length}×{g[0].length}); xanh = dương, cam = âm</figcaption>
    </figure>
  );
}

export function CnnLab() {
  const [imgName, setImgName] = useState('Chữ T');
  const [img, setImg] = useState<Grid>(IMAGES['Chữ T']);
  const [kName, setKName] = useState('Cạnh dọc (Sobel x)');
  const [ker, setKer] = useState<Grid>(KERNELS['Cạnh dọc (Sobel x)']);
  const [stride, setStride] = useState(1);
  const [pad, setPad] = useState(0);
  const [poolMode, setPoolMode] = useState<'max' | 'avg'>('max');
  const [step, setStep] = useState(0);

  const res = useMemo(() => {
    try {
      const c = conv2d(img, ker, stride, pad), r = relu(c);
      return { c, r, p: r.length >= 2 && r[0].length >= 2 ? pool(r, 2, 2, poolMode) : null, err: null as string | null };
    } catch (e) { return { c: null, r: null, p: null, err: (e as Error).message }; }
  }, [img, ker, stride, pad, poolMode]);

  const pos: [number, number] | undefined = res.c ? [Math.floor(step / res.c[0].length) % res.c.length, step % res.c[0].length] : undefined;
  const detail = useMemo(() => {
    if (!res.c || !pos) return null;
    const terms: string[] = []; let s = 0;
    for (let a = 0; a < ker.length; a++) for (let b = 0; b < ker[0].length; b++) {
      const y = pos[0] * stride - pad + a, x = pos[1] * stride - pad + b;
      const v = y < 0 || x < 0 || y >= img.length || x >= img[0].length ? 0 : img[y][x];
      if (v !== 0 && ker[a][b] !== 0) terms.push(`${v}×${Number(ker[a][b].toFixed(3))}`);
      s += v * ker[a][b];
    }
    return `Ô (${pos[0]}, ${pos[1]}): ${terms.join(' + ') || '0'} = ${Number(s.toFixed(4))}`;
  }, [res.c, pos, ker, img, stride, pad]);

  const table = { columns: ['Bước', 'Kích thước'], rows: [['Ảnh vào', `${img.length}×${img[0].length}`], ['Sau convolution', res.c ? `${res.c.length}×${res.c[0].length}` : 'lỗi'], ['Sau ReLU', res.r ? `${res.r.length}×${res.r[0].length}` : 'lỗi'], ['Sau pooling 2×2', res.p ? `${res.p.length}×${res.p[0].length}` : 'không áp dụng']] };
  const setCell = (g: Grid, y: number, x: number, v: number): Grid => g.map((r, i) => r.map((c, j) => (i === y && j === x ? v : c)));

  return (
    <div className="lab">
      <section className="controls">
        <div className="box">
          <Field label="Ảnh mẫu"><select value={imgName} onChange={(e) => { setImgName(e.target.value); setImg(IMAGES[e.target.value]); setStep(0); }}>{Object.keys(IMAGES).map((n) => <option key={n}>{n}</option>)}</select></Field>
          <Field label="Kernel 3×3"><select value={kName} onChange={(e) => { setKName(e.target.value); setKer(KERNELS[e.target.value]); }}>{Object.keys(KERNELS).map((n) => <option key={n}>{n}</option>)}</select></Field>
          <Field label={`Stride = ${stride}`}><input type="range" min={1} max={3} value={stride} onChange={(e) => { setStride(Number(e.target.value)); setStep(0); }} /></Field>
          <Field label={`Padding = ${pad}`}><input type="range" min={0} max={2} value={pad} onChange={(e) => { setPad(Number(e.target.value)); setStep(0); }} /></Field>
          <Field label="Pooling 2×2"><select value={poolMode} onChange={(e) => setPoolMode(e.target.value as 'max' | 'avg')}><option value="max">Max</option><option value="avg">Average</option></select></Field>
          <div className="row"><button onClick={() => setStep(Math.max(0, step - 1))}>Ô trước</button><button onClick={() => res.c && setStep((step + 1) % (res.c.length * res.c[0].length))}>Ô tiếp</button></div>
          <p className="muted">Bấm vào ô của ảnh để đổi 0/1. Công thức: đầu ra = ⌊(n + 2·padding − kernel)/stride⌋ + 1.</p>
        </div>
      </section>
      <section className="main">
        <p className="badge">Mô phỏng nguyên lý — kernel cố định, không huấn luyện</p>
        {res.err && <p role="alert" className="warn">{res.err}</p>}
        <div className="row" style={{ alignItems: 'flex-start', gap: 20 }}>
          <Heat g={img} label="Ảnh vào (bấm để đổi)" onCell={(y, x) => { setImg(setCell(img, y, x, img[y][x] ? 0 : 1)); setImgName('Tự vẽ'); }} />
          <Heat g={ker} label="Kernel" />
          {res.c && <Heat g={res.c} label="Feature map (convolution)" mark={pos} />}
          {res.p && <Heat g={res.p} label={`Sau ReLU + pooling ${poolMode}`} />}
        </div>
        {detail && <p className="node" role="status">{detail}</p>}
        <p>Kernel trượt trên ảnh: mỗi vị trí nhân từng cặp ô rồi cộng lại. Kernel cạnh dọc cho giá trị lớn chỗ ảnh đổi từ tối sang sáng theo chiều ngang. Tên "convolution" trong các framework thực chất là tương quan chéo (không lật kernel). Trong CNN thật, kernel được học từ dữ liệu.</p>
        <Table data={table} />
      </section>
    </div>
  );
}
