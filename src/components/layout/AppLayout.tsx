import React from 'react';
import { Outlet } from 'react-router-dom';
import { Nav } from './Nav';

/** Casca das telas autenticadas: navegação + conteúdo rolável. O mapa ocupa o conteúdo inteiro. */
export const AppLayout: React.FC = () => (
  <div className="flex h-dvh w-full flex-col bg-background text-foreground">
    <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[200] focus:rounded-lg focus:bg-card focus:px-3 focus:py-2">
      Pular para o conteúdo
    </a>
    <Nav />
    <main id="conteudo" className="relative min-h-0 flex-1 overflow-y-auto">
      <Outlet />
    </main>
  </div>
);
