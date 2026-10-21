import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { hasRole, parseRole } from '@/lib/roles';
import type { Role } from '@/lib/apiSchemas';
import { PageShell } from './PageShell';

/** Barreira de rota por perfil (ADR 0010). A API continua sendo a barreira real; isto evita tela inútil. */
export const RequireRole: React.FC<{ min: Role }> = ({ min }) => {
  const { user, roleChanged, clearRoleChanged } = useAuth();
  const allowed = hasRole(parseRole(user?.role), min);
  // Perfil mudou e esta tela deixou de ser permitida: vai ao mapa com aviso (o estado de navegação vira notificação no AppLayout).
  React.useEffect(() => {
    if (!allowed && roleChanged) clearRoleChanged?.();
  }, [allowed, roleChanged, clearRoleChanged]);
  if (allowed) return <Outlet />;
  if (roleChanged) return <Navigate to="/map" replace state={{ notice: 'Seu perfil mudou.' }} />;
  return (
    <PageShell title="Sem permissão">
      <div role="alert" className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-6 text-center">
        <ShieldOff className="size-5 text-muted-foreground" aria-hidden="true" />
        <p className="text-body-strong text-foreground">Seu perfil não acessa esta tela.</p>
        <p className="text-caption text-muted-foreground">Peça a um administrador o perfil necessário ({min === 'ADMIN' ? 'Administrador' : 'Operador'}).</p>
      </div>
    </PageShell>
  );
};
