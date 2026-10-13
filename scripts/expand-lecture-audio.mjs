// Offline authoring: uses the existing clone only; never restarts services.
// Resume safely by rerunning. Existing published audio/manifests are preserved.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { expansions } from './lecture-expansions.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const special = { KNN: 'knn', TREE: 'tree', LOGREG: 'logistic' };
const sshArgs = ['-o', 'ConnectTimeout=10', '-F', '/Users/phongdang/home-server/.ssh/config', 'tts'];
function run(command, args, input) {
  const r = spawnSync(command, args, { input, maxBuffer: 32 * 1024 * 1024, timeout: 200000 });
  if (r.error || r.status !== 0) throw new Error(`${command}: ${r.error?.message ?? r.stderr.toString()}`);
  return r.stdout;
}
function duration(file) {
  const seconds = Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', file]).toString());
  if (!Number.isFinite(seconds) || seconds <= 0) throw new Error(`Invalid audio: ${file}`);
  return seconds;
}
const catalog = JSON.parse(run('ssh', [...sshArgs, 'curl -fsS --max-time 10 http://127.0.0.1:8002/profiles']).toString());
const profile = catalog.profiles.find(p => p.name.toLowerCase().replace(/[^a-z]/g, '') === 'duyenhamy');
if (!profile || !/^[a-zA-Z0-9_-]+$/.test(profile.id)) throw new Error('Duyen Ha My is unavailable. No voice substitution.');
const selected = process.argv.slice(2);
for (const [id, slides] of Object.entries(expansions)) {
  if (selected.length && !selected.includes(id)) continue;
  const oldPath = `public/audio/${special[id] ?? `guide/${id.toLowerCase()}`}/manifest.json`;
  const standalone = id === 'TEACHABLE';
  const old = standalone ? { voice: 'clone-duyenhamy', scenes: [] } : JSON.parse(fs.readFileSync(path.join(root, oldPath), 'utf8'));
  if (old.voice !== 'clone-duyenhamy') throw new Error(`Unexpected original voice: ${id}`);
  const dir = path.join(root, 'public/audio/lectures-v2', id.toLowerCase());
  fs.mkdirSync(dir, { recursive: true });
  // Measure originals too: no estimated timeline lengths.
  for (const s of old.scenes) s.duration = duration(path.join(root, 'public', s.audio));
  const added = slides.map((s, i) => {
    const key = createHash('sha256').update(`clone-duyenhamy:${profile.id}:${s.caption}`).digest('hex').slice(0, 16);
    return { id: `extended-${i + 1}`, audio: `/audio/lectures-v2/${id.toLowerCase()}/${key}.mp3`, duration: 0,
      caption: s.caption, teaching: true, preset: { title: s.title, bullets: s.bullets } };
  });
  for (const s of added) {
    const mp3 = path.join(root, 'public', s.audio);
    if (!fs.existsSync(mp3)) {
      const start = Date.now();
      console.log(`START ${id} ${s.id}: ${s.preset.title}`);
      const wav = run('ssh', [...sshArgs, `curl -fsS --max-time 180 -H 'Content-Type: application/json' --data-binary @- http://127.0.0.1:8002/profiles/${profile.id}/synthesize`], JSON.stringify({ text: s.caption, speed: 1 }));
      if (wav.subarray(0, 4).toString() !== 'RIFF') throw new Error('Expected WAV; refusing to publish.');
      // Encode to a temporary artifact; a failed encode cannot become a cached clip.
      const temp = `${mp3}.pending.mp3`;
      run('ffmpeg', ['-v', 'error', '-i', 'pipe:0', '-codec:a', 'libmp3lame', '-q:a', '4', '-y', temp], wav);
      duration(temp);
      fs.renameSync(temp, mp3);
      console.log(`AUDIO ${id} ${s.id}: ${((Date.now() - start) / 1000).toFixed(1)}s generation`);
    }
    s.duration = duration(mp3);
  }
  const scenes = standalone ? added : special[id] ? [...old.scenes, ...added]
    : [added[0], old.scenes[0], old.scenes[1], added[1], old.scenes[2], ...added.slice(2)];
  const manifest = { lessonId: id, voice: 'clone-duyenhamy', version: '2026.10-expanded', scenes };
  const target = path.join(dir, 'manifest.json');
  if (fs.existsSync(target)) {
    if (JSON.stringify(JSON.parse(fs.readFileSync(target, 'utf8'))) !== JSON.stringify(manifest)) throw new Error(`Existing manifest differs: ${target}; manual review required.`);
  } else {
    fs.writeFileSync(`${target}.pending`, JSON.stringify(manifest, null, 2) + '\n');
    fs.renameSync(`${target}.pending`, target);
  }
  console.log(`READY ${id}: ${scenes.length} slides, ${scenes.reduce((n,s) => n+s.duration,0).toFixed(1)}s audio`);
}
