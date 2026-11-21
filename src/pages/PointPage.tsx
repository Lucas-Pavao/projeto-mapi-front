import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { InfoTip } from '@/components/InfoTip';
import { PageShell } from '@/components/layout/PageShell';
import { EmptyState, QueryState } from '@/components/ui/query-state';
import { useAuth } from '@/hooks/useAuth';
import { OnlyInDetail } from '@/lib/detailMode';
import { hasRole, parseRole } from '@/lib/roles';
import { useFloodPoints } from '@/features/points/hooks/useFloodPoints';
import { usePoint } from '@/features/points/hooks/usePoint';
import { PointHeader } from '@/features/points/components/PointHeader';
import { PointList } from '@/features/points/components/PointList';
import { WaterWeatherPanel } from '@/features/points/components/PointPanels';
import { useRainCandidates } from '@/features/points/hooks/useRainCandidates';
import { RainCandidatesPanel } from '@/features/points/components/RainCandidatesPanel';
import { PageFrame, Panel, PanelTitle } from '@/features/operacao/components/Panel';
import { useAlagamentoPontos } from '@/features/alagamento/hooks/useAlagamentoPontos';
import { HorizonBars } from '@/features/alagamento/components/AlertaRegressao';
import { BaldeChart } from '@/features/alagamento/components/BaldeChart';
import { LEGEND_RULE } from '@/features/alagamento/utils/alagamentoText';
import { httpStatus } from '@/lib/apiError';

const MapLink: React.FC = () => (
  <Link to="/map" className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-body-strong text-foreground hover:bg-muted md:h-8">
    <ArrowLeft className="size-4" aria-hidden="true" /> Voltar ao mapa
  </Link>
);

const Title: React.FC<{ children: React.ReactNode; info: string }> = ({ children, info }) => (
  <div className="flex items-center gap-1.5"><PanelTitle>{children}</PanelTitle><InfoTip text={info} /></div>
);

const INFO = {
  forecast: `Lâmina máxima prevista em 1, 3 e 6 h (cenários provável q50 e pessimista q95 do rain_v1, passados pelo balde do ponto) e a lâmina a cada 10 min: medida à esquerda de agora, prevista à direita. ${LEGEND_RULE}`,
  why: 'O que mais mudou a chuva prevista (SHAP local do rain_v1, em mm), quanta chuva a mais levaria a 15 cm e quanto a lâmina muda com os parâmetros sem fonte.',
};

/** Página do ponto (5.5): cabeçalho pelo alerta por regressão, alagamento previsto pelo balde e "Por que este nível". */
export const PointPage: React.FC = () => {
  const { slug = '' } = useParams();
  const point = usePoint(slug);
  const all = useFloodPoints();
  const rain = useRainCandidates(slug);
  const { user } = useAuth();
  const isAdmin = hasRole(parseRole(user?.role), 'ADMIN');
  const al = useAlagamentoPontos(isAdmin);
  const a = al.data?.find((x) => x.slug === slug);
  const bySlug = React.useMemo(() => (isAdmin && al.data ? new Map(al.data.map((x) => [x.slug, x] as const)) : undefined), [isAdmin, al.data]);

  if (point.isError && httpStatus(point.error) === 404) {
    return (
      <PageShell title="Ponto não encontrado" actions={<MapLink />}>
        <EmptyState title={`Não existe ponto com o identificador “${slug}”.`} hint="Ele pode ter sido desativado. Escolha um ponto no mapa." />
      </PageShell>
    );
  }

  const p = point.data;
  const empty = !isAdmin ? 'O alerta de alagamento por regressão é experimental: só o administrador vê enquanto a validação não for aprovada.'
    : al.isLoading ? 'Lendo o alerta de alagamento…'
      : al.isError ? 'Não foi possível ler o alerta de alagamento agora.'
        : !a ? 'Alerta de alagamento ainda não calculado para este ponto.'
          : a.level === 'SEM_DADO' ? `Sem dado: ${a.reasonText ?? 'motivo não informado'}. Sem dado não é sem alerta.` : null;
  const e = a?.explanation;
  return (
    <PageFrame className="lg:flex-row">
      <PointList points={all.data} current={slug} alagamentoBySlug={bySlug} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 lg:grid lg:grid-cols-12 lg:grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)] lg:overflow-y-auto">
        <div className="lg:col-span-12">
          <QueryState query={point} what="o ponto">
            {(pt) => (
              <>
                {!pt.active && <p role="status" className="mb-4 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-body text-warning">Ponto desativado: sem alerta novo.</p>}
                <PointHeader point={pt} alagamento={a} isAdmin={isAdmin} status={al.isLoading ? 'loading' : al.isError ? 'error' : 'ok'} />
              </>
            )}
          </QueryState>
        </div>
        {p && (
          <>
            <Panel aria-label="Alagamento previsto" className="min-h-[300px] lg:col-span-7">
              <Title info={INFO.forecast}>Alagamento previsto · chuva prevista pelo balde</Title>
              {empty ? <p data-testid="point-empty" className="m-0 text-[13px] text-muted-foreground">{empty}</p> : a && (
                <>
                  <HorizonBars horizons={a.horizons} withValidity />
                  <BaldeChart steps={e?.decomposition ?? []} capacityM3H={e?.capacityM3H} only="sheet" />
                </>
              )}
            </Panel>
            <Panel aria-label="Por que este nível" className="lg:col-span-5">
              <Title info={INFO.why}>Por que este nível</Title>
              {empty || !e ? <p className="m-0 text-[13px] text-muted-foreground">{empty ?? 'sem explicação neste ciclo'}</p> : (
                <div className="flex flex-col gap-3 text-[13px] leading-[18px]">
                  <ol data-testid="point-shap" className="m-0 flex list-decimal flex-col gap-1 pl-5">{e.shapTop3.map((s) => <li key={s.text}>{s.text}</li>)}</ol>
                  <p data-testid="point-cf" className="m-0"><span className="text-muted-foreground">Para chegar a 15 cm: </span>{e.counterfactualText ?? '—'}</p>
                  <p data-testid="point-sens" className="m-0"><span className="text-muted-foreground">Sensibilidade: </span>{e.sensitivity?.text ?? '—'}</p>
                  <OnlyInDetail>
                    <p className="m-0 text-xs text-muted-foreground">Parâmetro que mais pesa: {e.sensitivity?.heaviestParameter ?? '—'} · cenário servido {e.servedScenario ?? '—'} em {e.servedHorizonHours ?? '—'} h</p>
                  </OnlyInDetail>
                </div>
              )}
            </Panel>
            <div className="flex flex-col lg:col-span-7"><WaterWeatherPanel point={p} rain={rain.data} /></div>
            <div className="flex flex-col lg:col-span-5"><RainCandidatesPanel query={rain} /></div>
          </>
        )}
      </div>
    </PageFrame>
  );
};

export default PointPage;
