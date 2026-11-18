import React from 'react';
import { cn } from '@/lib/utils';
import { SourceTag } from '@/components/risk/SourceTag';
import { CEMADEN_ATTRIBUTION } from '../schemas/station.schema';
import type { Kind, ListItem } from '../utils/sensorView';

export type Filter = Kind | 'all' | 'problem';

export const FILTERS: ReadonlyArray<{ value: Filter; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'chuva', label: 'Chuva' },
  { value: 'rio', label: 'Rio' },
  { value: 'mare', label: 'Maré' },
  { value: 'problem', label: 'Com problema' },
];

interface Props {
  items: ListItem[];
  selected: string;
  filter: Filter;
  onFilter: (f: Filter) => void;
  onSelect: (key: string) => void;
  online: string;
  /** Quantas estações cada filtro mostra (o rótulo leva o número). */
  counts?: Record<Filter, number>;
}

/** Lista lateral: filtros em pílula e uma linha por estação (ponto tracejado e texto âmbar quando sem resposta). */
export const SensorList: React.FC<Props> = ({ items, selected, filter, onFilter, onSelect, online, counts }) => (
  <aside aria-label="Estações" className="flex min-h-0 w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card lg:w-[340px]">
    <div className="flex flex-col gap-2.5 border-b border-border p-3.5">
      <div className="flex items-baseline justify-between">
        <h1 className="m-0 text-[20px] font-extrabold leading-[26px]">Estações</h1>
        <span className="text-[12px] text-muted-foreground" aria-live="polite">{online}</span>
      </div>
      <div role="radiogroup" aria-label="Filtrar por tipo" className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const on = filter === f.value;
          return (
            <button
              key={f.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onFilter(f.value)}
              className={cn('h-11 cursor-pointer rounded-full border px-3 text-[12px] font-bold leading-4 md:h-[30px]', on ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-transparent text-foreground')}
            >
              {f.label}{counts ? ` ${counts[f.value]}` : ''}
            </button>
          );
        })}
      </div>
    </div>
    <ul className="m-0 flex min-h-0 flex-1 list-none flex-col gap-0.5 overflow-y-auto p-2 max-lg:max-h-80">
      {items.map((r) => (
        <li key={r.key} data-stale={r.off}>
          <button
            type="button"
            aria-pressed={r.key === selected}
            onClick={() => onSelect(r.key)}
            className={cn('flex w-full cursor-pointer items-center gap-3 rounded-[10px] border-0 px-2 py-[9px] text-left text-foreground hover:bg-muted', r.key === selected ? 'bg-secondary' : 'bg-transparent', r.fail && 'opacity-70')}
          >
            <span aria-hidden="true" className={cn('box-border size-2.5 shrink-0 rounded-full', r.off ? 'border-2 border-dashed border-risk-unknown-edge bg-transparent' : '')} style={r.off ? undefined : { background: r.dot }} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[14px] font-bold leading-5">{r.name}</span>
              {(r.sources?.length || r.monthTag) && (
                <span className="flex flex-wrap items-center gap-1" data-testid="station-tags">
                  {r.sources?.map((k) => <SourceTag key={k} kind={k} />)}
                  {r.monthTag && <span className={cn('inline-flex h-[18px] items-center rounded border px-1.5 text-[10px] font-bold leading-none', r.monthTag.tone === 'destructive' ? 'border-destructive text-destructive' : r.monthTag.tone === 'warning' ? 'border-warning text-warning' : 'border-border text-muted-foreground')}>{r.monthTag.text}</span>}
                </span>
              )}
              <span className={cn('truncate text-[12px] leading-4', r.off ? 'text-warning' : 'text-muted-foreground')}>{r.sub}</span>
            </span>
            <span className={cn('font-mono text-[14px] font-semibold leading-5', r.off && 'text-muted-foreground')}>{r.value}</span>
          </button>
        </li>
      ))}
    </ul>
    <p className="m-0 border-t border-border px-3.5 py-2.5 text-[11px] leading-[15px] text-muted-foreground">{CEMADEN_ATTRIBUTION}</p>
  </aside>
);
