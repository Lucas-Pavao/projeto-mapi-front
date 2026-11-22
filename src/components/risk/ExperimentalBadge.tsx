import React from 'react';
import { FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Selo "Experimental · não validado", em `warning`. Texto sempre visível, nunca só em tooltip. */
export const ExperimentalBadge: React.FC<{ className?: string; label?: string }> = ({ className, label = 'Experimental · não validado' }) => (
  <p
    data-testid="experimental-label"
    className={cn('inline-flex items-center gap-1.5 rounded-md border border-warning/50 bg-warning/10 px-2 py-1 text-xs font-bold leading-tight text-warning', className)}
  >
    <FlaskConical className="size-3 shrink-0" aria-hidden="true" />
    {label}
  </p>
);
