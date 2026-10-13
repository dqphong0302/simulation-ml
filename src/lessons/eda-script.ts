import type { TeachingPreset } from '../features/narrated-lessons/TeachingSlide';
import scenes from './eda-script.json';

/** Slide bài Khám phá dữ liệu; tiêu đề trùng khóa hình trong SlideFigures. Audio tạo bằng scripts/revise-lecture-audio.mjs. */
export const EDA_SCENES: (TeachingPreset & { caption: string })[] = scenes;
