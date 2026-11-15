import type { CandidateRole, MonthStatus, RainCandidate } from '../schemas/rain-candidates.schema';

export const MONTH_STATUS_TEXT: Record<MonthStatus, string> = {
  OK: 'mês OK',
  UNCHECKED: 'mês sem checagem',
  FAIL: 'reprovada no mês',
  OFFLINE: 'offline',
};

export const REASON_TEXT: Record<string, string> = {
  PARTIAL_COVERAGE: 'cobertura parcial',
  STUCK_ZERO: 'zero travado',
  UNDERCATCH: 'subestima',
  OVERCATCH: 'superestima',
  FEW_WET_NEIGHBORS: 'poucas vizinhas com chuva',
};

export const ROLE_TAG: Record<CandidateRole, string> = { USED: 'usada', LOWER: 'menor', EXCLUDED: 'fora', NO_VALUE: 'sem valor' };

/** "690 m" ou "1,2 km". */
export function distanceText(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;
}

/** "mês OK" ou "reprovada no mês (zero travado, subestima)". */
export function candidateStatus(c: Pick<RainCandidate, 'monthStatus' | 'reasons'>): string {
  const base = MONTH_STATUS_TEXT[c.monthStatus];
  return c.reasons.length > 0 ? `${base} (${c.reasons.map((r) => REASON_TEXT[r] ?? r).join(', ')})` : base;
}

/** Valor da candidata: excluída = "—"; válida sem valor = "sem dado" (nunca 0). */
export function candidateValue(c: Pick<RainCandidate, 'role' | 'valueMm'>): string {
  if (c.role === 'EXCLUDED') return '—';
  if (c.valueMm == null) return 'sem dado';
  return `${c.valueMm.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mm`;
}
