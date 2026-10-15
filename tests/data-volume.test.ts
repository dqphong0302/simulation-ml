import { describe, expect, it } from 'vitest';
import { LESSON_CFG, LEVELS, MAX_N, evaluate, makePool, metricsFor, type Family } from '../src/features/data-volume/model';
import { LESSONS } from '../src/lessons';

const curve = (id: string, seed = 1) => {
  const cfg = LESSON_CFG[id], pool = makePool(cfg.family, seed);
  return [LEVELS[0], 60, MAX_N].map(n => evaluate(cfg, pool, n, seed, false).values);
};

describe('mô phỏng lượng dữ liệu', () => {
  it('mọi bài đều có cấu hình và mốc cỡ mẫu tăng dần', () => {
    LESSONS.forEach(l => expect(LESSON_CFG[l.id], l.id).toBeDefined());
    expect(LEVELS[0]).toBe(8);
    expect(LEVELS.at(-1)).toBe(MAX_N);
    LEVELS.slice(1).forEach((v, i) => expect(v).toBeGreaterThan(LEVELS[i]));
  });

  it('luồng dữ liệu tái lập theo seed', () => {
    expect(makePool('classify', 3).train.slice(0, 5)).toEqual(makePool('classify', 3).train.slice(0, 5));
    expect(makePool('classify', 3).test).toEqual(makePool('classify', 4).test);
  });

  it('số giá trị khớp danh sách chỉ số', () => {
    for (const id of Object.keys(LESSON_CFG)) expect(curve(id)[0].length, id).toBe(metricsFor(LESSON_CFG[id]).length);
  });

  it('nhiều dữ liệu hơn thì khoảng cách train–test thu hẹp (KNN, Tree)', () => {
    for (const id of ['TREE', 'CNN']) {
      const [small, , big] = curve(id);
      expect(small[0] - small[1], id).toBeGreaterThan(big[0] - big[1]);
      expect(big[1], id).toBeGreaterThan(small[1]);
    }
  });

  it('sai số ước lượng giảm khi N tăng', () => {
    const down: [string, number][] = [['LINREG', 1], ['KMEANS', 0], ['PCA', 0], ['EDA', 0]];
    for (const [id, k] of down) { const [s, , b] = curve(id); expect(b[k], id).toBeLessThan(s[k]); }
    const [s, , b] = curve('VAE');
    expect(b[1]).toBeGreaterThan(s[1]);
    const [rs, , rb] = curve('RAG');
    expect(rb[0]).toBeGreaterThan(rs[0]);
  });

  it('chạy đủ nhanh cho mọi họ bài toán ở cỡ lớn nhất', () => {
    const fams = new Set<Family>();
    for (const id of Object.keys(LESSON_CFG)) {
      const cfg = LESSON_CFG[id]; if (fams.has(cfg.family) && cfg.learners.length < 2) continue; fams.add(cfg.family);
      const pool = makePool(cfg.family, 1), t = performance.now();
      evaluate(cfg, pool, MAX_N, 1, true);
      expect(performance.now() - t, id).toBeLessThan(800);
    }
  });
});
