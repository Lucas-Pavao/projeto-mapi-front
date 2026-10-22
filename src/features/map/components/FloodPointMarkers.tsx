import React from 'react';
import { MapMarker, MarkerContent } from '@/components/ui/map';
import { RiskBadge } from '@/components/risk/RiskBadge';
import { getRiskVisual } from '@/components/risk/risk';
import type { RiskLevel } from '../schemas/floodPointResponse.schema';
import type { FloodPointResponseDTO } from '../types';

interface Props {
  points: FloodPointResponseDTO[];
  selectedFloodPointId: number | undefined;
  /** Risco do ponto selecionado vindo do status em tempo real (tem prioridade sobre a lista). */
  selectedRisk: RiskLevel | undefined;
  /** Slugs com alerta ativo: só esses pulsam (ADR 0011). */
  alertSlugs?: ReadonlySet<string>;
  onSelect: (point: FloodPointResponseDTO) => void;
}

/** Marcadores dos pontos críticos: RiskBadge (ícone + rótulo) e pulso só com alerta ativo. */
export const FloodPointMarkers: React.FC<Props> = ({ points, selectedFloodPointId, selectedRisk, alertSlugs, onSelect }) => (
  <>
    {points.map((point) => {
      const isSelected = selectedFloodPointId === point.id;
      const riskLevel = (isSelected && selectedRisk) || point.floodPrediction?.riskLevel;
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
          label={`Ponto crítico ${point.name}: risco ${riskLabel}${hasAlert ? ', com alerta ativo' : ''}. Pressione enter para abrir.`}
        >
          <MarkerContent>
            {/* Alvo de toque >= 44 px (marcador 32 px + 6 px de cada lado). */}
            <div className="group relative flex cursor-pointer flex-col items-center p-1.5">
              {/* Seleção como no protótipo: aro de 2 px na cor do texto, a 2 px do alvo. */}
              {isSelected && <span aria-hidden="true" className="absolute -inset-0.5 rounded-[14px] border-2 border-foreground" />}
              <RiskBadge level={riskLevel} variant="marker" pulse={hasAlert} className="transition-transform duration-200 group-hover:scale-110" />
            </div>
          </MarkerContent>
        </MapMarker>
      );
    })}
  </>
);
