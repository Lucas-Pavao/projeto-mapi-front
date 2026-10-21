import React from 'react';
import { cn } from '@/lib/utils';
import type { RiskLevel } from '../schemas/floodPointResponse.schema';
import { formatProbability, getRiskVisual } from '../utils/risk';
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
        {pulse && <span aria-hidden="true" className={cn('absolute inset-0 animate-ping rounded-lg opacity-40', v.ping)} />}
        <span
          className={cn(
            'relative inline-flex size-8 items-center justify-center rounded-lg border-2 shadow-elevation-overlay',
            v.bg,
            unknown && 'border-dashed',
          )}
        >
          <RiskIcon level={level} className="size-5" />
        </span>
      </span>
    );
  }

  return (
    <span
      data-risk={level ?? 'UNKNOWN'}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-bold leading-4',
        v.bg,
        unknown && 'border-dashed',
        className,
      )}
    >
      <RiskIcon level={level} className="size-4 shrink-0" />
      {v.label}
      {pct && <span className="font-mono font-semibold">{pct}</span>}
    </span>
  );
};
