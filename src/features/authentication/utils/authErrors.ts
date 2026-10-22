import axios from 'axios';

export type AuthMode = 'login' | 'register';

/** Texto de erro de login/cadastro. Status conhecidos têm texto próprio; senão, a mensagem da API; senão, o padrão. */
export function authErrorMessage(err: unknown, mode: AuthMode, hasInvite = false): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status ?? null;
    if (status === null) return 'Sem conexão com o MAPi. Confira a internet e tente de novo.';
    if (status === 429) return 'Muitas tentativas seguidas. Espere um pouco e tente de novo.';
    if (mode === 'login' && [400, 401, 403].includes(status)) return 'Usuário ou senha incorretos, ou conta desativada.';
    if (mode === 'register' && status === 409) return 'Esse usuário (ou e-mail) já está em uso. Tente outro.';
    if (mode === 'register' && hasInvite && [400, 403, 404, 410, 422].includes(status)) return 'Convite inválido, vencido ou já usado. Peça outro a um administrador.';
    const apiMessage = (err.response?.data as { message?: unknown } | undefined)?.message;
    if (typeof apiMessage === 'string' && apiMessage.trim()) return apiMessage;
  } else if (err instanceof Error && err.message) {
    return err.message;
  }
  return mode === 'register' ? 'Não foi possível criar a conta. Confira os dados e tente de novo.' : 'Falha ao entrar. Tente de novo.';
}
