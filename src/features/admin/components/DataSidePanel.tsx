import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { MonthGrid } from './MonthGrid';
import { IntegrityPanel } from './IntegrityPanel';

type Tab = 'meses' | 'integridade';
const TABS: Array<[Tab, string]> = [['meses', 'Estações no mês'], ['integridade', 'Integridade por ponto']];

type IntegrityProps = React.ComponentProps<typeof IntegrityPanel>;

/** Painel lateral da tela Dados: duas abas, a grade estação × mês e a integridade por ponto. */
export const DataSidePanel: React.FC<Omit<IntegrityProps, 'embedded'> & { initialTab?: Tab }> = ({ initialTab = 'meses', ...integrity }) => {
  const [tab, setTab] = useState<Tab>(initialTab);
  return (
    <div className="flex min-h-80 min-w-0 flex-col gap-3 rounded-2xl border border-border bg-card px-[18px] py-3.5 lg:col-span-4 lg:min-h-0">
      <div role="tablist" aria-label="Painel lateral" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" role="tab" id={`dados-tab-${id}`} aria-selected={tab === id} aria-controls={`dados-panel-${id}`} onClick={() => setTab(id)}
            className={cn('h-9 rounded-md text-xs font-bold md:h-8', tab === id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}>
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`dados-panel-${tab}`} aria-labelledby={`dados-tab-${tab}`} className="custom-scrollbar min-h-0 flex-1 overflow-auto">
        {tab === 'meses' ? <MonthGrid embedded /> : <IntegrityPanel {...integrity} embedded />}
      </div>
    </div>
  );
};
