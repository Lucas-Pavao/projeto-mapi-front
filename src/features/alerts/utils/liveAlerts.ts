import type { QueryClient } from '@tanstack/react-query';
import { ALERTS_KEY } from '../hooks/useAlerts';
import type { Alert, AlertPage } from '../schemas/alert.schema';

/**
 * Aplica um alerta recebido pelo stream aos caches. Na lista OPEN: entra no topo se ainda está
 * aberto, sai se já foi reconhecido. As outras listas (reconhecidos, todos) são revalidadas.
 */
export function applyLiveAlert(qc: QueryClient, alert: Alert): void {
  qc.setQueriesData<AlertPage>({ queryKey: [...ALERTS_KEY, 'OPEN'] }, (old) => {
    if (!old) return old;
    const exists = old.content.some((a) => a.id === alert.id);
    if (alert.acknowledgedAt) {
      if (!exists) return old;
      return { ...old, totalElements: Math.max(0, old.totalElements - 1), content: old.content.filter((a) => a.id !== alert.id) };
    }
    if (exists) return { ...old, content: old.content.map((a) => (a.id === alert.id ? alert : a)) };
    return { ...old, totalElements: old.totalElements + 1, content: [alert, ...old.content] };
  });
  void qc.invalidateQueries({ queryKey: ALERTS_KEY, predicate: (q) => q.queryKey[1] !== 'OPEN' });
}
