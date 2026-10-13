import { describe, expect, it } from 'vitest';
import { applyScaler, fitScaler, makeSyntheticDataset, splitDataset, type Sample } from '../src/core/algorithms/dataset';
import { knnPredict } from '../src/core/algorithms/knn';
import { evaluate, roc } from '../src/core/algorithms/metrics';
import { buildTree, treePredict } from '../src/core/algorithms/tree';
import { classify, logisticProba, trainLogistic } from '../src/core/algorithms/logistic';

const pts = (rows: [number, number, 0 | 1][]): Sample[] => rows.map(([a, b, y]) => ({ x: [a, b], y }));

describe('KNN', () => {
  const train = pts([[0, 0, 0], [0, 1, 0], [1, 0, 0], [5, 5, 1], [5, 6, 1], [6, 5, 1]]);
  it('bỏ phiếu theo láng giềng gần nhất', () => {
    expect(knnPredict(train, [0.5, 0.5], 3).label).toBe(0);
    expect(knnPredict(train, [5.5, 5.5], 3).label).toBe(1);
  });
  it('hòa phiếu chọn láng giềng gần nhất', () => {
    const r = knnPredict(train, [0.2, 0.2], 2);
    expect(r.votes).toEqual([2, 0]);
    const t = knnPredict(pts([[0, 0, 1], [2, 0, 0]]), [0.5, 0], 2);
    expect(t.tieBroken).toBe(true);
    expect(t.label).toBe(1);
  });
  it('k lớn hơn số mẫu thì dùng toàn bộ', () => {
    expect(knnPredict(train, [0, 0], 99).neighbors).toHaveLength(6);
  });
});

describe('chia dữ liệu và chuẩn hóa', () => {
  const ds = makeSyntheticDataset(200, 1);
  it('tái lập theo seed và không trùng giữa các tập', () => {
    const a = splitDataset(ds.samples, [6, 2, 2], 7);
    const b = splitDataset(ds.samples, [6, 2, 2], 7);
    expect(a.train.map((s) => s.x[0])).toEqual(b.train.map((s) => s.x[0]));
    expect(a.train.length + a.val.length + a.test.length).toBe(200);
    const all = new Set([...a.train, ...a.val, ...a.test]);
    expect(all.size).toBe(200);
  });
  it('scaler fit trên train cho mean≈0, std≈1', () => {
    const { train } = splitDataset(ds.samples, [6, 2, 2], 7);
    const sc = fitScaler(train);
    const z = train.map((s) => applyScaler(s.x, sc)[0]);
    expect(z.reduce((s, v) => s + v, 0) / z.length).toBeCloseTo(0, 6);
  });
  it('cột hằng không chia cho 0', () => {
    const sc = fitScaler(pts([[3, 1, 0], [3, 2, 1]]));
    expect(applyScaler([3, 1], sc)[0]).toBe(0);
  });
});

describe('chỉ số đánh giá', () => {
  it('confusion matrix và các chỉ số', () => {
    const m = evaluate([1, 1, 0, 0, 1, 0], [1, 0, 0, 1, 1, 0]);
    expect(m.confusion).toEqual({ tp: 2, fn: 1, tn: 2, fp: 1 });
    expect(m.accuracy).toBeCloseTo(4 / 6);
    expect(m.precision).toBeCloseTo(2 / 3);
    expect(m.recall).toBeCloseTo(2 / 3);
    expect(m.specificity).toBeCloseTo(2 / 3);
    expect(m.f1).toBeCloseTo(2 / 3);
  });
  it('mẫu số 0 trả null', () => {
    const m = evaluate([0, 0], [0, 0]);
    expect(m.precision).toBeNull();
    expect(m.recall).toBeNull();
    expect(m.f1).toBeNull();
  });
  it('AUC: hoàn hảo = 1, ngược = 0, một lớp = null', () => {
    expect(roc([0, 0, 1, 1], [0.1, 0.2, 0.8, 0.9])?.auc).toBeCloseTo(1);
    expect(roc([0, 0, 1, 1], [0.9, 0.8, 0.2, 0.1])?.auc).toBeCloseTo(0);
    expect(roc([1, 1], [0.3, 0.6])).toBeNull();
  });
});

describe('Decision Tree', () => {
  const rows = pts([[1, 0, 0], [2, 0, 0], [3, 0, 0], [7, 0, 1], [8, 0, 1], [9, 0, 1]]);
  it('tìm điểm chia hoàn hảo ở độ sâu 1', () => {
    const t = buildTree(rows, 1, 'gini');
    expect(t.feature).toBe(0);
    expect(t.threshold).toBeCloseTo(5);
    expect(treePredict(t, [2, 0])).toBe(0);
    expect(treePredict(t, [8, 0])).toBe(1);
  });
  it('độ sâu 0 là một lá', () => {
    expect(buildTree(rows, 0, 'entropy').left).toBeUndefined();
  });
});

describe('Logistic Regression', () => {
  it('học được dữ liệu tách tuyến tính và loss giảm', () => {
    const ds = makeSyntheticDataset(300, 3);
    const { train } = splitDataset(ds.samples, [8, 1, 1], 3);
    const sc = fitScaler(train);
    const z = train.map((s) => ({ x: applyScaler(s.x, sc), y: s.y }));
    const m = trainLogistic(z, 0.5, 300);
    expect(m.lossHistory[299]).toBeLessThan(m.lossHistory[0]);
    const pred = z.map((s) => classify(logisticProba(m, s.x), 0.5));
    expect(evaluate(z.map((s) => s.y), pred).accuracy!).toBeGreaterThan(0.8);
  });
});

import { forward, initMlp, meanLoss, trainEpoch } from '../src/core/algorithms/mlp';
import { bm25, buildContext, checkCitations, chunkDoc, cosine, fingerprint } from '../src/core/rag/rag';
import { checkEndpoint, redact } from '../src/core/security/url';
import { buildPayload, previewRequest, type ChatProfile } from '../src/core/providers/chat';
import { sceneAt, type Manifest } from '../src/core/narration/timeline';

describe('MLP', () => {
  it('gradient giải tích khớp gradient số', () => {
    const data = pts([[0.5, -1, 1], [-0.3, 0.8, 0], [1, 1, 1]]);
    const m = initMlp([2, 3, 1], 'tanh', 5);
    const before = JSON.parse(JSON.stringify(m));
    const lr = 1e-3;
    trainEpoch(m, data, lr);
    // Δw ≈ -lr * dL/dw ; so với sai phân hữu hạn cho một trọng số
    const eps = 1e-5;
    const probe = JSON.parse(JSON.stringify(before));
    probe.W[0][1][0] += eps; const lp = meanLoss(probe, data);
    probe.W[0][1][0] -= 2 * eps; const lm = meanLoss(probe, data);
    const numeric = (lp - lm) / (2 * eps);
    const analytic = (before.W[0][1][0] - m.W[0][1][0]) / lr;
    expect(analytic).toBeCloseTo(numeric, 4);
  });
  it('học XOR', () => {
    const xor = pts([[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 0]]);
    const m = initMlp([2, 6, 1], 'tanh', 2);
    let loss = 0;
    for (let i = 0; i < 4000; i++) loss = trainEpoch(m, xor, 0.8);
    expect(loss).toBeLessThan(0.1);
    expect(forward(m, [0, 1]).a[2][0]).toBeGreaterThan(0.5);
  });
});

describe('RAG', () => {
  const text = 'Tiểu đường là bệnh chuyển hóa.\n\nInsulin giúp hạ đường huyết.\n\nKNN là thuật toán láng giềng gần nhất.';
  it('chunk giữ vị trí nguồn và mã đoạn', () => {
    const cs = chunkDoc({ id: 'a', name: 'a.txt', text }, 1, 60, 10);
    expect(cs.length).toBeGreaterThan(1);
    expect(cs[0].id).toBe('D1-C1');
    cs.forEach((c) => expect(text.slice(c.start, c.end).trim()).toBe(c.text));
  });
  it('BM25 xếp đoạn liên quan lên đầu; truy vấn lạ trả rỗng', () => {
    const cs = chunkDoc({ id: 'a', name: 'a.txt', text }, 1, 40, 0);
    expect(bm25(cs, 'insulin đường huyết', 2)[0].chunk.text).toContain('Insulin');
    expect(bm25(cs, 'zzzz', 2)).toEqual([]);
  });
  it('cosine, fingerprint, kiểm tra trích dẫn', () => {
    expect(cosine([1, 0], [1, 0])).toBeCloseTo(1);
    expect(cosine([0, 0], [1, 0])).toBe(0);
    expect(fingerprint(['a', 1])).not.toBe(fingerprint(['a', 2]));
    const hits = bm25(chunkDoc({ id: 'a', name: 'a', text }, 1, 40, 0), 'insulin', 1);
    expect(buildContext(hits)).toContain(`[${hits[0].chunk.id}]`);
    const r = checkCitations(`ok [${hits[0].chunk.id}] và [D9-C9]`, hits);
    expect(r.found).toEqual([hits[0].chunk.id]);
    expect(r.invalid).toEqual(['D9-C9']);
  });
});

describe('Bảo mật cấu hình API', () => {
  it('từ chối URL nguy hiểm', () => {
    expect(checkEndpoint('http://example.com/v1').ok).toBe(false);
    expect(checkEndpoint('https://user:pw@example.com/v1').ok).toBe(false);
    expect(checkEndpoint('https://example.com/v1?key=abc').ok).toBe(false);
    expect(checkEndpoint('https://example.com/v1/').url).toBe('https://example.com/v1');
    expect(checkEndpoint('http://localhost:11434/v1').ok).toBe(true);
  });
  it('payload xem trước che key', () => {
    const p: ChatProfile = { label: 'x', baseUrl: 'https://api.example.com/v1', model: 'm', apiKey: 'sk-secret123', temperature: 0.5, topP: 1, maxTokens: 100, stream: false };
    const prev = previewRequest(p, [{ role: 'user', content: 'sk-secret123 hi' }]);
    expect(prev).not.toContain('sk-secret123');
    expect(prev).toContain('chat/completions');
    expect(JSON.stringify(buildPayload(p, []))).not.toContain('sk-secret123');
    expect(redact('Bearer abc.def', '')).toBe('Bearer ***');
  });
});

describe('Timeline thuyết minh', () => {
  const m: Manifest = { lessonId: 'x', voice: 'v', scenes: [
    { id: 'a', caption: '', audio: '', duration: 10, preset: { k: 3, scale: false, step: 0, query: [1, 1] } },
    { id: 'b', caption: '', audio: '', duration: 5, preset: { k: 3, scale: false, step: 1, query: [1, 1] } }] };
  it('tìm cảnh theo thời gian media', () => {
    expect(sceneAt(m, 0)).toEqual({ index: 0, offset: 0 });
    expect(sceneAt(m, 12)).toEqual({ index: 1, offset: 2 });
    expect(sceneAt(m, 99).index).toBe(1);
  });
});

import { describe as stat, histogram, makeCircles, pearson, quantile } from '../src/core/algorithms/dataset';
describe('Thống kê dữ liệu', () => {
  it('describe, quantile, pearson, histogram', () => {
    const s = stat([1, 2, 3, 4, null]);
    expect(s.missing).toBe(1); expect(s.mean).toBeCloseTo(2.5); expect(s.median).toBeCloseTo(2.5);
    expect(stat([null]).mean).toBeNull();
    expect(quantile([1, 2, 3, 4, 5], 0.5)).toBe(3);
    expect(pearson([1, 2, 3], [2, 4, 6])).toBeCloseTo(1);
    expect(pearson([1, 1, 1], [1, 2, 3])).toBeNull();
    expect(histogram([0, 1, 1, 2], 0, 2, 2).map((b) => b.count)).toEqual([1, 3]);
    expect(makeCircles(10, 1).samples).toHaveLength(10);
  });
});

import { readFileSync } from 'node:fs';
import { parseLabelledCsv, PIMA } from '../src/core/datasets/csv';
import { imputeSelect } from '../src/features/ml-lab/useData';
describe('Dữ liệu Pima diabetes', () => {
  const t = parseLabelledCsv(readFileSync('public/datasets/diabetes.csv', 'utf8'), 'Outcome');
  it('đọc đủ 768 dòng, 8 biến, 268 ca dương', () => {
    expect(t.rows).toHaveLength(768);
    expect(t.names).toHaveLength(8);
    expect(t.y.filter((y) => y === 1)).toHaveLength(268);
    expect(PIMA.zeroMeansMissing.every((n) => t.names.includes(n))).toBe(true);
  });
  it('NULL/rỗng → NaN, báo lỗi dòng sai', () => {
    expect(parseLabelledCsv('a,b,Outcome\n1,,0\n2,NULL,1', 'Outcome').rows[0][1]).toBeNaN();
    expect(() => parseLabelledCsv('a,Outcome\n1,2', 'Outcome')).toThrow(/nhãn/);
    expect(() => parseLabelledCsv('a,Outcome\nx,1', 'Outcome')).toThrow(/số/);
    expect(() => parseLabelledCsv('a,Outcome\n1,1,5', 'Outcome')).toThrow(/cột/);
  });
  it('điền thiếu bằng median của train, không dùng val/test', () => {
    const mk = (xs: number[], y: 0 | 1 = 0): Sample[] => xs.map((v) => ({ x: [v, 1], y }));
    const out = imputeSelect({ train: mk([1, 3, NaN, 5]), val: mk([NaN]), test: mk([1000]) }, [0, 1]);
    expect(out.train[2].x[0]).toBe(3);
    expect(out.val[0].x[0]).toBe(3);
  });
});

import { estimateTokens, sample, softmax, topP } from '../src/core/algorithms/sampling';
describe('Lấy mẫu token minh họa', () => {
  it('softmax tổng 1; temperature thấp nhọn hơn', () => {
    const lo = softmax([2, 1, 0], 0.2), hi = softmax([2, 1, 0], 2);
    expect(lo.reduce((a, b) => a + b)).toBeCloseTo(1);
    expect(lo[0]).toBeGreaterThan(hi[0]);
  });
  it('top-p cắt đuôi và chuẩn hóa lại', () => {
    const p = topP([0.5, 0.3, 0.15, 0.05], 0.8);
    expect(p[2]).toBe(0); expect(p[3]).toBe(0);
    expect(p.reduce((a, b) => a + b)).toBeCloseTo(1);
  });
  it('sample tái lập theo seed, tổng bằng n', () => {
    const a = sample([0.7, 0.3], 100, 3), b = sample([0.7, 0.3], 100, 3);
    expect(a).toEqual(b); expect(a[0] + a[1]).toBe(100);
    expect(estimateTokens('xin chào').words).toBe(2);
  });
});

import { csvToText } from '../src/core/rag/readers';
describe('Đọc tài liệu cho RAG', () => {
  it('CSV thành văn bản có tên cột', () => {
    expect(csvToText('a,b\n1,2')).toBe('Dòng 1: a: 1; b: 2');
  });
  it('PDF nhiều trang giữ số trang theo ranh giới \\f', () => {
    const text = 'Trang một nói về insulin.\fTrang hai nói về KNN.';
    const cs = chunkDoc({ id: 'p', name: 'x.pdf', text, paged: true }, 1, 200, 0);
    expect(cs.map((c) => c.page)).toEqual([1, 2]);
    expect(cs[1].text).toContain('KNN');
  });
});

import { conv2d, outSize, pool } from '../src/core/algorithms/conv';
import { attention, randomMat } from '../src/core/algorithms/attention';
describe('CNN: convolution và pooling', () => {
  it('công thức kích thước đầu ra', () => {
    expect(outSize(8, 3, 1, 0)).toBe(6); expect(outSize(8, 3, 1, 1)).toBe(8); expect(outSize(8, 3, 2, 1)).toBe(4);
  });
  it('tính đúng một ô và padding', () => {
    const img = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
    expect(conv2d(img, [[1, 0], [0, 1]], 1, 0)).toEqual([[6, 8], [12, 14]]);
    expect(conv2d(img, [[0, 0, 0], [0, 1, 0], [0, 0, 0]], 1, 1)).toEqual(img);
    expect(() => conv2d(img, [[1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1]], 1, 0)).toThrow();
  });
  it('pooling max và avg', () => {
    const g = [[1, 2, 3, 4], [5, 6, 7, 8], [1, 1, 1, 1], [1, 1, 1, 9]];
    expect(pool(g, 2, 2, 'max')).toEqual([[6, 8], [1, 9]]);
    expect(pool(g, 2, 2, 'avg')[0][0]).toBe(3.5);
  });
});
describe('Attention', () => {
  it('mỗi hàng trọng số tổng 1; causal che tương lai', () => {
    const X = randomMat(4, 6, 1), W = () => randomMat(6, 3, 2);
    const a = attention(X, W(), randomMat(6, 3, 3), randomMat(6, 3, 4), true);
    a.weights.forEach((r, i) => { expect(r.reduce((s, v) => s + v, 0)).toBeCloseTo(1); r.forEach((v, j) => { if (j > i) expect(v).toBe(0); }); });
    expect(a.weights[0][0]).toBeCloseTo(1);
    expect(a.out).toHaveLength(4);
  });
});

import { fitLine, forestProba, kmeans, pca, pcaProject, regMetrics, trainForest } from '../src/core/algorithms/ml_extra';
describe('ML mở rộng', () => {
  it('k-means tách hai cụm rõ và tái lập theo seed', () => {
    const X = [[0, 0], [0.1, 0], [0, 0.1], [10, 10], [10.1, 10], [10, 10.1]];
    const r = kmeans(X, 2, 1);
    expect(new Set(r.assign.slice(0, 3)).size).toBe(1); expect(r.assign[0]).not.toBe(r.assign[3]);
    expect(kmeans(X, 2, 1).assign).toEqual(r.assign);
    expect(r.inertia).toBeLessThan(0.1);
  });
  it('PCA: thành phần đầu theo hướng dữ liệu, tổng tỷ lệ = 1', () => {
    const X = Array.from({ length: 50 }, (_, i) => [i, 2 * i + (i % 2 ? 0.1 : -0.1)]);
    const m = pca(X);
    expect(m.ratio[0]).toBeGreaterThan(0.999);
    expect(m.ratio.reduce((a, b) => a + b)).toBeCloseTo(1);
    expect(Math.abs(m.components[0][1] / m.components[0][0])).toBeCloseTo(2, 1);
    expect(pcaProject(m, m.mean, 2)).toEqual([0, 0].map((v) => expect.closeTo(v, 8)));
  });
  it('hồi quy tuyến tính: đường chính xác, R²=1; cột hằng không chia 0', () => {
    const m = fitLine([1, 2, 3, 4], [3, 5, 7, 9]);
    expect(m.slope).toBeCloseTo(2); expect(m.intercept).toBeCloseTo(1);
    expect(regMetrics(m, [1, 2, 3, 4], [3, 5, 7, 9]).r2).toBeCloseTo(1);
    expect(fitLine([2, 2], [1, 3]).slope).toBe(0);
  });
  it('random forest học dữ liệu tách được', () => {
    const tr = pts([[1, 5, 0], [2, 4, 0], [3, 6, 0], [1.5, 5.5, 0], [8, 1, 1], [9, 2, 1], [7, 1.5, 1], [8.5, 2.5, 1]]);
    const f = trainForest(tr, 15, 3, 4);
    expect(forestProba(f, [1.5, 5])).toBeLessThan(0.5); expect(forestProba(f, [8.5, 2])).toBeGreaterThan(0.5);
  });
});

import { trainSvm, svmPredict } from '../src/core/algorithms/ml_extra';
import { alphaBar, initAe, noisify, trainAeEpoch } from '../src/core/algorithms/autoencoder';
describe('SVM, autoencoder, diffusion', () => {
  it('SVM tuyến tính tách được hai cụm', () => {
    const tr = pts([[-2, -2, 0], [-1.5, -2.5, 0], [-2.5, -1, 0], [2, 2, 1], [1.5, 2.5, 1], [2.5, 1, 1]]);
    const m = trainSvm(tr, 1, 400, 0.05);
    expect(tr.every((s) => svmPredict(m, s.x) === s.y)).toBe(true);
  });
  it('autoencoder giảm lỗi tái dựng trên dữ liệu gần một đường thẳng', () => {
    const X = Array.from({ length: 40 }, (_, i) => { const t = (i - 20) / 20; return [t, 2 * t]; });
    const m = initAe(2, 1, 3);
    const first = trainAeEpoch(m, X, 0.3);
    let last = first;
    for (let i = 0; i < 1500; i++) last = trainAeEpoch(m, X, 0.3);
    expect(last).toBeLessThan(first / 5);
  });
  it('diffusion: ᾱ giảm đơn điệu, tái lập theo seed', () => {
    expect(alphaBar(0, 100)).toBe(1); expect(alphaBar(100, 100)).toBeLessThan(alphaBar(10, 100));
    expect(noisify([1, 1], 50, 100, 2)).toEqual(noisify([1, 1], 50, 100, 2));
  });
});

import { Dense, Gan1d, Vae } from '../src/core/algorithms/nn';
import { gaussian as gauss, makeRng as mk } from '../src/core/algorithms/rng';
describe('Lớp Dense, VAE, GAN', () => {
  it('gradient Dense khớp sai phân hữu hạn', () => {
    const l1 = new Dense(3, 4, 'tanh', mk(1)), l2 = new Dense(4, 1, 'linear', mk(2));
    const x = [0.3, -0.7, 0.5];
    const loss = () => l2.forward(l1.forward(x))[0] ** 2;
    loss(); l1.backward(l2.backward([2 * l2.forward(l1.forward(x))[0]]));
    const analytic = l1.gW[2][1];
    const e = 1e-5; l1.W[2][1] += e; const lp = loss(); l1.W[2][1] -= 2 * e; const lm = loss(); l1.W[2][1] += e;
    expect(analytic).toBeCloseTo((lp - lm) / (2 * e), 5);
  });
  it('VAE: lỗi tái dựng giảm, KL hữu hạn', () => {
    const r = mk(5);
    const X = Array.from({ length: 60 }, () => { const t = gauss(r); return [t, 0.5 * t + 0.1 * gauss(r)]; });
    const v = new Vae(2, 1, 6, 3);
    const first = v.epoch(X, 0.05, 0.1); let last = first;
    for (let i = 0; i < 400; i++) last = v.epoch(X, 0.05, 0.1);
    expect(last.recon).toBeLessThan(first.recon); expect(Number.isFinite(last.kl)).toBe(true);
  });
  it('GAN 1D: phân phối sinh dịch về gần trung bình dữ liệu thật', () => {
    const g = new Gan1d(8, 7), r = mk(9);
    for (let i = 0; i < 1500; i++) g.step(Array.from({ length: 32 }, () => 3 + 0.5 * gauss(r)), 0.05, 0.05);
    const samples = Array.from({ length: 300 }, () => g.gen(gauss(r)));
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    expect(Math.abs(mean - 3)).toBeLessThan(1);
  });
});

import { runCompare } from '../src/core/algorithms/compare';
describe('So sánh mô hình (lõi chạy trong Worker)', () => {
  it('trả điểm số hợp lệ cho validation và test', () => {
    const ds = makeSyntheticDataset(120, 5), sp = splitDataset(ds.samples, [6, 2, 2], 5), sc = fitScaler(sp.train);
    const r = runCompare({ train: scaleSamples(sp.train, sc), val: scaleSamples(sp.val, sc), test: scaleSamples(sp.test, sc), seed: 5 });
    expect(r.map((e) => e.name)).toEqual(['KNN', 'Decision Tree', 'Logistic Regression', 'MLP 8 neuron']);
    r.forEach((e) => { expect(e.val).toHaveLength(sp.val.length); expect(e.test).toHaveLength(sp.test.length); expect(e.val.every((p) => p >= 0 && p <= 1)).toBe(true); });
  });
});
import { scaleSamples } from '../src/core/algorithms/dataset';

import { kfun, ksvmPredict, trainKSvm } from '../src/core/algorithms/ksvm';
describe('SVM có kernel (SMO)', () => {
  it('kernel RBF đúng công thức', () => {
    expect(kfun({ type: 'rbf', gamma: 0.5 }, [0, 0], [1, 1])).toBeCloseTo(Math.exp(-1));
    expect(kfun({ type: 'poly', degree: 2, coef0: 1 }, [1, 2], [3, 4])).toBe(144);
  });
  it('RBF tách được hai vòng tròn mà SVM tuyến tính không tách được', () => {
    const ds = makeCircles(120, 3, 0.05);
    const rbf = trainKSvm(ds.samples, { type: 'rbf', gamma: 2 }, 5, 1);
    const lin = trainKSvm(ds.samples, { type: 'linear' }, 5, 1);
    const acc = (m: typeof rbf) => ds.samples.filter((s) => ksvmPredict(m, s.x) === s.y).length / ds.samples.length;
    expect(acc(rbf)).toBeGreaterThan(0.95);
    expect(acc(lin)).toBeLessThan(0.8);
    expect(rbf.nSv).toBeGreaterThan(0);
  });
});

import { add as tAdd, crossEntropy, gather, matmul, matmulT, relu as tRelu, softmaxRows, T as Ten } from '../src/core/algorithms/autograd';
import { CORPUS, MiniGpt, buildVocab } from '../src/core/algorithms/minigpt';
describe('Autograd ma trận và Transformer nhỏ', () => {
  it('gradient khớp sai phân hữu hạn qua attention + FFN', () => {
    const r = mk(4);
    const E = Ten.randn(5, 3, r, 0.5), W = Ten.randn(3, 3, r, 0.5), U = Ten.randn(3, 5, r, 0.5);
    const f = () => { const x = gather(E, [1, 3, 2]); const a = softmaxRows(matmulT(matmul(x, W), x), true); return crossEntropy(matmul(tRelu(tAdd(matmul(a, x), x)), U), [3, 2, 4]); };
    const L = f(); L.backward();
    const g = W.grad[4], e = 1e-6; W.data[4] += e; const lp = f().data[0]; W.data[4] -= 2 * e; const lm = f().data[0]; W.data[4] += e;
    expect(g).toBeCloseTo((lp - lm) / (2 * e), 5);
    const g2 = E.grad[3 * 3 + 1]; E.data[10] += e; const lp2 = f().data[0]; E.data[10] -= 2 * e; const lm2 = f().data[0]; E.data[10] += e;
    expect(g2).toBeCloseTo((lp2 - lm2) / (2 * e), 5);
  });
  it('causal mask: hàng đầu chỉ nhìn chính nó', () => {
    const a = softmaxRows(new Ten(new Float64Array([1, 2, 3, 4]), 2, 2), true);
    expect(a.at(0, 0)).toBeCloseTo(1); expect(a.at(0, 1)).toBe(0);
  });
  it('mô hình nhỏ học được corpus: loss giảm mạnh và sinh câu kết thúc bằng dấu chấm', () => {
    const v = buildVocab(CORPUS), m = new MiniGpt(v, { ctx: 8, d: 16, ff: 32, seed: 1, lr: 0.02 });
    const data = m.windows(CORPUS);
    const before = m.evalLoss(data);
    for (let i = 0; i < 150; i++) m.step(data);
    const after = m.evalLoss(data);
    expect(after).toBeLessThan(before / 3);
    const g = m.generate('bác sĩ', 10, 0.3, 2);
    expect(g.steps.length).toBeGreaterThan(0);
    expect(m.attention('bệnh nhân uống').weights[0][1]).toBe(0);
  });
});

