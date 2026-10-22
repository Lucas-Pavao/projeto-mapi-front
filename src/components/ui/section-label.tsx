import React from 'react';
import { cn } from '@/lib/utils';

interface SectionLabelProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'h2' | 'h3' | 'h4' | 'span' | 'p';
}

/** Rótulo de seção do protótipo: 12/16, negrito, espaçado 0,06 em, caixa alta, cor `muted-foreground`. (Não use `text-overline` junto de uma cor em `cn`: o tailwind-merge descarta um dos dois.) */
export const SectionLabel: React.FC<SectionLabelProps> = ({ as = 'h2', className, ...props }) => {
  const Tag = as as React.ElementType;
  return <Tag className={cn('m-0 text-xs leading-4 font-bold tracking-[0.06em] text-muted-foreground uppercase', className)} {...props} />;
};
