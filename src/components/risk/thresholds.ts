import type { RiskLevel, RiskThresholds } from '@/features/map/schemas/floodPointResponse.schema';

/**
 * Nível a partir de uma probabilidade e dos limiares que a API enviou (`riskThresholds`), com `>=`:
 * p >= alto é ALTO; p >= moderado é MODERADO. Nunca usa constante: sem limiares ou sem probabilidade
 * devolve null (não classifica; a tela mostra "sem classe", não "baixo").
 */
export function riskOf(p: number | null | undefined, thresholds: Pick<RiskThresholds, 'medium' | 'high'> | null | undefined): Exclude<RiskLevel, 'UNKNOWN'> | null {
  if (p == null || !Number.isFinite(p) || !thresholds) return null;
  if (p >= thresholds.high) return 'HIGH';
  if (p >= thresholds.medium) return 'MEDIUM';
  return 'LOW';
}

/** Sempre 1 casa decimal ("0,9%", "1,6%", "24,4%", "31,0%"); null vira "—". */
export function pctTxt(p: number | null | undefined): string {
  if (p == null || !Number.isFinite(p)) return '—';
  const v = p * 100;
  return `${v.toFixed(1).replace('.', ',')}%`;
}

/** Escala de raiz quadrada: abre a faixa baixa (0–10 %), onde ficam os limiares do modelo. */
export function sqrtScale(v: number): number {
  return Math.sqrt(Math.max(0, Math.min(1, v)));
}

/** Limiares vigentes: os da primeira previsão que os traz (todas vêm do mesmo metadata do modelo). Sem nenhum, null. */
export function thresholdsOf(items: ReadonlyArray<{ floodPrediction?: { riskThresholds?: RiskThresholds | null } | null }> | null | undefined): RiskThresholds | null {
  for (const i of items ?? []) if (i.floodPrediction?.riskThresholds) return i.floodPrediction.riskThresholds;
  return null;
}

/** Faixa de cada classe em texto, a partir dos limiares: "abaixo de 1,6%", "de 1,6% até abaixo de 24%", "24% ou mais". */
export function bandText(level: Exclude<RiskLevel, 'UNKNOWN'>, t: Pick<RiskThresholds, 'medium' | 'high'>): string {
  switch (level) {
    case 'LOW': return `abaixo de ${pctTxt(t.medium)}`;
    case 'MEDIUM': return `de ${pctTxt(t.medium)} até abaixo de ${pctTxt(t.high)}`;
    case 'HIGH': return `${pctTxt(t.high)} ou mais`;
  }
}
