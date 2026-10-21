import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { EmptyState, QueryState } from '@/components/ui/query-state';
import { TideDatumNotice } from '@/components/TideDatumNotice';
import { usePredictionSeries } from '@/features/points/hooks/usePredictionSeries';
import { usePoint } from '@/features/points/hooks/usePoint';
import { RiskNowCard } from '@/features/points/components/RiskNowCard';
import { RiskHistory } from '@/features/points/components/RiskHistory';
import { TerrainFacts } from '@/features/map/components/TerrainFacts';
import { httpStatus } from '@/lib/apiError';
import type { PredictionSummary } from '@/features/points/schemas/prediction.schema';

const MapLink: React.FC<{ className?: string }> = ({ className }) => (
  <Link to="/map" className={`inline-flex h-11 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-body-strong text-foreground hover:bg-muted md:h-8 ${className ?? ''}`}>
    <ArrowLeft className="size-4" aria-hidden="true" /> Voltar ao mapa
  </Link>
);

export const PointPage: React.FC = () => {
  const { slug = '' } = useParams();
  const point = usePoint(slug);
  const series = usePredictionSeries(slug);

  const latest = useMemo<PredictionSummary | null>(() => {
    const items = series.data?.items ?? [];
    if (items.length === 0) return null;
    return items.reduce((a, b) => (Date.parse(b.issuedAt) > Date.parse(a.issuedAt) ? b : a));
  }, [series.data]);

  if (point.isError && httpStatus(point.error) === 404) {
    return (
      <PageShell title="Ponto não encontrado" actions={<MapLink />}>
        <EmptyState title={`Não existe ponto com o identificador “${slug}”.`} hint="Ele pode ter sido desativado. Escolha um ponto no mapa." />
      </PageShell>
    );
  }

  const p = point.data;
  return (
    <PageShell
      title={p?.name ?? `Ponto ${slug}`}
      description={p ? [p.municipality, p.description].filter(Boolean).join(' · ') || undefined : undefined}
      actions={<MapLink />}
    >
      <QueryState query={point} what="o ponto">
        {(pt) => (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-4">
              {!pt.active && <p role="status" className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-body text-warning">Ponto desativado: sem previsões novas.</p>}
              <QueryState
                query={series}
                what="as previsões"
                isEmpty={(d) => d.items.length === 0}
                emptyTitle="Sem previsões nas últimas 24 h."
                emptyHint="Quando o modelo emitir uma previsão para este ponto, ela aparece aqui."
              >
                {() => <RiskNowCard prediction={latest} />}
              </QueryState>
              <dl className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4 text-body" aria-label="Dados do ponto">
                <div><dt className="text-caption text-muted-foreground">Coordenadas</dt><dd className="text-reading text-foreground">{pt.latitude.toFixed(5)}, {pt.longitude.toFixed(5)}</dd></div>
                <div><dt className="text-caption text-muted-foreground">Bacia</dt><dd className="text-foreground">{pt.basinName ?? '—'}</dd></div>
                <div><dt className="text-caption text-muted-foreground">Altitude</dt><dd className="text-reading text-foreground">{pt.altitudeM != null ? `${pt.altitudeM} m` : '—'}</dd></div>
                <div><dt className="text-caption text-muted-foreground">Distância ao canal</dt><dd className="text-reading text-foreground">{pt.distanceToChannelM != null ? `${pt.distanceToChannelM} m` : '—'}</dd></div>
                <div className="col-span-2">
                  <dt className="text-caption text-muted-foreground">Estações ligadas ao ponto</dt>
                  <dd className="text-code text-foreground">
                    {[...(pt.sensorConfig?.pluviometerStationIds ?? []), ...(pt.sensorConfig?.riverLevelStationIds ?? [])].join(', ') || 'nenhuma configurada'}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="flex min-w-0 flex-col gap-4">
              <TerrainFacts slug={pt.slug} />
              {pt.tideHeight != null && (
                <p className="rounded-xl border border-border bg-card p-4 text-body text-foreground">
                  Maré agora: <span className="text-reading">{pt.tideHeight.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} {pt.tideUnit ?? 'm (NR da DHN)'}</span>
                </p>
              )}
              <TideDatumNotice />
            </div>
            {series.data && series.data.items.length > 0 && (
              <div className="min-w-0 lg:col-span-2"><RiskHistory items={series.data.items} /></div>
            )}
          </div>
        )}
      </QueryState>
    </PageShell>
  );
};
export default PointPage;
