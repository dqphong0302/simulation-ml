// Sửa lời bài giảng đã xuất bản và tạo audio mới chỉ cho các câu thay đổi (giọng Duyên Hà My, VieNeu).
// - Áp dụng scripts/lecture-revisions.json lên public/audio/lectures-v2/<bài>/manifest.json.
// - Tạo manifest cho bài chỉ có kịch bản chữ (EDA) từ src/lessons/eda-script.json.
// Chạy lại an toàn: clip đã có (cùng mã băm lời thoại) được dùng lại; clip chỉ được xuất bản sau khi mã hóa thành công.
// Dùng: node scripts/revise-lecture-audio.mjs [--dry] [--theory-review] [--keep-unused] [--sentences] [BÀI ...]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const dry = args.includes('--dry');
const theoryReview = args.includes('--theory-review');
const keepUnused = args.includes('--keep-unused');
const only = args.filter((a) => !a.startsWith('--'));
const sshArgs = ['-o', 'ConnectTimeout=10', '-F', '/Users/phongdang/home-server/.ssh/config', 'tts'];
const VOICE = 'clone-duyenhamy';

function run(command, argv, input) {
  const r = spawnSync(command, argv, { input, maxBuffer: 32 * 1024 * 1024, timeout: 200000 });
  if (r.error || r.status !== 0) throw new Error(`${command}: ${r.error?.message ?? r.stderr.toString()}`);
  return r.stdout;
}
function duration(file) {
  const s = Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', file]).toString());
  if (!Number.isFinite(s) || s <= 0) throw new Error(`Audio không hợp lệ: ${file}`);
  return s;
}

let profile = null;
function voiceProfile() {
  if (profile) return profile;
  const catalog = JSON.parse(run('ssh', [...sshArgs, 'curl -fsS --max-time 10 http://127.0.0.1:8002/profiles']).toString());
  profile = catalog.profiles.find((p) => p.name.toLowerCase().replace(/[^a-z]/g, '') === 'duyenhamy');
  if (!profile || !/^[a-zA-Z0-9_-]+$/.test(profile.id)) throw new Error('Không có giọng Duyên Hà My. Không thay giọng khác.');
  return profile;
}
/** Cùng cách đặt tên như expand-lecture-audio.mjs: mã băm của giọng + lời thoại. */
function clipFor(lesson, caption) {
  const key = createHash('sha256').update(`${VOICE}:${voiceProfile().id}:${caption}`).digest('hex').slice(0, 16);
  return `/audio/lectures-v2/${lesson.toLowerCase()}/${key}.mp3`;
}
/** Gọi VieNeu cho một đoạn văn; thử lại tối đa 3 lần (máy TTS đôi khi kẹt một yêu cầu). */
function tts(text, label, maxTime) {
  for (let attempt = 1; ; attempt++) {
    try {
      const wav = run('ssh', [...sshArgs, `curl -fsS --max-time ${maxTime} -H 'Content-Type: application/json' --data-binary @- http://127.0.0.1:8002/profiles/${voiceProfile().id}/synthesize`], JSON.stringify({ text, speed: 1 }));
      if (wav.subarray(0, 4).toString() !== 'RIFF') throw new Error('Không nhận được WAV');
      return wav;
    } catch (e) { if (attempt >= 3) throw e; console.log(`  thử lại ${label} (lần ${attempt + 1}): ${String(e.message).slice(0, 80)}`); }
  }
}
/**
 * bySentence: tổng hợp từng câu rồi ghép (nghỉ 0,25 s giữa các câu). Câu ngắn ít làm mô hình bị lặp/treo hơn đoạn dài.
 */
function synthesize(rel, caption, label, bySentence = false) {
  const mp3 = path.join(root, 'public', rel);
  if (fs.existsSync(mp3)) return duration(mp3);
  if (dry) { console.log(`  [dry] sẽ tạo ${label}`); return 0; }
  const t0 = Date.now();
  fs.mkdirSync(path.dirname(mp3), { recursive: true });
  const temp = `${mp3}.pending.mp3`;
  if (bySentence || args.includes('--sentences')) {
    const parts = caption.split(/(?<=[.?!])\s+/).filter(Boolean);
    const dir = fs.mkdtempSync(path.join(path.dirname(mp3), '.parts-'));
    try {
      const files = parts.map((p, i) => { const w = path.join(dir, `${i}.wav`); fs.writeFileSync(w, tts(p, `${label} câu ${i + 1}`, 60)); return w; });
      const inputs = files.flatMap((w) => ['-i', w]);
      const graph = files.map((_, i) => `[${i}:a]aresample=48000,aformat=channel_layouts=mono,apad=pad_dur=${i < files.length - 1 ? 0.25 : 0}[a${i}]`).join(';') + ';' + files.map((_, i) => `[a${i}]`).join('') + `concat=n=${files.length}:v=0:a=1[out]`;
      run('ffmpeg', ['-v', 'error', ...inputs, '-filter_complex', graph, '-map', '[out]', '-codec:a', 'libmp3lame', '-q:a', '4', '-y', temp]);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  } else {
    const wav = tts(caption, label, 180);
    run('ffmpeg', ['-v', 'error', '-i', 'pipe:0', '-codec:a', 'libmp3lame', '-q:a', '4', '-y', temp], wav);
  }
  duration(temp);
  fs.renameSync(temp, mp3);
  console.log(`  AUDIO ${label}: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  return duration(mp3);
}
function writeManifest(lesson, manifest) {
  const dir = path.join(root, 'public/audio/lectures-v2', lesson.toLowerCase());
  const target = path.join(dir, 'manifest.json');
  if (dry) return;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(`${target}.pending`, JSON.stringify(manifest, null, 2) + '\n');
  fs.renameSync(`${target}.pending`, target);
  // Keep the fallback lecture consistent too, reusing the same measured clips.
  if (theoryReview) {
    const special = { KNN: 'knn', TREE: 'tree', LOGREG: 'logistic' };
    const fallback = path.join(root, 'public/audio', special[lesson] ?? `guide/${lesson.toLowerCase()}`, 'manifest.json');
    if (fs.existsSync(fallback)) {
      const old = JSON.parse(fs.readFileSync(fallback, 'utf8'));
      old.scenes = old.scenes.map(s => {
        const revised = manifest.scenes.find(r => r.id === s.id);
        return revised ? { ...s, caption: revised.caption, preset: revised.preset, audio: revised.audio, duration: revised.duration } : s;
      });
      fs.writeFileSync(fallback, JSON.stringify(old, null, 2) + '\n');
    } else {
      fs.mkdirSync(path.dirname(fallback), { recursive: true });
      fs.writeFileSync(fallback, JSON.stringify(manifest, null, 2) + '\n');
    }
  }
  // Dọn clip không còn được manifest nào dùng (chỉ trong thư mục lectures-v2 của bài).
  const used = new Set(manifest.scenes.map((s) => path.basename(s.audio)));
  if (!keepUnused) for (const f of fs.readdirSync(dir)) if (f.endsWith('.mp3') && !used.has(f)) { fs.unlinkSync(path.join(dir, f)); console.log(`  xóa clip cũ ${lesson}/${f}`); }
}

const want = (id) => !only.length || only.includes(id);

// 1) Sửa các bài đã xuất bản.
const revisions = JSON.parse(fs.readFileSync(path.join(root, theoryReview ? 'scripts/theory-lecture-revisions.json' : 'scripts/lecture-revisions.json'), 'utf8'));
for (const [lesson, scenes] of Object.entries(revisions)) {
  if (!want(lesson)) continue;
  const file = path.join(root, 'public/audio/lectures-v2', lesson.toLowerCase(), 'manifest.json');
  const m = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log(`SỬA ${lesson}`);
  for (const [id, rev] of Object.entries(scenes)) {
    const s = m.scenes.find((x) => x.id === id);
    if (!s) throw new Error(`${lesson}: không có cảnh ${id}`);
    let caption = rev.caption ?? s.caption;
    if (rev.sub) {
      if (!caption.includes(rev.sub[0]) && !caption.includes(rev.sub[1])) throw new Error(`${lesson}/${id}: không tìm thấy câu cần thay`);
      caption = caption.replace(rev.sub[0], rev.sub[1]);
    }
    s.preset = { ...s.preset, ...(rev.title ? { title: rev.title } : {}), ...(rev.bullets ? { bullets: rev.bullets } : {}) };
    if (caption !== s.caption) {
      s.caption = caption;
      s.audio = clipFor(lesson, caption);
      s.duration = synthesize(s.audio, caption, `${lesson} ${id}`);
    }
  }
  writeManifest(lesson, m);
}

// 2) Bài chỉ có kịch bản chữ → tạo audio + manifest đầy đủ.
if (want('EDA')) {
  const scenes = JSON.parse(fs.readFileSync(path.join(root, 'src/lessons/eda-script.json'), 'utf8'));
  console.log('TẠO EDA');
  const out = scenes.map((sc, i) => {
    const audio = clipFor('EDA', sc.caption);
    return { id: `eda-${i + 1}`, audio, duration: synthesize(audio, sc.caption, `EDA ${i + 1}`, true), caption: sc.caption, teaching: true, preset: { title: sc.title, bullets: sc.bullets } };
  });
  writeManifest('EDA', { lessonId: 'EDA', voice: VOICE, version: '2026.10-expanded', scenes: out });
}
// New application lessons: the same authored source feeds text fallback and audio.
const applications = JSON.parse(fs.readFileSync(path.join(root, 'src/lessons/application-scripts.json'), 'utf8'));
for (const [lesson, scenes] of Object.entries(applications)) {
  if (!want(lesson)) continue;
  console.log(`TẠO ${lesson}`);
  const out = scenes.map((sc, i) => {
    const audio = clipFor(lesson, sc.caption);
    return { id: `s${i + 1}`, audio, duration: synthesize(audio, sc.caption, `${lesson} ${i + 1}`, true), caption: sc.caption, teaching: true, preset: { title: sc.title, bullets: sc.bullets } };
  });
  writeManifest(lesson, { lessonId: lesson, voice: VOICE, version: '2026.10-applications', scenes: out });
}
console.log(dry ? 'Chạy thử xong (không ghi gì).' : 'Xong.');
