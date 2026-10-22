import { useTokenColor } from '@/lib/tokens';
import type { RiskLevel } from '@/features/map/schemas/floodPointResponse.schema';
import { getRiskVisual } from './risk';

const RISK_TOKEN: Record<RiskLevel, string> = {
  LOW: '--risk-low',
  MEDIUM: '--risk-moderate',
  HIGH: '--risk-high',
  UNKNOWN: '--risk-unknown',
};

/** Preenchimento do nível lido do token em runtime (para paint do MapLibre); cai no hex do tema escuro. */
export function useRiskFill(level: RiskLevel | null | undefined): string {
  const l: RiskLevel = level ?? 'UNKNOWN';
  return useTokenColor(RISK_TOKEN[l], getRiskVisual(l).hex);
}
