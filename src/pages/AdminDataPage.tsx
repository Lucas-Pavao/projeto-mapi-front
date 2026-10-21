import React from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { QueryState } from '@/components/ui/query-state';
import { useIngestionSources } from '@/features/admin/hooks/useAdminData';
import { formatRecife } from '@/features/map/utils/datetime';
import type { IngestionStatus } from '@/types/api';

const STATUS_LABEL: Record<IngestionStatus, string> = { OK: 'Em dia', DELAYED: 'Atrasada', FAILING: 'Com falha', QUARANTINED: 'Em quarentena', IDLE: 'Parada' };

export const AdminDataPage: React.FC = () => {
  const query = useIngestionSources();
  return (
    <PageShell title="Dados" description="Estado da ingestão por fonte.">
      <QueryState query={query} what="as fontes" emptyTitle="Nenhuma fonte cadastrada.">
        {(items) => (
          <ul className="grid gap-2 sm:grid-cols-2">
            {items.map((s) => (
              <li key={s.source} className="rounded-xl border border-border bg-card p-4">
                <p className="font-mono text-sm font-bold text-foreground">{s.source}</p>
                <p className="text-sm text-foreground">{STATUS_LABEL[s.status]}</p>
                <p className="text-xs text-muted-foreground">Último sucesso: {formatRecife(s.lastSuccessAt) ?? 'nunca'}</p>
                {s.lastError && <p className="text-xs text-destructive">{s.lastError}</p>}
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    </PageShell>
  );
};
export default AdminDataPage;
