export interface Scene<P = Record<string, unknown>> {
  id: string;
  caption: string;
  audio: string;      // đường dẫn file tĩnh
  duration: number;   // giây, đo thực tế từ file audio
  /** Hành động mô phỏng bắt đầu ở thời điểm này của cảnh (giây). */
  pauseForInteraction?: boolean;
  interactiveK?: boolean;
  interactive?: string; // loại tương tác riêng của bài (ví dụ "depth")
  teaching?: boolean; // slide lý thuyết bổ sung, không dùng preset mô phỏng
  preset: P;
  prompt?: string;
}
export interface Manifest<P = Record<string, unknown>> { lessonId: string; voice: string; scenes: Scene<P>[] }

export function sceneAt<P>(m: Manifest<P>, t: number): { index: number; offset: number } {
  let acc = 0;
  for (let i = 0; i < m.scenes.length; i++) {
    if (t < acc + m.scenes[i].duration) return { index: i, offset: t - acc };
    acc += m.scenes[i].duration;
  }
  return { index: m.scenes.length - 1, offset: m.scenes[m.scenes.length - 1]?.duration ?? 0 };
}
export const totalDuration = <P,>(m: Manifest<P>): number => m.scenes.reduce((s, c) => s + c.duration, 0);
