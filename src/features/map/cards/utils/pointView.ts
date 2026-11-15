import { degradationText, RISK_MEANING } from '@/components/risk/risk';
import { sqrtScale } from '@/components/risk/thresholds';
import { thresholdReason } from '@/components/risk/provenance';
import type { FloodPrediction, RiskThresholds } from '@/features/map/schemas/floodPointResponse.schema';
import type { PredictionSummary } from '@/features/points/schemas/prediction.schema';

/** Os 5 estados do card do ponto: 3 classes, "sem dado suficiente" (INSUFFICIENT_DATA) e "modelo indisponível" (demais motivos). */
export type PointCardState = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT' | 'UNAVAILABLE';

export function pointCardState(p: Pick<FloodPrediction, 'riskLevel' | 'degradationReason'> | null | undefined): PointCardState {
  switch (p?.riskLevel) {
    case 'HIGH': return 'HIGH';
    case 'MEDIUM': return 'MEDIUM';
    case 'LOW': return 'LOW';
    default: return p?.degradationReason === 'INSUFFICIENT_DATA' ? 'INSUFFICIENT' : 'UNAVAILABLE';
  }
}

export const isUnknownState = (s: PointCardState) => s === 'INSUFFICIENT' || s === 'UNAVAILABLE';

/** Linha "Por quê" do card: o limiar que produziu a faixa, ou o motivo de não haver previsão (nunca porcentagem em UNKNOWN). */
export function reasonOf(state: PointCardState, p: FloodPrediction | null | undefined, rainStation: string | null): { label: string; text: string } {
  if (state === 'INSUFFICIENT') return { label: 'Sem dado suficiente:', text: `falta chuva medida da hora atual ou das últimas 3 h (${rainStation ?? 'nenhuma estação válida'}). Lacuna não vira zero.` };
  if (state === 'UNAVAILABLE') return { label: 'Modelo indisponível:', text: `${degradationText(p?.degradationReason)}. O último valor válido não é mostrado como atual.` };
  const t = thresholdReason(p?.riskLevel, p?.floodProbability, p?.riskThresholds);
  return { label: 'Por quê:', text: t ?? 'limiares indisponíveis, sem classe calculada pelo front.' };
}

export const meaningOf = (state: PointCardState): string =>
  RISK_MEANING[state === 'HIGH' ? 'HIGH' : state === 'MEDIUM' ? 'MEDIUM' : state === 'LOW' ? 'LOW' : 'UNKNOWN'];

export interface SeriesModel {
  /** Trechos contínuos (x em 0–1 da janela, p = probabilidade). UNKNOWN ou sem valor quebra o trecho. */
  runs: Array<Array<{ x: number; p: number }>>;
  /** Faixas sem previsão (x0–x1 em 0–1). */
  gaps: Array<{ x0: number; x1: number }>;
  thresholds: RiskThresholds | null;
}

/** Série de probabilidade das últimas `hours` h até `now`, normalizada. Sem previsão fica como lacuna, nunca como 0 %. */
export function seriesModel(items: readonly PredictionSummary[], now: number, hours = 12): SeriesModel {
  const t0 = now - hours * 3_600_000;
  const sorted = items.map((i) => ({ i, t: Date.parse(i.issuedAt) })).filter((x) => Number.isFinite(x.t) && x.t >= t0 && x.t <= now).sort((a, b) => a.t - b.t);
  const runs: SeriesModel['runs'] = [];
  const gaps: SeriesModel['gaps'] = [];
  let cur: SeriesModel['runs'][number] | null = null;
  let gapStart: number | null = null;
  const xOf = (t: number) => (t - t0) / (now - t0);
  for (const { i, t } of sorted) {
    if (i.riskLevel === 'UNKNOWN' || i.probability == null) {
      cur = null;
      if (gapStart == null) gapStart = xOf(t);
      continue;
    }
    if (gapStart != null) { gaps.push({ x0: gapStart, x1: xOf(t) }); gapStart = null; }
    if (!cur) { cur = []; runs.push(cur); }
    cur.push({ x: xOf(t), p: i.probability });
  }
  if (gapStart != null) gaps.push({ x0: gapStart, x1: 1 });
  const thresholds = [...items].reverse().find((i) => i.riskThresholds)?.riskThresholds ?? null;
  return { runs, gaps, thresholds };
}

/** y do SVG (0 em cima) em escala de raiz quadrada. */
export const yScaled = (p: number, h: number): number => (1 - sqrtScale(p)) * h;
