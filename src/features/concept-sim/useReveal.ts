import { useEffect, useRef, type DependencyList } from 'react';

/** Thêm lớp "in" cho các phần tử .rv khi chúng cuộn vào màn hình (hiệu ứng xuất hiện dần). */
export function useReveal<T extends HTMLElement>(deps: DependencyList) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const items = Array.from(ref.current?.querySelectorAll<HTMLElement>('.rv') ?? []);
    if (typeof IntersectionObserver !== 'function') { items.forEach(el => el.classList.add('in')); return; }
    const io = new IntersectionObserver((entries) => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    items.forEach(el => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}
