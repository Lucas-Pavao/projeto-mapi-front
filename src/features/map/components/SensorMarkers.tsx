import React from 'react';
import { MapMarker, MarkerContent } from '@/components/ui/map';
import { cn } from '@/lib/utils';
import { getSensorConfig, getDataFreshness } from '../utils/sensor';
import { fmtNum, riverState } from '../utils/overview';
import type { SensorResponseDTO } from '../types';

interface Props {
  sensors: SensorResponseDTO[];
  selectedSensorId: number | undefined;
  nearbySensorIds: Set<string>;
  onSelect: (sensor: SensorResponseDTO) => void;
}

const RIVER_EDGE = { Inundação: 'border-risk-high-edge', Alerta: 'border-risk-moderate', 'Pré-alerta': 'border-risk-moderate', normal: 'border-primary' } as const;
const RIVER_STROKE = { Inundação: 'stroke-risk-high-edge', Alerta: 'stroke-risk-moderate', 'Pré-alerta': 'stroke-risk-moderate', normal: 'stroke-primary' } as const;

/**
 * Sensores no mapa como rótulos de leitura (Main.dc.html): ponto de cor + valor para chuva; onda + "rio valor · estado"
 * para a estação fluvial com cotas da APAC; "sem resposta" tracejado quando a leitura está velha (nunca um zero).
 */
export const SensorMarkers: React.FC<Props> = ({ sensors, selectedSensorId, nearbySensorIds, onSelect }) => (
  <>
    {sensors.map((sensor) => {
      const config = getSensorConfig(sensor);
      const freshness = getDataFreshness(sensor.timestamp);
      const stale = freshness.status === 'stale';
      const isSelected = selectedSensorId === sensor.id;
      const isNearby = nearbySensorIds.has(sensor.sensorId) && !isSelected;
      const state = riverState(sensor.value, sensor);
      const isRiver = state !== null;
      const value = sensor.value != null ? `${fmtNum(sensor.value, isRiver ? 2 : 1)} ${sensor.unit ?? ''}`.trim() : '—';
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
            {/* Alvo de toque >= 44 px no celular: o rótulo tem 22–26 px e ganha folga vertical. */}
            <div className="cursor-pointer py-[11px] md:py-0">
              {isRiver && !stale ? (
                <div className={cn('flex h-[26px] items-center gap-1.5 whitespace-nowrap rounded-full border-[1.5px] bg-popover pl-1.5 pr-2.5 font-mono text-xs leading-4 font-bold text-foreground shadow-elevation-overlay', RIVER_EDGE[state], ring)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true" className={RIVER_STROKE[state]}>
                    <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
                  </svg>
                  {sensor.riverName ?? sensor.stationName} {value}
                  {state !== 'normal' && <> · {state}</>}
                </div>
              ) : (
                <div className={cn('flex h-[22px] items-center gap-[5px] whitespace-nowrap rounded-full border bg-popover pl-[5px] pr-2 font-mono text-[11px] leading-[14px] font-semibold shadow-elevation-raised', stale ? 'border-warning text-warning' : 'border-border text-foreground', ring)}>
                  <span aria-hidden="true" className={cn('size-2 rounded-full', stale ? 'border border-dashed border-warning bg-transparent' : config.color)} />
                  {stale ? 'sem resposta' : value}
                </div>
              )}
            </div>
          </MarkerContent>
        </MapMarker>
      );
    })}
  </>
);
