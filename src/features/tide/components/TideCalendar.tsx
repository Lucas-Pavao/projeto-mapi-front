import React from 'react';
import { cn } from '@/lib/utils';
import type { DayDataDTO } from '@/features/map/types';
import { SPRING_M, dayPoints, daySummary } from '../utils/tideTable';

const m2 = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const WEEK = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

interface TideCalendarProps {
  monthName: string;
  /** Dia da semana (0 = domingo) do dia 1. */
  firstWeekday: number;
  days: DayDataDTO[];
  selected: number;
  onSelect: (day: number) => void;
}

/** Calendário do mês: preamar de cada dia, destaque da sizígia e barra de amplitude. Tudo da tábua. */
export const TideCalendar: React.FC<TideCalendarProps> = ({ monthName, firstWeekday, days, selected, onSelect }) => {
  const rows = days.map((d) => ({ d, s: daySummary(dayPoints(d)) }));
  const maxRange = Math.max(0.01, ...rows.map((r) => r.s?.range ?? 0));
  const spring = rows.filter((r) => r.s && r.s.hi >= SPRING_M).length;
  return (
    <section aria-label="Calendário do mês" className="flex min-h-0 flex-col gap-2.5 rounded-2xl border border-border bg-card px-[18px] py-4 lg:col-span-5">
      <div className="flex items-baseline justify-between">
        <h2 className="m-0 text-xs leading-4 font-bold tracking-[0.06em] text-muted-foreground">{monthName.toUpperCase()} · AMPLITUDE DO DIA</h2>
        <span className="text-xs text-muted-foreground">{spring} dias com preamar ≥ {m2(SPRING_M).replace(',00', ',0')} m</span>
      </div>
      <div aria-hidden="true" className="grid grid-cols-7 gap-1.5 text-center text-[11px] text-muted-foreground">{WEEK.map((w) => <span key={w}>{w}</span>)}</div>
      <div className="grid flex-1 grid-cols-7 gap-1.5 [grid-auto-rows:minmax(56px,1fr)]">
        {Array.from({ length: firstWeekday }, (_, i) => <span key={`p${i}`} />)}
        {rows.map(({ d, s }) => {
          const on = d.day === selected;
          const high = !!s && s.hi >= SPRING_M;
          return (
            <button
              key={d.day}
              type="button"
              aria-pressed={on}
              aria-label={`${d.day} de ${monthName.toLowerCase()}: ${s ? `preamar ${m2(s.hi)} m` : 'sem dados'}`}
              onClick={() => onSelect(d.day)}
              className={cn('relative flex min-h-14 flex-col items-start justify-between overflow-hidden rounded-[10px] border-2 px-[7px] py-1.5 text-foreground', on ? 'border-primary bg-primary/15' : high ? 'border-warning bg-transparent' : 'border-border bg-transparent')}
            >
              <span className="font-mono text-[13px] leading-4 font-bold">{d.day}</span>
              <span className={cn('font-mono text-[11px] leading-[14px] font-semibold', high ? 'text-warning' : 'text-muted-foreground')}>{s ? m2(s.hi) : '—'}</span>
              {s && <span aria-hidden="true" className="absolute inset-x-0 bottom-0 bg-sand opacity-35" style={{ height: `${Math.round((s.range / maxRange) * 60)}%` }} />}
            </button>
          );
        })}
      </div>
      <div className="flex gap-3.5 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="size-3 rounded-[3px] border-2 border-warning" />preamar ≥ {m2(SPRING_M).replace(',00', ',0')} m (sizígia)</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-3 bg-sand opacity-50" />amplitude</span>
      </div>
    </section>
  );
};
