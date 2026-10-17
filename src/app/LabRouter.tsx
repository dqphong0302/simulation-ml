import { Fragment, Suspense, lazy, type ComponentType } from 'react';
import type { LabData } from '../features/ml-lab/useData';
import { DataGate } from './DataGate';

// Keep data requirements explicit and load only the selected feature module.
const dataLabs: Partial<Record<string, ComponentType<{ d: LabData }>>> = {
  '/data': lazy(() => import('../features/data-lab/DataLab').then(m => ({ default: m.DataLab }))),
  '/ml/knn': lazy(() => import('../features/ml-lab/KnnLab').then(m => ({ default: m.KnnLab }))),
  '/ml/tree': lazy(() => import('../features/ml-lab/TreeLab').then(m => ({ default: m.TreeLab }))),
  '/ml/logistic': lazy(() => import('../features/ml-lab/LogisticLab').then(m => ({ default: m.LogisticLab }))),
  '/ml/kmeans': lazy(() => import('../features/ml-lab/ExtraLabs').then(m => ({ default: m.KmeansLab }))),
  '/ml/pca': lazy(() => import('../features/ml-lab/ExtraLabs').then(m => ({ default: m.PcaLab }))),
  '/ml/regression': lazy(() => import('../features/ml-lab/ExtraLabs').then(m => ({ default: m.RegressionLab }))),
  '/ml/forest': lazy(() => import('../features/ml-lab/ExtraLabs').then(m => ({ default: m.ForestLab }))),
  '/ml/svm': lazy(() => import('../features/ml-lab/ExtraLabs').then(m => ({ default: m.SvmLab }))),
  '/ml/boosting': lazy(() => import('../features/ml-lab/BoostingLab').then(m => ({ default: m.BoostingLab }))),
  '/ml/compare': lazy(() => import('../features/ml-lab/CompareLab').then(m => ({ default: m.CompareLab }))),
  '/dl/mlp': lazy(() => import('../features/dl-lab/DlLab').then(m => ({ default: m.DlLab }))),
  '/dl/autoencoder': lazy(() => import('../features/dl-lab/GenLabs').then(m => ({ default: m.AutoencoderLab }))),
  '/dl/vae': lazy(() => import('../features/dl-lab/GenLabs').then(m => ({ default: m.VaeLab }))),
};
const standaloneLabs: Partial<Record<string, ComponentType>> = {
  '/eda': lazy(() => import('../features/eda/EdaLab').then(m => ({ default: m.EdaLab }))),
  '/ml/teachable': lazy(() => import('../features/teachable-lab/TeachableLab').then(m => ({ default: m.TeachableLab }))),
  '/dl/cnn': lazy(() => import('../features/dl-lab/CnnLab').then(m => ({ default: m.CnnLab }))),
  '/dl/transfer': lazy(() => import('../features/dl-lab/ImageApplications').then(m => ({ default: m.TransferLab }))),
  '/dl/segmentation': lazy(() => import('../features/dl-lab/ImageApplications').then(m => ({ default: m.SegmentationLab }))),
  '/dl/attention': lazy(() => import('../features/dl-lab/AttentionLab').then(m => ({ default: m.AttentionLab }))),
  '/dl/transformer': lazy(() => import('../features/dl-lab/TransformerLab').then(m => ({ default: m.TransformerLab }))),
  '/dl/gan': lazy(() => import('../features/dl-lab/GenLabs').then(m => ({ default: m.GanLab }))),
  '/dl/diffusion': lazy(() => import('../features/dl-lab/GenLabs').then(m => ({ default: m.DiffusionLab }))),
  '/genai/concepts': lazy(() => import('../features/genai-playground/Concepts').then(m => ({ default: m.Concepts }))),
  '/genai': lazy(() => import('../features/genai-playground/Playground').then(m => ({ default: m.Playground }))),
  '/rag': lazy(() => import('../features/rag-lab/RagLab').then(m => ({ default: m.RagLab }))),
};

export function LabRouter({ path }: { path: string }) {
  const DataLab = dataLabs[path], StandaloneLab = standaloneLabs[path];
  return <Suspense fallback={<p className="loading" role="status">Đang mở phòng thực hành…</p>}>
    {DataLab ? <DataGate render={d => <Fragment key={path + d.source + d.ds.featureNames.join()}><DataLab d={d} /></Fragment>} /> : StandaloneLab ? <StandaloneLab /> : null}
  </Suspense>;
}
