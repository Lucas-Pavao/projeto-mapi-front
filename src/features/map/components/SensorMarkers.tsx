import React, { useMemo } from 'react';
import { MapMarker, MarkerContent } from '@/components/ui/map';
import { cn } from '@/lib/utils';
import { getSensorConfig, getDataFreshness } from '../utils/sensor';
import { fmtNum, riverState } from '../utils/overview';
import { useLabelDeclutter, type GeoLabel } from '../hooks/useLabelDeclutter';
import type { SensorResponseDTO } from '../types';

interface Props {
  sensors: SensorResponseDTO[];
  selectedSensorId: number | undefined;
  nearbySensorIds: Set<string>;
  /** Pontos críticos no mapa: os rótulos dos sensores nunca os cobrem. */
  floodPoints?: readonly { id: number; longitude: number; latitude: number }[];
  onSelect: (sensor: SensorResponseDTO) => void;
}

const RIVER_EDGE = { Inundação: 'border-risk-high-edge', Alerta: 'border-risk-moderate', 'Pré-alerta': 'border-risk-moderate', normal: 'border-primary' } as const;
const RIVER_STROKE = { Inundação: 'stroke-risk-high-edge', Alerta: 'stroke-risk-moderate', 'Pré-alerta': 'stroke-risk-moderate', normal: 'stroke-primary' } as const;

/** Marcador do ponto crítico com a folga de toque (32 + 2 × 6 px). */
const FLOOD_POINT_BOX = 44;
const NO_POINTS: NonNullable<Props['floodPoints']> = [];

/**
 * Sensores no mapa como rótulos de leitura (Main.dc.html): ponto de cor + valor para chuva; onda + "rio valor · estado"
 * para a estação fluvial com cotas da APAC; "sem resposta" tracejado quando a leitura está velha (nunca um zero).
 * Rótulo que encostaria em outro (ou num ponto crítico) vira só o ponto de cor; o zoom traz o rótulo de volta.
 */
export const SensorMarkers: React.FC<Props> = ({ sensors, selectedSensorId, nearbySensorIds, floodPoints = NO_POINTS, onSelect }) => {
  const items = useMemo(
    () =>
      sensors.map((sensor) => {
        const stale = getDataFreshness(sensor.timestamp).status === 'stale';
        const state = riverState(sensor.value, sensor);
        const isRiver = state !== null && !stale;
        const value = sensor.value != null ? `${fmtNum(sensor.value, state !== null ? 2 : 1)} ${sensor.unit ?? ''}`.trim() : '—';
        const text = isRiver ? `${sensor.riverName ?? sensor.stationName} ${value}${state !== 'normal' ? ` · ${state}` : ''}` : stale ? 'sem resposta' : value;
        // Largura estimada pela fonte mono (12 px ≈ 7,2 px por caractere; 11 px ≈ 6,6 px) mais ícone, folgas e borda.
        const w = isRiver ? 39 + text.length * 7.2 : 28 + text.length * 6.6;
        return { sensor, stale, state, isRiver, value, text, w, h: isRiver ? 26 : 22 };
      }),
    [sensors],
  );

  // Prioridade: o selecionado, depois rios, depois chuva com leitura, por último "sem resposta".
  const labels = useMemo<GeoLabel[]>(() => {
    const rank = (i: (typeof items)[number]) => (i.sensor.id === selectedSensorId ? 0 : i.isRiver ? 1 : i.stale ? 3 : 2);
    return [...items]
      .sort((a, b) => rank(a) - rank(b))
      .map((i) => ({ key: String(i.sensor.id), longitude: i.sensor.longitude!, latitude: i.sensor.latitude!, w: i.w, h: i.h }));
  }, [items, selectedSensorId]);
  const reserved = useMemo<GeoLabel[]>(
    () => floodPoints.map((p) => ({ key: `p${p.id}`, longitude: p.longitude, latitude: p.latitude, w: FLOOD_POINT_BOX, h: FLOOD_POINT_BOX })),
    [floodPoints],
  );
  const visible = useLabelDeclutter(labels, reserved);

  return (
    <>
      {items.map(({ sensor, stale, state, isRiver, value, text }) => {
        const config = getSensorConfig(sensor);
        const isSelected = selectedSensorId === sensor.id;
        const isNearby = nearbySensorIds.has(sensor.sensorId) && !isSelected;
        const collapsed = visible !== null && !visible.has(String(sensor.id)) && !isSelected;
        const ring = isSelected ? 'ring-2 ring-ring' : isNearby ? 'ring-2 ring-primary/60' : '';
        return (
          <MapMarker
            key={sensor.id}
            longitude={sensor.longitude!}
            latitude={sensor.latitude!}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(sensor);
            }}
            label={`Sensor ${sensor.stationName || sensor.sensorId}, ${config.label}${stale ? ', sem resposta recente' : `, ${value}`}. Pressione enter para abrir.`}
          >
            <MarkerContent>
              {/* Alvo de toque >= 44 px no celular e no tablet: o rótulo tem 22–26 px e ganha folga vertical. */}
              <div className={cn('cursor-pointer', collapsed ? 'p-[17px] lg:p-1.5' : 'py-[11px] lg:py-0')}>
                {collapsed ? (
                  <span
                    aria-hidden="true"
                    title={text}
                    className={cn(
                      'block size-2.5 rounded-full border-[1.5px] shadow-elevation-raised',
                      stale ? 'border-dashed border-warning bg-popover' : isRiver ? cn('bg-popover', RIVER_EDGE[state!]) : cn('border-popover', config.color),
                      ring,
                    )}
                  />
                ) : isRiver ? (
                  <div className={cn('flex h-[26px] items-center gap-1.5 whitespace-nowrap rounded-full border-[1.5px] bg-popover pl-1.5 pr-2.5 font-mono text-xs leading-4 font-bold text-foreground shadow-elevation-overlay', RIVER_EDGE[state!], ring)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true" className={RIVER_STROKE[state!]}>
                      <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
                    </svg>
                    {text}
                  </div>
                ) : (
                  <div className={cn('flex h-[22px] items-center gap-[5px] whitespace-nowrap rounded-full border bg-popover pl-[5px] pr-2 font-mono text-[11px] leading-[14px] font-semibold shadow-elevation-raised', stale ? 'border-warning text-warning' : 'border-border text-foreground', ring)}>
                    <span aria-hidden="true" className={cn('size-2 rounded-full', stale ? 'border border-dashed border-warning bg-transparent' : config.color)} />
                    {text}
                  </div>
                )}
              </div>
            </MarkerContent>
          </MapMarker>
        );
      })}
    </>
  );
};
