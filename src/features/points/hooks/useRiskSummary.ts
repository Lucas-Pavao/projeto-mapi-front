import { replaceEqualDeep, useQuery } from '@tanstack/react-query';
import { predictionsService } from '../services/predictions.service';
import type { RiskSummary } from '../schemas/prediction.schema';

export const RISK_SUMMARY_KEY = ['points', 'risk-summary'] as const;

/** Mantém o dado mais novo (por `computedAt`): consulta atrasada não sobrescreve o que o stream já trouxe. */
export function newestRiskSummary(old: unknown, next: unknown): unknown {
  const o = old as RiskSummary | undefined;
  const n = next as RiskSummary | undefined;
  if (o && n && Date.parse(o.computedAt) > Date.parse(n.computedAt)) return o;
  return replaceEqualDeep(old, next);
}

/** Contagem por nível de risco. O stream (`risk-summary`) escreve neste mesmo cache. */
export const useRiskSummary = (enabled = true) =>
  useQuery({
    queryKey: RISK_SUMMARY_KEY,
    queryFn: predictionsService.riskSummary,
    structuralSharing: newestRiskSummary,
    enabled,
    refetchInterval: 60_000,
  });
