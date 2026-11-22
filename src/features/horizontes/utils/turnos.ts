import type { ForecastEntry, ForecastPeriod, OfficialForecast } from '../schemas/horizontes.schema';

export const PERIOD_LABEL: Record<ForecastPeriod, string> = { MANHA: 'Manhã', TARDE: 'Tarde', NOITE: 'Noite', DIA: 'Dia' };

const partsFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Recife', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' });

/** Data civil (yyyy-MM-dd) e hora de Recife de um instante. */
export const recifeDateHour = (ms: number): { date: string; hour: number } => {
  const p = Object.fromEntries(partsFmt.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) };
};

/**
 * Turno atual e o seguinte. Horário dos turnos do INMET [não verificado: a API não publica]: manhã até 12h, tarde até
 * 18h, noite até 24h (de madrugada, o turno "atual" é a manhã do dia). Dia sem turnos vira um bloco DIA.
 */
export const currentAndNext = (f: OfficialForecast, nowMs: number): { current: Entry | null; next: Entry | null } => {
  const { date, hour } = recifeDateHour(nowMs);
  const order: ForecastPeriod[] = ['MANHA', 'TARDE', 'NOITE'];
  const want: ForecastPeriod = hour < 12 ? 'MANHA' : hour < 18 ? 'TARDE' : 'NOITE';
  const flat: Entry[] = [];
  for (const d of f.days) {
    if (d.date < date) continue;
    const sorted = [...d.periods].sort((a, b) => order.indexOf(a.period) - order.indexOf(b.period));
    for (const e of sorted) flat.push({ ...e, date: d.date, today: d.date === date });
  }
  const startIdx = flat.findIndex((e) => !e.today || e.period === 'DIA' || order.indexOf(e.period) >= order.indexOf(want));
  if (startIdx < 0) return { current: null, next: null };
  return { current: flat[startIdx] ?? null, next: flat[startIdx + 1] ?? null };
};

export type Entry = ForecastEntry & { date: string; today: boolean };

const clockFmt = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Recife', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

/** "visto às 14h15" (hora de Recife). */
export const seenAtText = (iso: string | null | undefined): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `visto às ${clockFmt.format(d).replace(':', 'h')}`;
};

/** "24–34 °C" ou só o que existir; nunca inventa zero. */
export const tempText = (e: ForecastEntry): string | null => {
  if (e.tempMin != null && e.tempMax != null) return `${e.tempMin}–${e.tempMax} °C`;
  if (e.tempMax != null) return `máx. ${e.tempMax} °C`;
  if (e.tempMin != null) return `mín. ${e.tempMin} °C`;
  return null;
};

/** Rótulo do turno: "Tarde" hoje, "Amanhã · manhã" no dia seguinte. */
export const entryLabel = (e: Entry): string => (e.today ? PERIOD_LABEL[e.period] : `Amanhã · ${PERIOD_LABEL[e.period].toLowerCase()}`);
