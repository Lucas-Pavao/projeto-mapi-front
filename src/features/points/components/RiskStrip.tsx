import React from 'react';
import { RiskIcon } from '@/components/risk/RiskIcon';
import { UNKNOWN_BORDER_PILL } from '@/components/risk/RiskBadge';
import { formatProbability, getRiskVisual } from '@/components/risk/risk';
import { cn } from '@/lib/utils';
import { formatRecife, formatRecifeHourMs } from '@/features/map/utils/datetime';
import type { PredictionSummary } from '../schemas/prediction.schema';

/** Faixa do tempo: um bloco por previsão, na ordem de emissão, com ícone, hora (America/Recife) e cor do nível. */
export const RiskStrip: React.FC<{ items: PredictionSummary[]; label?: string }> = ({ items, label = 'Faixa do tempo' }) => {
  const sorted = [...items].sort((a, b) => Date.parse(a.issuedAt) - Date.parse(b.issuedAt));
  return (
    <ol className="flex flex-wrap gap-1.5" aria-label={label}>
      {sorted.map((p) => {
        const v = getRiskVisual(p.riskLevel);
        const pct = formatProbability(p.riskLevel, p.probability);
        return (
          <li
            key={p.issuedAt}
            data-risk={p.riskLevel}
            title={`${formatRecife(p.issuedAt)}: ${v.label}${pct ? ` ${pct}` : ''}`}
            className={cn('flex min-w-14 flex-col items-center gap-0.5 rounded-lg px-1.5 py-1 text-2xs font-bold', v.bg, p.riskLevel === 'UNKNOWN' ? UNKNOWN_BORDER_PILL : 'border')}
          >
            <RiskIcon level={p.riskLevel} className="size-4" />
            <span className="font-mono">{formatRecifeHourMs(Date.parse(p.issuedAt))}</span>
            <span className="sr-only">{v.label}</span>
          </li>
        );
      })}
    </ol>
  );
};
