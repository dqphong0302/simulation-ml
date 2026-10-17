import { useState } from 'react';
import manifest from './pythonAudio.json';
import narration from './pythonNarration.json';

export function PythonAudio({ id, title }: { id: string; title: string }) {
  const [failed, setFailed] = useState(false);
  const clip = manifest.clips.find(c => c.id === id);
  const text = narration.find(c => c.id === id)?.text;
  if (!clip) return null;
  return <div className="python-audio">
    <div className="python-audio-label"><strong>Nghe hướng dẫn</strong><span>Duyên Hà My · {Math.ceil(clip.duration)} giây</span></div>
    <audio id={`audio-python-${id}`} controls preload="none" src={clip.src} aria-label={`Nghe hướng dẫn: ${title}`} onError={() => setFailed(true)} onCanPlay={() => setFailed(false)} />
    {failed && <p role="alert">Chưa tải được audio. <a href={clip.src} target="_blank" rel="noreferrer">Mở file âm thanh</a> hoặc đọc lời bên dưới.</p>}
    <details><summary>Lời hướng dẫn</summary><p>{text}</p></details>
  </div>;
}
