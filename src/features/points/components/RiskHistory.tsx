import React from 'react';
import { RiskBadge } from '@/components/risk/RiskBadge';
import { ExperimentalBadge } from '@/components/risk/ExperimentalBadge';
import { RiskIcon } from '@/components/risk/RiskIcon';
import { degradationText, formatProbability, getRiskVisual, showsExperimentalLabel } from '@/components/risk/risk';
import { cn } from '@/lib/utils';
import { formatRecife, formatRecifeHourMs } from '@/features/map/utils/datetime';
import { UNKNOWN_BORDER_PILL } from '@/components/risk/RiskBadge';
import type { PredictionSummary } from '../schemas/prediction.schema';

/** Faixa do tempo (um bloco por previsão, com ícone e hora) + tabela com os mesmos dados. */
export const RiskHistory: React.FC<{ items: PredictionSummary[] }> = ({ items }) => {
  const sorted = [...items].sort((a, b) => Date.parse(a.issuedAt) - Date.parse(b.issuedAt));
  return (
    <section aria-label="Histórico de risco" className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <h2 className="text-title text-foreground">Risco nas últimas 24 h</h2>
      <ol className="flex flex-wrap gap-1.5" aria-label="Faixa do tempo">
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
            </li>
          );
        })}
      </ol>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] text-left text-body">
          <caption className="sr-only">Previsões do ponto, da mais antiga para a mais recente</caption>
          <thead>
            <tr className="border-b border-border text-caption text-muted-foreground">
              <th scope="col" className="py-1 pr-3 font-medium">Emitida em</th>
              <th scope="col" className="py-1 pr-3 font-medium">Risco</th>
              <th scope="col" className="py-1 font-medium">Observação</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={p.issuedAt} className="border-b border-border/60 align-top">
                <td className="py-2 pr-3 text-reading text-foreground">{formatRecife(p.issuedAt)}</td>
                <td className="py-2 pr-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <RiskBadge level={p.riskLevel} probability={p.probability} />
                    {showsExperimentalLabel(p) && <ExperimentalBadge />}
                  </div>
                </td>
                <td className="py-2 text-caption text-muted-foreground">
                  {p.riskLevel === 'UNKNOWN'
                    ? `${degradationText(p.degradationReason)}${p.lastValidIssuedAt ? `; última válida ${formatRecife(p.lastValidIssuedAt)}` : ''}`
                    : p.modelVersion ?? ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
