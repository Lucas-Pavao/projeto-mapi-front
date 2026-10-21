import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toTimePts } from '@/components/charts/chartMath';
import { useTimeline } from '@/features/events/hooks/useTimeline';
import { nearestPoint } from '@/features/events/utils/tide';
import { useTideTable } from '@/features/tide/hooks/useTideTable';
import { TideCalendar } from '@/features/tide/components/TideCalendar';
import { TideDay } from '@/features/tide/components/TideDay';
import { dayCurve, dayPoints, daySummary, findDay, recifeParts } from '@/features/tide/utils/tideTable';
import { cn } from '@/lib/utils';

const HARBOR = 'pe02';
const m2 = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}h${String(min % 60).padStart(2, '0')}`;

export const TidePage: React.FC = () => {
  const timeline = useTimeline(1, 1);
  const today = useMemo(() => recifeParts(timeline.now), [timeline.now]);
  const table = useTideTable(HARBOR, today.year);
  const [picked, setPicked] = useState<number | null>(null);
  const day = picked ?? today.day;

  const month = table.data?.months.find((x) => x.month === today.month);
  const prevMonth = table.data?.months.find((x) => x.month === today.month - 1);
  const nextMonth = table.data?.months.find((x) => x.month === today.month + 1);

  const detail = useMemo(() => {
    const cur = dayPoints(findDay(month, day));
    const prev = day > 1 ? dayPoints(findDay(month, day - 1)) : dayPoints(prevMonth?.days.at(-1));
    const next = month && day < month.days.length ? dayPoints(findDay(month, day + 1)) : dayPoints(nextMonth?.days[0]);
    return { curve: dayCurve(prev, cur, next), summary: daySummary(cur) };
  }, [month, prevMonth, nextMonth, day]);

  const tideNow = useMemo(() => {
    const pts = toTimePts(timeline.data?.tide.points ?? []);
    const cur = nearestPoint(pts, timeline.now);
    if (!cur) return null;
    const after = pts.find((p) => p.t > cur.t && p.v != null);
    return { v: cur.v, rising: after?.v != null ? after.v > cur.v : null };
  }, [timeline.data, timeline.now]);

  const monthName = month?.monthName ?? new Intl.DateTimeFormat('pt-BR', { month: 'long', timeZone: 'America/Recife' }).format(timeline.now);
  const firstWeekday = month ? new Date(Date.UTC(today.year, today.month - 1, 1)).getUTCDay() : 0;
  const isToday = day === today.day;
  const spring = (detail.summary?.hi ?? 0) >= 2;
  const dayTitle = `DIA ${day} DE ${monthName.toUpperCase()} · ${detail.summary ? (spring ? 'MARÉ DE SIZÍGIA' : 'MARÉ DE QUADRATURA') : 'SEM DADOS DA TÁBUA'}`;

  return (
    <div className="flex w-full flex-col gap-4 p-4 lg:h-full">
      <section className="flex flex-wrap items-center gap-6 rounded-2xl border border-border bg-card px-5 py-4">
        <div className="min-w-0 flex-1">
          <h1 className="m-0 text-[22px] leading-7 font-extrabold text-foreground">Tábua de maré · Porto do Recife</h1>
          <p className="m-0 text-[13px] leading-[18px] text-muted-foreground">Porto {HARBOR} · DHN via TabuaMare · altura sobre o nível de redução · sincronizada 1× por dia</p>
        </div>
        <div className="text-right">
          <div data-testid="tide-now" className={cn('font-mono text-[30px] leading-9 font-extrabold', tideNow && tideNow.v >= 2 ? 'text-warning' : 'text-foreground')}>
            {tideNow ? `${m2(tideNow.v)} m` : '—'}
          </div>
          <div className="text-xs text-muted-foreground">
            {tideNow ? <>agora ({hhmm(today.minute)}){tideNow.rising != null && ` · ${tideNow.rising ? 'enchendo' : 'vazando'}`} · previsto</> : 'sem ponto de maré perto do horário atual'}
          </div>
        </div>
      </section>

      {table.isPending ? (
        <div role="status" className="flex min-h-40 flex-1 items-center justify-center rounded-2xl border border-border bg-card text-body text-muted-foreground">Carregando a tábua…</div>
      ) : table.isError || !table.data ? (
        <div role="alert" className="flex min-h-40 flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-6 text-center">
          <p className="m-0 text-body-strong text-foreground">Não foi possível carregar a tábua de maré.</p>
          <Button type="button" variant="outline" className="h-11 md:h-8" onClick={() => void table.refetch()}>Tentar de novo</Button>
        </div>
      ) : !month || month.days.length === 0 ? (
        <div className="flex min-h-40 flex-1 flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-card p-6 text-center">
          <p className="m-0 text-body-strong text-foreground">Sem dados de maré neste mês.</p>
          <p className="m-0 text-caption text-muted-foreground">A tábua do porto pode não estar carregada para este período.</p>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-12">
          <TideCalendar monthName={monthName} firstWeekday={firstWeekday} days={month.days} selected={day} onSelect={setPicked} />
          <TideDay title={dayTitle} curve={detail.curve} summary={detail.summary} nowMinute={isToday ? today.minute : null} />
        </div>
      )}
    </div>
  );
};
export default TidePage;
