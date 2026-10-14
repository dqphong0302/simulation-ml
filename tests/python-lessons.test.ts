import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { LESSONS } from '../src/lessons';
import { PYTHON_LESSONS, makeNotebook } from '../src/lessons/python';

describe('Python notebooks', () => {
  it('covers every lesson with explanations, exercises and an executable notebook structure', () => {
    expect(Object.keys(PYTHON_LESSONS).sort()).toEqual(LESSONS.map(l => l.id).sort());
    for (const lesson of LESSONS) {
      const notebook = makeNotebook(lesson.id);
      expect(notebook.nbformat).toBe(4);
      expect(new Set(notebook.cells.map(c => c.id)).size).toBe(notebook.cells.length);
      expect(PYTHON_LESSONS[lesson.id].exercises.length).toBeGreaterThan(0);
      for (const step of PYTHON_LESSONS[lesson.id].steps) {
        expect(step.explanation.length).toBeGreaterThan(30);
        expect(step.code.length).toBeGreaterThan(30);
      }
    }
  });
  it('keeps API calls opt-in and excludes runtime state from downloads', () => {
    const notebook = makeNotebook('GENAI');
    expect(JSON.stringify(notebook)).toContain('RUN_API = False');
    for (const cell of notebook.cells) if (cell.cell_type === 'code' && 'outputs' in cell) {
      expect(cell.outputs).toEqual([]);
      expect(cell.execution_count).toBeNull();
    }
    expect(() => makeNotebook('unknown')).toThrow();
  });
  it('validates Python syntax for all notebook code cells', () => {
    const sources = LESSONS.map(l => ({ id: l.id, code: makeNotebook(l.id).cells
      .filter(c => c.cell_type === 'code').map(c => c.source.join(''))
      .filter(s => !s.startsWith('%pip')).join('\n\n') }));
    const result = spawnSync('python3', ['-c', 'import ast,json,sys\nfor item in json.load(sys.stdin): ast.parse(item["code"], filename=item["id"])'], { input: JSON.stringify(sources), encoding: 'utf8' });
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
  });
  if (process.env.NOTEBOOK_PYTHON) it('executes each complete notebook offline on CPU', () => {
    for (const lesson of LESSONS) {
      const source = makeNotebook(lesson.id).cells.filter(c => c.cell_type === 'code')
        .map(c => c.source.join('')).filter(s => !s.startsWith('%pip')).join('\n\n');
      const result = spawnSync(process.env.NOTEBOOK_PYTHON!, ['-c', source], {
        encoding: 'utf8', timeout: 90000, env: { ...process.env, MPLBACKEND: 'Agg' },
      });
      expect(result.status, `${lesson.id}: ${result.stderr}`).toBe(0);
    }
  }, 300000);
});
