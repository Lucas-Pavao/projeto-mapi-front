import type { Timeline } from '@/features/events/schemas/timeline.schema';
import { HOUR_MS, toTimePts, type TimePt } from '@/components/charts/chartMath';
import { nearestPoint } from '@/features/events/utils/tide';
import type { RiskLevel } from '../schemas/floodPointResponse.schema';
import type { FloodPointResponseDTO } from '../types';

/** "0,7" / "0,22": vírgula decimal (pt-BR). */
export const fmtNum = (v: number, digits = 1): string => v.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Chuva média das estações em cada instante da janela (valor nulo não entra na média; sem nenhum, fica nulo). */
export function meanRainSeries(rain: Timeline['rain']): TimePt[] {
  const byT = new Map<number, number[]>();
  for (const station of rain) {
    for (const p of toTimePts(station.points)) {
      const arr = byT.get(p.t) ?? [];
      if (p.v != null) arr.push(p.v);
      byT.set(p.t, arr);
    }
  }
  return [...byT.entries()].sort((a, b) => a[0] - b[0]).map(([t, vs]) => ({ t, v: vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : null }));
}

/** Último valor de chuva até `nowMs` (a hora fechada mais recente). */
export function rainNow(series: readonly TimePt[], nowMs: number): number | null {
  for (let i = series.length - 1; i >= 0; i--) {
    const p = series[i];
    if (p.t <= nowMs + HOUR_MS && p.v != null) return p.v;
  }
  return null;
}

/** Maré no instante (ponto mais próximo, até 30 min) e a direção pela inclinação da tábua logo depois. */
export function tideNow(series: readonly TimePt[], nowMs: number): { v: number; rising: boolean | null } | null {
  const cur = nearestPoint(series, nowMs);
  if (!cur) return null;
  const next = nearestPoint(series, cur.t + 30 * 60_000, 15 * 60_000);
  const rising = next && next.t > cur.t && next.v !== cur.v ? next.v > cur.v : null;
  return { v: cur.v, rising };
}

const RANK: Record<RiskLevel, number> = { HIGH: 0, MEDIUM: 1, UNKNOWN: 2, LOW: 3 };

/** Alto primeiro; depois Moderado, Previsão indisponível (nunca "escondida" como baixo) e Baixo; dentro do nível, maior probabilidade. */
export function sortPoints(points: readonly FloodPointResponseDTO[]): FloodPointResponseDTO[] {
  const lvl = (p: FloodPointResponseDTO): RiskLevel => p.floodPrediction?.riskLevel ?? 'UNKNOWN';
  return [...points].sort((a, b) => RANK[lvl(a)] - RANK[lvl(b)] || (b.floodPrediction?.floodProbability ?? -1) - (a.floodPrediction?.floodProbability ?? -1) || a.name.localeCompare(b.name));
}

/** Série de probabilidade (0–1) por ponto para a minilinha; UNKNOWN e sem probabilidade viram buraco (null). */
export function probabilityByPoint(risk: Timeline['risk']): Map<string, Array<number | null>> {
  const out = new Map<string, Array<number | null>>();
  for (const r of risk) {
    const items = [...r.items].sort((a, b) => Date.parse(a.issuedAt) - Date.parse(b.issuedAt));
    out.set(r.slug, items.map((i) => (i.riskLevel === 'UNKNOWN' ? null : i.probability ?? null)));
  }
  return out;
}

/** Estado do rio pelas cotas oficiais da APAC. Sem cotas, sem estado (null). */
export function riverState(level: number | null, s: { riverPreAlertLevel?: number | null; riverAlertLevel?: number | null; riverFloodLevel?: number | null }): 'normal' | 'Pré-alerta' | 'Alerta' | 'Inundação' | null {
  if (level == null) return null;
  const { riverPreAlertLevel: pre, riverAlertLevel: alert, riverFloodLevel: flood } = s;
  if (pre == null && alert == null && flood == null) return null;
  if (flood != null && level >= flood) return 'Inundação';
  if (alert != null && level >= alert) return 'Alerta';
  if (pre != null && level >= pre) return 'Pré-alerta';
  return 'normal';
}
