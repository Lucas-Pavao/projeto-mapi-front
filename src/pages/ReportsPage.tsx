import React from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { QueryState } from '@/components/ui/query-state';
import { useReports } from '@/features/reports/hooks/useReports';
import { formatRecife } from '@/features/map/utils/datetime';

export const ReportsPage: React.FC = () => {
  const query = useReports('PENDING');
  return (
    <PageShell title="Relatos" description="Fila de relatos de alagamento enviados por moradores, aguardando conferência.">
      <QueryState query={query} what="os relatos" isEmpty={(d) => d.content.length === 0} emptyTitle="Nenhum relato pendente.">
        {(page) => (
          <ul className="space-y-2">
            {page.content.map((r) => (
              <li key={r.id} className="rounded-xl border border-border bg-card p-4 text-body">
                <p className="text-body-strong text-foreground">Relato #{r.id} · {formatRecife(r.observedAt)}</p>
                <p className="text-muted-foreground">
                  {r.nearestPointSlug ? `Ponto mais próximo: ${r.nearestPointSlug} (${r.nearestPointDistanceM ?? '—'} m)` : 'Sem ponto próximo'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    </PageShell>
  );
};
export default ReportsPage;
