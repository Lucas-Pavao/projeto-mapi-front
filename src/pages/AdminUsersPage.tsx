import React, { useState } from 'react';
import { Pencil } from 'lucide-react';
import { QueryState } from '@/components/ui/query-state';
import { NoticeRegion } from '@/components/ui/notice-region';
import { Button } from '@/components/ui/button';
import { useNotices } from '@/hooks/useNotices';
import { useAuth } from '@/hooks/useAuth';
import { useAdminUsers, useCreateInvite, usePatchUser } from '@/features/admin/hooks/useAdminData';
import { InviteDialog, UserEditDialog } from '@/features/admin/components/UserDialogs';
import { RolePermissions } from '@/features/admin/components/RolePermissions';
import { USER_CONFLICT_TEXT, initials, lastAccessText } from '@/features/admin/utils/users';
import type { Invite, UserPatch, UserSummary } from '@/features/admin/schemas/admin.schema';
import { actionErrorMessage, httpStatus } from '@/lib/apiError';
import type { Role } from '@/lib/apiSchemas';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;
/** O token só é checado na próxima requisição da pessoa afetada (TOKEN_REVOKED). */
const TAKES_EFFECT = 'A mudança vale na próxima ação desse usuário.';
const ROLES: Role[] = ['ADMIN', 'OPERADOR', 'USER'];
const cols = 'grid grid-cols-[1.6fr_150px_1fr_110px_44px] items-center gap-3';

export const AdminUsersPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const query = useAdminUsers(page, PAGE_SIZE);
  const patch = usePatchUser();
  const invite = useCreateInvite();
  const { notices, notify, dismiss } = useNotices();
  const { user: me } = useAuth();
  const [editing, setEditing] = useState<UserSummary | null>(null);
  const [inviting, setInviting] = useState(false);
  const [created, setCreated] = useState<Invite | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [q, setQ] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

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
  const openInvite = () => { setCreated(null); setFormError(null); setInviting(true); };
  const label = (u: UserSummary) => u.name ?? u.email ?? `usuário ${u.id}`;
  const now = query.dataUpdatedAt;

  return (
    <div className="grid w-full grid-cols-1 gap-4 p-4 lg:h-full lg:grid-cols-12">
      <section aria-label="Usuários" className="flex min-h-96 min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card lg:col-span-7 lg:min-h-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-[18px] py-4">
          <div className="min-w-0 flex-1 basis-64">
            <h1 className="m-0 text-[22px] leading-7 font-extrabold text-foreground">Usuários e perfis</h1>
            <p className="m-0 text-xs text-muted-foreground">A API tem os perfis USER, OPERADOR e ADMIN (JWT + refresh). Convidado não faz login. Desativar bloqueia o login.</p>
          </div>
          <label className="flex w-full sm:w-[220px]">
            <span className="sr-only">Buscar usuário</span>
            <input type="search" placeholder="Buscar usuário" value={q} onChange={(e) => setQ(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground placeholder:text-muted-foreground md:h-9" />
          </label>
        </div>
        <QueryState query={query} what="os usuários" isEmpty={(d) => d.content.length === 0} emptyTitle="Nenhum usuário." emptyHint="Convide a primeira pessoa.">
          {(data) => {
            const needle = q.trim().toLowerCase();
            const list = needle ? data.content.filter((u) => [u.name, u.email].some((x) => x?.toLowerCase().includes(needle))) : data.content;
            return (
              <>
                <div aria-hidden="true" className={cn(cols, 'border-b border-border px-[18px] py-2 text-[11px] font-bold tracking-[0.04em] text-muted-foreground max-md:hidden')}>
                  <span>USUÁRIO</span><span>PERFIL</span><span>ÚLTIMO ACESSO</span><span>STATUS</span><span />
                </div>
                <ul aria-label="Usuários" className="custom-scrollbar m-0 min-h-0 flex-1 list-none overflow-y-auto p-0">
                  {list.length === 0 && <li className="px-[18px] py-6 text-body text-muted-foreground">Nenhum usuário com “{q}”.</li>}
                  {list.map((u) => {
                    const self = me?.id === u.id;
                    const on = u.active;
                    return (
                      <li key={u.id} data-user-id={u.id} data-self={self} data-active={u.active} className={cn(cols, 'border-b border-border px-[18px] py-2.5 max-md:grid-cols-1 max-md:gap-2')}>
                        <span className="flex min-w-0 items-center gap-2.5">
                          <span aria-hidden="true" className="flex size-8 flex-none items-center justify-center rounded-full bg-secondary text-xs font-extrabold">{initials(u.name, u.email)}</span>
                          <span className="min-w-0">
                            <strong className="block truncate text-sm">{u.name ?? <span className="font-normal text-muted-foreground">Sem nome</span>}</strong>
                            <span className="block break-all text-xs text-muted-foreground">{u.email ?? 'Sem e-mail (conta criada antes do cadastro de e-mail)'}</span>
                            {self && <span className="block text-xs font-semibold text-foreground">Esta é a sua conta: você não pode mudar o próprio perfil nem desativar a si mesmo.</span>}
                          </span>
                        </span>
                        <select value={u.role} disabled={busyId === u.id || self} aria-label={`Perfil de ${label(u)}`} onChange={(e) => apply(u, { role: e.target.value as Role }, `Perfil alterado. ${TAKES_EFFECT}`)} className="h-11 rounded-lg border border-input bg-card px-2 text-[13px] font-semibold text-foreground disabled:opacity-60 md:h-[34px]">
                          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <span className="font-mono text-xs text-muted-foreground">{lastAccessText(u.lastLoginAt, now)}</span>
                        <label className={cn('flex min-h-11 items-center gap-1.5 text-xs font-bold', on ? 'text-success' : 'text-muted-foreground')}>
                          <input type="checkbox" role="switch" checked={on} disabled={busyId === u.id || self} onChange={() => apply(u, { active: !u.active }, `${u.active ? 'Usuário desativado.' : 'Usuário ativado.'} ${TAKES_EFFECT}`)} aria-label={`${label(u)}: conta ativa`} className="m-0 size-4 accent-success" />
                          {on ? 'ativo' : 'inativo'}
                        </label>
                        <button type="button" onClick={() => { setFormError(null); setEditing(u); }} aria-label={`Editar ${label(u)}`} className="flex size-11 items-center justify-center rounded-lg border-0 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground md:size-8"><Pencil className="size-4" aria-hidden="true" /></button>
                      </li>
                    );
                  })}
                </ul>
                {data.totalElements > PAGE_SIZE && (
                  <nav aria-label="Páginas" className="flex items-center justify-between gap-2 border-t border-border px-[18px] py-2">
                    <Button type="button" variant="outline" className="h-11 px-4 md:h-8" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
                    <span className="text-caption text-muted-foreground">Página {page + 1} de {Math.ceil(data.totalElements / PAGE_SIZE)} · {data.totalElements} usuários</span>
                    <Button type="button" variant="outline" className="h-11 px-4 md:h-8" disabled={(page + 1) * PAGE_SIZE >= data.totalElements} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
                  </nav>
                )}
              </>
            );
          }}
        </QueryState>
        <form onSubmit={(e) => { e.preventDefault(); openInvite(); }} className="mt-auto flex items-center gap-2 border-t border-border px-[18px] py-3">
          <input type="email" placeholder="email@instituicao.gov.br" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} aria-label="E-mail para convite" className="h-11 min-w-0 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground placeholder:text-muted-foreground md:h-[38px]" />
          <Button type="submit" className="h-11 px-4 md:h-9">Convidar</Button>
        </form>
      </section>

      <RolePermissions />

      {editing && <UserEditDialog key={editing.id} user={editing} saving={patch.isPending} error={formError} onSave={(p) => apply(editing, p, 'Usuário atualizado.', () => setEditing(null))} onClose={() => setEditing(null)} />}
      {inviting && (
        <InviteDialog
          invite={created}
          creating={invite.isPending}
          error={formError}
          origin={window.location.origin}
          initialEmail={inviteEmail}
          onCreate={(role, email) => { setFormError(null); invite.mutate({ role, email }, { onSuccess: (inv) => { setCreated(inv); setInviteEmail(''); }, onError: (e) => setFormError(actionErrorMessage(e, 'gerar o convite')) }); }}
          onClose={() => { setInviting(false); setCreated(null); }}
        />
      )}
      <NoticeRegion notices={notices} onDismiss={dismiss} />
    </div>
  );
};
export default AdminUsersPage;
