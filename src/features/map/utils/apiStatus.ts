import { formatRecife } from './datetime';

export type ApiStatus = 'loading' | 'online' | 'error';

/** Estado real da conexão, derivado do resultado das requisições (não é mais um texto fixo). */
export function deriveApiStatus(input: { isLoading: boolean; hasError: boolean }): ApiStatus {
  if (input.hasError) return 'error';
  if (input.isLoading) return 'loading';
  return 'online';
}

/** "Último dado válido: 10/10/2026 12:30 (horário de Recife)" ou aviso de que nunca houve dado. */
export function lastValidText(lastSuccessAt: string | null | undefined): string {
  const formatted = formatRecife(lastSuccessAt);
  return formatted
    ? `Último dado válido: ${formatted} (horário de Recife)`
    : 'Nenhum dado válido recebido nesta sessão';
}
