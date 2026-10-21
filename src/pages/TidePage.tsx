import React, { useMemo, useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { QueryState } from '@/components/ui/query-state';
import { TimeChart } from '@/components/charts/TimeChart';
import { toTimePts } from '@/components/charts/chartMath';
import { TideDatumNotice } from '@/components/TideDatumNotice';
import { useTimeline } from '@/features/events/hooks/useTimeline';
import { nearestPoint, tideExtremes } from '@/features/events/utils/tide';
import { formatRecifeDayMs, formatRecifeHourMs } from '@/features/map/utils/datetime';
import { cn } from '@/lib/utils';

const WINDOWS = [
  { id: '24', label: '24 h', past: 12, future: 12 },
  { id: '48', label: '48 h', past: 24, future: 24 },
  { id: '72', label: '72 h', past: 36, future: 36 },
] as const;

const m = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const TidePage: React.FC = () => {
  const [win, setWin] = useState<(typeof WINDOWS)[number]['id']>('48');
  const w = WINDOWS.find((x) => x.id === win)!;
  const query = useTimeline(w.past, w.future);
  const when = (t: number) => `${formatRecifeDayMs(t)} ${formatRecifeHourMs(t)}`;

  return (
    <PageShell title="Maré" description="Maré prevista pela tábua da DHN no porto de referência, com a hora atual marcada.">
      <TideDatumNotice />
      <div role="group" aria-label="Janela de tempo" className="flex flex-wrap gap-2">
        {WINDOWS.map((o) => (
          <button key={o.id} type="button" aria-pressed={win === o.id} onClick={() => setWin(o.id)} className={cn('h-11 rounded-full border px-4 text-body-strong md:h-8', win === o.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground hover:bg-muted')}>
            {o.label}
          </button>
        ))}
      </div>
      <QueryState query={query} what="a maré" isEmpty={(t) => t.tide.points.length === 0} emptyTitle="Sem dados de maré nesta janela." emptyHint="A tábua do porto pode não estar carregada para este período.">
        {(t) => <TideContent timeline={t} from={Date.parse(query.range.from)} to={Date.parse(query.range.to)} now={query.now} when={when} />}
      </QueryState>
    </PageShell>
  );
};

const TideContent: React.FC<{ timeline: NonNullable<ReturnType<typeof useTimeline>['data']>; from: number; to: number; now: number; when: (t: number) => string }> = ({ timeline, from, to, now, when }) => {
  const pts = useMemo(() => toTimePts(timeline.tide.points), [timeline.tide.points]);
  const extremes = useMemo(() => tideExtremes(pts), [pts]);
  const current = nearestPoint(pts, now);
  return (
    <>
      <section aria-label="Maré agora" className="rounded-xl border border-border bg-card p-4">
        <p className="text-caption text-muted-foreground">Porto <span className="text-code">{timeline.tide.harbor}</span> · altura prevista em metros, referência da tábua (NR)</p>
        <p className="text-reading-lg text-foreground" data-testid="tide-now">{current ? <>{m(current.v)} <span className="text-body text-muted-foreground">m agora (previsto)</span></> : <span className="text-body text-muted-foreground">Sem ponto de maré perto do horário atual.</span>}</p>
      </section>
      <section className="rounded-xl border border-border bg-card p-4">
        <TimeChart
          title={`Maré prevista, porto ${timeline.tide.harbor}`}
          unit="m, ref. NR"
          from={from}
          to={to}
          decimals={2}
          height={240}
          series={[{ id: 'tide', label: `Maré prevista (${timeline.tide.harbor})`, kind: 'line', points: pts, colorClass: 'text-chart-1' }]}
          markers={[{ t: now, label: 'agora' }]}
        />
      </section>
      <section aria-label="Preamares e baixa-mares" className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-title text-foreground">Máximos e mínimos da série</h2>
        <p className="text-caption text-muted-foreground">Achados nos próprios pontos exibidos (passo de {timeline.stepMinutes} min), sem ajuste de curva.</p>
        {extremes.length === 0 ? (
          <p className="mt-2 text-body text-muted-foreground">Nenhum máximo ou mínimo na janela.</p>
        ) : (
          <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {extremes.map((e) => (
              <li key={e.t} data-extreme={e.kind} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-body">
                <span className="font-semibold text-foreground">{e.kind === 'HIGH' ? 'Preamar' : 'Baixa-mar'}</span>
                <span className="text-reading text-foreground">{m(e.v)} m</span>
                <span className="text-caption text-muted-foreground">{when(e.t)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
};
export default TidePage;
