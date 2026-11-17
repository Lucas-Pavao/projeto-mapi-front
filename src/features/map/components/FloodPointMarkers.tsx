import React from 'react';
import { MapMarker, MarkerContent } from '@/components/ui/map';
import { RiskBadge } from '@/components/risk/RiskBadge';
import { getRiskVisual } from '@/components/risk/risk';
import type { RiskLevel } from '../schemas/floodPointResponse.schema';
import { markerRingOf, type MarkerRing } from '@/features/alerta/utils/alertaText';
import type { AlertaPonto } from '@/features/alerta/schemas/alerta.schema';
import type { FloodPointResponseDTO } from '../types';

interface Props {
  points: FloodPointResponseDTO[];
  selectedFloodPointId: number | undefined;
  /** Risco do ponto selecionado vindo do status em tempo real (tem prioridade sobre a lista). */
  selectedRisk: RiskLevel | undefined;
  /** Estado do alerta por ponto (só ADMIN, ADR 0026): define o anel. Sem o mapa (visitante), sem anel; ponto fora do mapa = sem dado. */
  alertaBySlug?: ReadonlyMap<string, AlertaPonto>;
  onSelect: (point: FloodPointResponseDTO) => void;
}

/** Cor não é o único sinal: cada anel leva um rótulo curto visível sob o marcador. */
const RING: Record<MarkerRing, { cls: string; text: string; short: string; tagCls: string; pulse: boolean }> = {
  ATENCAO: { cls: 'border-2 border-warning', text: 'alerta de atenção', short: 'atenção', tagCls: 'border-warning text-warning', pulse: true },
  ALERTA: { cls: 'border-2 border-destructive', text: 'alerta ativo', short: 'alerta', tagCls: 'border-destructive text-destructive', pulse: true },
  SEM_DADO: { cls: 'border-2 border-dashed border-muted-foreground', text: 'alerta sem dado', short: 'sem dado', tagCls: 'border-dashed border-muted-foreground text-muted-foreground', pulse: false },
};

/** Marcadores dos pontos críticos: RiskBadge (ícone + rótulo) e anel pelo estado do alerta por ponto. */
export const FloodPointMarkers: React.FC<Props> = ({ points, selectedFloodPointId, selectedRisk, alertaBySlug, onSelect }) => (
  <>
    {points.map((point) => {
      const isSelected = selectedFloodPointId === point.id;
      const riskLevel = (isSelected && selectedRisk) || point.floodPrediction?.riskLevel;
      const { label: riskLabel } = getRiskVisual(riskLevel);
      const ring = alertaBySlug ? markerRingOf(alertaBySlug.get(point.slug)) : null;
      const r = ring ? RING[ring] : null;

      return (
        <MapMarker
          key={point.id}
          longitude={point.longitude}
          latitude={point.latitude}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(point);
          }}
          label={`Ponto crítico ${point.name}: risco ${riskLabel}${r ? `, com ${r.text}` : ''}. Pressione enter para abrir.`}
        >
          <MarkerContent>
            {/* Alvo de toque >= 44 px (marcador 32 px + 6 px de cada lado). */}
            <div className="group relative flex cursor-pointer flex-col items-center p-1.5">
              {/* Seleção como no protótipo: aro de 2 px na cor do texto, a 2 px do alvo. */}
              {isSelected && <span aria-hidden="true" className="absolute -inset-0.5 rounded-[14px] border-2 border-foreground" />}
              {r && (
                <span data-alerta-ring={ring} aria-hidden="true" className={`pointer-events-none absolute inset-0.5 rounded-[12px] ${r.cls} ${r.pulse ? 'animate-ping opacity-70 motion-reduce:animate-none' : ''}`} />
              )}
              <RiskBadge level={riskLevel} variant="marker" className="transition-transform duration-200 group-hover:scale-110" />
              {r && (
                <span data-alerta-tag={ring} aria-hidden="true" className={`mt-0.5 whitespace-nowrap rounded border bg-popover px-1 text-[9px] font-bold leading-[12px] ${r.tagCls}`}>{r.short}</span>
              )}
            </div>
          </MarkerContent>
        </MapMarker>
      );
    })}
  </>
);
