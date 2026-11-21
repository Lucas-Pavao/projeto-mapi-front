import React from 'react';
import { cn } from '@/lib/utils';
import { formatHoraCurta } from '@/features/operacao/utils/format';
import type { AlagamentoPonto, FloodLevel } from '../schemas/alagamento.schema';
import { BAR_CLASS, HCRIT_CM, fmt1, pctOfBar, rangeCm } from '../utils/alagamentoText';

export const LEVEL_LABEL: Record<FloodLevel, string> = { ALERTA: 'Alerta', ATENCAO: 'Atenção', SEM_ALERTA: 'Sem alerta', SEM_DADO: 'Sem dado' };
const BOX_CLASS: Record<FloodLevel, string> = {
  ALERTA: 'border-destructive', ATENCAO: 'border-warning', SEM_ALERTA: 'border-border', SEM_DADO: 'border-dashed border-muted-foreground',
};
const LABEL_CLASS: Record<FloodLevel, string> = {
  ALERTA: 'text-destructive', ATENCAO: 'text-warning', SEM_ALERTA: 'text-success', SEM_DADO: 'text-muted-foreground',
};

/** Prancha "PainelAnalise" (box) e "PontoDetalhe" (plain): uma linha por prazo, com o prazo e o nível à esquerda, a barra e "17–33 cm · até 16h30" à direita. */
export const HorizonBoxes: React.FC<{ horizons: AlagamentoPonto['horizons']; variant?: 'box' | 'plain' }> = ({ horizons, variant = 'box' }) => (
  <ul className="m-0 flex list-none flex-col gap-2 p-0">
    {horizons.map((h) => {
      const c = BAR_CLASS[h.level];
      return (
        <li key={h.hours} data-testid={`horizonte-${h.hours}`} data-level={h.level}
          className={cn('grid grid-cols-[64px_1fr] items-center gap-2.5', variant === 'box' && cn('rounded-[10px] border px-2.5 py-2', BOX_CLASS[h.level]))}>
          <div>
            <div className="font-mono text-[15px] leading-5 font-extrabold">{h.hours} h</div>
            <div className={cn('whitespace-nowrap text-[11px] font-bold', LABEL_CLASS[h.level])}>{LEVEL_LABEL[h.level]}</div>
          </div>
          <div className="flex min-w-0 flex-col gap-[3px]">
            <span className="relative my-[5px] h-2 rounded-full bg-muted" role="img"
              aria-label={`${h.hours} h: lâmina provável ${fmt1(h.sheetQ50Cm) ?? 'sem dado'} cm, pessimista ${fmt1(h.sheetQ95Cm) ?? 'sem dado'} cm; alagamento a partir de ${HCRIT_CM} cm`}>
              <span className={cn('absolute inset-y-0 left-0 rounded-full', c.q95)} style={{ width: `${pctOfBar(h.sheetQ95Cm)}%` }} />
              <span className={cn('absolute inset-y-0 left-0 rounded-full', c.q50)} style={{ width: `${pctOfBar(h.sheetQ50Cm)}%` }} />
              <span aria-hidden="true" className="absolute -inset-y-[5px] w-0.5 bg-risk-high-edge" style={{ left: `${pctOfBar(HCRIT_CM)}%` }} />
            </span>
            <span className="font-mono text-[11px] leading-[15px] text-muted-foreground">
              {rangeCm(h.sheetQ50Cm, h.sheetQ95Cm)}{h.validUntil ? ` · até ${formatHoraCurta(h.validUntil)}` : ''}
            </span>
          </div>
        </li>
      );
    })}
  </ul>
);

