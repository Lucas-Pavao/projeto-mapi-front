import React from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { QueryState } from '@/components/ui/query-state';
import { useTideTable } from '@/features/map/hooks/useTideTable';

export const TidePage: React.FC = () => {
  const query = useTideTable('pe02');
  return (
    <PageShell title="Maré" description="Tábua de maré do porto de referência.">
      <QueryState query={query} what="a tábua de maré" isEmpty={(t) => t.months.length === 0} emptyTitle="Sem tábua de maré para este ano.">
        {(t) => (
          <div className="rounded-xl border border-border bg-card p-4 text-sm">
            <p className="font-bold text-foreground">{t.harborName}</p>
            <p className="text-muted-foreground">Ano {t.year} · fonte {t.dataCollectionInstitution}</p>
            <p className="font-mono text-foreground">Nível médio {t.meanLevel.toLocaleString('pt-BR')} m</p>
          </div>
        )}
      </QueryState>
    </PageShell>
  );
};
export default TidePage;
