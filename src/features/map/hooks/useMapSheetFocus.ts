import { useEffect, type RefObject } from 'react';
import type { MapRef } from '@/components/ui/map';

/**
 * Celular: a folha inferior cobre até 640 px (ou 70 vh); o mapa desloca o marcador para a área livre acima
 * dela e devolve o padding quando a folha fecha.
 */
export function useMapSheetFocus(mapRef: RefObject<MapRef | null>, hasSheet: boolean, lat: number | null, lng: number | null, sheetHeightPx?: number) {
  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    if (hasSheet) {
      m.easeTo({
        center: [lng as number, lat as number],
        zoom: Math.max(m.getZoom(), 13.5),
        padding: { top: 0, left: 0, right: 0, bottom: Math.round(Math.min(sheetHeightPx ?? window.innerHeight * 0.7, window.innerHeight - 140)) },
        duration: 600,
      });
    } else if ((m.getPadding()?.bottom ?? 0) > 0) {
      m.easeTo({ padding: { top: 0, left: 0, right: 0, bottom: 0 }, duration: 400 });
    }
  }, [mapRef, hasSheet, lat, lng, sheetHeightPx]);
}
