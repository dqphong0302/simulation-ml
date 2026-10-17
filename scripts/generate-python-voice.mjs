// Offline audio authoring; existing Duyen Ha My profile only. Never runs in browser.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = fileURLToPath(new URL('../', import.meta.url));
const scenes = JSON.parse(fs.readFileSync(path.join(root, 'src/learning/pythonNarration.json'), 'utf8'));
const ssh = ['-o','ConnectTimeout=10','-F','/Users/phongdang/home-server/.ssh/config','tts'];
function run(cmd, args, input) {
  const r = spawnSync(cmd, args, { input, timeout: 195000, maxBuffer: 32 * 1024 * 1024 });
  if (r.error || r.status !== 0) throw new Error(`${cmd}: ${r.error?.message || r.stderr.toString()}`);
  return r.stdout;
}
const catalog = JSON.parse(run('ssh', [...ssh, 'curl -fsS --max-time 10 http://127.0.0.1:8002/profiles']));
const profile = catalog.profiles.find(p => p.name.toLowerCase().replace(/[^a-z]/g,'') === 'duyenhamy');
if (!profile || !/^[\w-]+$/.test(profile.id)) throw new Error('Duyen Ha My unavailable; no substitute voice allowed.');
const dir = path.join(root, 'public/audio/python-basics');
fs.mkdirSync(dir, { recursive: true });
const clips = [];
for (const s of scenes) {
  const hash = createHash('sha256').update(profile.id + s.text).digest('hex').slice(0,12);
  const name = `${s.id}-${hash}.mp3`, file = path.join(dir,name);
  if (!fs.existsSync(file)) {
    const wav = run('ssh', [...ssh, `curl -fsS --max-time 180 -H 'Content-Type: application/json' --data-binary @- http://127.0.0.1:8002/profiles/${profile.id}/synthesize`], JSON.stringify({text:s.text,speed:1}));
    if (wav.subarray(0,4).toString() !== 'RIFF') throw new Error('Expected WAV');
    run('ffmpeg',['-v','error','-i','pipe:0','-codec:a','libmp3lame','-q:a','4','-y',`${file}.pending.mp3`],wav);
    fs.renameSync(`${file}.pending.mp3`,file);
  }
  const duration = Number(run('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',file]).toString());
  if (!(duration > 0)) throw new Error('Invalid duration');
  clips.push({id:s.id,src:`/audio/python-basics/${name}`,duration});
  console.log(`${s.id}: ${duration.toFixed(2)}s`);
}
fs.writeFileSync(path.join(root,'src/learning/pythonAudio.json'),JSON.stringify({voice:'clone-duyenhamy',clips},null,2)+'\n');
