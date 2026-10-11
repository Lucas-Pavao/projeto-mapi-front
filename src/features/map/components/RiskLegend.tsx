import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRiskVisual, RISK_LEGEND_ORDER, RISK_MEANING } from '../utils/risk';
import { RiskIcon } from './RiskIcon';

function startsOpen(): boolean {
  try {
    return typeof window.matchMedia === 'function' ? window.matchMedia('(min-width: 768px)').matches : true;
  } catch {
    return true;
  }
}

/**
 * Legenda permanente de risco (4 estados). O cabeçalho fica sempre visível; em celular o corpo
 * começa recolhido para não cobrir o mapa, mas nunca some.
 */
export const RiskLegend: React.FC<{ className?: string }> = ({ className }) => {
  const [open, setOpen] = useState(startsOpen);
  return (
    <section
      aria-labelledby="risk-legend-title"
      className={cn('rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl shadow-2xl shadow-black/50', className)}
    >
      <h2 id="risk-legend-title" className="m-0">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="risk-legend-body"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-2 rounded-2xl px-3 py-2 text-2xs font-black uppercase tracking-widest text-white"
        >
          Legenda de risco
          <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} aria-hidden="true" />
        </button>
      </h2>
      <div id="risk-legend-body" hidden={!open}>
        <ul className="space-y-2 px-3 pb-3">
          {RISK_LEGEND_ORDER.map((level) => {
            const v = getRiskVisual(level);
            return (
              <li key={level} className="flex gap-2" data-risk={level}>
                <span
                  className={cn('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-white', v.bg, level === 'UNKNOWN' && 'border-2 border-dashed border-white/70')}
                  aria-hidden="true"
                >
                  <RiskIcon level={level} className="h-4 w-4" />
                </span>
                <span className="text-2xs leading-snug text-zinc-300">
                  <strong className="block text-white">{v.label}</strong>
                  {RISK_MEANING[level]}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="border-t border-white/10 px-3 py-2 text-2xs leading-snug text-zinc-400">
          Classes vêm da probabilidade estimada pelo modelo, ainda em validação. Confirme em campo antes de decidir.
        </p>
      </div>
    </section>
  );
};
