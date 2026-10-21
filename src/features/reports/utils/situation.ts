import type { RiskLevel } from '@/features/map/schemas/floodPointResponse.schema';

/** Ordem de leitura do relatório: Alto, Moderado, indisponível (não é baixo), Baixo. */
const RISK_ORDER: Record<RiskLevel, number> = { HIGH: 0, MEDIUM: 1, UNKNOWN: 2, LOW: 3 };

export function sortByRisk<T extends { floodPrediction?: { riskLevel?: RiskLevel | null } | null; name: string }>(points: readonly T[]): T[] {
  return [...points].sort((a, b) => {
    const ra = RISK_ORDER[a.floodPrediction?.riskLevel ?? 'UNKNOWN'] ?? 2;
    const rb = RISK_ORDER[b.floodPrediction?.riskLevel ?? 'UNKNOWN'] ?? 2;
    return ra - rb || a.name.localeCompare(b.name, 'pt-BR');
  });
}

export interface RainTotal {
  /** Soma das barras horárias da janela, em mm. */
  totalMm: number;
  /** Maior valor numa hora, em mm, e o fim dessa hora (ISO). */
  maxHourMm: number;
  maxHourEnd: string | null;
  /** Quantas horas vieram sem valor (nulo): o total vale só para as horas com leitura. */
  missingHours: number;
}

/** Totais de chuva a partir dos pontos horários da API (t = fim da hora). Nada é estimado para horas sem leitura. */
export function rainTotal(points: ReadonlyArray<{ t: string; v: number | null }>): RainTotal {
  let total = 0;
  let max = 0;
  let maxEnd: string | null = null;
  let missing = 0;
  for (const p of points) {
    if (p.v == null) {
      missing++;
      continue;
    }
    total += p.v;
    if (p.v > max) {
      max = p.v;
      maxEnd = p.t;
    }
  }
  return { totalMm: Math.round(total * 100) / 100, maxHourMm: max, maxHourEnd: maxEnd, missingHours: missing };
}
