import { describe, expect, it } from 'vitest';
import { LESSONS } from '../src/lessons';
import { THEORY, parseTheory } from '../src/lessons/theory';

describe('medical theory integrity', () => {
  it('covers all 23 lessons with substantial medical theory content', () => {
    expect(LESSONS.length).toBe(23);
    for (const lesson of LESSONS) {
      const theory = THEORY[lesson.id];
      expect(theory, `Missing theory for ${lesson.id}`).toBeDefined();
      expect(theory.length, `Theory for ${lesson.id} is too short`).toBeGreaterThan(1000);

      const blocks = parseTheory(theory);
      expect(blocks.length).toBeGreaterThan(5);

      const headings = blocks.filter((b) => b.t === 'h');
      expect(headings.length, `Theory for ${lesson.id} must have at least 3 headings`).toBeGreaterThanOrEqual(3);

      for (const h of headings) {
        if (h.t === 'h') {
          expect(h.id).toMatch(/^muc-\d+-/);
        }
      }
    }
  });

  it('contains expected clinical keywords in foundation and ML lessons', () => {
    expect(THEORY.EDA).toContain('lâm sàng');
    expect(THEORY.DATA).toContain('TRIPOD');
    expect(THEORY.LOGREG).toContain('Odds Ratio');
    expect(THEORY.LOGREG).toContain('Sensitivity');
    expect(THEORY.LOGREG).toContain('Specificity');
    expect(THEORY.COMPARE).toContain('PROBAST');
    expect(THEORY.CNN).toContain('Grad-CAM');
    expect(THEORY.VAE).toContain('HIPAA');
  });
});
