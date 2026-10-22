import React from 'react';
import { RISK_LABEL_PT } from '../utils/riskLabels';
import { cn } from '@/lib/utils';
import { highMinutes, type Cell } from '../utils/strips';
import { formatHoraCurta } from '@/features/operacao/utils/format';

const FILL: Record<string, string> = {
  LOW: 'bg-risk-low',
  MEDIUM: 'bg-risk-moderate',
  HIGH: 'bg-risk-high',
  UNKNOWN: 'bg-[repeating-linear-gradient(135deg,var(--risk-unknown)_0_3px,transparent_3px_5px)] outline outline-1 -outline-offset-1 outline-dashed outline-risk-unknown-edge',
};

interface Props { name: string; cells: Cell[]; sel: number; onPick: (t: number) => void }

/** Faixa de risco de um ponto: uma coluna por intervalo, clicável. Coluna ainda não ocorrida fica apagada. */
export const EventStrip: React.FC<Props> = ({ name, cells, sel, onPick }) => {
  const mins = Math.round(highMinutes(cells, sel));
  const selIdx = cells.findIndex((c) => c.start <= sel && sel <= c.end);
  return (
    <>
      <div className="text-[12px] font-bold leading-[15px]">{name}<br /><span className="font-normal text-muted-foreground">{mins ? `alto por ${mins} min` : 'sem risco alto'}</span></div>
      <div role="group" aria-label={`Risco de ${name}`} className="flex h-[26px] gap-px">
        {cells.map((c) => {
          const label = `${name} às ${formatHoraCurta(new Date(c.end).toISOString()) ?? ''}: ${c.level ? RISK_LABEL_PT[c.level] : 'sem previsão'}${c.probability != null ? ` ${Math.round(c.probability * 100)}%` : ''}`;
          return (
            <button
              key={c.i} type="button" tabIndex={-1} aria-label={label} title={label} onClick={() => onPick(c.end)} data-risk={c.level ?? 'NONE'}
              className={cn('h-full min-w-0 flex-1 cursor-pointer rounded-[2px] border-0 p-0', c.level ? FILL[c.level] : 'bg-muted', c.start > sel ? 'opacity-[0.22]' : '', c.i === selIdx && 'shadow-[0_0_0_2px_var(--foreground)]')}
            />
          );
        })}
      </div>
    </>
  );
};
