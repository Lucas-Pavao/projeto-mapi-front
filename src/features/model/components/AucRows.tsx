import React from 'react';
import { cn } from '@/lib/utils';

export interface AucRow {
  id: string;
  name: string;
  auc: number;
  lo: number;
  hi: number;
  color: string;
  excluiZeroCinco?: boolean;
}

const fmt3 = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const fmt2 = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Escala do AUC: começa no menor 0,1 que cobre todos os IC (no mínimo 0,5) e termina em 1. */
function aucDomain(rows: AucRow[]): [number, number] {
  const lo = Math.min(0.5, ...rows.map((r) => r.lo));
  return [Math.floor(lo * 10) / 10, 1];
}

/** AUC com intervalo de 95% por linha (clicável). Só desenha o que recebe; a escala acompanha os dados. */
export const AucRows: React.FC<{ rows: AucRow[]; selected: string; onSelect: (id: string) => void }> = ({ rows, selected, onSelect }) => {
  const [d0, d1] = aucDomain(rows);
  const pos = (v: number) => `${(((v - d0) / (d1 - d0)) * 100).toFixed(2)}%`;
  const ticks: number[] = [];
  for (let t = Math.round(d0 * 10); t <= 10; t++) ticks.push(t / 10);
  return (
    <div className="relative flex min-h-0 flex-1 flex-col justify-around overflow-y-auto">
      <div aria-hidden="true" className="pointer-events-none absolute top-0 bottom-[18px] left-[220px] right-[70px] hidden lg:block">
        <div className="absolute top-0 bottom-0 w-px border-l border-dashed border-muted-foreground opacity-60" style={{ left: pos(0.5) }} />
      </div>
      {rows.map((r) => {
        const on = r.id === selected;
        return (
          <button key={r.id} type="button" aria-pressed={on} onClick={() => onSelect(r.id)} className={cn('relative flex h-11 shrink-0 items-center rounded-[10px] border-0 p-0 text-left text-foreground', on ? 'bg-muted' : 'bg-transparent')}>
            <span className="w-[220px] shrink-0 box-border pl-2.5 text-[13px] leading-4 font-bold">{r.name}</span>
            <span className="relative h-full flex-1">
              <span className="absolute top-1/2 -mt-0.5 h-1 rounded-full opacity-55" style={{ left: pos(r.lo), width: `${(((r.hi - r.lo) / (d1 - d0)) * 100).toFixed(2)}%`, background: r.color }} />
              <span className="absolute top-1/2 -mt-[7px] -ml-[7px] size-3.5 rounded-full border-2 border-card" style={{ left: pos(r.auc), background: r.color }} />
            </span>
            <span className="w-[70px] shrink-0 box-border pr-2.5 text-right font-mono text-sm leading-[18px] font-bold">{fmt3(r.auc)}</span>
          </button>
        );
      })}
      <div aria-hidden="true" className="ml-[220px] mr-[70px] flex justify-between font-mono text-[11px] leading-4 text-muted-foreground">
        {ticks.map((t) => <span key={t}>{fmt2(t)}</span>)}
      </div>
    </div>
  );
};
