import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { NoticeRegion } from '@/components/ui/notice-region';
import { useNotices } from '@/hooks/useNotices';
import { Nav } from './Nav';

/** Casca das telas autenticadas: navegação + conteúdo rolável. O mapa ocupa o conteúdo inteiro. */
export const AppLayout: React.FC = () => {
  const { notices, notify, dismiss } = useNotices();
  const location = useLocation();
  const navigate = useNavigate();
  // Avisos vindos de redirecionamentos (state.notice), ex.: "Seu perfil mudou.". Consome o estado para não repetir ao recarregar.
  const notice = (location.state as { notice?: string } | null)?.notice;
  useEffect(() => {
    if (!notice) return;
    notify('info', notice);
    navigate(location.pathname + location.search, { replace: true, state: null });
  }, [notice, notify, navigate, location.pathname, location.search]);

  return (
    <div className="app-shell flex h-dvh w-full flex-col bg-background text-foreground">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[200] focus:rounded-lg focus:bg-card focus:px-3 focus:py-2">
        Pular para o conteúdo
      </a>
      {/* No celular e no tablet (< 1024 px) o mapa tem a própria barra superior (MobileMapa); o menu abre pelo logotipo dela. */}
      <div className={cn('no-print', location.pathname === '/map' && 'max-[1023px]:hidden')}>
        <Nav />
      </div>
      <main id="conteudo" className="relative min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <NoticeRegion notices={notices} onDismiss={dismiss} />
    </div>
  );
};
