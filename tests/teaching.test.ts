import { describe, expect, it } from 'vitest';
import { LESSONS } from '../src/lessons';
import { RESOURCES, resourceById, STATION_GROUPS } from '../src/teaching/catalog';
import { makeResourceSession, makeSession, parseBackup, sessionMarkdown, totalMinutes } from '../src/teaching/session';

const backup = (session = makeSession('data', 'test-session')) => JSON.stringify({ version: 1, sessions: [session] });
describe('teaching station contracts', () => {
  it('covers every existing lesson exactly once across groups with real local routes', () => {
    const ids = STATION_GROUPS.flatMap(group => group.resourceIds);
    expect(new Set(ids).size).toBe(ids.length);
    for (const lesson of LESSONS) { expect(ids.filter(id => id === lesson.id)).toHaveLength(1); expect(resourceById(lesson.id)?.href).toBe(`#${lesson.path}?tab=lab`); }
    expect(new Set(RESOURCES.map(r => r.id)).size).toBe(RESOURCES.length);
    for (const id of ids) expect(resourceById(id)?.href).toMatch(/^#\//);
    expect(RESOURCES.filter(r => ['GENAI', 'RAG'].includes(r.id)).every(r => r.requirement.includes('API'))).toBe(true);
  });
  it('creates editable 45-minute templates from each group with appropriate activities', () => {
    for (const group of STATION_GROUPS) {
      const session = makeSession(group.id, `test-${group.id}`);
      expect(session.groupId).toBe(group.id); expect(totalMinutes(session)).toBe(45);
      expect(parseBackup(backup(session)).sessions[0]).toEqual(session);
      expect(session.activities.every(a => group.resourceIds.includes(a.resourceId))).toBe(true);
    }
    expect(makeSession('python').activities[1].task).toContain('Colab');
    expect(makeSession('ml').activities[1].task).toContain('k');
  });
  it('generates a real topic-specific pack for all 31 current resources, never a Python fallback for other topics', () => {
    expect(RESOURCES).toHaveLength(31);
    for (const resource of RESOURCES) {
      const session = makeResourceSession(resource.id, `pack-${resource.id}`);
      expect(parseBackup(backup(session)).sessions[0]).toEqual(session);
      expect(session.activities.every(a => a.resourceId === resource.id)).toBe(true);
      expect(session.title).toContain(resource.title.split(':')[0]);
      if (!['PYTHON', 'LEARNING'].includes(resource.id)) expect(session.activities[1].task).not.toContain('phut = [10, 15, 15, 20]');
    }
    expect(makeResourceSession('DATASETS').activities[1].task).toContain('sheet');
    expect(makeResourceSession('SEG').activities[1].task).toContain('ngưỡng');
    expect(() => makeResourceSession('javascript:alert(1)')).toThrow();
  });
  it('rejects malformed, unknown, oversized, duplicate and executable-shaped imports atomically', () => {
    const original = makeSession('data', 'test-session');
    for (const raw of ['no-json', '{}', '{"version":2,"sessions":[]}', ' '.repeat(1_000_001), JSON.stringify({ version: 1, sessions: [original, original] })]) expect(() => parseBackup(raw)).toThrow();
    for (const change of [{ id: '../escape' }, { groupId: 'fake' }, { groupSize: 0 }, { groupSize: 13 }, { title: '' }, { outcomes: '' }, { activities: [] }, { activities: Array(13).fill(original.activities[0]) }])
      expect(() => parseBackup(backup({ ...original, ...change }))).toThrow();
    for (const change of [{ minutes: 0 }, { minutes: 181 }, { minutes: 1.5 }, { resourceId: 'javascript:alert(1)' }, { resourceId: 'https://evil.example' }, { task: '' }, { evidence: '' }, { teacherNote: 'a'.repeat(4001) }]) {
      const session = { ...original, activities: [{ ...original.activities[0], ...change }] };
      expect(() => parseBackup(backup(session))).toThrow();
    }
    expect(() => parseBackup(backup({ ...original, activities: [original.activities[0], original.activities[0]] }))).toThrow();
    expect(() => parseBackup(JSON.stringify({ version: 1, sessions: Array.from({ length: 31 }, (_, i) => makeSession('data', `s${i}`)) }))).toThrow();
  });
  it('exports real station links and separates student tasks from private teacher notes', () => {
    const session = makeSession('data', 'export');
    session.activities[0].teacherNote = 'PRIVATE_MARKER_ANSWER';
    session.activities[0].task = '<script>alert(1)</script> ![image](https://evil.example/a.png)';
    const teacher = sessionMarkdown(session, 'teacher', 'http://127.0.0.1:5175');
    const student = sessionMarkdown(session, 'student', 'https://teach.example');
    expect(teacher).toContain('PRIVATE\\_MARKER\\_ANSWER'); expect(student).not.toContain('PRIVATE');
    expect(student).toContain('https://teach.example/#/eda?tab=lab');
    expect(student).toContain('45 phút'); expect(student).toContain('Ghi chép nhóm');
    expect(student).not.toContain('<script>'); expect(student).not.toContain('![image]');
    expect(() => sessionMarkdown(session, 'student', 'javascript:alert(1)')).toThrow();
  });
});
