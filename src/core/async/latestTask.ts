/** One owner per async operation; cancelled or superseded results must never update the UI. */
export function latestTask() {
  let current: AbortController | null = null;
  return {
    start() { current?.abort(); current = new AbortController(); return current.signal; },
    cancel() { current?.abort(); current = null; },
    isCurrent(signal: AbortSignal) { return current?.signal === signal && !signal.aborted; },
  };
}
