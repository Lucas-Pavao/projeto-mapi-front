import React from 'react';
import { CircleHelp, OctagonAlert, ShieldCheck, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FloodLevel } from '../schemas/alagamento.schema';

/**
 * Marcador quadrado do nível do alerta por regressão (MAPi.RiskBadge variant="marker" do protótipo).
 * Forma distinta por nível (octógono, triângulo, escudo, interrogação): o nível nunca depende só de cor.
 * Sem nível (visitante ou ponto sem linha): cinza tracejado. Decorativo: o nome acessível vem do pai.
 */
const VISUAL: Record<FloodLevel | 'NONE', { Icon: typeof ShieldCheck; cls: string; ping: string }> = {
  ALERTA: { Icon: OctagonAlert, cls: 'border-2 bg-risk-high text-on-risk-high border-risk-high-edge', ping: 'bg-risk-high' },
  ATENCAO: { Icon: TriangleAlert, cls: 'border-2 bg-risk-moderate text-on-risk-moderate border-risk-moderate-edge', ping: 'bg-risk-moderate' },
  SEM_ALERTA: { Icon: ShieldCheck, cls: 'border-2 bg-risk-low text-on-risk-low border-risk-low-edge', ping: 'bg-risk-low' },
  SEM_DADO: { Icon: CircleHelp, cls: 'border-[3px] border-dashed bg-clip-padding bg-risk-unknown text-on-risk-unknown border-risk-unknown-edge', ping: 'bg-risk-unknown' },
  NONE: { Icon: CircleHelp, cls: 'border-[3px] border-dashed bg-clip-padding bg-risk-unknown text-on-risk-unknown border-risk-unknown-edge', ping: 'bg-risk-unknown' },
};

export const FloodLevelBadge: React.FC<{ level: FloodLevel | null | undefined; pulse?: boolean; className?: string }> = ({ level, pulse = false, className }) => {
  const v = VISUAL[level ?? 'NONE'];
  return (
    <span aria-hidden="true" data-flood-badge={level ?? 'NONE'} className={cn('relative inline-flex size-8 flex-none items-center justify-center', className)}>
      {pulse && <span className={cn('absolute inset-0 animate-ping rounded-lg opacity-60 motion-reduce:animate-none', v.ping)} />}
      <span className={cn('relative inline-flex size-8 items-center justify-center rounded-lg shadow-elevation-overlay', v.cls)}>
        <v.Icon className="size-4" />
      </span>
    </span>
  );
};
