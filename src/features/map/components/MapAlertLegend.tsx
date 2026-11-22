import React, { useState } from 'react';
import { InfoTip } from '@/components/InfoTip';
import { cn } from '@/lib/utils';
import { LEGEND_RULE } from '@/features/alagamento/utils/alagamentoText';

const ITEMS = [
  { key: 'ALERTA', label: 'Alerta', ring: 'border-2 border-destructive' },
  { key: 'ATENCAO', label: 'Atenção', ring: 'border-2 border-warning' },
  { key: 'SEM_ALERTA', label: 'Sem alerta', ring: 'border border-border' },
  { key: 'SEM_DADO', label: 'Sem dado', ring: 'border-2 border-dashed border-muted-foreground' },
] as const;

/** Itens da legenda: anel de cada nível do alerta por regressão. */
export const AlertLegendList: React.FC = () => (
  <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-xs">
    {ITEMS.map((i) => (
      <li key={i.key} data-legend={i.key} className="flex items-center gap-2">
        <span aria-hidden="true" className={cn('size-4 rounded-md bg-card', i.ring)} />
        {i.label}
      </li>
    ))}
  </ul>
);

/** Legenda do mapa (5.11 item 6): um botão "Legenda" que abre e fecha; a regra fica no ⓘ dentro dela. */
export const MapAlertLegend: React.FC<{ className?: string }> = ({ className }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn('flex flex-col items-end gap-2', className)}>
      {open && (
        <div id="legenda-alerta" role="region" aria-label="Legenda do alerta" className="mapi-enter-popover w-[220px] origin-bottom-right rounded-xl border border-border bg-popover p-3 text-xs shadow-[var(--elevation-overlay),var(--surface-highlight)]">
          <div className="mb-2 flex items-center justify-between font-bold">Alerta de alagamento<InfoTip text={LEGEND_RULE} align="end" /></div>
          <AlertLegendList />
        </div>
      )}
      <button type="button" aria-expanded={open} aria-controls="legenda-alerta" onClick={() => setOpen((o) => !o)}
        className="mapi-press h-9 rounded-lg border border-border bg-popover px-3 text-xs font-bold text-foreground shadow-[var(--elevation-overlay),var(--surface-highlight)] hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">
        Legenda
      </button>
    </div>
  );
};
