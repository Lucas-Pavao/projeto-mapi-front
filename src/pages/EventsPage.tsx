import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { QueryState } from '@/components/ui/query-state';
import { TimeChart, type ChartMarker } from '@/components/charts/TimeChart';
import { toTimePts } from '@/components/charts/chartMath';
import { TideDatumNotice } from '@/components/TideDatumNotice';
import { ExperimentalBadge } from '@/components/risk/ExperimentalBadge';
import { showsExperimentalLabel } from '@/components/risk/risk';
import { useTimeline } from '@/features/events/hooks/useTimeline';
import { RiskStrip } from '@/features/points/components/RiskStrip';
import { SEVERITY_LABEL } from '@/features/reports/utils/labels';
import { useFloodPoints } from '@/features/points/hooks/useFloodPoints';
import { formatRecife } from '@/features/map/utils/datetime';
import type { Timeline } from '@/features/events/schemas/timeline.schema';
import { cn } from '@/lib/utils';

const WINDOWS = [24, 48, 72] as const;

const Panel: React.FC<{ children: React.ReactNode; label: string }> = ({ children, label }) => (
  <section aria-label={label} className="min-w-0 rounded-xl border border-border bg-card p-4">{children}</section>
);

const TimelineView: React.FC<{ t: Timeline; from: number; to: number; names: Map<string, string> }> = ({ t, from, to, names }) => {
  const markers = useMemo<ChartMarker[]>(
    () => (t.floodEvents ?? []).map((e) => ({ t: Date.parse(e.startTime), label: `alagamento ${SEVERITY_LABEL[e.severity].toLowerCase()}` })).filter((m) => Number.isFinite(m.t)),
    [t.floodEvents],
  );
  const tide = useMemo(() => toTimePts(t.tide.points), [t.tide.points]);
  return (
    <div className="flex flex-col gap-4">
      <Panel label="Chuva">
        {t.rain.length === 0 ? (
          <p className="text-body text-muted-foreground">Nenhum pluviômetro com dado nesta janela.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {t.rain.map((s) => (
              <TimeChart key={s.stationId} title={`Chuva por hora, ${s.stationId}`} unit="mm na hora" from={from} to={to} zero markers={markers}
                series={[{ id: s.stationId, label: s.stationId, kind: 'bars', points: toTimePts(s.points), colorClass: 'text-chart-3' }]} emptyText="Sem leituras de chuva nesta janela." />
            ))}
            <p className="text-caption text-muted-foreground">Cada barra é a soma da hora e termina no fim dela (ex.: a barra de 15:00 cobre 14:00 a 15:00).</p>
          </div>
        )}
      </Panel>
      <Panel label="Maré">
        <TimeChart title={`Maré prevista, porto ${t.tide.harbor}`} unit="m, ref. NR" from={from} to={to} decimals={2} markers={markers}
          series={[{ id: 'tide', label: `${t.tide.harbor} (tábua DHN)`, kind: 'line', points: tide, colorClass: 'text-chart-2' }]} emptyText="Sem maré nesta janela." />
        <TideDatumNotice compact className="mt-3" />
      </Panel>
      <Panel label="Rio">
        {t.river.length === 0 ? (
          <p className="text-body text-muted-foreground">Nenhuma estação de rio com dado nesta janela.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {t.river.map((s) => (
              <TimeChart key={s.stationId} title={`Nível do rio, ${s.stationId}`} unit="m" from={from} to={to} decimals={2} markers={markers}
                series={[{ id: s.stationId, label: s.stationId, kind: 'line', points: toTimePts(s.points), colorClass: 'text-chart-1' }]} emptyText="Sem leituras de rio nesta janela." />
            ))}
          </div>
        )}
      </Panel>
      <Panel label="Risco por ponto">
        <h2 className="mb-2 text-title text-foreground">Risco por ponto</h2>
        {t.risk.length === 0 ? (
          <p className="text-body text-muted-foreground">Nenhuma previsão nesta janela.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {t.risk.map((r) => {
              const anyClass = r.items.some((p) => showsExperimentalLabel(p));
              return (
                <li key={r.slug} data-slug={r.slug} className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/pontos/${r.slug}`} className="text-body-strong text-primary hover:underline">{names.get(r.slug) ?? r.slug}</Link>
                    {anyClass && <ExperimentalBadge />}
                  </div>
                  {r.items.length === 0 ? <p className="text-caption text-muted-foreground">Sem previsão na janela.</p> : <RiskStrip items={r.items} label={`Risco de ${names.get(r.slug) ?? r.slug}`} />}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
      <Panel label="Eventos de alagamento">
        <h2 className="mb-2 text-title text-foreground">Alagamentos confirmados</h2>
        {(t.floodEvents ?? []).length === 0 ? (
          <p className="text-body text-muted-foreground">Nenhum alagamento confirmado nesta janela.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {(t.floodEvents ?? []).map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-x-3 text-body text-foreground">
                <span className="text-reading">{formatRecife(e.startTime)}</span>
                <Link to={`/pontos/${e.slug}`} className="font-semibold text-primary hover:underline">{names.get(e.slug) ?? e.slug}</Link>
                <span className="text-caption text-muted-foreground">gravidade observada: {SEVERITY_LABEL[e.severity]}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
};

export const EventsPage: React.FC = () => {
  const [hours, setHours] = useState<(typeof WINDOWS)[number]>(24);
  const query = useTimeline(hours);
  const points = useFloodPoints();
  const names = useMemo(() => new Map((points.data ?? []).map((p) => [p.slug, p.name])), [points.data]);
  const isEmpty = (t: Timeline) => t.rain.length + t.river.length + t.risk.length === 0 && t.tide.points.length === 0 && (t.floodEvents ?? []).length === 0;
  return (
    <PageShell title="Eventos" description="Linha do tempo de chuva, maré, rio e risco por ponto, na mesma janela. Horas em America/Recife.">
      <div role="group" aria-label="Janela de tempo" className="flex flex-wrap gap-2">
        {WINDOWS.map((w) => (
          <button key={w} type="button" aria-pressed={hours === w} onClick={() => setHours(w)} className={cn('h-11 rounded-full border px-4 text-body-strong md:h-8', hours === w ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground hover:bg-muted')}>
            Últimas {w} h
          </button>
        ))}
      </div>
      <QueryState query={query} what="a linha do tempo" isEmpty={isEmpty} emptyTitle="Sem dados nesta janela." emptyHint="Tente uma janela maior.">
        {(t) => <TimelineView t={t} from={Date.parse(query.range.from)} to={Date.parse(query.range.to)} names={names} />}
      </QueryState>
    </PageShell>
  );
};
export default EventsPage;
