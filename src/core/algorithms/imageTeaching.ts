/** Explicit teaching conventions: when both masks are empty, Dice = IoU = 1. */
export function maskMetrics(truth: boolean[], predicted: boolean[]) {
  if (truth.length !== predicted.length || !truth.length) throw new Error('Hai mặt nạ phải cùng số pixel và không rỗng.');
  let tp = 0, fp = 0, fn = 0, tn = 0;
  truth.forEach((t, i) => { if (t && predicted[i]) tp++; else if (t) fn++; else if (predicted[i]) fp++; else tn++; });
  return { tp, fp, fn, tn, dice: 2 * tp + fp + fn ? 2 * tp / (2 * tp + fp + fn) : 1, iou: tp + fp + fn ? tp / (tp + fp + fn) : 1, accuracy: (tp + tn) / truth.length };
}
export function teachingMask(offset = 0) {
  const truth = Array.from({ length: 256 }, (_, i) => (i % 16 - 7) ** 2 + (Math.floor(i / 16) - 8) ** 2 <= 16);
  const image = truth.map((t, i) => Math.max(0, Math.min(1, (t ? .7 : .15) + .13 * Math.sin(i * 17))));
  // Hand-written radial score, NOT a learned network or a clinical probability.
  const scores = truth.map((_, i) => 1 / (1 + Math.exp((Math.hypot(i % 16 - 7 - offset, Math.floor(i / 16) - 8) - 4.2) * 1.2)));
  return { truth, image, scores };
}
export function weightStep(weights: number[], gradients: number[], rate: number, frozen: boolean) {
  return weights.map((w, i) => frozen ? w : w - rate * gradients[i]);
}
