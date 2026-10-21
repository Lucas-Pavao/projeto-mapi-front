import React from 'react';
import { cn } from '@/lib/utils';

interface SectionLabelProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'h2' | 'h3' | 'h4' | 'span' | 'p';
}

/** Rótulo de seção do protótipo: 12/16, negrito, espaçado 0,06 em, caixa alta, cor `muted-foreground`. */
export const SectionLabel: React.FC<SectionLabelProps> = ({ as = 'h2', className, ...props }) => {
  const Tag = as as React.ElementType;
  return <Tag className={cn('text-overline m-0 text-muted-foreground', className)} {...props} />;
};
