import React, { useState } from 'react';
import { Pencil, UserPlus } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { QueryState } from '@/components/ui/query-state';
import { NoticeRegion } from '@/components/ui/notice-region';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/form-field';
import { useNotices } from '@/hooks/useNotices';
import { useAdminUsers, useCreateInvite, usePatchUser } from '@/features/admin/hooks/useAdminData';
import { InviteDialog, UserEditDialog } from '@/features/admin/components/UserDialogs';
import { ROLE_LABEL, USER_CONFLICT_TEXT } from '@/features/admin/utils/users';
import type { Invite, UserPatch, UserSummary } from '@/features/admin/schemas/admin.schema';
import { formatRecife } from '@/features/map/utils/datetime';
import { actionErrorMessage, httpStatus } from '@/lib/apiError';
import type { Role } from '@/lib/apiSchemas';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;
const ROLES: Role[] = ['USER', 'OPERADOR', 'ADMIN'];

export const AdminUsersPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const query = useAdminUsers(page, PAGE_SIZE);
  const patch = usePatchUser();
  const invite = useCreateInvite();
  const { notices, notify, dismiss } = useNotices();
  const [editing, setEditing] = useState<UserSummary | null>(null);
  const [inviting, setInviting] = useState(false);
  const [created, setCreated] = useState<Invite | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const apply = (u: UserSummary, p: UserPatch, okMsg: string, onDone?: () => void) => {
    setBusyId(u.id);
    patch.mutate({ id: u.id, patch: p }, {
      onSuccess: () => { notify('success', okMsg); onDone?.(); },
      onError: (e) => {
        const msg = httpStatus(e) === 409 ? USER_CONFLICT_TEXT : actionErrorMessage(e, 'alterar o usuário');
        if (onDone) setFormError(msg); else notify('error', msg);
      },
      onSettled: () => setBusyId(null),
    });
  };

  return (
    <PageShell
      title="Usuários"
      description="Contas, perfis e convites. Mudar perfil ou desativar vale na hora; desativar bloqueia o login."
      actions={<Button type="button" className="h-11 gap-1.5 px-4 md:h-8" onClick={() => { setCreated(null); setFormError(null); setInviting(true); }}><UserPlus className="size-4" aria-hidden="true" /> Convidar</Button>}
    >
      <QueryState query={query} what="os usuários" isEmpty={(d) => d.content.length === 0} emptyTitle="Nenhum usuário." emptyHint="Convide a primeira pessoa.">
        {(data) => (
          <>
            <ul className="flex flex-col gap-2" aria-label="Usuários">
              {data.content.map((u) => (
                <li key={u.id} data-user-id={u.id} data-active={u.active} className={cn('flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3', u.active ? 'border-border' : 'border-dashed border-border opacity-80')}>
                  <div className="min-w-0 flex-1 basis-56">
                    <p className="text-body-strong text-foreground">{u.name ?? <span className="font-normal text-muted-foreground">Sem nome</span>}</p>
                    <p className="break-all text-caption text-muted-foreground">{u.email ?? 'Sem e-mail (conta criada antes do cadastro de e-mail)'}</p>
                    <p className="text-caption text-muted-foreground">Último acesso: {formatRecife(u.lastLoginAt) ?? 'nunca'}</p>
                  </div>
                  <label className="flex flex-col gap-1 text-caption text-muted-foreground">
                    Perfil
                    <Select value={u.role} disabled={busyId === u.id} aria-label={`Perfil de ${u.name ?? u.email ?? `usuário ${u.id}`}`} onChange={(e) => apply(u, { role: e.target.value as Role }, 'Perfil alterado.')} className="w-40">
                      {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                    </Select>
                  </label>
                  <label className="flex min-h-11 items-center gap-2 text-body text-foreground">
                    <input type="checkbox" role="switch" checked={u.active} disabled={busyId === u.id} onChange={() => apply(u, { active: !u.active }, u.active ? 'Usuário desativado.' : 'Usuário ativado.')} className="size-4" aria-label={`${u.name ?? u.email ?? `Usuário ${u.id}`}: conta ativa`} />
                    {u.active ? 'Ativo' : 'Inativo'}
                  </label>
                  <Button type="button" variant="outline" className="h-11 gap-1.5 px-3 md:h-8" onClick={() => { setFormError(null); setEditing(u); }} aria-label={`Editar ${u.name ?? u.email ?? `usuário ${u.id}`}`}><Pencil className="size-4" aria-hidden="true" /> Editar</Button>
                </li>
              ))}
            </ul>
            {data.totalElements > PAGE_SIZE && (
              <nav aria-label="Páginas" className="flex items-center justify-between gap-2">
                <Button type="button" variant="outline" className="h-11 px-4 md:h-8" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
                <span className="text-caption text-muted-foreground">Página {page + 1} de {Math.ceil(data.totalElements / PAGE_SIZE)} · {data.totalElements} usuários</span>
                <Button type="button" variant="outline" className="h-11 px-4 md:h-8" disabled={(page + 1) * PAGE_SIZE >= data.totalElements} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
              </nav>
            )}
          </>
        )}
      </QueryState>
      {editing && <UserEditDialog key={editing.id} user={editing} saving={patch.isPending} error={formError} onSave={(p) => apply(editing, p, 'Usuário atualizado.', () => setEditing(null))} onClose={() => setEditing(null)} />}
      {inviting && (
        <InviteDialog
          invite={created}
          creating={invite.isPending}
          error={formError}
          origin={window.location.origin}
          onCreate={(role, email) => { setFormError(null); invite.mutate({ role, email }, { onSuccess: (inv) => setCreated(inv), onError: (e) => setFormError(actionErrorMessage(e, 'gerar o convite')) }); }}
          onClose={() => { setInviting(false); setCreated(null); }}
        />
      )}
      <NoticeRegion notices={notices} onDismiss={dismiss} />
    </PageShell>
  );
};
export default AdminUsersPage;
