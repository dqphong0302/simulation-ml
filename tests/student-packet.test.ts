import { describe, expect, it } from 'vitest';
import { RESOURCES } from '../src/teaching/catalog';
import { makeResourceSession } from '../src/teaching/session';
import { makeStudentWork, parseStudentPacket, parseStudentWork, studentWorkMarkdown, toStudentPacket } from '../src/teaching/studentPacket';

const sample = () => {
  const session = makeResourceSession('SEG', 'packet-test');
  session.activities.forEach(a => { a.teacherNote = 'PRIVATE_ANSWER_NOT_FOR_STUDENT'; });
  return session;
};
describe('student handout and portable work', () => {
  it('removes teacher notes from every resource, retains tasks and validates the round trip', () => {
    for (const resource of RESOURCES) {
      const packet = toStudentPacket(makeResourceSession(resource.id));
      const raw = JSON.stringify(packet);
      expect(raw).not.toContain('teacherNote');
      expect(parseStudentPacket(raw)).toEqual(packet);
      expect(packet.session.activities[1].task).toBe(makeResourceSession(resource.id).activities[1].task);
    }
    expect(JSON.stringify(toStudentPacket(sample()))).not.toContain('PRIVATE_ANSWER');
  });
  it('rejects a teacher backup or a mislabeled packet with private fields', () => {
    const session = sample();
    expect(() => parseStudentPacket(JSON.stringify({ version: 1, sessions: [session] }))).toThrow();
    expect(() => parseStudentPacket(JSON.stringify({ kind: 'sml-student-handout', version: 1, session }))).toThrow(/ghi chú riêng/);
  });
  it('rejects unsupported versions, unknown resources, malformed activities and oversized text', () => {
    const packet = toStudentPacket(sample());
    expect(() => parseStudentPacket('not JSON')).toThrow();
    expect(() => parseStudentPacket(' '.repeat(1_000_001))).toThrow();
    expect(() => parseStudentPacket(JSON.stringify({ ...packet, version: 2 }))).toThrow();
    for (const change of [{ resourceId: 'https://evil.example' }, { minutes: -1 }, { task: '' }, { evidence: 'a'.repeat(4001) }]) {
      const modified = structuredClone(packet);
      Object.assign(modified.session.activities[0], change);
      expect(() => parseStudentPacket(JSON.stringify(modified))).toThrow();
    }
  });
  it('keeps unknown URLs/HTML as inert task text and strips unrecognized fields', () => {
    const packet = toStudentPacket(sample());
    packet.session.activities[0].task = '<script>alert(1)</script> ![image](https://evil.example/track)';
    const withExtra = structuredClone(packet);
    Object.assign(withExtra.session.activities[0], { href: 'javascript:alert(1)', onClick: 'alert(1)' });
    const clean = parseStudentPacket(JSON.stringify(withExtra));
    expect(clean.session.activities[0]).not.toHaveProperty('href');
    expect(clean.session.activities[0]).not.toHaveProperty('onClick');
    const work = makeStudentWork(clean, ['<img src=x onerror=alert(1)>', '', '', ''], '![x](https://evil.example)');
    const report = studentWorkMarkdown(work);
    expect(report).toContain('\\<script\\>'); expect(report).toContain('\\<img');
    expect(report).not.toMatch(/(^|[^\\])<(?:script|img)/m); expect(report).not.toContain('![image]');
    expect(report).not.toContain('PRIVATE_ANSWER');
  });
  it('round trips notes and reflections without changing handout tasks, and rejects mismatched lengths/types', () => {
    const packet = toStudentPacket(sample());
    const work = makeStudentWork(packet, ['Dự đoán', 'TP/FP/FN', 'Giới hạn', 'Câu hỏi'], 'Chưa chứng minh lâm sàng.');
    expect(parseStudentWork(JSON.stringify(work))).toEqual(work);
    expect(studentWorkMarkdown(work)).toContain('TP/FP/FN');
    for (const patch of [{ notes: [] }, { notes: [1, '', '', ''] }, { reflection: 'a'.repeat(4001) }, { notes: ['a'.repeat(4001), '', '', ''] }, { kind: 'teacher' }])
      expect(() => parseStudentWork(JSON.stringify({ ...work, ...patch }))).toThrow();
    expect(() => parseStudentWork(JSON.stringify(packet))).toThrow();
    expect(() => parseStudentWork(JSON.stringify({ ...work, packet: { version: 999 } }))).toThrow();
  });
});
