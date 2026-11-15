import React from 'react';
import { TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fmtOne, syntheticWarningOf, thresholdReason } from './provenance';
import type { FloodPrediction } from '@/features/map/schemas/floodPointResponse.schema';

interface Props {
  prediction: FloodPrediction | null | undefined;
  className?: string;
}

/**
 * De onde veio a faixa de risco: aviso de dado sintético (visível), o limiar que produziu a faixa (escolhido na
 * validação, Etapa 4 do IN1165) e os três fatores de maior contribuição SHAP, em unidade física. Não inventa nada:
 * cada parte só aparece se a API a enviar.
 */
export const PredictionProvenance: React.FC<Props> = ({ prediction, className }) => {
  if (!prediction || prediction.riskLevel === 'UNKNOWN') return null;
  const warning = syntheticWarningOf(prediction);
  const reason = thresholdReason(prediction.riskLevel, prediction.floodProbability, prediction.riskThresholds);
  const top = (prediction.contributors ?? []).slice(0, 3);
  if (!warning && !reason && top.length === 0) return null;
  return (
    <div className={cn('flex flex-col gap-1.5 text-xs leading-[16px]', className)} data-testid="prediction-provenance">
      {warning && (
        <p role="note" data-testid="synthetic-warning"
           className="m-0 flex items-start gap-1.5 rounded-md border border-warning/60 bg-warning/10 px-2 py-1 font-bold text-warning">
          <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          {warning}
        </p>
      )}
      {reason && (
        <p className="m-0 text-muted-foreground" data-testid="threshold-reason">
          {reason}
          {prediction.riskThresholds?.source === 'metadata' ? ' (limiares escolhidos na validação do modelo)' : ''}
        </p>
      )}
      {top.length > 0 && (
        <div>
          <p className="m-0 font-bold text-foreground">Por quê (maiores contribuições)</p>
          <ul className="m-0 list-none p-0" data-testid="top-contributors">
            {top.map((c) => (
              <li key={c.featureId} className="flex justify-between gap-2 text-muted-foreground">
                <span>
                  {c.label}
                  {c.value != null ? `: ${fmtOne(c.value)}${c.unit ? ` ${c.unit}` : ''}` : ''}
                </span>
                <span className="font-mono tabular-nums">{c.contribution >= 0 ? '+' : '−'}{fmtOne(Math.abs(c.contribution) * 100)} p.p.</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {prediction.rainSource && (
        <p className="m-0 text-[11px] text-muted-foreground">
          Modelo treinado com chuva {prediction.rainSource === 'MEASURED' ? 'medida (pluviômetro do Cemaden)' : 'de reanálise'}.
        </p>
      )}
    </div>
  );
};
