import React, { useState } from 'react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogPanel } from '@/components/ui/dialog-panel';
import { Field, Select } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { formatRecife } from '@/features/map/utils/datetime';
import type { Role } from '@/lib/apiSchemas';
import type { Invite, UserPatch, UserSummary } from '../schemas/admin.schema';
import { ROLE_HELP, ROLE_LABEL, inviteLink, inviteMessage } from '../utils/users';

const ROLES: Role[] = ['USER', 'OPERADOR', 'ADMIN'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const UserEditDialog: React.FC<{ user: UserSummary; saving: boolean; error?: string | null; onSave: (p: UserPatch) => void; onClose: () => void }> = ({ user, saving, error, onSave, onClose }) => {
  const [name, setName] = useState(user.name ?? '');
  const [email, setEmail] = useState(user.email ?? '');
  const [errs, setErrs] = useState<Record<string, string>>({});
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const patch: UserPatch = {};
    const out: Record<string, string> = {};
    if (name.trim() !== (user.name ?? '')) {
      if (name.length > 255) out.name = 'No máximo 255 caracteres.';
      else patch.name = name.trim();
    }
    if (email.trim() !== (user.email ?? '')) {
      if (email.trim() !== '' && !EMAIL_RE.test(email.trim())) out.email = 'E-mail inválido.';
      else patch.email = email.trim();
    }
    if (Object.keys(patch).length === 0 && Object.keys(out).length === 0) out.form = 'Nada mudou.';
    setErrs(out);
    if (Object.keys(out).length === 0) onSave(patch);
  };
  return (
    <DialogPanel title="Editar usuário" description="Apague o campo para limpá-lo. O e-mail não pode repetir outro cadastro." onClose={onClose}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-3">
        <Field label="Nome" error={errs.name}>{(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} className="h-11 md:h-8" />}</Field>
        <Field label="E-mail" error={errs.email}>{(p) => <Input {...p} type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 md:h-8" />}</Field>
        {errs.form && <p role="alert" className="text-body text-warning">{errs.form}</p>}
        {error && <p role="alert" className="text-body text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" className="h-11 px-4 md:h-8" onClick={onClose}>Cancelar</Button>
          <Button type="submit" className="h-11 px-4 md:h-8" disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</Button>
        </div>
      </form>
    </DialogPanel>
  );
};

interface InviteProps {
  invite: Invite | null;
  creating: boolean;
  error?: string | null;
  origin: string;
  onCreate: (role: Role, email: string | null) => void;
  onClose: () => void;
}

export const InviteDialog: React.FC<InviteProps> = ({ invite, creating, error, origin, onCreate, onClose }) => {
  const [role, setRole] = useState<Role>('USER');
  const [email, setEmail] = useState('');
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [copied, setCopied] = useState<'link' | 'msg' | 'fail' | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && !EMAIL_RE.test(email.trim())) return setEmailErr('E-mail inválido.');
    setEmailErr(null);
    onCreate(role, email.trim() || null);
  };

  const link = invite ? inviteLink(origin, invite.token) : '';
  const expires = invite ? formatRecife(invite.expiresAt) ?? invite.expiresAt : '';
  const copy = async (text: string, what: 'link' | 'msg') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
    } catch {
      setCopied('fail');
    }
  };

  return (
    <DialogPanel title={invite ? 'Convite criado' : 'Convidar pessoa'} description={invite ? 'Copie agora: o link só aparece aqui. Uso único, vale por 72 h.' : 'O convite dá o perfil escolhido a quem criar a conta com ele. Não há envio por e-mail: você copia o link.'} onClose={onClose}>
      {invite ? (
        <div className="flex flex-col gap-3">
          <p className="text-body text-foreground">Perfil: <strong>{ROLE_LABEL[invite.role]}</strong> · válido até <strong>{expires}</strong></p>
          <Field label="Link de cadastro">{(p) => <Input {...p} readOnly value={link} onFocus={(e) => e.currentTarget.select()} className="h-11 font-mono md:h-8" />}</Field>
          <div className="flex flex-wrap gap-2">
            <Button type="button" className="h-11 gap-1.5 px-4 md:h-8" onClick={() => void copy(link, 'link')}><Copy className="size-4" aria-hidden="true" /> Copiar link</Button>
            <Button type="button" variant="outline" className="h-11 px-4 md:h-8" onClick={() => void copy(inviteMessage(link, invite.role, expires), 'msg')}>Copiar mensagem pronta</Button>
          </div>
          <p role="status" aria-live="polite" className="min-h-5 text-caption text-muted-foreground">
            {copied === 'link' && 'Link copiado.'}{copied === 'msg' && 'Mensagem copiada.'}{copied === 'fail' && 'Não foi possível copiar sozinho: selecione o link acima e copie.'}
          </p>
          <div className="flex justify-end"><Button type="button" variant="outline" className="h-11 px-4 md:h-8" onClick={onClose}>Fechar</Button></div>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="flex flex-col gap-3">
          <Field label="Perfil" hint={ROLE_HELP[role]}>
            {(p) => <Select {...p} value={role} onChange={(e) => setRole(e.target.value as Role)}>{ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</Select>}
          </Field>
          <Field label="E-mail da pessoa (opcional)" hint="Se informado, preenche o e-mail da conta e vale sobre o digitado no cadastro." error={emailErr}>
            {(p) => <Input {...p} type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 md:h-8" />}
          </Field>
          {error && <p role="alert" className="text-body text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" className="h-11 px-4 md:h-8" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="h-11 px-4 md:h-8" disabled={creating}>{creating ? 'Gerando…' : 'Gerar convite'}</Button>
          </div>
        </form>
      )}
    </DialogPanel>
  );
};
