import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Manifest, Scene } from '../../core/narration/timeline';
import { sceneAt, totalDuration } from '../../core/narration/timeline';
import { TeachingSlide, type TeachingPreset } from './TeachingSlide';
import { SlideDeck } from './SlideDeck';

const sceneTitles: Record<string, string[]> = {
  KNN: ['Dự đoán điểm mới', 'Tìm láng giềng gần nhất', 'Bỏ phiếu đa số', 'Bạn thử đổi k', 'Kết quả khi k = 7', 'Ảnh hưởng của chuẩn hóa', 'Chọn k bằng validation'],
  TREE: ['Bắt đầu với cây đơn giản', 'Quan sát phép chia', 'Dự đoán khi cây sâu hơn', 'Tăng độ sâu', 'So sánh train và validation', 'Bạn thử đổi độ sâu', 'Chọn độ sâu phù hợp'],
  LOGREG: ['Từ xác suất đến quyết định', 'Ngưỡng 0,5 và bảng nhầm lẫn', 'Dự đoán khi hạ ngưỡng', 'Kết quả ở ngưỡng 0,2', 'Kết quả ở ngưỡng 0,8', 'Bạn thử đổi ngưỡng', 'Chọn ngưỡng và xem ROC'],
};
function titleFor<P>(scene: Scene<P>, lessonId: string, index: number) {
  return (scene.preset as Partial<TeachingPreset>).title ?? sceneTitles[lessonId]?.[index] ?? `Slide ${index + 1}`;
}

const fmtTime = (t: number) => { const v = Math.max(0, Math.round(t)); return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`; };

export interface StageCtx<P> { scene: Scene<P>; idx: number; waiting: boolean; goNext: () => void }

/**
 * Trình phát bài có giọng đọc dùng chung. Trạng thái mô phỏng luôn dựng từ preset của cảnh nên tua/nhảy cảnh vẫn đúng;
 * không tự phát khi mở trang; lỗi audio không chặn nội dung; có phụ đề, transcript, tốc độ và phím mũi tên.
 */
export function NarratedPlayer<P>({ lessonId, manifestUrl, noscriptHint, stage, fallback }: { lessonId: string; manifestUrl: string; noscriptHint: string; stage: (c: StageCtx<P>) => ReactNode; fallback?: ReactNode }) {
  const [m, setM] = useState<Manifest<P> | null | 'error'>(null);
  const [idx, setIdx] = useState(0);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [rate, setRate] = useState(1);
  const [audioFail, setAudioFail] = useState(false);
  const [pos, setPos] = useState(0);
  const audio = useRef<HTMLAudioElement>(null);
  const pendingSeek = useRef<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setM(null); setIdx(0); setPos(0); setPlaying(false); setStarted(false); setAudioFail(false); setWaiting(false); pendingSeek.current = null;
    const read = async (url: string) => {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error('Manifest unavailable');
      const value = await response.json();
      if (value.lessonId !== lessonId || !Array.isArray(value.scenes) || !value.scenes.length) throw new Error('Invalid manifest');
      return value as Manifest<P>;
    };
    read(`/audio/lectures-v2/${lessonId.toLowerCase()}/manifest.json`)
      .catch(() => { if (controller.signal.aborted) throw new Error('Aborted'); return read(manifestUrl); })
      .then(value => { if (!controller.signal.aborted) setM(value); })
      .catch(() => { if (!controller.signal.aborted) setM('error'); });
    return () => controller.abort();
  }, [manifestUrl, lessonId]);
  const man = m && m !== 'error' ? m : null;
  const scene = man?.scenes[idx];
  // Chỉ KNN/Tree/Logistic có cảnh mô phỏng tương tác; các bài khác mọi cảnh đều là slide chữ + hình.
  const interactive = !!scene && !scene.teaching && !!sceneTitles[lessonId];

  const goto = (i: number, autoplay: boolean) => {
    if (!man) return;
    pendingSeek.current = null;
    if (i === idx && audio.current) audio.current.currentTime = 0;
    setIdx(Math.max(0, Math.min(man.scenes.length - 1, i))); setWaiting(false); setPos(0); setPlaying(autoplay);
  };
  useEffect(() => {
    const a = audio.current;
    if (!a || !scene) return;
    a.playbackRate = rate;
    if (playing && started) a.play().catch(() => { setAudioFail(true); setPlaying(false); });
    else a.pause();
  }, [idx, playing, started, scene, rate]);

  const onEnded = () => {
    if (!man || !scene) return;
    if (scene.pauseForInteraction) { setWaiting(true); setPlaying(false); return; }
    if (idx < man.scenes.length - 1) goto(idx + 1, true); else setPlaying(false);
  };
  const total = man ? totalDuration(man) : 0;
  const before = man ? man.scenes.slice(0, idx).reduce((s, c) => s + c.duration, 0) : 0;
  const onKey = (e: React.KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (e.key === ' ' && tag === 'DIV') { e.preventDefault(); setStarted(true); setPlaying(!playing); }
    if (tag === 'DIV' && e.key === 'ArrowRight') goto(idx + 1, playing);
    if (tag === 'DIV' && e.key === 'ArrowLeft') goto(idx - 1, playing);
  };
  const seek = (t: number) => {
    if (!man) return;
    const { index, offset } = sceneAt(man, t);
    goto(index, playing); setPos(offset);
    if (index === idx && audio.current && audio.current.readyState >= 1) audio.current.currentTime = offset;
    else pendingSeek.current = offset;
  };

  if (m === null) return <p className="loading">Đang tải bài…</p>;
  if (!man || !scene) return fallback ?? <p role="alert" className="warn">Không tải được audio/kịch bản. {noscriptHint}</p>;

  return (
    <div className="narrated" onKeyDown={onKey} tabIndex={0} aria-label="Bài học có giọng đọc. Mũi tên trái phải đổi slide, phím cách phát hoặc dừng.">
      <div className="lecture-stage">
        <SlideDeck idx={idx} total={man.scenes.length} title={titleFor(scene, lessonId, idx)} onPrev={() => goto(idx - 1, playing)} onNext={() => goto(idx + 1, playing)} flow={interactive}>
          {interactive && <h2 className="stage-title">{titleFor(scene, lessonId, idx)}</h2>}
          <Fragment key={`stage-${scene.id}`}>{scene.teaching
            ? <TeachingSlide preset={scene.preset as TeachingPreset} lessonId={lessonId} index={idx} />
            : stage({ scene, idx, waiting, goNext: () => goto(idx + 1, true) })}</Fragment>
        </SlideDeck>
        <section className={`player pbar-wrap${playing ? ' is-playing' : ''}`} aria-live="polite">
          <div className="pbar">
            <button className="play" onClick={() => { setStarted(true); if (waiting) goto(idx + 1, true); else setPlaying(!playing); }} aria-label={playing ? 'Tạm dừng' : 'Nghe bài'}>
              {playing ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" /></svg>}
            </button>
            <div className="pbar-mid">
              <div className="pbar-row">
                <span className="eyebrow">{playing && <span className="eq" aria-hidden="true"><i /><i /><i /><i /></span>}Slide {idx + 1}/{man.scenes.length}{waiting ? ' · đang chờ bạn' : ''}</span>
                <ol className="scene-dots" aria-label="Các slide">
                  {man.scenes.map((s, i) => <li key={s.id}><button className={i === idx ? 'on' : i < idx ? 'done' : ''} onClick={() => goto(i, playing)} aria-label={`Slide ${i + 1}${s.pauseForInteraction ? ' (tương tác)' : ''}`} aria-current={i === idx ? 'step' : undefined}>{s.pauseForInteraction ? '✋' : ''}</button></li>)}
                </ol>
              </div>
              <label className="progress"><span className="sr-only">Tiến trình</span>
                <input type="range" min={0} max={Math.floor(total)} value={Math.round(before + pos)} onChange={(e) => seek(Number(e.target.value))} />
                <span className="time">{fmtTime(before + pos)} / {fmtTime(total)}</span></label>
            </div>
            <div className="player-actions">
              <button className="icon-btn" title="Nghe lại slide này" aria-label="Nghe lại slide này" onClick={() => { setStarted(true); setPlaying(true); if (audio.current) { audio.current.currentTime = 0; void audio.current.play().catch(() => setAudioFail(true)); } }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
              </button>
              <button className="btn sm rate-btn" aria-label={`Tốc độ đọc ${rate}×, bấm để đổi`} onClick={() => { const R = [0.75, 1, 1.25, 1.5]; setRate(R[(R.indexOf(rate) + 1) % R.length]); }}>{String(rate).replace('.', ',')}×</button>
            </div>
          </div>
          <p className="caption" key={scene.id}>{scene.caption}</p>
          {audioFail && <p role="alert" className="warn">Không phát được âm thanh. Hãy đọc phụ đề; bài học vẫn dùng được.</p>}
          {waiting && <div className="result" role="status"><span>{scene.prompt}</span><button className="primary" onClick={() => goto(idx + 1, true)}>Tiếp tục</button></div>}
        </section>
      </div>
      <audio ref={audio} key={`audio-${scene.id}`} src={scene.audio} preload="metadata" onLoadedMetadata={(e) => { setAudioFail(false); if (pendingSeek.current !== null) { e.currentTarget.currentTime = Math.min(pendingSeek.current, e.currentTarget.duration); pendingSeek.current = null; } }} onEnded={onEnded} onError={() => { setAudioFail(true); setPlaying(false); }} onTimeUpdate={(e) => setPos(e.currentTarget.currentTime)} />
    </div>
  );
}
