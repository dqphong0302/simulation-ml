import { NarratedPlayer, type StageCtx } from './NarratedPlayer';
import { TeachingSlide, type TeachingPreset } from './TeachingSlide';
import { SlideDeck } from './SlideDeck';
import { useState } from 'react';
import teachable from '../../lessons/teachable-script.json';
import { EDA_SCENES } from '../../lessons/eda-script';

/** Bản slide chữ khi chưa tải được audio. */
const TEXT_FALLBACK: Record<string, (TeachingPreset & { caption: string })[]> = { TEACHABLE: teachable, EDA: EDA_SCENES };

/** Slide chữ không có audio: khung 16:9, mũi tên qua lại, phụ đề bên dưới. */
export function TextSlides({ lessonId, scenes, onPractice }: { lessonId: string; scenes: (TeachingPreset & { caption: string })[]; onPractice: () => void }) {
  const [index, setIndex] = useState(0);
  const scene = scenes[index];
  const go = (d: number) => setIndex(i => Math.max(0, Math.min(scenes.length - 1, i + d)));
  return <div className="narrated" tabIndex={0} aria-label="Bài giảng dạng slide. Mũi tên trái phải đổi slide."
    onKeyDown={(e) => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); }}>
    <div className="lecture-stage">
      <SlideDeck idx={index} total={scenes.length} title={scene.title} onPrev={() => go(-1)} onNext={() => go(1)}>
        <TeachingSlide key={index} preset={scene} lessonId={lessonId} index={index} onPractice={index === scenes.length - 1 ? onPractice : undefined}/>
      </SlideDeck>
      <section className="player pbar-wrap"><p className="caption">{scene.caption}</p></section>
    </div>
  </div>;
}

/** Bài giảng dạng slide: mỗi cảnh một trang ý chính, đồng bộ với audio. */
export function SlideLecture({ lessonId, onPractice }: { lessonId: string; onPractice: () => void }) {
  const render = ({ scene, idx }: StageCtx<TeachingPreset>) =>
    <TeachingSlide preset={scene.preset} lessonId={lessonId} index={idx} onPractice={onPractice} />;
  return <NarratedPlayer<TeachingPreset> lessonId={lessonId} manifestUrl={`/audio/guide/${lessonId.toLowerCase()}/manifest.json`} noscriptHint="Bạn vẫn có thể học ở tab Thực hành." stage={render} fallback={TEXT_FALLBACK[lessonId] ? <TextSlides lessonId={lessonId} scenes={TEXT_FALLBACK[lessonId]} onPractice={onPractice}/> : undefined} />;
}
