import React from 'react';
import { MapPin } from 'lucide-react';
import { MapMarker, MarkerContent } from '@/components/ui/map';
import type { AlagamentoPonto } from '@/features/alagamento/schemas/alagamento.schema';
import { floodRingOf, listLineOf, type FloodRing } from '@/features/alagamento/utils/alagamentoText';
import type { FloodPointResponseDTO } from '../types';

interface Props {
  points: FloodPointResponseDTO[];
  selectedFloodPointId: number | undefined;
  /** Alerta por regressão de cada ponto (só ADMIN, modo sombra): define o anel. Sem o mapa (visitante), sem anel. */
  alagamentoBySlug?: ReadonlyMap<string, AlagamentoPonto>;
  onSelect: (point: FloodPointResponseDTO) => void;
}

/** Cor não é o único sinal: cada anel leva um rótulo curto visível sob o marcador. Sem alerta: sem anel. */
const RING: Record<Exclude<FloodRing, null>, { cls: string; short: string; tagCls: string; pulse: boolean }> = {
  ALERTA: { cls: 'border-2 border-destructive', short: 'alerta', tagCls: 'border-destructive text-destructive', pulse: true },
  ATENCAO: { cls: 'border-2 border-warning', short: 'atenção', tagCls: 'border-warning text-warning', pulse: true },
  SEM_DADO: { cls: 'border-2 border-dashed border-muted-foreground', short: 'sem dado', tagCls: 'border-dashed border-muted-foreground text-muted-foreground', pulse: false },
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
              {isSelected && <span aria-hidden="true" className="absolute -inset-0.5 rounded-[14px] border-2 border-foreground" />}
              {r && (
                <span data-alerta-ring={ring} aria-hidden="true" className={`pointer-events-none absolute inset-0.5 rounded-[12px] ${r.cls} ${r.pulse ? 'animate-ping opacity-70 motion-reduce:animate-none' : ''}`} />
              )}
              <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-[10px] border border-border bg-popover text-foreground shadow-elevation-overlay transition-transform duration-200 group-hover:scale-110">
                <MapPin className="size-4" />
              </span>
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
