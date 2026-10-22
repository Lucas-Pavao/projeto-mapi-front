import { useEffect, useRef, useState } from 'react';

/** Largura do elemento em px (ResizeObserver). Sem ResizeObserver (jsdom), usa `fallback`. */
export function useElementWidth<T extends HTMLElement>(fallback = 640) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const update = () => setWidth(Math.max(240, Math.round(el.getBoundingClientRect().width) || fallback));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fallback]);
  return { ref, width };
}
