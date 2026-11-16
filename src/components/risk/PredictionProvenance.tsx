import React from 'react';
import { cn } from '@/lib/utils';
import { SyntheticWarning } from './SyntheticWarning';
import { absentInputs, fmtOne, rainInputText, riskHeadline, syntheticWarningOf, thresholdReason } from './provenance';
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
  const imputedIds = new Set((prediction.imputedFeatures ?? []).map((i) => i.featureId));
  const top = (prediction.contributors ?? []).slice(0, 3);
  const absent = absentInputs(prediction);
  const rainTxt = rainInputText(prediction);
  if (!warning && !reason && top.length === 0 && absent.length === 0) return null;
  return (
    <div className={cn('flex flex-col gap-1.5 text-xs leading-[16px]', className)} data-testid="prediction-provenance">
      <p className="m-0 font-bold text-foreground" data-testid="risk-headline">{riskHeadline(prediction)}</p>
      <SyntheticWarning prediction={prediction} />
      {absent.length > 0 && (
        <p role="note" data-testid="absent-inputs" className="m-0 rounded-md border border-warning bg-warning/10 px-2 py-1.5 text-foreground">
          <strong className="text-warning">Entradas ausentes nesta previsão:</strong> {absent.map((a) => a.label).join(', ')}.
          {' '}Ausente não virou zero: o modelo recebeu "sem dado".
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
                  {imputedIds.has(c.featureId) ? ': imputado' : c.value != null ? `: ${fmtOne(c.value)}${c.unit ? ` ${c.unit}` : ''}` : ''}
                </span>
                <span className="font-mono tabular-nums">{c.contribution >= 0 ? '+' : '−'}{fmtOne(Math.abs(c.contribution) * 100)} p.p.</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {rainTxt && <p className="m-0 text-[11px] text-muted-foreground" data-testid="rain-input">{rainTxt}</p>}
    </div>
  );
};
