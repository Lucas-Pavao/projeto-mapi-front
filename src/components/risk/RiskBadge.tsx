import React from 'react';
import { cn } from '@/lib/utils';
import type { RiskLevel } from '@/features/map/schemas/floodPointResponse.schema';
import { formatProbability, getRiskVisual } from './risk';
import { RiskIcon } from './RiskIcon';

export interface RiskBadgeProps {
  level: RiskLevel | null | undefined;
  /** "pill": rótulo com ícone (cards, listas). "marker": marcador quadrado do mapa, só ícone. */
  variant?: 'pill' | 'marker';
  /** Probabilidade 0–1. Nunca exibida em UNKNOWN. */
  probability?: number | null;
  /** Anel de pulso; só para ponto com alerta ativo. */
  pulse?: boolean;
  className?: string;
}

/** Tracejado visível (>= 1,5 px) na cor risk-unknown-edge; bg-clip-padding deixa o vão mostrar o fundo da página. */
export const UNKNOWN_BORDER_PILL = 'border-2 border-dashed bg-clip-padding';
export const UNKNOWN_BORDER_MARKER = 'border-[3px] border-dashed bg-clip-padding';

/**
 * Selo do nível de risco. Cor, ícone e rótulo andam juntos: o risco nunca depende só de cor.
 * UNKNOWN = cinza tracejado, sem porcentagem.
 */
export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, variant = 'pill', probability, pulse = false, className }) => {
  const v = getRiskVisual(level);
  const unknown = !v.showsProbability;
  const pct = formatProbability(level, probability);

  if (variant === 'marker') {
    return (
      <span
        role="img"
        aria-label={`Risco ${v.label}`}
        data-risk={level ?? 'UNKNOWN'}
        className={cn('relative inline-flex size-8 items-center justify-center', className)}
      >
        {pulse && <span aria-hidden="true" className={cn('absolute inset-0 animate-ping rounded-lg opacity-60', v.ping)} />}
        <span
          className={cn(
            'relative inline-flex size-8 items-center justify-center rounded-lg shadow-elevation-overlay',
            v.bg,
            // UNKNOWN: borda tracejada espessa e com o fundo recortado na borda, para os vãos aparecerem.
            unknown ? UNKNOWN_BORDER_MARKER : 'border-2',
          )}
        >
          <RiskIcon level={level} className="size-4" />
        </span>
      </span>
    );
  }

  return (
    <span
      data-risk={level ?? 'UNKNOWN'}
      className={cn(
        'inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-bold',
        v.bg,
        unknown ? UNKNOWN_BORDER_PILL : 'border',
        className,
      )}
    >
      <RiskIcon level={level} className="size-3.5 shrink-0" />
      {v.label}
      {pct && <span className="font-mono font-semibold tabular-nums">{pct}</span>}
    </span>
  );
};
