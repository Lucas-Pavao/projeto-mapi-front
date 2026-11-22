import React from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut, X } from 'lucide-react';
import { ModalDialog } from '@/components/ui/modal-dialog';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { NAV_GROUPS, NAV_ITEMS } from '@/lib/navItems';
import { DetailSwitch } from '@/lib/detailMode';
import { hasRole, parseRole } from '@/lib/roles';

/** Folha de navegação do celular (<= 640 px): todos os itens do perfil, foco preso, Esc fecha. */
export const MobileMenu: React.FC<{ onClose: () => void; top?: string }> = ({ onClose, top = 'top-[60px]' }) => {
  const { user, logout } = useAuth();
  const role = parseRole(user?.role);
  const items = NAV_ITEMS.filter((i) => hasRole(role, i.minRole));
  const link = ({ isActive }: { isActive: boolean }) =>
    cn('mapi-press-row flex h-12 items-center gap-3 rounded-lg px-3 text-body-strong', isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground');
  return (
    <ModalDialog label="Menu principal" onClose={onClose} className={cn('mapi-enter-backdrop fixed inset-x-0 bottom-0 z-50 flex flex-col bg-background/80 backdrop-blur-[2px]', top)}>
      <div id="menu-principal" className="mapi-enter-popover flex max-h-full origin-top flex-col overflow-y-auto border-b border-border bg-card p-2 shadow-[var(--elevation-overlay),var(--surface-highlight)]">
        <button type="button" onClick={onClose} aria-label="Fechar menu" className="mapi-press ml-auto flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
          <X className="size-5" aria-hidden="true" />
        </button>
        <ul>
          {NAV_GROUPS.map((g) => {
            const gi = items.filter((i) => i.group === g.id);
            if (gi.length === 0) return null;
            return (
              <li key={g.id}>
                {g.id !== 'mapa' && <p className="px-3 pb-1 pt-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">{g.label}</p>}
                <ul>
                  {gi.map(({ label, to, icon: Icon }) => (
                    <li key={to}>
                      <NavLink to={to} end={to === '/modelo'} onClick={onClose} className={link}>
                        <Icon className="size-5" aria-hidden="true" />
                        {label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
          <li className="mt-1 border-t border-border px-1 pt-1"><DetailSwitch /></li>
          <li className="mt-1 border-t border-border pt-1">
            <button type="button" onClick={() => { onClose(); void logout(); }} className="mapi-press-row flex h-12 w-full items-center gap-3 rounded-lg px-3 text-body-strong text-muted-foreground hover:bg-muted hover:text-foreground">
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
