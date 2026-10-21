const TZ = 'America/Recife';
const parts = (d: Date, opts: Intl.DateTimeFormatOptions) =>
  Object.fromEntries(new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, ...opts }).formatToParts(d).map((p) => [p.type, p.value]));

/** "21h30" (hoje, em America/Recife) ou "20/10 21h30" (outro dia). Ausente ou inválido: null. */
export function formatHoraCurta(iso: string | null | undefined, now: number = Date.now()): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const h = parts(d, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const hora = `${h.hour}h${h.minute}`;
  const a = parts(d, { day: '2-digit', month: '2-digit', year: 'numeric' });
  const b = parts(new Date(now), { day: '2-digit', month: '2-digit', year: 'numeric' });
  return a.day === b.day && a.month === b.month && a.year === b.year ? hora : `${a.day}/${a.month} ${hora}`;
}

/** "21h" a partir de epoch ms, em America/Recife. */
export function formatHoraCheia(ms: number): string {
  return `${parts(new Date(ms), { hour: '2-digit', hourCycle: 'h23' }).hour}h`;
}

/** Número em pt-BR com casas fixas; ausente: "—". */
export function num(v: number | null | undefined, digits = 1): string {
  return v == null || !Number.isFinite(v) ? '—' : v.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
