import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { ChevronDown, LogOut, Menu, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { NAV_GROUPS, NAV_ITEMS, USERS_MIN_ROLE, USERS_PATH, type NavGroupId, type NavItem } from '@/lib/navItems';
import { DetailSwitch } from '@/lib/detailMode';
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

/**
 * Grupo da barra (seção 5.11): botão que abre um menu suspenso. Teclado: Enter/Espaço/seta abre e foca o 1º item; setas
 * andam; Home/End; Esc fecha e devolve o foco. O grupo da tela atual fica marcado.
 */
const GroupMenu: React.FC<{ id: NavGroupId; label: string; items: readonly NavItem[]; count: number; counts: Record<'alerts' | 'reports', number> }> = ({ id, label, items, count, counts }) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }
  const current = items.some((i) => pathname === i.to || (i.to !== '/modelo' && pathname.startsWith(i.to + '/')));
  useEffect(() => {
    if (!open) return;
    wrapRef.current?.querySelector<HTMLElement>('[role=menuitem]')?.focus();
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);
  const move = (e: React.KeyboardEvent) => {
    const els = Array.from(wrapRef.current?.querySelectorAll<HTMLElement>('[role=menuitem]') ?? []);
    const i = els.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); els[(i + 1) % els.length]?.focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); els[(i - 1 + els.length) % els.length]?.focus(); }
    if (e.key === 'Home') { e.preventDefault(); els[0]?.focus(); }
    if (e.key === 'End') { e.preventDefault(); els[els.length - 1]?.focus(); }
  };
  if (items.length === 0) return null;
  const menuId = `menu-${id}`;
  return (
    <div
      ref={wrapRef}
      className="relative shrink-0"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation();
          setOpen(false);
          btnRef.current?.focus();
        } else if (open) move(e);
      }}
      onBlur={(e) => {
        if (open && !e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); setOpen(true); } }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        data-current={current || undefined}
        className={cn('mapi-press flex h-11 items-center gap-1 whitespace-nowrap rounded-lg px-2.5 text-[13px] leading-4 md:h-9',
          current ? 'bg-secondary font-bold text-foreground' : 'font-semibold text-muted-foreground hover:bg-muted hover:text-foreground')}
      >
        {label}
        {current && <span className="sr-only"> (tela atual neste grupo)</span>}
        {count > 0 && (
          <span className="h-[18px] min-w-[18px] rounded-full bg-risk-high px-[5px] text-center font-mono text-[11px] leading-[18px] font-bold tabular-nums text-on-risk-high">
            {count > 99 ? '99+' : count}
            <span className="sr-only"> alertas abertos</span>
          </span>
        )}
        <ChevronDown className={cn('size-4 transition-transform duration-150 ease-[var(--ease-out)]', open && 'rotate-180')} aria-hidden="true" />
      </button>
      {open && (
        <ul id={menuId} role="menu" aria-label={label} className="mapi-enter-popover absolute left-0 top-full z-50 mt-1.5 min-w-48 origin-top-left rounded-xl border border-border bg-popover p-1 shadow-[var(--elevation-overlay),var(--surface-highlight)]">
          {items.map(({ label: l, to, icon: Icon, badge }) => (
            <li key={to} role="none">
              <NavLink
                role="menuitem"
                to={to}
                end={to === '/modelo'}
                className={({ isActive }) =>
                  cn('mapi-press-row flex h-11 items-center gap-2 rounded-lg px-3 text-body-strong focus-visible:outline-2 focus-visible:outline-ring', isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground')
                }
              >
                <Icon className="size-4" aria-hidden="true" />
                {l}
                {badge && counts[badge] > 0 && (
                  <span className="ml-auto font-mono text-xs font-bold text-risk-high-text">
                    {counts[badge]}<span className="sr-only"> {badge === 'alerts' ? 'abertos' : 'pendentes'}</span>
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

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
  const item = 'mapi-press-row flex h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-body-strong text-muted-foreground hover:bg-muted hover:text-foreground md:h-9';
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
        className="mapi-press flex size-11 items-center justify-center rounded-full hover:bg-muted md:size-9"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-bold ring-1 ring-border/70">{initials}</span>
      </button>
      {open && (
        <div id="menu-conta" className="mapi-enter-popover absolute right-0 top-full z-50 mt-1.5 w-56 origin-top-right rounded-xl border border-border bg-popover p-1 shadow-[var(--elevation-overlay),var(--surface-highlight)]">
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

/** Barra de navegação principal: Mapa · Análise · Operação · Gestão (seção 5.11), Detalhes, tema e conta. */
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
  const initials = (user?.username ?? 'U').slice(0, 2).toUpperCase();
  const { counts, apiDown } = useNavStatus(role);
  return (
    <nav aria-label="Principal" className="flex h-[60px] shrink-0 items-center gap-2 border-b border-border bg-card px-3 text-foreground sm:gap-3 sm:px-4">
      <Link to="/map" aria-label="MAPi — mapa ao vivo" className="mapi-press flex h-11 shrink-0 items-center rounded-lg pr-2">
        <img src={theme === 'light' ? logoLight : logoDark} alt="MAPi" className="h-[26px] w-auto" />
      </Link>
      <div className="flex min-w-0 flex-1 items-center gap-0.5 max-[640px]:hidden">
        {NAV_GROUPS.map((g) => {
          const gi = items.filter((i) => i.group === g.id);
          if (g.id === 'mapa') {
            return gi.map(({ label, to, icon: Icon }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) => cn('mapi-press flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-[13px] leading-4 md:h-9',
                  isActive ? 'bg-secondary font-bold text-foreground shadow-elevation-raised' : 'font-semibold text-muted-foreground hover:bg-muted hover:text-foreground')}>
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </NavLink>
            ));
          }
          return <GroupMenu key={g.id} id={g.id} label={g.label} items={gi} count={g.id === 'operacao' ? counts.alerts : 0} counts={counts} />;
        })}
      </div>
      <div className="flex-1 min-[641px]:hidden" />
      <StatusChip apiDown={apiDown} />
      <DetailSwitch className="max-[640px]:hidden" />
      <ThemeControls />
      <AccountMenu username={user?.username} role={role} initials={initials} canManageUsers={hasRole(role, USERS_MIN_ROLE)} onLogout={() => void logout()} />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="menu-principal"
        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        className="mapi-press flex size-11 shrink-0 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted min-[641px]:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>
      {open && <MobileMenu onClose={() => setOpen(false)} />}
    </nav>
  );
};
