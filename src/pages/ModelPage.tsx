import React from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { QueryState } from '@/components/ui/query-state';
import { useModelEvaluation } from '@/features/model/hooks/useModelEvaluation';
import { formatRecife } from '@/features/map/utils/datetime';

export const ModelPage: React.FC = () => {
  const query = useModelEvaluation();
  return (
    <PageShell title="Modelo" description="Avaliação congelada do modelo de previsão. Os números são exibidos como foram gerados, sem recálculo.">
      <QueryState query={query} what="a avaliação" isEmpty={(d) => Object.keys(d.result).length === 0} emptyTitle="Avaliação indisponível.">
        {(d) => (
          <div className="space-y-2 rounded-xl border border-border bg-card p-4 text-body">
            <p className="text-muted-foreground">Fonte: <span className="font-mono text-foreground">{d.source}</span></p>
            <p className="text-muted-foreground">SHA-256: <span className="break-all text-code text-foreground">{d.sha256}</span></p>
            {d.frozenAt && <p className="text-muted-foreground">Congelada em {formatRecife(d.frozenAt)}</p>}
          </div>
        )}
      </QueryState>
    </PageShell>
  );
};
export default ModelPage;
