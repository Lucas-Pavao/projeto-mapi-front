import React from 'react';
import { cn } from '@/lib/utils';
import { measuredRainText, rainForecastLines, rainForecastOrigin } from './provenance';
import type { FloodPrediction } from '@/features/map/schemas/floodPointResponse.schema';

interface Props {
  prediction: FloodPrediction | null | undefined;
  className?: string;
}

/**
 * Chuva prevista ao lado da medida, sempre distinguidas por texto. A prevista aparece como faixa entre quantis, nunca
 * como um número único. Aparece também quando o risco é UNKNOWN: a previsão de chuva não depende do modelo de alagamento.
 */
export const RainForecastSummary: React.FC<Props> = ({ prediction, className }) => {
  const lines = rainForecastLines(prediction);
  if (lines.length === 0) return null;
  const measured = measuredRainText(prediction);
  const origin = rainForecastOrigin(prediction);
  return (
    <div className={cn('grid gap-2 text-xs leading-[16px] sm:grid-cols-2', className)} data-testid="rain-forecast-summary">
      <div className="rounded-md border border-border px-2 py-1.5" data-testid="rain-measured">
        <p className="m-0 font-bold text-foreground">Chuva medida</p>
        <p className="m-0 text-muted-foreground">{measured ?? 'sem chuva medida agora'}</p>
      </div>
      <div className="rounded-md border border-dashed border-border px-2 py-1.5" data-testid="rain-forecast">
        <p className="m-0 font-bold text-foreground">Chuva prevista <span className="font-normal text-muted-foreground">(estimativa, não medição)</span></p>
        <ul className="m-0 list-none p-0 text-muted-foreground">
          {lines.map((l) => (
            <li key={l.horizonHours} title={l.typical}>
              <span className="font-mono tabular-nums">{l.horizonHours} h:</span> {l.band}
            </li>
          ))}
        </ul>
        <p className="m-0 text-[11px] text-muted-foreground">Faixa entre a mediana e o quantil de 95%.{origin ? ` ${origin}.` : ''}</p>
        {prediction?.rainForecast?.usedByModel === false && (
          <p className="m-0 text-[11px] text-muted-foreground" data-testid="rain-forecast-not-used">O modelo de alagamento em uso ainda não recebe esta previsão.</p>
        )}
      </div>
      <p className="m-0 text-[10px] text-muted-foreground sm:col-span-2">DADOS DA REDE OBSERVACIONAL DO CEMADEN/MCTIC</p>
    </div>
  );
};
