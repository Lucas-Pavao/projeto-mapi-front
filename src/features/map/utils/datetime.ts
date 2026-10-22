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

const hourFmt = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Recife', hour: '2-digit', minute: '2-digit' });
const dayFmt = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Recife', day: '2-digit', month: '2-digit' });

/** "HH:mm" em America/Recife a partir de epoch ms. */
export const formatRecifeHourMs = (ms: number): string => hourFmt.format(new Date(ms));
/** "dd/MM" em America/Recife a partir de epoch ms. */
export const formatRecifeDayMs = (ms: number): string => dayFmt.format(new Date(ms));
