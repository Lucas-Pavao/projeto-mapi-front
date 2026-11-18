import React, { useMemo, useState } from 'react';
import { QueryState } from '@/components/ui/query-state';
import { useRainData } from '@/features/rain-events/hooks/useRainEvents';
import { KpiRow, OverCapacityList, SensitivityPanel } from '@/features/rain-events/components/RainEventsPanels';
import { RAIN_SOURCES, type RainData, type RainSource } from '@/features/rain-events/schemas/rain-events.schema';
import { SOURCE_LABEL, aboveCapacity, eventKey, eventsOf, monthYear, slugsOf, sourceKpis } from '@/features/rain-events/utils/rainEvents';
import { cn } from '@/lib/utils';

const Content: React.FC<{ data: RainData }> = ({ data }) => {
  const [source, setSource] = useState<RainSource>('CEMADEN_PED');
  const [slug, setSlug] = useState('all');
  const [sel, setSel] = useState<string | null>(null);
  const [frac, setFrac] = useState(0);
  const d = data.sources[source];
  const capacity = d.params.capacityMmH;
  const over = useMemo(() => aboveCapacity(eventsOf(d, slug), capacity), [d, slug, capacity]);
  const bySource = RAIN_SOURCES.map((s) => eventsOf(data.sources[s], slug));
  const shas = Object.entries(d.sha256);
  return (
    <div className="flex w-full flex-col gap-4 p-4 lg:h-full">
      <header className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card px-5 py-3.5">
        <div className="min-w-0 flex-1">
          <h1 className="m-0 text-[22px] leading-7 font-extrabold">Eventos de chuva por ponto</h1>
          <p className="m-0 text-[13px] leading-[18px] text-muted-foreground" data-testid="rain-period">{monthYear(d.periodFrom)} → {monthYear(d.periodTo)} · evento = horas com chuva separadas por menos de {String(d.params.dryGapHours ?? 6)} h secas · {slugsOf(d).length} pontos críticos</p>
        </div>
        <label className="flex items-center gap-2 text-xs font-bold">Ponto
          <select value={slug} onChange={(e) => { setSlug(e.target.value); setSel(null); }} className="h-8 rounded-lg border border-input bg-background px-2 text-xs font-normal text-foreground">
            <option value="all">Todos os pontos</option>
            {slugsOf(d).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <div role="radiogroup" aria-label="Fonte da chuva" className="flex gap-0.5 rounded-[10px] bg-muted p-1">
          {RAIN_SOURCES.map((s) => (
            <button key={s} type="button" role="radio" aria-checked={source === s} onClick={() => { setSource(s); setSel(null); }}
              className={cn('h-8 cursor-pointer rounded-lg border-0 px-3 text-xs font-bold text-foreground', source === s ? 'bg-card' : 'bg-transparent')}>{SOURCE_LABEL[s]}</button>
          ))}
        </div>
      </header>
      <KpiRow kpis={sourceKpis(d, slug)} />
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3.5 lg:grid-cols-12">
        <OverCapacityList events={over} capacity={capacity} selected={sel ?? (over[0] ? eventKey(over[0]) : null)} onSelect={setSel} sourceLabel={SOURCE_LABEL[source]} />
        <SensitivityPanel events={bySource} capacity={capacity} frac={frac} onFrac={setFrac} active={RAIN_SOURCES.indexOf(source)} />
      </div>
      <p className="m-0 text-[11px] leading-[15px] text-muted-foreground" data-testid="rain-sources">
        Horas rotuladas pelo fim, em UTC (ADR 0017). Fonte: arquivo estático gerado de /api/analise/eventos-chuva ({d.params.methodVersion as string | undefined ?? 'eventos-chuva'}); o cálculo ao vivo de 5 anos é lento demais para a tela.
        {shas.map(([name, h]) => <span key={name}> · {name} SHA-256 <span className="font-mono">{h}</span></span>)}
        {source === 'CEMADEN_PED' && data.attribution ? ` ${data.attribution}.` : ''}
      </p>
    </div>
  );
};

export const RainEventsPage: React.FC = () => {
  const query = useRainData();
  return (
    <QueryState query={query} what="os eventos de chuva" emptyTitle="Sem eventos.">
      {(data) => <Content data={data} />}
    </QueryState>
  );
};
export default RainEventsPage;
