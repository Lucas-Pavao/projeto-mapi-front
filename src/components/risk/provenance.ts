import { getRiskVisual } from './risk';
import { pctTxt } from './thresholds';
import type { FloodPrediction, RiskLevel, RiskThresholds } from '@/features/map/schemas/floodPointResponse.schema';

const pct = pctTxt;
export const fmtOne = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

/** Aviso de modelo treinado com rótulo sintético: texto visível, nunca em tooltip (Etapa 8 do IN1165). */
export function syntheticWarningOf(prediction: Pick<FloodPrediction, 'trainingData' | 'syntheticWarning'> | null | undefined): string | null {
  if (!prediction) return null;
  if (prediction.syntheticWarning) return prediction.syntheticWarning;
  return prediction.trainingData === 'SYNTHETIC'
    ? 'Modelo treinado com rótulo SINTÉTICO (experimento controlado): a probabilidade não foi validada contra alagamento real.'
    : null;
}

/** "Alto porque 31% ≥ 24,4%": a faixa com o limiar que a produziu, em vez de um número solto. */
export function thresholdReason(level: RiskLevel | null | undefined, p: number | null | undefined, t: RiskThresholds | null | undefined): string | null {
  if (!t || p == null || !level || level === 'UNKNOWN') return null;
  const label = getRiskVisual(level).label;
  switch (level) {
    case 'HIGH':
      return `${label}: probabilidade ${pct(p)} ≥ limiar alto ${pct(t.high)}`;
    case 'MEDIUM':
      return `${label}: ${pct(t.medium)} ≤ probabilidade ${pct(p)} < limiar alto ${pct(t.high)}`;
    case 'LOW':
      return `${label}: probabilidade ${pct(p)} < limiar moderado ${pct(t.medium)}`;
  }
}

