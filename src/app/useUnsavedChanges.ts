import { useEffect } from 'react';

/** Guard same-tab in-app links and full-page unload; new-tab lab links stay usable. */
export function useUnsavedChanges(dirty: boolean, message: string) {
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    const guardNavigation = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest('a') : null;
      if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return;
      const next = new URL(link.href, window.location.href);
      if (next.origin !== window.location.origin || next.pathname !== window.location.pathname || !next.hash.startsWith('#/') || next.hash === window.location.hash) return;
      if (!window.confirm(message)) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener('beforeunload', warn);
    document.addEventListener('click', guardNavigation, true);
    return () => {
      window.removeEventListener('beforeunload', warn);
      document.removeEventListener('click', guardNavigation, true);
    };
  }, [dirty, message]);
}
