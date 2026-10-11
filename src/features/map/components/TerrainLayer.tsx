import { useEffect, useRef } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { useMap } from '@/components/ui/map';
import {
  TERRAIN_LAYER_ID,
  TERRAIN_OPACITY,
  TERRAIN_SOURCE_ID,
  ensurePmtilesProtocol,
  type TerrainStatus,
  terrainSourceUrl,
} from '../utils/terrain';

/**
 * Hipsometria do PE3D como camada raster de tiles PNG pré-gerados em PMTiles (ADR 0008, C3). Filho de <Map>. A fonte é
 * criada na primeira vez que a camada liga (nada é baixado antes); depois, ligar/desligar só
 * alterna `visibility`, sem recriar fonte, camada nem mapa. Cleanup remove tudo ao desmontar.
 */
export function TerrainLayer({ enabled, onStatusChange }: { enabled: boolean; onStatusChange?: (s: TerrainStatus) => void }) {
  const { map, isLoaded } = useMap();
  const createdRef = useRef(false);
  const failedRef = useRef(false); // erro é sticky: o 'idle' depois da falha não pode virar 'ready'
  const statusCbRef = useRef(onStatusChange);
  useEffect(() => {
    statusCbRef.current = onStatusChange;
  });

  // Estado: loading enquanto a fonte baixa; ready no primeiro 'idle' com a fonte carregada (a
  // camada já foi desenhada); error se a fonte falhar (arquivo ausente, rede, protocolo).
  useEffect(() => {
    if (!map || !isLoaded) return;
    if (!enabled) {
      statusCbRef.current?.('off');
      return;
    }
    statusCbRef.current?.(failedRef.current ? 'error' : 'loading');
    const onIdle = () => {
      if (!failedRef.current && map.getSource(TERRAIN_SOURCE_ID) && map.isSourceLoaded(TERRAIN_SOURCE_ID)) statusCbRef.current?.('ready');
    };
    const onLoading = (e: { sourceId?: string }) => {
      if (e.sourceId === TERRAIN_SOURCE_ID) statusCbRef.current?.('loading');
    };
    const onError = (e: { sourceId?: string }) => {
      if (e.sourceId === TERRAIN_SOURCE_ID) {
        failedRef.current = true;
        statusCbRef.current?.('error');
      }
    };
    map.on('idle', onIdle);
    map.on('sourcedataloading', onLoading);
    map.on('error', onError);
    return () => {
      map.off('idle', onIdle);
      map.off('sourcedataloading', onLoading);
      map.off('error', onError);
    };
  }, [map, isLoaded, enabled]);

  useEffect(() => {
    if (!map || !isLoaded) return;
    if (enabled && !createdRef.current) {
      ensurePmtilesProtocol();
      if (!map.getSource(TERRAIN_SOURCE_ID)) {
        map.addSource(TERRAIN_SOURCE_ID, { type: 'raster', url: terrainSourceUrl(), tileSize: 256 });
      }
      if (!map.getLayer(TERRAIN_LAYER_ID)) {
        map.addLayer(
          { id: TERRAIN_LAYER_ID, type: 'raster', source: TERRAIN_SOURCE_ID, paint: { 'raster-opacity': TERRAIN_OPACITY } },
          firstSymbolLayerId(map),
        );
      }
      createdRef.current = true;
    }
    if (createdRef.current && map.getLayer(TERRAIN_LAYER_ID)) {
      map.setLayoutProperty(TERRAIN_LAYER_ID, 'visibility', enabled ? 'visible' : 'none');
    }
  }, [map, isLoaded, enabled]);

  useEffect(() => {
    if (!map) return;
    return () => {
      try {
        if (map.getLayer(TERRAIN_LAYER_ID)) map.removeLayer(TERRAIN_LAYER_ID);
        if (map.getSource(TERRAIN_SOURCE_ID)) map.removeSource(TERRAIN_SOURCE_ID);
      } catch {
        // mapa já destruído
      }
      createdRef.current = false;
      failedRef.current = false;
    };
  }, [map]);

  return null;
}

/** Insere o raster abaixo dos rótulos do mapa-base para não cobrir nomes de ruas. */
function firstSymbolLayerId(map: MapLibreMap): string | undefined {
  return map.getStyle()?.layers?.find((l) => l.type === 'symbol')?.id;
}
