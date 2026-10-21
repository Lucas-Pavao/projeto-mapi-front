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
