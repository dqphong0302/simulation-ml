import { describe, expect, it } from 'vitest';
import { LESSONS } from '../src/lessons';
import { THEORY, parseTheory } from '../src/lessons/theory';
import { THEORY_CORE } from '../src/lessons/theory/curriculum';

describe('medical theory integrity', () => {
  it('has an individual beginner contract, worked example, answer, scope and sources for every lesson', () => {
    expect(Object.keys(THEORY_CORE).sort()).toEqual(LESSONS.map(l => l.id).sort());
    for (const lesson of LESSONS) {
      const c = THEORY_CORE[lesson.id], src = THEORY[lesson.id];
      expect(c.goals).toHaveLength(3);
      for (const value of [c.mechanism, c.example, c.mistake, c.practice, c.answer, c.scope]) expect(value.length).toBeGreaterThan(60);
      expect(c.sources.length).toBeGreaterThan(0);
      for (const [name, url] of c.sources) {
        expect(name.length).toBeGreaterThan(10);
        expect(new URL(url).protocol).toBe('https:');
        expect(src).toContain(url);
      }
      const headings = parseTheory(src).filter(b => b.t === 'h');
      expect(new Set(headings.map(h => h.id)).size).toBe(headings.length);
      expect(headings.slice(0, 7).map(h => h.text)).toEqual(['Sau bài này bạn làm được gì?', 'Hiểu bằng lời', 'Ví dụ tính tay — dữ liệu giả', 'Tránh hiểu nhầm', 'Tự thử và giải thích', 'Lab này làm được gì, chưa làm gì?', 'Nguồn kiểm chứng']);
      expect(src.indexOf('Đáp án gợi ý:')).toBeLessThan(src.indexOf('Mở rộng ·'));
      expect(src).toContain('không phải hướng dẫn chẩn đoán');
    }
  });
  it('keeps scope limitations and important corrections in the student-facing text', () => {
    expect(THEORY.DATA).toContain('handle_unknown');
    expect(THEORY.DATA).toContain('ngày-tháng-năm');
    expect(THEORY.EDA).toContain('mẫu số');
    expect(THEORY.DIFF).toContain('chưa học denoiser');
    expect(THEORY.CNN).toContain('không huấn luyện CNN');
    expect(THEORY.VAE).toContain('β khác 1');
    expect(THEORY.RAG).toContain('ký tự, không phải token');
    expect(THEORY.KMEANS).toContain('không nhất thiết giảm đều');
    expect(THEORY.DATA).not.toContain('sai phạm học thuật');
    expect(THEORY.DATA).not.toContain('sẽ khiến mô hình mất khả năng');
    expect(THEORY.DATA).toContain('Mức ảnh hưởng phụ thuộc dữ liệu');
    expect(THEORY.TEACHABLE).toContain('không suy ra cơ chế chỉ từ cách chụp');
  });
  it('covers all 26 lessons with substantial medical theory content', () => {
    expect(LESSONS.length).toBe(26);
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
