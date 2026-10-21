import React from 'react';
import { cn } from '@/lib/utils';

/** Moldura das telas de operação: acima de lg os painéis ocupam a janela (16 px de margem); abaixo, empilham. */
export const PageFrame: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <div className={cn('flex flex-col gap-4 p-4 lg:absolute lg:inset-4 lg:p-0', className)}>{children}</div>
);

/** Painel arredondado do protótipo (card, borda, raio 16, respiro 16 × 18). */
export const Panel = React.forwardRef<HTMLElement, React.ComponentProps<'section'>>(({ className, ...props }, ref) => (
  <section ref={ref} className={cn('flex min-w-0 flex-1 flex-col gap-2.5 rounded-2xl border border-border bg-card px-[18px] py-4', className)} {...props} />
));
Panel.displayName = 'Panel';

/** Título de painel em caixa alta com espaçamento (12/16, 700, 0,06em). */
export const PanelTitle: React.FC<React.ComponentProps<'h2'>> = ({ className, ...props }) => (
  <h2 className={cn('m-0 text-[12px] font-bold uppercase leading-4 tracking-[0.06em] text-muted-foreground', className)} {...props} />
);
