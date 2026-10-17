import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { LESSONS } from '../src/lessons';
import revisions from '../scripts/theory-lecture-revisions.json';

type Scene = { id: string; audio: string; duration: number; caption: string; preset?: { title: string; bullets: string[] } };
const manifest = (id: string) => JSON.parse(readFileSync(`public/audio/lectures-v2/${id.toLowerCase()}/manifest.json`, 'utf8')) as { lessonId: string; scenes: Scene[] };

describe('reviewed lecture content and audio manifests', () => {
  it('has real referenced clips for every lesson, not missing audio placeholders', () => {
    for (const lesson of LESSONS) {
      const m = manifest(lesson.id);
      expect(m.lessonId).toBe(lesson.id);
      expect(m.scenes.length).toBeGreaterThan(0);
      for (const s of m.scenes) {
        expect(s.caption.length).toBeGreaterThan(30);
        expect(s.audio.startsWith('/audio/')).toBe(true);
        expect(statSync(`public${s.audio}`).size).toBeGreaterThan(1000);
        expect(s.duration).toBeGreaterThan(1);
      }
    }
  });
  it('publishes corrected captions and slide bullets, including the fallback manifests', () => {
    for (const [id, scenes] of Object.entries(revisions)) {
      const m = manifest(id);
      const fallback = JSON.parse(readFileSync(`public/audio/guide/${id.toLowerCase()}/manifest.json`, 'utf8')) as { scenes: Scene[] };
      for (const [sceneId, r] of Object.entries(scenes)) {
        const s = m.scenes.find(s => s.id === sceneId)!;
        expect(s.caption, `${id}/${sceneId}`).toBe(r.caption);
        if ('bullets' in r) expect(s.preset?.bullets).toEqual(r.bullets);
        const f = fallback.scenes.find(s => s.id === sceneId)!;
        expect(f.caption).toBe(s.caption);
        expect(f.audio).toBe(s.audio);
      }
    }
  });
  it('matches EDA source text in both the text fallback and voiced version', () => {
    const source = JSON.parse(readFileSync('src/lessons/eda-script.json', 'utf8')) as { caption: string; bullets: string[] }[];
    const scenes = manifest('EDA').scenes;
    expect(scenes).toHaveLength(source.length);
    source.forEach((s, i) => {
      expect(scenes[i].caption).toBe(s.caption);
      expect(scenes[i].preset?.bullets).toEqual(s.bullets);
    });
  });
});
