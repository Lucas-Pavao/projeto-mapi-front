import type { RainEvent, RainSource, RainSourceData } from '../schemas/rain-events.schema';

export const SOURCE_LABEL: Record<RainSource, string> = { CEMADEN_PED: 'Cemaden PED', ANA: 'ANA', OPEN_METEO_ARCHIVE: 'Reanálise (Open-Meteo)' };

export const eventKey = (e: RainEvent) => `${e.slug}|${e.startUtc}`;

/** Slugs dos pontos presentes nos dados, em ordem. */
export const slugsOf = (d: RainSourceData): string[] => [...new Set(d.summary.map((r) => r.slug))].sort();

export const eventsOf = (d: RainSourceData, slug: string): RainEvent[] => (slug === 'all' ? d.events : d.events.filter((e) => e.slug === slug));

/** Eventos completos (não truncados) com pico horário acima da fração `frac` da capacidade, do maior para o menor pico. */
export function aboveCapacity(events: readonly RainEvent[], capacity: number, frac = 1): RainEvent[] {
  return events
    .filter((e) => !e.truncated && e.maxHourlyMmH != null && e.maxHourlyMmH > capacity * frac)
    .sort((a, b) => (b.maxHourlyMmH as number) - (a.maxHourlyMmH as number));
}

export interface Kpi { label: string; value: string; tone?: 'high' | 'muted' }

const fmt1 = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** KPIs da fonte para o ponto escolhido (ou todos): soma das linhas do resumo e o maior pico horário dos eventos. Ausente = "—". */
export function sourceKpis(d: RainSourceData, slug: string): Kpi[] {
  const rows = d.summary.filter((r) => slug === 'all' || r.slug === slug);
  const sum = (type: string, key: 'count' | 'eventsAboveCapacity') => rows.filter((r) => r.type === type).reduce((s, r) => s + (r[key] ?? 0), 0);
  const cov = rows.filter((r) => r.type === 'TOTAL' && r.coverageFraction != null).map((r) => r.coverageFraction as number);
  const peaks = eventsOf(d, slug).map((e) => e.maxHourlyMmH).filter((v): v is number => v != null);
  const fmt = (n: number) => n.toLocaleString('pt-BR');
  return [
    { label: 'eventos', value: fmt(sum('TOTAL', 'count')) },
    { label: 'fracos', value: fmt(sum('FRACA', 'count')), tone: 'muted' },
    { label: 'médios', value: fmt(sum('MEDIA', 'count')) },
    { label: 'eventos de chuva forte', value: fmt(sum('FORTE', 'count')) },
    { label: 'acima da capacidade', value: fmt(sum('TOTAL', 'eventsAboveCapacity')), tone: 'high' },
    { label: 'maior pico (mm/h)', value: peaks.length ? fmt1(Math.max(...peaks)) : '—' },
    { label: 'horas com valor', value: cov.length ? `${(cov.reduce((a, b) => a + b, 0) / cov.length * 100).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%` : '—', tone: 'muted' },
  ];
}

export const SWEEP = [1, 0.75, 0.5, 0.35, 0.25] as const;

/** "out/2021" a partir do instante UTC do período, em America/Recife. */
export function monthYear(iso: string): string {
  const p = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric', timeZone: 'America/Recife' }).formatToParts(new Date(iso));
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? '';
  return `${get('month').replace('.', '')}/${get('year')}`;
}
