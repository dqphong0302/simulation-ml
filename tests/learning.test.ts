import { describe, expect, it } from 'vitest';
import { LESSONS } from '../src/lessons';
import { GUIDES } from '../src/learning/guides';
import { PATH } from '../src/learning/model';
import { parseProgress } from '../src/learning/progress';
import { THEORY } from '../src/lessons/theory';

describe('beginner learning contract', () => {
  it('covers every lesson, introduction and final project', () => {
    for (const id of new Set([...LESSONS.map(l => l.id), ...PATH.map(s => s.id)])) {
      const g = GUIDES[id];
      expect(g, id).toBeDefined();
      expect(g.idea.length).toBeGreaterThan(70);
      expect(g.case.length).toBeGreaterThan(50);
      expect(g.vocabulary.length).toBeGreaterThanOrEqual(3);
      expect(g.experiment).toHaveLength(4);
      expect(g.questions).toHaveLength(3);
      expect(new Set(g.questions.map(q => q.prompt)).size).toBe(3);
      for (const q of g.questions) {
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
        expect(new Set(q.options).size).toBe(q.options.length);
        expect(q.explanation.length).toBeGreaterThan(30);
      }
    }
  });
  it('rejects corrupt storage and completion without evidence', () => {
    for (const raw of [null, 'broken', 'null', '[]', 'true']) expect(parseProgress(raw)).toEqual({});
    expect(parseProgress('{"UNKNOWN":{"done":true}}')).toEqual({});
    expect(parseProgress('{"INTRO":{"done":true,"score":3}}').INTRO.done).toBe(false);
    expect(parseProgress(JSON.stringify({ INTRO: { done: true, score: 1, journal: ['a','b','c','d'] } })).INTRO.done).toBe(false);
    expect(parseProgress(JSON.stringify({ INTRO: { done: true, score: 2, journal: ['a','b','c','d'] } })).INTRO.done).toBe(true);
    const invalid = parseProgress(JSON.stringify({ INTRO: { score: 99, journal: [123, 'x'.repeat(5000)] } })).INTRO;
    expect(invalid.score).toBeUndefined();
    expect(invalid.journal).toHaveLength(4);
    expect(invalid.journal?.[0]).toBe('');
    expect(invalid.journal?.[1]).toHaveLength(4000);
  });
  it('states important limits instead of clinical guarantees', () => {
    expect(THEORY.GENCON).toContain('không phải phân phối xác suất bệnh');
    expect(THEORY.GENCON).toContain('không bảo đảm AI trả lời đúng');
    expect(THEORY.GENAI).toContain('Subjective là thông tin chủ quan');
    expect(THEORY.RAG).toContain('không bảo đảm tài liệu mới');
    expect(THEORY.VAE).toContain('không bảo vệ tuyệt đối');
    expect(THEORY.LOGREG).toContain('precision có thể tăng hoặc giảm');
    expect(THEORY.COMPARE).toContain('không tự là khoảng tin cậy 95%');
  });
});
