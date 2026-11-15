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

/** "3,2%" até 10 % (1 casa), "24%" a partir daí; null vira "—". Probabilidades de 1 % a 10 % não somem no arredondamento. */
export function pctTxt(p: number | null | undefined): string {
  if (p == null || !Number.isFinite(p)) return '—';
  const v = p * 100;
  return `${(v < 10 ? v.toFixed(1) : Math.round(v).toString()).replace('.', ',')}%`;
}

/** Escala de raiz quadrada: abre a faixa baixa (0–10 %), onde ficam os limiares do modelo. */
export function sqrtScale(v: number): number {
  return Math.sqrt(Math.max(0, Math.min(1, v)));
}
