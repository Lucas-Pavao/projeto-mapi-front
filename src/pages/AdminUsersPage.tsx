import React from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { QueryState } from '@/components/ui/query-state';
import { useAdminUsers } from '@/features/admin/hooks/useAdminData';

export const AdminUsersPage: React.FC = () => {
  const query = useAdminUsers();
  return (
    <PageShell title="Usuários" description="Contas e perfis (USER, OPERADOR, ADMIN).">
      <QueryState query={query} what="os usuários" isEmpty={(d) => d.content.length === 0} emptyTitle="Nenhum usuário.">
        {(page) => (
          <ul className="space-y-2">
            {page.content.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-4 text-sm">
                <span className="min-w-0">
                  <span className="block font-bold text-foreground">{u.name ?? u.email}</span>
                  <span className="block text-xs text-muted-foreground">{u.email}</span>
                </span>
                <span className="font-mono text-xs text-foreground">{u.role}{u.active ? '' : ' · inativo'}</span>
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    </PageShell>
  );
};
export default AdminUsersPage;
