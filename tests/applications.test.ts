import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fitBoosting, boostProba, boostScore, logLoss } from '../src/core/algorithms/boosting';
import { maskMetrics, teachingMask, weightStep } from '../src/core/algorithms/imageTeaching';
import { LESSONS, orderLessons } from '../src/lessons';
import { PATH } from '../src/learning/model';
import { TABLE_NOTEBOOKS, compatibility } from '../src/learning/dataContext';
import { modelLimitsFor } from '../src/core/datasets/importData';
import { PYTHON_LESSONS } from '../src/lessons/python';
import scripts from '../src/lessons/application-scripts.json';

describe('application curriculum and actual computations', () => {
  it('adds three complete lessons and keeps generative models explicitly optional', () => {
    expect(LESSONS).toHaveLength(26);
    expect(LESSONS.filter(l => l.group === 'ml')).toHaveLength(11);
    expect(LESSONS.filter(l => l.group === 'dl')).toHaveLength(10);
    expect(LESSONS.filter(l => l.exploration).map(l => l.id).sort()).toEqual(['DIFF', 'GAN', 'VAE']);
    const dl = orderLessons(LESSONS.filter(l => l.group === 'dl')).map(l => l.id);
    expect(dl).toEqual(['MLP', 'CNN', 'TRANSFER', 'SEG', 'ATTN', 'GPT', 'AE', 'VAE', 'GAN', 'DIFF']);
    expect(PATH.some(l => ['VAE', 'GAN', 'DIFF'].includes(l.id))).toBe(false);
    expect(TABLE_NOTEBOOKS.has('BOOST')).toBe(true);
    expect(modelLimitsFor('/ml/boosting')).toEqual({ rows: 500, columns: 8 });
    expect(PYTHON_LESSONS.TRANSFER.steps.map(s => s.code).join('\n')).toContain('assert delta > 0');
    expect(PYTHON_LESSONS.SEG.steps.map(s => s.code).join('\n')).toContain('torch.cat([up, skip]');
    for (const id of ['TRANSFER', 'SEG']) expect(compatibility(id, '', { id: 1, name: 'x', originalRows: 10, sampled: false, table: { names: ['a', 'b'], cells: [['1', '2']], delimiter: ',' } }).suitable).toBe(false);
  });
  it('fits binary negative-gradient stumps using train only, including worked first step', () => {
    const data = [0, 1, 2, 3].map(x => ({ x: [x], y: (x >= 2 ? 1 : 0) as 0 | 1 }));
    const m = fitBoosting(data, 1, .1);
    expect(m.bias).toBe(0);
    expect(m.trees[0]).toEqual({ feature: 0, threshold: 1.5, left: -.5, right: .5 });
    expect(boostScore(m, [3])).toBeCloseTo(.05);
    expect(boostProba(m, [3])).toBeCloseTo(1 / (1 + Math.exp(-.05)));
    const full = fitBoosting(data, 60, .2);
    expect(logLoss(data, x => boostProba(full, x))!).toBeLessThan(logLoss(data, () => .5)!);
    expect(boostProba(full, [0])).toBeLessThan(.5);
    expect(boostProba(full, [3])).toBeGreaterThan(.5);
    expect(fitBoosting(data, 60, .2)).toEqual(full);
    expect(data[0].x).toEqual([0]);
  });
  it('handles constant columns, single class and invalid input without NaN', () => {
    const m = fitBoosting([{ x: [2], y: 1 }, { x: [2], y: 1 }], 5, .1);
    expect(Number.isFinite(boostProba(m, [2]))).toBe(true);
    expect(() => fitBoosting([], 1, .1)).toThrow();
    expect(() => fitBoosting([{ x: [NaN], y: 1 }], 1, .1)).toThrow();
    expect(() => fitBoosting([{ x: [1], y: 1 }], 1, 0)).toThrow();
    expect(logLoss([], () => .5)).toBeNull();
  });
  it('computes Dice and IoU exactly and declares empty-mask convention', () => {
    const truth = [true, true, true, true, true, true, true, true, true, true, false, false];
    const pred = [true, true, true, true, true, true, false, false, false, false, true, true];
    expect(maskMetrics(truth, pred)).toMatchObject({ tp: 6, fp: 2, fn: 4, dice: 12 / 18, iou: .5 });
    expect(maskMetrics([false], [false])).toMatchObject({ dice: 1, iou: 1 });
    expect(maskMetrics([true], [false]).dice).toBe(0);
    expect(() => maskMetrics([true], [])).toThrow();
    const s = teachingMask(1);
    expect(s.truth).toHaveLength(256);
    expect(s.scores.every(p => Number.isFinite(p) && p >= 0 && p <= 1)).toBe(true);
    expect(s.scores.filter(p => p >= .7).length).toBeLessThanOrEqual(s.scores.filter(p => p >= .5).length);
  });
  it('holds frozen weights unchanged and updates only open weights', () => {
    expect(weightStep([.8], [.3], .01, true)).toEqual([.8]);
    expect(weightStep([.8], [.3], .01, false)[0]).toBeCloseTo(.797);
  });
  it('publishes each new authored slide as audio, caption and fallback, not placeholders', () => {
    for (const [id, source] of Object.entries(scripts)) {
      const main = JSON.parse(readFileSync(`public/audio/lectures-v2/${id.toLowerCase()}/manifest.json`, 'utf8'));
      const fallback = JSON.parse(readFileSync(`public/audio/guide/${id.toLowerCase()}/manifest.json`, 'utf8'));
      expect(main.voice).toBe('clone-duyenhamy');
      expect(main.scenes).toHaveLength(6);
      expect(fallback.scenes).toEqual(main.scenes);
      source.forEach((s, i) => {
        expect(main.scenes[i].caption).toBe(s.caption);
        expect(main.scenes[i].preset).toEqual({ title: s.title, bullets: s.bullets });
      });
    }
  });
});
