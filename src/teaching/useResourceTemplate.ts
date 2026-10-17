import { useSessionData } from '../core/datasets/session';
import { adaptGuide } from '../learning/dataContext';
import { GUIDES } from '../learning/guides';
import { makeResourceSession } from './session';

/** Only new templates adapt to the active table. Imported/custom plans are never rewritten. */
export function useResourceTemplate() {
  const data = useSessionData();
  return (resourceId: string, id?: string) => {
    const guide = GUIDES[resourceId];
    const experiment = guide ? adaptGuide(resourceId, guide, data).experiment : undefined;
    return makeResourceSession(resourceId, id, experiment);
  };
}
