import React from 'react';
import { cn } from '@/lib/utils';
import type { AlertaPonto } from '../schemas/alerta.schema';
import { CHIP_TONE_CLASS, alertChipOf } from '../utils/alertaText';

interface Props {
  alerta: AlertaPonto | null | undefined;
  isAdmin: boolean;
  className?: string;
}

/** Selo do alerta por ponto (prancha "Nível 1"): o mesmo no card do mapa, no popup e na folha do celular. Texto sempre visível. */
export const AlertChip: React.FC<Props> = ({ alerta, isAdmin, className }) => {
  const chip = alertChipOf(alerta, isAdmin);
  return (
    <span data-testid="alerta-chip" data-chip={chip.kind}
      className={cn('inline-flex min-h-6 items-center rounded-full border px-2.5 text-xs font-bold', CHIP_TONE_CLASS[chip.tone], chip.dashed && 'border-dashed', className)}>
      {chip.label}
    </span>
  );
};
