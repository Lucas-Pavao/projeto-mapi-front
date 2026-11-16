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


/** "nas próximas 6 h" quando o modelo declara horizonte (v3); null no nowcast (v2, sem horizonte). */
export function horizonPhrase(p: Pick<FloodPrediction, 'horizonHours'> | null | undefined): string | null {
  return p?.horizonHours ? `nas próximas ${p.horizonHours} h` : null;
}

/** "Risco de alagamento nas próximas 6 h" (v3) ou "Risco de alagamento agora" (sem horizonte). */
export function riskHeadline(p: Pick<FloodPrediction, 'horizonHours'> | null | undefined): string {
  const h = horizonPhrase(p);
  return h ? `Risco de alagamento ${h}` : 'Risco de alagamento agora';
}

const RAIN_IDS = new Set(['current_rainfall', 'rainfall_3h_accumulated', 'rainfall_6h_accumulated', 'rainfall_12h_accumulated',
  'rainfall_24h_accumulated', 'rain_0_1h', 'rain_1_3h', 'rain_3_6h', 'rain_6_12h', 'rain_12_24h']);
/** Entradas que não entram no modelo em uso: ausentes, mas sem efeito na previsão. Não ganham destaque. */
const NOT_USED = new Set(['river_level', 'river_level_m', 'soil_moisture', 'rain_max_10min_mm']);

/** Entradas que faltaram nesta previsão e o modelo usa (a ausência pesa): para o aviso visível. */
export function absentInputs(p: Pick<FloodPrediction, 'imputedFeatures'> | null | undefined): { featureId: string; label: string }[] {
  return (p?.imputedFeatures ?? []).filter((i) => !NOT_USED.has(i.featureId));
}

/** Motivo do UNKNOWN por falta de dado, pelo que faltou: chuva medida ou maré. */
export function insufficientText(p: Pick<FloodPrediction, 'imputedFeatures'> | null | undefined): string {
  const ids = new Set((p?.imputedFeatures ?? []).map((i) => i.featureId));
  const rain = [...ids].some((id) => RAIN_IDS.has(id));
  if (ids.has('tide_level') && !rain) return 'sem maré prevista agora';
  if (ids.has('tide_level')) return 'sem chuva medida suficiente nem maré prevista agora';
  return 'sem chuva medida suficiente agora';
}

/** De onde veio a chuva que ENTROU nesta previsão (não a do treino). */
export function rainInputText(p: Pick<FloodPrediction, 'rainSource' | 'rainInput'> | null | undefined): string | null {
  const src = p?.rainInput?.source ?? p?.rainSource;
  if (!src) return null;
  const age = p?.rainInput?.ageMinutes;
  const ageTxt = age != null ? `, leitura mais recente há ${age} min` : '';
  if (src === 'MEASURED') return `Chuva medida (pluviômetros do Cemaden, maior valor entre as estações válidas a até 5 km)${ageTxt}.`;
  if (src === 'REANALYSIS_FALLBACK') return 'Chuva ESTIMADA (Open-Meteo), não medida: faltou chuva medida e o recurso reserva está ligado.';
  return null;
}

const mm = (v: number) => `${v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mm`;
const RAIN_SOURCE_LABEL: Record<string, string> = { CEMADEN_PED: 'pluviômetros do Cemaden', OPEN_METEO_FORECAST: 'previsão do Open-Meteo' };

export interface RainForecastLine {
  horizonHours: number;
  /** "de 0,2 a 4,0 mm": a faixa entre os quantis de 50% e 95%, nunca um número único. */
  band: string;
  /** "em 8 de cada 10 vezes, até 1,1 mm". */
  typical: string;
  probFortePct: string | null;
}

/** Chuva MEDIDA que entrou na previsão: última hora e 3 h. Null quando a API não mandou valor (ausente não é zero). */
export function measuredRainText(p: Pick<FloodPrediction, 'rainInput'> | null | undefined): string | null {
  const values = p?.rainInput?.values ?? [];
  const of = (id: string) => values.find((v) => v.featureId === id)?.valueMm;
  const h1 = of('current_rainfall');
  const h3 = of('rainfall_3h_accumulated');
  if (h1 == null && h3 == null) return null;
  const parts = [h1 != null ? `${mm(h1)} na última hora` : 'última hora sem dado', h3 != null ? `${mm(h3)} em 3 h` : '3 h sem dado'];
  return parts.join(' · ');
}

/** Chuva PREVISTA por horizonte, como faixa entre quantis. */
export function rainForecastLines(p: Pick<FloodPrediction, 'rainForecast'> | null | undefined): RainForecastLine[] {
  return (p?.rainForecast?.horizons ?? []).map((h) => ({
    horizonHours: h.horizonHours,
    band: `de ${mm(h.q50Mm).replace(' mm', '')} a ${mm(h.q95Mm)}`,
    typical: `em 8 de cada 10 vezes, até ${mm(h.q80Mm)}`,
    probFortePct: h.probForte != null ? pct(h.probForte) : null,
  }));
}

/** "modelo rain_v1 · pluviômetros do Cemaden e previsão do Open-Meteo". */
export function rainForecastOrigin(p: Pick<FloodPrediction, 'rainForecast'> | null | undefined): string | null {
  const f = p?.rainForecast;
  if (!f) return null;
  const src = (f.sources ?? []).map((s) => RAIN_SOURCE_LABEL[s] ?? s).join(' e ');
  return [f.modelVersion ? `modelo ${f.modelVersion}` : null, src || null].filter(Boolean).join(' · ') || null;
}
