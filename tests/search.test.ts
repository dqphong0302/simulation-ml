import { describe, expect, it } from 'vitest';
import { matchesLesson } from '../src/app/search';

describe('lesson search', () => {
  const lesson = { title: 'Khám phá dữ liệu: thống kê mô tả', goal: 'Đọc biểu đồ, tương quan và tải CSV.' };
  it('accepts empty, accented, unaccented and mixed-case queries', () => {
    for (const query of ['', '   ', 'khám phá', 'kham pha', 'DU LIEU', 'doc bieu do', 'csv tuong quan']) {
      expect(matchesLesson(lesson, query)).toBe(true);
    }
  });
  it('requires every search term to match', () => {
    expect(matchesLesson(lesson, 'csv transformer')).toBe(false);
  });
});
