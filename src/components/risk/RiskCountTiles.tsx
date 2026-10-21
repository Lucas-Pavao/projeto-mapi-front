import React from 'react';
import { cn } from '@/lib/utils';
import type { RiskSummary } from '@/features/points/schemas/prediction.schema';
import { getRiskVisual } from './risk';
import type { RiskLevel } from '@/features/map/schemas/floodPointResponse.schema';

/** Ordem do protótipo: Alto, Moderado, Baixo, Indisponível. */
const ORDER: readonly RiskLevel[] = ['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'];
const TOP: Record<RiskLevel, string> = {
  HIGH: 'border-t-risk-high',
  MEDIUM: 'border-t-risk-moderate',
  LOW: 'border-t-risk-low',
  UNKNOWN: 'border-t-risk-unknown-edge border-dashed',
};
const SHORT: Record<RiskLevel, string> = { HIGH: 'Alto', MEDIUM: 'Moderado', LOW: 'Baixo', UNKNOWN: 'Indisp.' };

interface Props {
  summary: RiskSummary | undefined;
  /** Contagem indisponível (falha da API): mostra "—" em vez de zero, que seria lido como "sem risco". */
  failed?: boolean;
  className?: string;
}

/**
 * Quatro blocos de contagem por nível de risco. O rótulo fica sempre visível (o risco não depende só da cor);
 * UNKNOWN nunca soma no baixo e usa o filete tracejado.
 */
export const RiskCountTiles: React.FC<Props> = ({ summary, failed = false, className }) => (
  <section aria-label="Pontos por nível de risco" className={cn('grid grid-cols-4 gap-1.5', className)}>
    {ORDER.map((level) => {
      const v = getRiskVisual(level);
      const n = summary ? String(summary[level]) : failed ? '—' : '…';
      return (
        <div key={level} data-risk-count={level} className={cn('flex min-w-0 flex-col gap-0.5 rounded-[10px] border-t-[3px] bg-muted p-2', TOP[level])}>
          <span className={cn('font-mono text-[22px] leading-[26px] font-bold', v.text)}>{n}</span>
          <span className="truncate text-[11px] leading-[14px] text-muted-foreground">
            <span aria-hidden={level === 'UNKNOWN' ? 'true' : undefined}>{SHORT[level]}</span>
            {level === 'UNKNOWN' && <span className="sr-only">{v.label}</span>}
          </span>
        </div>
      );
    })}
  </section>
);
