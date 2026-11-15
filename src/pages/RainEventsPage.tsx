import React, { useMemo, useState } from 'react';
import { QueryState } from '@/components/ui/query-state';
import { useFloodPoints } from '@/features/points/hooks/useFloodPoints';
import { useRainEventsBySource, useRainSummary, useRainWindow } from '@/features/rain-events/hooks/useRainEvents';
import { KpiRow, OverCapacityList, SensitivityPanel } from '@/features/rain-events/components/RainEventsPanels';
import { RAIN_SOURCES, type RainSource } from '@/features/rain-events/schemas/rain-events.schema';
import { SOURCE_LABEL, aboveCapacity, capacityOf, summaryKpis } from '@/features/rain-events/utils/rainEvents';
import { cn } from '@/lib/utils';

const CEMADEN = 'DADOS DA REDE OBSERVACIONAL DO CEMADEN/MCTIC';

export const RainEventsPage: React.FC = () => {
  const [source, setSource] = useState<RainSource>('CEMADEN_PED');
  const [slug, setSlug] = useState('all');
  const [sel, setSel] = useState<string | null>(null);
  const [frac, setFrac] = useState(0);
  const w = useRainWindow();
  const points = useFloodPoints();
  const summary = useRainSummary(slug, source, w);
  const tables = useRainEventsBySource(slug, w);
  const idx = RAIN_SOURCES.indexOf(source);
  const current = tables[idx]?.data;
  const capacity = capacityOf(current?.manifest ?? summary.data?.manifest);
  const over = useMemo(() => (current && capacity != null ? aboveCapacity(current.events, capacity) : []), [current, capacity]);

  return (
    <div className="flex w-full flex-col gap-4 p-4 lg:h-full">
      <header className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card px-5 py-3.5">
        <div className="min-w-0 flex-1">
          <h1 className="m-0 text-[22px] leading-7 font-extrabold">Eventos de chuva</h1>
          <p className="m-0 text-[13px] leading-[18px] text-muted-foreground">Últimos 365 dias · horas rotuladas pelo fim, em UTC · chuva medida × reanálise · ADR 0017</p>
        </div>
        <label className="flex items-center gap-2 text-xs font-bold">Ponto
          <select value={slug} onChange={(e) => { setSlug(e.target.value); setSel(null); }} className="h-8 rounded-lg border border-input bg-background px-2 text-xs font-normal text-foreground">
            <option value="all">Todos os pontos</option>
            {(points.data ?? []).map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
          </select>
        </label>
        <div role="radiogroup" aria-label="Fonte da chuva" className="flex gap-0.5 rounded-[10px] bg-muted p-1">
          {RAIN_SOURCES.map((s) => (
            <button key={s} type="button" role="radio" aria-checked={source === s} onClick={() => { setSource(s); setSel(null); }}
              className={cn('h-8 cursor-pointer rounded-lg border-0 px-3 text-xs font-bold text-foreground', source === s ? 'bg-card' : 'bg-transparent')}>{SOURCE_LABEL[s]}</button>
          ))}
        </div>
      </header>
      <QueryState query={summary} what="o resumo dos eventos" emptyTitle="Sem eventos." isEmpty={(d) => d.rows.length === 0}>
        {(d) => (
          <>
            <KpiRow kpis={summaryKpis(d)} />
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-3.5 lg:grid-cols-12">
              <OverCapacityList events={over} capacity={capacity} selected={sel} onSelect={setSel} sourceLabel={SOURCE_LABEL[source]} />
              <SensitivityPanel tables={tables.map((t) => t.data)} failed={tables.map((t) => t.isError)} capacity={capacity} frac={frac} onFrac={setFrac} active={idx} />
            </div>
          </>
        )}
      </QueryState>
      {source === 'CEMADEN_PED' && <p className="m-0 text-[11px] text-muted-foreground">{CEMADEN}</p>}
    </div>
  );
};
export default RainEventsPage;
