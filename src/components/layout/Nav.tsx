import React, { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, USERS_MIN_ROLE, USERS_PATH } from '@/lib/navItems';
import { hasRole, parseRole } from '@/lib/roles';
import logoDark from '@/assets/mapi-logo-on-dark.svg';
import logoLight from '@/assets/mapi-logo-on-light.svg';
import { ThemeControls } from './ThemeControls';

const recifeTime = () =>
  new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Recife' }).format(new Date()).replace(':', 'h');

/** Relógio de Recife (formato 14h05), atualizado a cada 30 s. */
const Clock: React.FC = () => {
  const [now, setNow] = useState(recifeTime);
  useEffect(() => {
    const id = setInterval(() => setNow(recifeTime()), 30_000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="hidden h-8 items-center gap-2 whitespace-nowrap rounded-full bg-muted px-2.5 text-caption text-muted-foreground lg:flex">
      <span className="font-mono font-semibold text-foreground">{now}</span>
      <span>Recife</span>
    </div>
  );
};

/** Barra de navegação principal (Nav.dc.html). Rola na horizontal em telas estreitas. */
export const Nav: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const role = parseRole(user?.role);
  const items = NAV_ITEMS.filter((i) => hasRole(role, i.minRole));
  const initials = (user?.username ?? 'U').slice(0, 2).toUpperCase();
  return (
    <nav aria-label="Principal" className="flex h-[60px] shrink-0 items-center gap-2 border-b border-border bg-card px-3 text-foreground sm:gap-3 sm:px-4">
      <Link to="/map" aria-label="MAPi — mapa ao vivo" className="flex h-11 shrink-0 items-center rounded-lg pr-1">
        <img src={theme === 'light' ? logoLight : logoDark} alt="MAPi" className="h-[26px] w-auto" />
      </Link>
      <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [scrollbar-width:none]">
        {items.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/modelo'}
            className={({ isActive }) =>
              cn(
                'flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-body-strong md:h-9',
                isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </div>
      <Clock />
      <ThemeControls />
      {hasRole(role, USERS_MIN_ROLE) ? (
        <Link to={USERS_PATH} aria-label={`Usuários e perfis: ${user?.username ?? 'usuário'} · ${role}`} className="flex size-11 shrink-0 items-center justify-center rounded-full md:size-9">
          <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-caption font-bold">{initials}</span>
        </Link>
      ) : (
        <span role="img" aria-label={`Conta: ${user?.username ?? 'usuário'} · ${role}`} className="flex size-11 shrink-0 items-center justify-center rounded-full md:size-9">
          <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-caption font-bold">{initials}</span>
        </span>
      )}
    </nav>
  );
};
