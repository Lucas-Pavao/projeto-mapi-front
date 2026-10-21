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
        <Link to="/minha-rua" aria-label="MAPi" className="flex h-11 items-center">
          <img src={theme === 'light' ? logoLight : logoDark} alt="MAPi" className="h-[26px] w-auto" />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeControls />
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};
