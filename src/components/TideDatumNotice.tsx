import React from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Texto do aviso do ADR 0009 (cota do terreno × maré). */
export const TIDE_DATUM_TEXT =
  'A maré vem da tábua da DHN (referência NR) e a cota do terreno vem do MDT PE3D (outro datum). Os dois valores não são comparáveis: o MAPi ainda não tem o desnível entre as referências, então não calcula folga nem "maré acima da rua" (ADR 0009).';

/** Aviso fixo onde terreno e maré aparecem juntos ou lado a lado (ADR 0009). Texto sempre visível. */
export const TideDatumNotice: React.FC<{ className?: string; compact?: boolean }> = ({ className, compact = false }) => (
  <p
    data-testid="tide-datum-notice"
    className={cn('flex items-start gap-2 rounded-lg border border-info/40 bg-info/10 px-3 py-2 text-info', compact ? 'text-2xs leading-snug' : 'text-caption', className)}
  >
    <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
    <span>{TIDE_DATUM_TEXT}</span>
  </p>
);
