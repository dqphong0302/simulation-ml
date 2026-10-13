// Official browser bundles are pinned and served locally, not loaded from a CDN at runtime.
export interface Prediction { className: string; probability: number }
export interface EpochLog { loss?: number; acc?: number; val_loss?: number; val_acc?: number }
interface DisposableModel { dispose(): void; stopTraining?: boolean; layers?: unknown[] }
interface Artifacts { modelTopology: unknown; weightSpecs: unknown[]; weightData: ArrayBuffer }
export interface ImageModel {
  model: DisposableModel;
  trainingModel?: DisposableModel;
  truncatedModel?: DisposableModel;
  setLabels(labels: string[]): void;
  setSeed(seed: string): void;
  addExample(label: number, sample: HTMLCanvasElement): Promise<void>;
  train(params: { denseUnits: number; epochs: number; learningRate: number; batchSize: number }, callbacks: { onEpochEnd(epoch: number, logs: EpochLog): Promise<void> }): Promise<unknown>;
  predict(sample: HTMLCanvasElement): Promise<Prediction[]>;
  getMetadata(): Record<string, unknown>;
  save(handler: { save(artifacts: Artifacts): Promise<{ modelArtifactsInfo: { dateSaved: Date; modelTopologyType: string; modelTopologyBytes: number; weightSpecsBytes: number; weightDataBytes: number } }> }): Promise<unknown>;
}
interface Runtime {
  tf: { ready(): Promise<void>; nextFrame(): Promise<void>; getBackend(): string };
  tmImage: { createTeachable(metadata: { labels: string[]; modelName: string }, options: { checkpointUrl: string; trainingLayer: string }): Promise<ImageModel> };
}
let loading: Promise<Runtime> | undefined;
function script(src: string) {
  return new Promise<void>((resolve, reject) => {
    const element = document.createElement('script');
    element.src = src; element.async = true;
    element.onload = () => resolve();
    element.onerror = () => { element.remove(); reject(new Error('Không tải được thư viện cục bộ. Hãy thử lại.')); };
    document.head.appendChild(element);
  });
}
export function loadImageRuntime() {
  return loading ??= (async () => {
    const runtime = window as unknown as Runtime;
    if (!runtime.tf) await script('/vendor/teachable-machine/tf-1.3.1.min.js');
    if (!runtime.tmImage) await script('/vendor/teachable-machine/tm-image-0.8.5.min.js');
    await runtime.tf.ready();
    return runtime;
  })().catch(error => { loading = undefined; throw error; });
}

export function cropSquare(source: CanvasImageSource, width: number, height: number) {
  if (!width || !height) throw new Error('Ảnh chưa sẵn sàng.');
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 224;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Trình duyệt không hỗ trợ canvas.');
  const size = Math.min(width, height);
  ctx.drawImage(source, (width-size)/2, (height-size)/2, size, size, 0, 0, 224, 224);
  return canvas;
}
export async function readImage(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Chỉ nhận ảnh JPG, PNG hoặc WebP.');
  if (file.size > 10 * 1024 * 1024) throw new Error('Mỗi ảnh tối đa 10 MB.');
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 40_000_000) throw new Error('Ảnh quá lớn; hãy giảm xuống dưới 40 megapixel.');
    return cropSquare(bitmap, bitmap.width, bitmap.height);
  } finally { bitmap.close(); }
}
export async function canvasFromUrl(url: string) {
  const image = new Image(); image.src = url; await image.decode();
  return cropSquare(image, image.naturalWidth, image.naturalHeight);
}

const disposed = new WeakSet<ImageModel>();
export function disposeImageModel(model: ImageModel | null, joined: boolean) {
  if (!model || disposed.has(model)) return;
  disposed.add(model);
  // The library's dispose() disposes the training head twice after joining it.
  // Dispose the joined graph once; before joining, release its separate components.
  if (joined) model.model.dispose();
  else { model.trainingModel?.dispose(); model.truncatedModel?.dispose(); model.model.dispose(); }
}

export async function exportImageModel(model: ImageModel) {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  await model.save({ save: async a => {
    const json = JSON.stringify({ format: 'layers-model', generatedBy: 'Teachable Machine Image 0.8.5',
      modelTopology: a.modelTopology, weightsManifest: [{ paths: ['weights.bin'], weights: a.weightSpecs }] });
    zip.file('model.json', json); zip.file('weights.bin', a.weightData);
    return { modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: 'JSON', modelTopologyBytes: JSON.stringify(a.modelTopology).length, weightSpecsBytes: JSON.stringify(a.weightSpecs).length, weightDataBytes: a.weightData.byteLength } };
  } });
  zip.file('metadata.json', JSON.stringify(model.getMetadata(), null, 2));
  zip.file('README.txt', 'Mô hình ảnh huấn luyện trong trình duyệt bằng @teachablemachine/image 0.8.5 và TensorFlow.js 1.3.1.\nGiải nén rồi dùng model.json, weights.bin, metadata.json với tmImage.loadFromFiles().\nZIP không chứa ảnh huấn luyện. Trọng số vẫn có thể mang thông tin học từ dữ liệu; hãy cân nhắc trước khi chia sẻ.\n');
  return zip.generateAsync({ type: 'blob' });
}
