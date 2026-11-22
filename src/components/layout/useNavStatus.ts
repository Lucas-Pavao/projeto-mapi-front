import { useQuery } from '@tanstack/react-query';
import { useAlerts } from '@/features/alerts/hooks/useAlerts';
import { REPORTS_KEY } from '@/features/reports/hooks/useReports';
import { reportsService } from '@/features/reports/services/reports.service';
import { useFloodPoints } from '@/features/points/hooks/useFloodPoints';
import { hasRole } from '@/lib/roles';
import type { Role } from '@/lib/apiSchemas';

/**
 * Dados da barra: contadores dos selos (alertas abertos, relatos pendentes; só OPERADOR e ADMIN, ADR 0010)
 * e se a API responde (a lista de pontos, que o mapa compartilha).
 */
export function useNavStatus(role: Role) {
  const operator = hasRole(role, 'OPERADOR');
  const alerts = useAlerts('OPEN', { size: 1, enabled: operator });
  const reports = useQuery({ queryKey: [...REPORTS_KEY, 'PENDING', 0, 1], queryFn: () => reportsService.list('PENDING', 0, 1), enabled: operator });
  const points = useFloodPoints();
  return {
    counts: { alerts: operator ? alerts.data?.totalElements ?? 0 : 0, reports: operator ? reports.data?.totalElements ?? 0 : 0 },
    apiDown: points.isError,
  };
}
