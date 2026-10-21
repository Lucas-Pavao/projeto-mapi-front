import React from 'react';
import { MapMarker, MarkerContent } from '@/components/ui/map';
import { RiskBadge } from '@/components/risk/RiskBadge';
import { getRiskVisual } from '@/components/risk/risk';
import { cn } from '@/lib/utils';
import type { RiskLevel } from '../schemas/floodPointResponse.schema';
import type { FloodPointResponseDTO } from '../types';

interface Props {
  points: FloodPointResponseDTO[];
  selectedFloodPointId: number | undefined;
  /** Risco do ponto selecionado vindo do status em tempo real (tem prioridade sobre a lista). */
  selectedRisk: RiskLevel | undefined;
  /** Risco mais recente por slug (stream ao vivo); tem prioridade sobre o da lista. */
  liveRiskBySlug?: ReadonlyMap<string, RiskLevel>;
  /** Slugs com alerta ativo: só esses pulsam (ADR 0011). */
  alertSlugs?: ReadonlySet<string>;
  onSelect: (point: FloodPointResponseDTO) => void;
}

/** Marcadores dos pontos críticos: RiskBadge (ícone + rótulo) e pulso só com alerta ativo. */
export const FloodPointMarkers: React.FC<Props> = ({ points, selectedFloodPointId, selectedRisk, liveRiskBySlug, alertSlugs, onSelect }) => (
  <>
    {points.map((point) => {
      const isSelected = selectedFloodPointId === point.id;
      const riskLevel = (isSelected && selectedRisk) || liveRiskBySlug?.get(point.slug) || point.floodPrediction?.riskLevel;
      const { label: riskLabel } = getRiskVisual(riskLevel);
      const hasAlert = alertSlugs?.has(point.slug) ?? false;

      return (
        <MapMarker
          key={point.id}
          longitude={point.longitude}
          latitude={point.latitude}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(point);
          }}
          offset={[0, -20]}
          label={`Ponto crítico ${point.name}: risco ${riskLabel}${hasAlert ? ', com alerta ativo' : ''}. Pressione enter para abrir.`}
        >
          <MarkerContent>
            {/* Alvo de toque >= 44 px (marcador 32 px + 6 px de cada lado). */}
            <div className="group relative flex cursor-pointer flex-col items-center p-1.5">
              <RiskBadge
                level={riskLevel}
                variant="marker"
                pulse={hasAlert}
                className={cn('transition-transform duration-200 group-hover:scale-110', isSelected && 'scale-125 rounded-lg ring-2 ring-ring ring-offset-2 ring-offset-background')}
              />
            </div>
          </MarkerContent>
        </MapMarker>
      );
    })}
  </>
);
