import React from 'react';
import { cn } from '@/lib/utils';
import { getRiskVisual, RISK_LEGEND_ORDER, RISK_MEANING, EXPERIMENTAL_LEGEND_TEXT } from './risk';
import { RiskIcon } from './RiskIcon';
import { bandText } from './thresholds';
import type { RiskThresholds } from '@/features/map/schemas/floodPointResponse.schema';

/** Legenda dos quatro estados de risco, inline (sem moldura). A moldura de cartão fica em RiskLegend. */
export const RiskLegendList: React.FC<{ className?: string; showExperimentalNote?: boolean; thresholds?: RiskThresholds | null }> = ({ className, showExperimentalNote = true, thresholds }) => (
  <div className={className}>
    <ul className="space-y-2.5 px-3 py-3">
      {RISK_LEGEND_ORDER.map((level) => {
        const v = getRiskVisual(level);
        return (
          <li key={level} className="flex gap-2.5" data-risk={level}>
            <span
              className={cn('mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border-2', v.bg, level === 'UNKNOWN' && 'border-dashed bg-clip-padding')}
              aria-hidden="true"
            >
              <RiskIcon level={level} className="size-3.5" />
            </span>
            <span className="text-xs leading-snug text-muted-foreground">
              <strong className="block text-foreground">{v.label}{thresholds && level !== 'UNKNOWN' && <span data-testid="legend-band" className="ml-1.5 font-mono font-semibold text-muted-foreground">{bandText(level, thresholds)}</span>}</strong>
              {RISK_MEANING[level]}
            </span>
          </li>
        );
      })}
    </ul>
    {thresholds && <p data-testid="legend-source" className="border-t border-border px-3 py-2 text-xs leading-snug text-muted-foreground">Faixas pelos limiares escolhidos na validação do modelo{thresholds.source ? ` (${thresholds.source})` : ''}, em probabilidade bruta.</p>}
    {showExperimentalNote && <p className="border-t border-border px-3 py-2 text-xs leading-snug text-muted-foreground">{EXPERIMENTAL_LEGEND_TEXT}</p>}
  </div>
);
