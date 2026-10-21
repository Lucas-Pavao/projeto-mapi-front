import React from 'react';
import { MapMarker, MarkerContent } from '@/components/ui/map';
import { cn } from '@/lib/utils';
import { getSensorConfig, getDataFreshness } from '../utils/sensor';
import type { SensorResponseDTO } from '../types';

interface Props {
  sensors: SensorResponseDTO[];
  selectedSensorId: number | undefined;
  nearbySensorIds: Set<string>;
  onSelect: (sensor: SensorResponseDTO) => void;
}

/** Marcadores de sensores no mapa: ícone da camada, "sem resposta" quando velho, destaque de seleção/vizinhança. */
export const SensorMarkers: React.FC<Props> = ({ sensors, selectedSensorId, nearbySensorIds, onSelect }) => (
  <>
    {sensors.map((sensor) => {
      const config = getSensorConfig(sensor);
      const freshness = getDataFreshness(sensor.timestamp);
      const isStale = freshness.status === 'stale';
      const isSelected = selectedSensorId === sensor.id;
      const isNearby = nearbySensorIds.has(sensor.sensorId);

      return (
        <MapMarker
          key={sensor.id}
          longitude={sensor.longitude!}
          latitude={sensor.latitude!}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(sensor);
          }}
          offset={[0, -20]}
          label={`Sensor ${sensor.stationName || sensor.sensorId}, ${config.label}${isStale ? ', sem resposta recente' : ''}. Pressione enter para abrir.`}
        >
          <MarkerContent>
            <div className="relative group cursor-pointer flex flex-col items-center">
              <div
                className={cn(
                  'h-10 w-10 rounded-2xl rounded-bl-none rotate-45 border-2 border-border shadow-elevation-overlay flex items-center justify-center transition-all duration-300 group-hover:scale-110 z-10 relative overflow-hidden',
                  config.color,
                  isStale && 'opacity-50 grayscale',
                  isSelected ? 'ring-2 ring-ring scale-110' : '',
                  isNearby && !isSelected ? 'ring-2 ring-primary/60 scale-105' : '',
                )}
              >
                <div className="-rotate-45 flex items-center justify-center h-full w-full">
                  {React.createElement(config.icon, { className: 'h-5 w-5 text-background' })}
                </div>
              </div>

              {isStale && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-destructive border-2 border-border z-20" title="Sensor sem resposta recente" aria-hidden="true" />
              )}

              {isSelected && <div className="absolute -bottom-1 w-2 h-2 bg-foreground rounded-full animate-pulse" />}

              {isNearby && !isSelected && <div className="absolute -bottom-1 w-1.5 h-1.5 bg-primary/60 rounded-full" />}

              {(isSelected || isNearby) && (
                <div className={cn('absolute inset-0 rounded-2xl rotate-45 animate-ping opacity-20 pointer-events-none', isSelected ? 'bg-foreground' : 'bg-primary')} />
              )}
            </div>
          </MarkerContent>
        </MapMarker>
      );
    })}
  </>
);
