import { useQuery } from '@tanstack/react-query';
import { useAlerts } from '@/features/alerts/hooks/useAlerts';
import { REPORTS_KEY } from '@/features/reports/hooks/useReports';
import { reportsService } from '@/features/reports/services/reports.service';
import { useRiskSummary } from '@/features/points/hooks/useRiskSummary';
import { hasRole, type Role } from '@/lib/roles';

/**
 * Dados da barra: contadores dos selos (alertas abertos, relatos pendentes; só OPERADOR e ADMIN, ADR 0010)
 * e se a API responde (a contagem de risco é a consulta mais leve, e o mapa a compartilha).
 */
export function useNavStatus(role: Role) {
  const operator = hasRole(role, 'OPERADOR');
  const alerts = useAlerts('OPEN', { size: 1, enabled: operator });
  const reports = useQuery({ queryKey: [...REPORTS_KEY, 'PENDING', 0, 1], queryFn: () => reportsService.list('PENDING', 0, 1), enabled: operator });
  const summary = useRiskSummary();
  return {
    counts: { alerts: operator ? alerts.data?.totalElements ?? 0 : 0, reports: operator ? reports.data?.totalElements ?? 0 : 0 },
    apiDown: summary.isError,
  };
}
