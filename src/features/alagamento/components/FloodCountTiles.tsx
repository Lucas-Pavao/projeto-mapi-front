import React from 'react';
import { cn } from '@/lib/utils';
import type { FloodLevel } from '../schemas/alagamento.schema';

/** Faixa de cima de cada contador, como na prancha (border-top 3 px na cor do nível). */
const EDGE: Record<FloodLevel, string> = {
  ALERTA: 'border-t-risk-high', ATENCAO: 'border-t-risk-moderate', SEM_ALERTA: 'border-t-risk-low', SEM_DADO: 'border-t-risk-unknown',
};
const NUM: Record<FloodLevel, string> = {
  ALERTA: 'text-risk-high-text', ATENCAO: 'text-risk-moderate-text', SEM_ALERTA: 'text-risk-low-text', SEM_DADO: 'text-risk-unknown-text',
};

const ORDER: ReadonlyArray<{ level: FloodLevel; label: string }> = [
  { level: 'ALERTA', label: 'Alerta' },
  { level: 'ATENCAO', label: 'Atenção' },
  { level: 'SEM_ALERTA', label: 'Sem alerta' },
  { level: 'SEM_DADO', label: 'Sem dado' },
];

/** Contadores do painel "Agora na RMR" pelo nível do alerta por regressão (5.10). Falha de leitura: traço, nunca zero. */
export const FloodCountTiles: React.FC<{ counts: Record<FloodLevel, number> | null; size?: 'sm' | 'md' }> = ({ counts, size = 'md' }) => (
  <div data-testid="flood-counts" className="grid grid-cols-4 gap-1.5">
    {ORDER.map(({ level, label }) => (
      <div key={level} data-level={level} className={cn('flex flex-col gap-0.5 rounded-[10px] border-t-[3px] bg-muted', EDGE[level], size === 'sm' ? 'px-1.5 py-1.5' : 'p-2')}>
        <div className={cn('font-mono font-bold', size === 'sm' ? 'text-lg leading-6' : 'text-[22px] leading-[26px]', NUM[level])}>
          {counts ? counts[level] : '—'}
        </div>
        <div className="text-[11px] leading-[14px] text-muted-foreground">{label}</div>
      </div>
    ))}
  </div>
);
