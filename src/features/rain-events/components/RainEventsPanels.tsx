import React from 'react';
import { cn } from '@/lib/utils';
import { formatHoraCurta, num } from '@/features/operacao/utils/format';
import { RAIN_SOURCES, type RainEvent } from '../schemas/rain-events.schema';
import { SOURCE_LABEL, SWEEP, aboveCapacity, eventKey, type Kpi } from '../utils/rainEvents';

const panel = 'flex min-h-0 min-w-0 flex-col gap-2.5 rounded-2xl border border-border bg-card px-[18px] py-4';
const overline = 'm-0 text-xs leading-4 font-bold uppercase tracking-[0.06em] text-muted-foreground';

export const KpiRow: React.FC<{ kpis: Kpi[] }> = ({ kpis }) => (
  <section aria-label="Resumo da fonte" className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
    {kpis.map((k) => (
      <div key={k.label} className="rounded-[14px] border border-border bg-card px-4 py-3.5">
        <div className={cn('font-mono text-2xl font-extrabold leading-[30px]', k.tone === 'high' ? 'text-risk-high-text' : k.tone === 'muted' ? 'text-muted-foreground' : 'text-foreground')}>{k.value}</div>
        <div className="text-xs leading-4 text-muted-foreground">{k.label}</div>
      </div>
    ))}
  </section>
);

interface OverProps { events: RainEvent[]; capacity: number; selected: string | null; onSelect: (id: string) => void; sourceLabel: string }

/** Picos acima da capacidade de drenagem: uma barra por evento, com a marca da capacidade. Sem capacidade no manifesto, não há comparação. */
export const OverCapacityList: React.FC<OverProps> = ({ events, capacity, selected, onSelect, sourceLabel }) => {
  const top = events.slice(0, 8);
  const max = Math.max(capacity, ...top.map((e) => e.maxHourlyMmH ?? 0), 1) * 1.1;
  const sel = events.find((e) => eventKey(e) === selected) ?? null;
  return (
    <section aria-label="Eventos acima da capacidade" className={cn(panel, 'lg:col-span-7')}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className={overline}>Picos acima da capacidade de drenagem · {sourceLabel}</h2>
        <span className="text-xs text-muted-foreground">capacidade de projeto {num(capacity, 1)} mm/h</span>
      </div>
      {top.length === 0 ? <p className="m-0 text-[13px] text-muted-foreground">Nenhum evento completo passou da capacidade na janela.</p>
        : top.map((e) => (
          <button key={eventKey(e)} type="button" aria-pressed={eventKey(e) === selected} onClick={() => onSelect(eventKey(e))} data-event={eventKey(e)}
            className={cn('grid grid-cols-[minmax(0,220px)_1fr_70px] items-center gap-3 rounded-xl border-[1.5px] bg-transparent px-3 py-2.5 text-left text-foreground', eventKey(e) === selected ? 'border-primary' : 'border-border')}>
            <span><span className="block text-[13px] font-bold">{e.slug}</span><span className="block text-[11px] text-muted-foreground">{formatHoraCurta(e.startUtc) ?? '—'}{e.stationId ? ` · ${e.stationId}` : ''}</span></span>
            <span className="relative h-4 rounded-full bg-muted">
              <span className="absolute inset-y-0 left-0 rounded-full bg-risk-high" style={{ width: `${(((e.maxHourlyMmH ?? 0) / max) * 100).toFixed(1)}%` }} />
              <span className="absolute -inset-y-[3px] w-0.5 bg-foreground" style={{ left: `${((capacity / max) * 100).toFixed(1)}%` }} />
            </span>
            <span className="text-right font-mono text-[13px] font-bold">{num(e.maxHourlyMmH, 1)}</span>
          </button>
        ))}
      <p className="m-0 mt-auto text-xs leading-[17px] text-muted-foreground" data-testid="event-detail">
        {sel ? `${sel.slug}: ${num(sel.totalMm, 1)} mm em ${sel.durationMin ?? '—'} min, pico de ${num(sel.maxHourlyMmH, 1)} mm/h; ${num(sel.excessOverCapacityMm, 1)} mm acima da capacidade${sel.hasGap ? '; com lacuna na série' : ''}.` : 'Escolha um evento para ver o detalhe. Pico = maior chuva horária; hora sem dado quebra o evento, lacuna não vira zero.'}
      </p>
    </section>
  );
};

interface SweepProps { events: RainEvent[][]; capacity: number; frac: number; onFrac: (i: number) => void; active: number }

/** E se a rede drenar menos? Eventos acima de uma fração da capacidade, nas três fontes. */
export const SensitivityPanel: React.FC<SweepProps> = ({ events, capacity, frac, onFrac, active }) => {
  const f = SWEEP[frac];
  const counts = events.map((ev) => aboveCapacity(ev, capacity, f).length);
  const max = Math.max(1, ...counts.map((c) => c ?? 0));
  return (
    <section aria-label="Sensibilidade à capacidade" className={cn(panel, 'lg:col-span-5')}>
      <h2 className={overline}>E se a rede drenar menos? · eventos acima da capacidade</h2>
      <label className="flex flex-col gap-1">
        <span className="flex justify-between text-[13px] font-bold">Fração da capacidade<span className="font-mono" data-testid="frac-text">{num(capacity * f, 1)} mm/h</span></span>
        <input type="range" min={0} max={SWEEP.length - 1} step={1} value={frac} onChange={(e) => onFrac(Number(e.target.value))} className="m-0 w-full" aria-label="Fração da capacidade" />
      </label>
      <div className="flex flex-1 flex-col justify-center gap-2.5">
        {RAIN_SOURCES.map((s, i) => (
          <div key={s} data-sweep={s} className="grid grid-cols-[minmax(0,150px)_1fr_64px] items-center gap-2.5">
            <span className={cn('text-[13px]', i === active && 'font-extrabold')}>{SOURCE_LABEL[s]}</span>
            <span className="h-3.5 rounded-full bg-muted"><span className="block h-full rounded-full" style={{ width: `${((counts[i] / max) * 100).toFixed(1)}%`, background: i === active ? 'var(--primary)' : 'var(--chart-3)' }} /></span>
            <span className="text-right font-mono text-[13px] font-bold">{counts[i]}</span>
          </div>
        ))}
      </div>
      <ul className="m-0 pl-[18px] text-xs leading-[17px] text-muted-foreground">
        <li>Hora sem dado quebra o evento: lacuna não vira zero.</li>
        <li>Chuva do ponto = maior valor entre estações válidas até 5 km (ADR 0022).</li>
        <li>Fonte única para vários pontos e reanálise suavizam picos: tendem a subestimar.</li>
      </ul>
    </section>
  );
};
