// Offline authoring only. Never imported by the browser application.
// Run: node scripts/generate-data-voice.mjs
// Uses the existing Duyen Ha My profile, never creates or replaces a voice.
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = JSON.parse(fs.readFileSync(path.join(root, 'src/lessons/data-narration-script.json'), 'utf8'));
const sshArgs = ['-o', 'ConnectTimeout=10', '-F', '/Users/phongdang/home-server/.ssh/config', 'tts'];
function run(command, args, input) {
  const result = spawnSync(command, args, { input, maxBuffer: 24 * 1024 * 1024, timeout: 195000 });
  if (result.error || result.status !== 0) throw new Error(`${command}: ${result.error?.message ?? result.stderr.toString()}`);
  return result.stdout;
}
const catalog = JSON.parse(run('ssh', [...sshArgs, 'curl -fsS --max-time 10 http://127.0.0.1:8002/profiles']).toString());
const profile = catalog.profiles.find(p => p.name.toLowerCase().replace(/[^a-z]/g, '') === 'duyenhamy');
if (!profile || !/^[a-zA-Z0-9_-]+$/.test(profile.id)) throw new Error('Duyen Ha My profile unavailable; refusing to substitute voice.');
const output = path.join(root, 'public/audio/guide/data');
fs.mkdirSync(output, { recursive: true });
const scenes = [];
for (const scene of source.scenes) {
  const mp3 = path.join(output, `${scene.id}.mp3`);
  if (!fs.existsSync(mp3)) {
    const wav = run('ssh', [...sshArgs, `curl -fsS --max-time 180 -H 'Content-Type: application/json' --data-binary @- http://127.0.0.1:8002/profiles/${profile.id}/synthesize`], JSON.stringify({ text: scene.caption, speed: 1 }));
    if (wav.subarray(0, 4).toString() !== 'RIFF') throw new Error('Expected WAV audio; manifest not published.');
    run('ffmpeg', ['-v', 'error', '-i', 'pipe:0', '-codec:a', 'libmp3lame', '-q:a', '4', '-n', mp3], wav);
  }
  const duration = Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', mp3]).toString().trim());
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('Invalid clip duration; manifest not published.');
  scenes.push({ ...scene, duration });
  console.log(`${scene.id}: ${duration.toFixed(3)}s · clone-duyenhamy`);
}
// Publish only after every clip exists and has a measured duration.
const manifest = { lessonId: source.lessonId, voice: 'clone-duyenhamy', scenes };
const destination = path.join(output, 'manifest.json');
if (fs.existsSync(destination)) throw new Error('Manifest already exists; review changes manually instead of overwriting.');
fs.writeFileSync(destination, JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
console.log('Audio and manifest ready. Review the voice before enabling this lesson in the UI.');
