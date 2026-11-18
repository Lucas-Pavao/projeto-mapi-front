import React from 'react';
import { RiskLegend } from '@/components/risk/RiskLegend';
import { pctTxt } from '@/components/risk/thresholds';
import type { RiskThresholds } from '@/features/map/schemas/floodPointResponse.schema';

interface Props {
  /** Limiares do metadata do modelo (`riskThresholds` da API); sem eles a nota não aparece. */
  thresholds: RiskThresholds | null;
  modelVersion?: string | null;
  horizonHours?: number | null;
  className?: string;
}

/**
 * Legenda de risco sempre visível no canto do mapa (Baixo, Moderado, Alto, Previsão indisponível) e, logo abaixo,
 * a nota dos limiares vigentes. Os números vêm da resposta da API, nunca de constantes (comparação `>=`).
 */
export const MapRiskLegend: React.FC<Props> = ({ thresholds, modelVersion, horizonHours, className }) => {
  const prefix = ['Risco experimental', horizonHours != null ? `em ${horizonHours} h` : null, modelVersion ? `do ${modelVersion}` : null].filter(Boolean).join(' ');
  return (
    <div className={className}>
      <RiskLegend showExperimentalNote={false} className="w-full" />
      {thresholds && (
        <p data-testid="legend-source" className="mt-2 rounded-xl border border-border bg-popover px-3 py-2 text-xs leading-snug text-muted-foreground shadow-elevation-overlay">
          {prefix}: moderado a partir de <b className="font-mono text-foreground">{pctTxt(thresholds.medium)}</b>, alto a partir de <b className="font-mono text-foreground">{pctTxt(thresholds.high)}</b>
          {thresholds.source ? ` (${thresholds.source})` : ''}.
        </p>
      )}
    </div>
  );
};
