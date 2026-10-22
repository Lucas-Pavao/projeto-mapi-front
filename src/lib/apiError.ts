import axios from 'axios';

/** Status HTTP de um erro do axios, ou null se não for erro de resposta. */
export function httpStatus(error: unknown): number | null {
  return axios.isAxiosError(error) && error.response ? error.response.status : null;
}

/**
 * Mensagem em português para erro de ação (salvar, reconhecer, convidar). A API responde 403 tanto
 * sem sessão quanto sem perfil (ADR 0010), então o texto cobre os dois casos.
 */
export function actionErrorMessage(error: unknown, what: string): string {
  const status = httpStatus(error);
  switch (status) {
    case 400:
    case 422:
      return `Dados inválidos ao ${what}. Confira os campos.`;
    case 403:
      return `Sem permissão para ${what}, ou a sessão acabou. Entre de novo se for o caso.`;
    case 404:
      return `Item não encontrado ao ${what}. A lista pode ter mudado; atualize a página.`;
    case 409:
      return `Conflito ao ${what}: o item já foi alterado ou a regra do sistema não permite.`;
    case 429:
      return `Muitas tentativas ao ${what}. Espere um pouco e tente de novo.`;
    case 503:
      return `Serviço indisponível ao ${what}. Tente de novo em instantes.`;
    default:
      return status === null ? `Sem conexão ao ${what}. Confira a rede e tente de novo.` : `Não foi possível ${what}.`;
  }
}
