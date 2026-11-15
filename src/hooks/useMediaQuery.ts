import { useSyncExternalStore } from 'react';

/** Segue uma media query do navegador (false fora do navegador e em ambientes sem matchMedia). */
export function useMediaQuery(query: string): boolean {
  const subscribe = (cb: () => void) => {
    if (typeof window === 'undefined' || !window.matchMedia) return () => {};
    const mq = window.matchMedia(query);
    mq.addEventListener('change', cb);
    return () => mq.removeEventListener('change', cb);
  };
  const get = () => (typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(query).matches);
  return useSyncExternalStore(subscribe, get, () => false);
}

/** Celular: largura <= 640 px. */
export const useIsMobile = () => useMediaQuery('(max-width: 640px)');

/**
 * Mapa compacto: largura < 1024 px. Abaixo disso o layout de desktop (painel de 360 px + coluna de 300 px) não cabe,
 * e o mapa usa o layout do celular também no tablet.
 */
export const useIsCompactMap = () => useMediaQuery('(max-width: 1023px)');
