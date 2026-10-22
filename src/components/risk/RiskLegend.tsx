import React from 'react';
import { cn } from '@/lib/utils';
import { RiskLegendList } from './RiskLegendList';

interface RiskLegendProps {
  className?: string;
  showExperimentalNote?: boolean;
}

/** Legenda de risco (4 estados) como cartão sempre visível (RiskLegend do protótipo). Largura vem do consumidor. */
export const RiskLegend: React.FC<RiskLegendProps> = ({ className, showExperimentalNote = true }) => (
  <section aria-label="Legenda de risco" className={cn('rounded-xl border border-border bg-popover text-popover-foreground shadow-elevation-overlay', className)}>
    <RiskLegendList showExperimentalNote={showExperimentalNote} />
  </section>
);
