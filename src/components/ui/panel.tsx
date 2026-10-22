import React from 'react';
import { cn } from '@/lib/utils';

type PanelTag = 'div' | 'section' | 'aside' | 'article';

interface PanelProps extends React.HTMLAttributes<HTMLElement> {
  as?: PanelTag;
}

/**
 * Painel do protótipo: fundo `card`, borda 1 px, raio 16 e sombra de sobreposição.
 * Nas telas com mapa ele é posicionado em absoluto a 16 px das bordas (topo em 76 px da janela, ou seja,
 * `top-4` dentro de <main>); nas demais, é só o cartão. Sem padding próprio: o consumidor define.
 */
export const Panel = React.forwardRef<HTMLElement, PanelProps>(({ as = 'div', className, ...props }, ref) => {
  const Tag = as as React.ElementType;
  return <Tag ref={ref} className={cn('rounded-2xl border border-border bg-card text-card-foreground shadow-elevation-overlay', className)} {...props} />;
});
Panel.displayName = 'Panel';
