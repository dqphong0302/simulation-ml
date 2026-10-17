import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { COLAB_GUIDE, PYTHON_BASICS, makeBasicsNotebook } from '../src/learning/pythonBasics';

describe('Python & Colab beginner guide', () => {
  it('exports explained, output-free notebook cells', () => {
    const book = makeBasicsNotebook();
    expect(COLAB_GUIDE).toHaveLength(6);
    expect(PYTHON_BASICS).toHaveLength(8);
    expect(book.nbformat).toBe(4);
    expect(book.cells.filter(c => c.cell_type === 'code')).toHaveLength(8);
    for (const c of book.cells.filter(c => c.cell_type === 'code')) {
      expect(c).toMatchObject({ execution_count: null, outputs: [] });
    }
  });
  it('executes the full lesson with simulated input and no external files/packages', () => {
    const prelude = `import builtins\nanswers = iter(["A", "19", "1.70", "65"])\nbuiltins.input = lambda prompt: next(answers)\n`;
    const code = PYTHON_BASICS.map(s => s.code).join('\n\n');
    const result = spawnSync('python3', ['-c', prelude + code], { encoding: 'utf8', timeout: 10000 });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('123.33');
    expect(result.stdout).toContain('50.00%');
    expect(result.stdout).toContain('2 2 1');
  });
  it('handles invalid input and a CSV with no numeric or valid label values', () => {
    const input = PYTHON_BASICS.find(s => s.id === 'input')!.code;
    const stats = PYTHON_BASICS.find(s => s.id === 'statistics')!.code;
    const result = spawnSync('python3', ['-c', `import builtins\nanswers=iter(["A", "abc"])\nbuiltins.input=lambda prompt:next(answers)\n${input}\ncot=["Glucose","Outcome"]\ndulieu=[{"Glucose":"", "Outcome":"unknown"}]\n${stats}`], { encoding: 'utf8' });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('Cần nhập số');
    expect(result.stdout).toContain('Không có số hợp lệ');
    expect(result.stdout).not.toContain('Tỷ lệ nhãn 1');
  });
});
