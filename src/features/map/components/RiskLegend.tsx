import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRiskVisual, RISK_LEGEND_ORDER, RISK_MEANING, EXPERIMENTAL_LEGEND_TEXT } from '../utils/risk';
import { RiskIcon } from './RiskIcon';
import { MapToolPopover } from './MapToolPopover';

interface RiskLegendProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

/** Legenda de risco (4 estados) como botão da barra do mapa; o painel abre sob demanda. */
export const RiskLegend: React.FC<RiskLegendProps> = ({ open, onOpenChange, className }) => (
  <MapToolPopover
    id="risk-legend-body"
    label="Legenda de risco"
    icon={<ShieldAlert className="h-5 w-5" aria-hidden="true" />}
    open={open}
    onOpenChange={onOpenChange}
    panelClassName={className}
  >
    <ul className="space-y-2 px-3 py-2.5">
      {RISK_LEGEND_ORDER.map((level) => {
        const v = getRiskVisual(level);
        return (
          <li key={level} className="flex gap-2.5" data-risk={level}>
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
    <p className="border-t border-white/10 px-3 py-2 text-2xs leading-snug text-zinc-400">{EXPERIMENTAL_LEGEND_TEXT}</p>
  </MapToolPopover>
);
