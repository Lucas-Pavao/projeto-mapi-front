import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import logoDark from '@/assets/mapi-logo-on-dark.svg';
import logoLight from '@/assets/mapi-logo-on-light.svg';
import { ThemeControls } from './ThemeControls';

/** Casca das telas públicas (sem login): marca e alternância de tema. */
export const PublicLayout: React.FC = () => {
  const { theme } = useTheme();
  return (
    <div className="flex min-h-dvh w-full flex-col bg-background text-foreground">
      <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex min-w-0 items-center gap-4">
          <Link to="/minha-rua" aria-label="MAPi" className="flex h-11 shrink-0 items-center">
            <img src={theme === 'light' ? logoLight : logoDark} alt="MAPi" className="h-[26px] w-auto" />
          </Link>
          <span className="hidden truncate text-[13px] text-muted-foreground md:inline">Alagamento na Região Metropolitana do Recife</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeControls />
          <Link to="/login" className="flex h-11 items-center rounded-lg border border-input px-3.5 text-[13px] font-bold text-foreground md:h-10">Entrar (equipes)</Link>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};
