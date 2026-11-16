import { useEffect, useRef } from 'react';

/**
 * Foco do card: ao abrir, vai ao próprio card (tabIndex -1); ao fechar, volta ao elemento que o abriu (chip, marcador ou
 * linha da lista), se ele ainda estiver na página. Clique fora (que não seja num gatilho `data-card-trigger`) chama `onOutside`.
 */
export function useCardFocus<T extends HTMLElement>(onOutside?: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    ref.current?.focus({ preventScroll: true });
    return () => {
      if (opener && opener !== document.body && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => {
    if (!onOutside) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t || ref.current?.contains(t) || t.closest('[data-card-trigger], [data-card-root], .maplibregl-popup')) return;
      onOutside();
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [onOutside]);
  return ref;
}
