import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { ChevronDown, LogOut, Menu, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, USERS_MIN_ROLE, USERS_PATH, type NavItem } from '@/lib/navItems';
import { hasRole, parseRole } from '@/lib/roles';
import logoDark from '@/assets/mapi-logo-on-dark.svg';
import logoLight from '@/assets/mapi-logo-on-light.svg';
import { MobileMenu } from './MobileMenu';
import { ThemeControls } from './ThemeControls';
import { useNavStatus } from './useNavStatus';

const recifeTime = () =>
  new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Recife' }).format(new Date()).replace(':', 'h');

/** Chip de status do protótipo: ponto pulsante, relógio de Recife (14h05, atualizado a cada 30 s) e o fuso. Avisa se a API não responde. */
const StatusChip: React.FC<{ apiDown: boolean }> = ({ apiDown }) => {
  const [now, setNow] = useState(recifeTime);
  useEffect(() => {
    const id = setInterval(() => setNow(recifeTime()), 30_000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="hidden h-8 items-center gap-2 whitespace-nowrap rounded-full bg-muted px-2.5 text-xs leading-4 text-muted-foreground lg:flex">
      <span aria-hidden="true" className={cn('live-dot size-2 rounded-full', apiDown ? 'bg-warning' : 'bg-success')} />
      <span className="font-mono font-semibold text-foreground">{now}</span>
      <span>{apiDown ? 'sem conexão com a API' : 'Recife'}</span>
    </div>
  );
};

/** Menu "Mais" (641-1440 px): itens não prioritários. Esc fecha e devolve o foco ao botão. */
const MoreMenu: React.FC<{ items: readonly NavItem[] }> = ({ items }) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }
  useEffect(() => {
    if (!open) return;
    wrapRef.current?.querySelector<HTMLElement>('a')?.focus();
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);
  if (items.length === 0) return null;
  return (
    <div
      ref={wrapRef}
      className="relative shrink-0 max-[640px]:hidden min-[1440px]:hidden"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation();
          setOpen(false);
          btnRef.current?.focus();
        }
      }}
      onBlur={(e) => {
        if (open && !e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="menu-mais"
        className={cn('flex h-11 items-center gap-1 rounded-lg px-2.5 text-[13px] leading-4 font-semibold hover:bg-muted', open ? 'bg-secondary text-foreground' : 'text-muted-foreground')}
      >
        Mais
        <ChevronDown className="size-4" aria-hidden="true" />
      </button>
      {open && (
        <ul id="menu-mais" className="absolute right-0 top-full z-50 mt-1 min-w-48 rounded-xl border border-border bg-popover p-1 shadow-elevation-overlay">
          {items.map(({ label, to, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/modelo'}
                className={({ isActive }) =>
                  cn('flex h-11 items-center gap-2 rounded-lg px-3 text-body-strong', isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground')
                }
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const BADGE_NOUN = { alerts: 'abertos', reports: 'pendentes' } as const;

/** Menu da conta (avatar): perfil, Usuários (ADMIN) e Sair. Fechado, é só o avatar do protótipo. */
const AccountMenu: React.FC<{ username: string | undefined; role: string; initials: string; canManageUsers: boolean; onLogout: () => void }> = ({ username, role, initials, canManageUsers, onLogout }) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }
  useEffect(() => {
    if (!open) return;
    wrapRef.current?.querySelector<HTMLElement>('a, button[data-menu-item]')?.focus();
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);
  const item = 'flex h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-body-strong text-muted-foreground hover:bg-muted hover:text-foreground md:h-9';
  return (
    <div
      ref={wrapRef}
      className="relative shrink-0 max-[640px]:hidden"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation();
          setOpen(false);
          btnRef.current?.focus();
        }
      }}
      onBlur={(e) => {
        if (open && !e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="menu-conta"
        aria-label={`Conta e perfis: ${username ?? 'usuário'} · ${role}`}
        className="flex size-11 items-center justify-center rounded-full md:size-9"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-bold">{initials}</span>
      </button>
      {open && (
        <div id="menu-conta" className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-border bg-popover p-1 shadow-elevation-overlay">
          <p className="px-3 py-2 text-xs text-muted-foreground">
            <span className="block font-bold text-foreground">{username ?? 'usuário'}</span>
            {role}
          </p>
          {canManageUsers && (
            <Link to={USERS_PATH} className={item}>
              <Users className="size-4" aria-hidden="true" />
              Usuários e perfis
            </Link>
          )}
          <button type="button" data-menu-item onClick={onLogout} className={item}>
            <LogOut className="size-4" aria-hidden="true" />
            Sair
          </button>
        </div>
      )}
    </div>
  );
};

/** Barra de navegação principal (Nav.dc.html). Rola na horizontal em telas estreitas. */
export const Nav: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }
  const role = parseRole(user?.role);
  const items = NAV_ITEMS.filter((i) => hasRole(role, i.minRole));
  const barItems = items.filter((i) => i.inBar !== false);
  const initials = (user?.username ?? 'U').slice(0, 2).toUpperCase();
  const { counts, apiDown } = useNavStatus(role);
  return (
    <nav aria-label="Principal" className="flex h-[60px] shrink-0 items-center gap-2 border-b border-border bg-card px-3 text-foreground sm:gap-3 sm:px-4">
      <Link to="/map" aria-label="MAPi — mapa ao vivo" className="flex h-11 shrink-0 items-center rounded-lg pr-2">
        <img src={theme === 'light' ? logoLight : logoDark} alt="MAPi" className="h-[26px] w-auto" />
      </Link>
      <div className="flex min-w-0 flex-1 items-center gap-0.5 max-[640px]:hidden">
        {barItems.map(({ label, to, icon: Icon, priority, badge }) => {
          const n = badge ? counts[badge] : 0;
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/modelo'}
              className={({ isActive }) =>
                cn(
                  'h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-[13px] leading-4 md:h-9',
                  priority ? 'flex' : 'hidden min-[1440px]:flex',
                  isActive ? 'bg-secondary font-bold text-foreground' : 'font-semibold text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <Icon className="size-4" aria-hidden="true" />
              <span className="max-lg:sr-only">{label}</span>
              {n > 0 && badge && (
                <span className="h-[18px] min-w-[18px] rounded-full bg-risk-high px-[5px] text-center font-mono text-[11px] leading-[18px] font-bold text-on-risk-high">
                  {n > 99 ? '99+' : n}
                  <span className="sr-only"> {BADGE_NOUN[badge]}</span>
                </span>
              )}
            </NavLink>
          );
        })}
        <MoreMenu items={items.filter((i) => !i.priority)} />
      </div>
      <div className="flex-1 min-[641px]:hidden" />
      <StatusChip apiDown={apiDown} />
      <ThemeControls />
      <AccountMenu username={user?.username} role={role} initials={initials} canManageUsers={hasRole(role, USERS_MIN_ROLE)} onLogout={() => void logout()} />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="menu-principal"
        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted min-[641px]:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>
      {open && <MobileMenu onClose={() => setOpen(false)} />}
    </nav>
  );
};
