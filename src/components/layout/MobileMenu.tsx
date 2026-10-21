import React from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut, Users, X } from 'lucide-react';
import { ModalDialog } from '@/components/ui/modal-dialog';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, USERS_MIN_ROLE, USERS_PATH } from '@/lib/navItems';
import { hasRole, parseRole } from '@/lib/roles';

/** Folha de navegação do celular (<= 640 px): todos os itens do perfil, foco preso, Esc fecha. */
export const MobileMenu: React.FC<{ onClose: () => void; top?: string }> = ({ onClose, top = 'top-[60px]' }) => {
  const { user, logout } = useAuth();
  const role = parseRole(user?.role);
  const items = NAV_ITEMS.filter((i) => hasRole(role, i.minRole));
  const showUsers = hasRole(role, USERS_MIN_ROLE);
  const link = ({ isActive }: { isActive: boolean }) =>
    cn('flex h-12 items-center gap-3 rounded-lg px-3 text-body-strong', isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground');
  return (
    <ModalDialog label="Menu principal" onClose={onClose} className={cn('fixed inset-x-0 bottom-0 z-50 flex flex-col bg-background/80', top)}>
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
