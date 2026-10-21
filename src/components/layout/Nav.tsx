import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { ChevronDown, LogOut, Menu, Users, X } from 'lucide-react';
import { ModalDialog } from '@/components/ui/modal-dialog';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, USERS_MIN_ROLE, USERS_PATH, type NavItem } from '@/lib/navItems';
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

/** Folha de navegação do celular (<= 640 px): todos os itens do perfil, foco preso, Esc fecha. */
const MobileSheet: React.FC<{ items: readonly NavItem[]; showUsers: boolean; onClose: () => void }> = ({ items, showUsers, onClose }) => {
  const link = ({ isActive }: { isActive: boolean }) =>
    cn('flex h-12 items-center gap-3 rounded-lg px-3 text-body-strong', isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground');
  const { logout } = useAuth();
  return (
    <ModalDialog label="Menu principal" onClose={onClose} className="fixed inset-x-0 bottom-0 top-[60px] z-50 flex flex-col bg-background/80">
      <div id="menu-principal" className="flex max-h-full flex-col overflow-y-auto border-b border-border bg-card p-2 shadow-elevation-overlay">
        <button type="button" onClick={onClose} aria-label="Fechar menu" className="ml-auto flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
          <X className="size-5" aria-hidden="true" />
        </button>
        <ul>
          {items.map(({ label, to, icon: Icon }) => (
            <li key={to}>
              <NavLink to={to} end={to === '/modelo'} onClick={onClose} className={link}>
                <Icon className="size-5" aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
          {showUsers && (
            <li>
              <NavLink to={USERS_PATH} onClick={onClose} className={link}>
                <Users className="size-5" aria-hidden="true" />
                Usuários
              </NavLink>
            </li>
          )}
          <li className="mt-1 border-t border-border pt-1">
            <button type="button" onClick={() => { onClose(); void logout(); }} className="flex h-12 w-full items-center gap-3 rounded-lg px-3 text-body-strong text-muted-foreground hover:bg-muted hover:text-foreground">
              <LogOut className="size-5" aria-hidden="true" />
              Sair
            </button>
          </li>
        </ul>
      </div>
      <div aria-hidden="true" onClick={onClose} className="min-h-0 flex-1" />
    </ModalDialog>
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
      className="relative shrink-0 max-[640px]:hidden min-[1441px]:hidden"
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
        className={cn('flex h-11 items-center gap-1 rounded-lg px-2.5 text-body-strong hover:bg-muted', open ? 'bg-secondary text-foreground' : 'text-muted-foreground')}
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

/** Barra de navegação principal (Nav.dc.html). Rola na horizontal em telas estreitas. */
export const Nav: React.FC = () => {
  const { user } = useAuth();
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
  return (
    <nav aria-label="Principal" className="flex h-[60px] shrink-0 items-center gap-2 border-b border-border bg-card px-3 text-foreground sm:gap-3 sm:px-4">
      <Link to="/map" aria-label="MAPi — mapa ao vivo" className="flex h-11 shrink-0 items-center rounded-lg pr-1">
        <img src={theme === 'light' ? logoLight : logoDark} alt="MAPi" className="h-[26px] w-auto" />
      </Link>
      <div className="flex min-w-0 flex-1 items-center gap-0.5 max-[640px]:hidden">
        {items.map(({ label, to, icon: Icon, priority }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/modelo'}
            className={({ isActive }) =>
              cn(
                'h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-body-strong md:h-9',
                priority ? 'flex' : 'hidden min-[1441px]:flex',
                isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            <Icon className="size-4" aria-hidden="true" />
            <span className="max-lg:sr-only">{label}</span>
          </NavLink>
        ))}
        <MoreMenu items={items.filter((i) => !i.priority)} />
      </div>
      <div className="flex-1 min-[641px]:hidden" />
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
      {open && <MobileSheet items={items} showUsers={hasRole(role, USERS_MIN_ROLE)} onClose={() => setOpen(false)} />}
    </nav>
  );
};
