import { describe as suite, it, expect } from 'vitest';
import { describe, fitScaler } from '../src/core/algorithms/dataset';
import { preprocessDemo } from '../src/core/algorithms/preprocessDemo';
import { parseCsvText } from '../src/core/datasets/importData';
import { inspectColumns } from '../src/core/datasets/freecsv';
import { profile } from '../src/features/eda/DataProfile';

suite('theory arithmetic and preprocessing demo', () => {
  it('keeps EDA moment skew independent of sample SD and flags Tukey outliers at IQR=0', () => {
    const t = parseCsvText('glucose\n1\n1\n1\n1\n100');
    const p = profile(t, inspectColumns(t))[0];
    expect(p.kind).toBe('numeric');
    if (p.kind !== 'numeric') throw new Error('Expected numeric profile');
    expect(p.outliers).toBe(1);
    expect(p.skew).toBeCloseTo(1.5);
    expect(p.std).toBeCloseTo(describe([1, 1, 1, 1, 100]).std!);
  });
  it('reports sample SD and valid-only denominators, including edge cases', () => {
    expect(describe([2, 4, 4, 10])).toMatchObject({ n: 4, missing: 0, mean: 5, median: 4 });
    expect(describe([2, 4, 4, 10]).std).toBeCloseTo(Math.sqrt(12));
    expect(describe([2, 4, null, 10]).mean).toBeCloseTo(16 / 3);
    expect(describe([null, NaN]).std).toBeNull();
    expect(describe([4]).std).toBeNull();
    expect(describe([4, 4]).std).toBe(0);
  });
  it('does not change StandardScaler ddof=0 convention', () => {
    const sc = fitScaler([{ x: [10], y: 0 }, { x: [20], y: 1 }, { x: [30], y: 0 }]);
    expect(sc.mean[0]).toBe(20);
    expect(sc.std[0]).toBeCloseTo(Math.sqrt(200 / 3));
  });
  it('fits median then scaling on imputed train, exactly matching the worked example', () => {
    const p = preprocessDemo([[10], [20], [null], [30]], 'median', false, 'zscore');
    expect(p.fitted[0].fill).toBe(20);
    expect(p.rows).toEqual([[10], [20], [20], [30]]);
    expect(p.scaling[0].sd).toBeCloseTo(Math.sqrt(50));
    expect(p.scaled[3][0]).toBeCloseTo(Math.SQRT2);
    expect((40 - p.scaling[0].min) / (p.scaling[0].max - p.scaling[0].min)).toBe(1.5);
  });
  it('preserves unavailable information rather than inventing zeros', () => {
    const p = preprocessDemo([[null, 4], [null, 4]], 'mean', false, 'zscore');
    expect(p.emptyColumns).toEqual([0]);
    expect(p.scaled).toEqual([[null, 0], [null, 0]]);
    expect(preprocessDemo([[null], [null]], 'drop', false, 'minmax').rows).toEqual([]);
    expect(preprocessDemo([], 'median', false, 'none').rows).toEqual([]);
  });
  it('only clips on explicit choice and fits IQR to train', () => {
    const train = [[1], [2], [3], [4], [100]];
    expect(preprocessDemo(train, 'median', false, 'none').rows[4][0]).toBe(100);
    expect(preprocessDemo(train, 'median', true, 'none').rows[4][0]).toBe(7);
  });
});
