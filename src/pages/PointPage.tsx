import React from 'react';
import { useParams } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { QueryState } from '@/components/ui/query-state';
import { usePredictionSeries } from '@/features/points/hooks/usePredictionSeries';
import { RiskBadge } from '@/features/map/components/RiskBadge';
import { ExperimentalBadge } from '@/features/map/components/ExperimentalBadge';
import { showsExperimentalLabel } from '@/features/map/utils/risk';
import { formatRecife } from '@/features/map/utils/datetime';

export const PointPage: React.FC = () => {
  const { slug = '' } = useParams();
  const query = usePredictionSeries(slug);
  return (
    <PageShell title={`Ponto ${slug}`} description="Previsões das últimas 24 h. Detalhe completo chega na F2.">
      <QueryState query={query} what="as previsões" isEmpty={(d) => d.items.length === 0} emptyTitle="Sem previsões nas últimas 24 h.">
        {(d) => (
          <ul className="space-y-2">
            {d.items.map((p) => (
              <li key={p.issuedAt} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
                <span className="font-mono text-sm text-foreground">{formatRecife(p.issuedAt)}</span>
                <RiskBadge level={p.riskLevel} probability={p.probability} />
                {showsExperimentalLabel(p) && <ExperimentalBadge />}
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    </PageShell>
  );
};
export default PointPage;
