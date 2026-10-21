import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { EmptyState, QueryState } from '@/components/ui/query-state';
import { RiskBadge } from '@/components/risk/RiskBadge';
import { ExperimentalBadge } from '@/components/risk/ExperimentalBadge';
import { RISK_MEANING, degradationText, formatProbability, getRiskVisual, showsExperimentalLabel } from '@/components/risk/risk';
import { formatRecife } from '@/features/map/utils/datetime';
import { usePredictionSeries } from '@/features/points/hooks/usePredictionSeries';
import { useFloodPoints } from '@/features/points/hooks/useFloodPoints';
import { usePoint } from '@/features/points/hooks/usePoint';
import { PointHeader } from '@/features/points/components/PointHeader';
import { PointList } from '@/features/points/components/PointList';
import { ProbabilityChart } from '@/features/points/components/ProbabilityChart';
import { ContributorsPanel, TerrainPanel, WaterWeatherPanel } from '@/features/points/components/PointPanels';
import { PageFrame, Panel, PanelTitle } from '@/features/operacao/components/Panel';
import { httpStatus } from '@/lib/apiError';
import { cn } from '@/lib/utils';
import type { PredictionSummary } from '@/features/points/schemas/prediction.schema';

const MapLink: React.FC = () => (
  <Link to="/map" className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-body-strong text-foreground hover:bg-muted md:h-8">
    <ArrowLeft className="size-4" aria-hidden="true" /> Voltar ao mapa
  </Link>
);

export const PointPage: React.FC = () => {
  const { slug = '' } = useParams();
  const point = usePoint(slug);
  const all = useFloodPoints();
  const series = usePredictionSeries(slug);
  const [now] = useState(() => Date.now());

  const items = useMemo(() => [...(series.data?.items ?? [])].sort((a, b) => Date.parse(a.issuedAt) - Date.parse(b.issuedAt)), [series.data]);
  const p = point.data;
  const latest = useMemo<PredictionSummary | null>(() => items[items.length - 1] ?? null, [items]);

  if (point.isError && httpStatus(point.error) === 404) {
    return (
      <PageShell title="Ponto não encontrado" actions={<MapLink />}>
        <EmptyState title={`Não existe ponto com o identificador “${slug}”.`} hint="Ele pode ter sido desativado. Escolha um ponto no mapa." />
      </PageShell>
    );
  }

  const unknown = latest?.riskLevel === 'UNKNOWN';
  const pct = latest ? formatProbability(latest.riskLevel, latest.probability) : null;
  return (
    <PageFrame className="lg:flex-row">
      <PointList points={all.data} current={slug} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 lg:grid lg:grid-cols-12 lg:grid-rows-[auto_1fr_1fr] lg:overflow-y-auto">
        <div className="lg:col-span-12">
          <QueryState query={point} what="o ponto">
            {(pt) => (
              <>
                {!pt.active && <p role="status" className="mb-4 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-body text-warning">Ponto desativado: sem previsões novas.</p>}
                <PointHeader point={pt} prediction={latest} />
              </>
            )}
          </QueryState>
        </div>
        {p && (
          <>
            <Panel aria-label="Probabilidade ao longo do dia" className="min-h-[300px] lg:col-span-7">
              <div className="flex items-baseline justify-between">
                <PanelTitle>Probabilidade de alagamento (próximas 3 h)</PanelTitle>
                <span className={cn('font-mono text-[28px] font-extrabold leading-8', latest ? getRiskVisual(latest.riskLevel).text : 'text-muted-foreground')}>{pct ?? '—'}</span>
              </div>
              {series.isError ? (
                <p role="alert" className="m-0 flex-1 text-[13px] text-warning">Não foi possível carregar as previsões. Confira a conexão e recarregue.</p>
              ) : (
                <ProbabilityChart items={items} now={now} latest={latest} />
              )}
              <p className="m-0 text-[13px] leading-[18px]">
                {latest ? RISK_MEANING[latest.riskLevel] : 'Sem previsões nas últimas 24 h.'}
              </p>
            </Panel>
            <div className="flex min-h-0 flex-col lg:col-span-5"><ContributorsPanel contributors={p.floodPrediction?.contributors} unknown={unknown} /></div>
            <div className="flex flex-col lg:col-span-7"><WaterWeatherPanel point={p} /></div>
            <div className="flex flex-col lg:col-span-5"><TerrainPanel slug={p.slug} distanceToChannelM={p.distanceToChannelM} /></div>
            {items.length > 0 && <HistoricoAcessivel items={items} />}
          </>
        )}
      </div>
    </PageFrame>
  );
};

/** Histórico em texto para leitor de tela: mesmos dados da curva, uma linha por previsão. */
const HistoricoAcessivel: React.FC<{ items: PredictionSummary[] }> = ({ items }) => (
  <section aria-label="Histórico de risco" className="sr-only">
    <h2>Risco nas últimas 24 h</h2>
    <ul>
      {items.map((it) => (
        <li key={it.issuedAt} data-risk={it.riskLevel}>
          {formatRecife(it.issuedAt)}: <RiskBadge level={it.riskLevel} probability={it.probability} />
          {showsExperimentalLabel(it) && <ExperimentalBadge />}
          {it.riskLevel === 'UNKNOWN' && ` ${degradationText(it.degradationReason)}`}
        </li>
      ))}
    </ul>
  </section>
);
export default PointPage;
