import type { Role } from '@/lib/apiSchemas';

export const ROLE_LABEL: Record<Role, string> = { USER: 'Usuário', OPERADOR: 'Operador', ADMIN: 'Administrador' };
export const ROLE_HELP: Record<Role, string> = {
  USER: 'Vê mapa, pontos, sensores, maré e modelo; envia relatos; simula.',
  OPERADOR: 'Tudo do usuário, mais alertas, regras e revisão de relatos.',
  ADMIN: 'Tudo do operador, mais pontos, dados, usuários e convites.',
};

/** Link de cadastro para o convite. O token vai na query `convite` da tela de login. */
export function inviteLink(origin: string, token: string): string {
  return `${origin.replace(/\/$/, '')}/login?convite=${encodeURIComponent(token)}`;
}

/** Texto do convite para colar numa mensagem. */
export function inviteMessage(link: string, role: Role, expiresAtText: string): string {
  return `Convite para o MAPi (perfil ${ROLE_LABEL[role]}). Crie sua conta neste link, de uso único, válido até ${expiresAtText}: ${link}`;
}

/** Mensagem do 409 de usuário: a API junta quatro regras no mesmo status. */
export const USER_CONFLICT_TEXT =
  'A API recusou: você não pode mudar o próprio perfil nem desativar a si mesmo, o sistema precisa de ao menos um administrador ativo, e o e-mail não pode repetir outro cadastro.';

/** Iniciais para o avatar: duas primeiras palavras do nome; sem nome, a primeira letra do e-mail. */
export function initials(name: string | null | undefined, email: string | null | undefined): string {
  const src = (name ?? '').trim() || (email ?? '').trim();
  if (!src) return '?';
  return src.split(/[\s@._-]+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

/** "agora", "há 5 min", "há 3 h", "há 2 dias"; sem registro, "nunca". */
export function lastAccessText(iso: string | null | undefined, now: number): string {
  if (!iso) return 'nunca';
  const m = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000));
  if (m < 1) return 'agora';
  if (m < 60) return `há ${m} min`;
  if (m < 1440) return `há ${Math.floor(m / 60)} h`;
  const d = Math.floor(m / 1440);
  return `há ${d} ${d === 1 ? 'dia' : 'dias'}`;
}
