import React from 'react';
import { MapMarker, MarkerContent } from '@/components/ui/map';
import type { AlagamentoPonto } from '@/features/alagamento/schemas/alagamento.schema';
import { floodRingOf, listLineOf, type FloodRing } from '@/features/alagamento/utils/alagamentoText';
import { FloodLevelBadge } from '@/features/alagamento/components/FloodLevelBadge';
import type { FloodPointResponseDTO } from '../types';

interface Props {
  points: FloodPointResponseDTO[];
  selectedFloodPointId: number | undefined;
  /** Alerta por regressão de cada ponto (só ADMIN, modo sombra): define o anel. Sem o mapa (visitante), sem anel. */
  alagamentoBySlug?: ReadonlyMap<string, AlagamentoPonto>;
  onSelect: (point: FloodPointResponseDTO) => void;
}

/** Cor não é o único sinal: cada anel leva um rótulo curto visível sob o marcador. Sem alerta: sem anel. */
const RING: Record<Exclude<FloodRing, null>, { cls: string; short: string; tagCls: string }> = {
  ALERTA: { cls: 'border-[2.5px] border-destructive', short: 'alerta', tagCls: 'border-destructive text-destructive' },
  ATENCAO: { cls: 'border-[2.5px] border-warning', short: 'atenção', tagCls: 'border-warning text-warning' },
  SEM_DADO: { cls: 'border-[2.5px] border-dashed border-muted-foreground', short: 'sem dado', tagCls: 'border-dashed border-muted-foreground text-muted-foreground' },
};

/** Marcadores dos pontos críticos (5.3): ícone neutro e anel pelo nível do alerta por regressão. Sem porcentagem. */
export const FloodPointMarkers: React.FC<Props> = ({ points, selectedFloodPointId, alagamentoBySlug, onSelect }) => (
  <>
    {points.map((point) => {
      const isSelected = selectedFloodPointId === point.id;
      const a = alagamentoBySlug?.get(point.slug);
      const ring = alagamentoBySlug ? floodRingOf(a) : null;
      const r = ring ? RING[ring] : null;
      const state = alagamentoBySlug ? listLineOf(a).label.toLowerCase() : 'alerta experimental';
      return (
        <MapMarker
          key={point.id}
          longitude={point.longitude}
          latitude={point.latitude}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(point);
          }}
          label={`Ponto crítico ${point.name}: ${state}. Pressione enter para abrir.`}
        >
          <MarkerContent>
            {/* Alvo de toque >= 44 px (marcador 32 px + 6 px de cada lado). */}
            <div className="group relative flex cursor-pointer flex-col items-center p-1.5" data-flood-level={a?.level ?? (alagamentoBySlug ? 'SEM_DADO' : 'VISITOR')}>
              {/* Prancha: anel do nível a 7 px do ícone (tracejado em sem dado) e anel de seleção a 2 px. */}
              <span className="mapi-hover-scale relative transition-transform duration-150 ease-[var(--ease-out)]">
                {r && <span data-alerta-ring={ring} aria-hidden="true" className={`pointer-events-none absolute -inset-[7px] rounded-[18px] ${r.cls}`} />}
                {isSelected && <span aria-hidden="true" className="pointer-events-none absolute -inset-0.5 rounded-[12px] border-2 border-foreground" />}
                <FloodLevelBadge level={alagamentoBySlug ? (a?.level ?? 'SEM_DADO') : null} pulse={a?.level === 'ALERTA'} />
              </span>
            </div>
          </MarkerContent>
        </MapMarker>
      );
    })}
  </>
);
