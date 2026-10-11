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
    // 'idle' pode demorar ou não vir enquanto o mapa anima (marcadores, círculo de raio); a própria fonte avisa
    // quando terminou de carregar os tiles da vista, e isso já basta para sair de "carregando".
    const onSourceData = (e: { sourceId?: string; isSourceLoaded?: boolean }) => {
      if (e.sourceId === TERRAIN_SOURCE_ID && e.isSourceLoaded && !failedRef.current) statusCbRef.current?.('ready');
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
    map.on('sourcedata', onSourceData);
    map.on('sourcedataloading', onLoading);
    map.on('error', onError);
    return () => {
      map.off('idle', onIdle);
      map.off('sourcedata', onSourceData);
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
          terrainBeforeId(map),
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

/**
 * Posição do raster: logo abaixo da primeira camada de via (túnel, rua, ponte, ferrovia) do mapa-base. Assim a
 * hipsometria colore o terreno, mas o traço das ruas e os rótulos ficam por cima, sem perder contraste. Sem camada de
 * via reconhecida (estilo customizado), cai para abaixo do primeiro rótulo.
 */
const ROAD_LAYER_ID = /^(tunnel|road|bridge|rail)/;
function terrainBeforeId(map: MapLibreMap): string | undefined {
  const layers = map.getStyle()?.layers ?? [];
  return (layers.find((l) => l.type === 'line' && ROAD_LAYER_ID.test(l.id)) ?? layers.find((l) => l.type === 'symbol'))?.id;
}
