import React from 'react';
import { cn } from '@/lib/utils';

interface PageShellProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/** Moldura das telas que não são o mapa: título (h1), descrição e conteúdo. */
export const PageShell: React.FC<PageShellProps> = ({ title, description, actions, className, children }) => (
  <div className={cn('mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 sm:p-6', className)}>
    <header className="flex flex-wrap items-start justify-between gap-3 print:hidden">
      <div className="min-w-0">
        <h1 className="text-title-lg text-foreground">{title}</h1>
        {description && <p className="mt-1 max-w-prose text-body text-muted-foreground">{description}</p>}
      </div>
      {actions}
    </header>
    {children}
  </div>
);
