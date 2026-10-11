const recifeFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Recife',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * Utilitário único de exibição de instantes em America/Recife (ADR 0001/0007).
 * Aceita ISO-8601 (com `Z` ou offset). Ausente ou inválido → null, nunca "Invalid Date".
 */
export function formatRecife(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return recifeFormatter.format(date).replace(',', '');
}
