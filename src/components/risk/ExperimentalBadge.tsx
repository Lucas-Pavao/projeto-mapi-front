import React from 'react';
import { FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EXPERIMENTAL_LABEL } from './risk';

/**
 * Rótulo "Previsão experimental — modelo não validado" (ADR 0007, emenda 1), em `warning`.
 * Obrigatório junto de qualquer classe LOW/MEDIUM/HIGH enquanto o modelo for NOT_VALIDATED
 * (ver `showsExperimentalLabel`). Texto sempre visível, nunca só em tooltip.
 */
export const ExperimentalBadge: React.FC<{ className?: string }> = ({ className }) => (
  <p
    data-testid="experimental-label"
    className={cn(
      'inline-flex items-center gap-1.5 rounded-md border border-warning/40 bg-warning/10 px-2 py-1 text-2xs font-bold leading-tight text-warning',
      className,
    )}
  >
    <FlaskConical className="size-3 shrink-0" aria-hidden="true" />
    {EXPERIMENTAL_LABEL}
  </p>
);
