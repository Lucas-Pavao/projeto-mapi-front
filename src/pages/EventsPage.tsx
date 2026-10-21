import React from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { QueryState } from '@/components/ui/query-state';
import { useTimeline } from '@/features/events/hooks/useTimeline';

export const EventsPage: React.FC = () => {
  const query = useTimeline(24);
  return (
    <PageShell title="Eventos" description="Linha do tempo das últimas 24 h: chuva, maré, rio e risco por ponto. Gráficos disponíveis em breve.">
      <QueryState
        query={query}
        what="a linha do tempo"
        isEmpty={(t) => t.rain.length + t.river.length + t.risk.length === 0 && t.tide.points.length === 0}
        emptyTitle="Sem dados na janela."
      >
        {(t) => (
          <dl className="grid gap-2 sm:grid-cols-4">
            {[
              ['Estações de chuva', t.rain.length],
              ['Estações de rio', t.river.length],
              ['Pontos com previsão', t.risk.length],
              ['Eventos de alagamento', t.floodEvents?.length ?? 0],
            ].map(([label, n]) => (
              <div key={label} className="rounded-xl border border-border bg-card p-4">
                <dt className="text-caption text-muted-foreground">{label}</dt>
                <dd className="text-reading-lg text-foreground">{n}</dd>
              </div>
            ))}
          </dl>
        )}
      </QueryState>
    </PageShell>
  );
};
export default EventsPage;
