import { useEffect, useState } from 'react';
import { latestTask } from '../core/async/latestTask';

export function useLatestTask() {
  const [task] = useState(latestTask);
  useEffect(() => () => task.cancel(), [task]);
  return task;
}
