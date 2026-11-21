import React from 'react';
import { cn } from '@/lib/utils';
import type { FloodLevel } from '../schemas/alagamento.schema';
import { TEXT_CLASS, toneOf } from '../utils/alagamentoText';

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
      <div key={level} data-level={level} className={cn('rounded-[10px] bg-muted text-center', size === 'sm' ? 'px-1 py-1.5' : 'px-1.5 py-2')}>
        <div className={cn('font-mono font-extrabold leading-tight', size === 'sm' ? 'text-lg' : 'text-[22px]', TEXT_CLASS[toneOf(level)])}>
          {counts ? counts[level] : '—'}
        </div>
        <div className="text-[11px] leading-[14px] text-muted-foreground">{label}</div>
      </div>
    ))}
  </div>
);
