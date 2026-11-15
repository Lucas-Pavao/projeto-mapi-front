import React from 'react';
import { cn } from '@/lib/utils';
import type { SourceKind } from './sourceKinds';

const TAGS: Record<SourceKind, { label: string; hint: string; cls: string }> = {
  LIVE: { label: 'ao vivo', hint: 'Cemaden, leitura em tempo real', cls: 'border-primary/50 text-primary' },
  PED: { label: 'PED', hint: 'Cemaden PED, série validada', cls: 'border-success/60 text-success' },
  PED_ONLY: { label: 'só PED', hint: 'Estação que só existe no PED (sem leitura ao vivo)', cls: 'border-warning/60 text-warning' },
};

/** Etiqueta da fonte de um dado de chuva: ao vivo, PED ou só PED. Texto sempre visível (cor não é o único sinal). */
export const SourceTag: React.FC<{ kind: SourceKind; className?: string }> = ({ kind, className }) => {
  const t = TAGS[kind];
  return (
    <span title={t.hint} data-source={kind} className={cn('inline-flex h-[18px] items-center rounded border px-1.5 text-[10px] font-bold uppercase leading-none tracking-wide', t.cls, className)}>
      {t.label}
    </span>
  );
};
