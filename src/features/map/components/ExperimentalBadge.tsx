import React from 'react';
import { FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EXPERIMENTAL_LABEL } from '../utils/risk';

/**
 * Rótulo "Previsão experimental — modelo não validado" (ADR 0007, emenda 1). Âmbar 200 sobre
 * fundo escuro: contraste > 10:1 (mínimo AA 4,5:1). O texto fica visível, nunca só em tooltip.
 */
export const ExperimentalBadge: React.FC<{ className?: string }> = ({ className }) => (
  <p
    data-testid="experimental-label"
    className={cn(
      'inline-flex items-center gap-1.5 rounded-md border border-amber-300/40 bg-amber-950/70 px-2 py-1 text-2xs font-bold leading-tight text-amber-200',
      className,
    )}
  >
    <FlaskConical className="h-3 w-3 shrink-0" aria-hidden="true" />
    {EXPERIMENTAL_LABEL}
  </p>
);
