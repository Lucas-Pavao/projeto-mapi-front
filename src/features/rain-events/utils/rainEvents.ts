import type { RainEvent, RainEventTable, RainManifest, RainSource, RainSummary } from '../schemas/rain-events.schema';

export const SOURCE_LABEL: Record<RainSource, string> = { CEMADEN_PED: 'Cemaden PED', ANA: 'ANA', OPEN_METEO_ARCHIVE: 'Reanálise (Open-Meteo)' };

/** Capacidade de projeto (mm/h) que a API usou, lida do manifesto; sem ela a tela não desenha linha de capacidade. */
export function capacityOf(m: RainManifest | undefined): number | null {
  const v = m?.params?.capacityMmH;
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/** Eventos completos (não truncados) cuja chuva horária passou da fração `frac` da capacidade, do maior para o menor pico. */
export function aboveCapacity(events: readonly RainEvent[], capacity: number, frac = 1): RainEvent[] {
  return events
    .filter((e) => !e.truncated && e.maxHourlyMmH != null && e.maxHourlyMmH > capacity * frac)
    .sort((a, b) => (b.maxHourlyMmH as number) - (a.maxHourlyMmH as number));
}

export interface Kpi { label: string; value: string; tone?: 'high' | 'muted' }

const sumOf = (rows: RainSummary['rows'], type: string, key: 'count' | 'countWithoutGap' | 'eventsAboveCapacity' | 'truncatedExcluded') =>
  rows.filter((r) => r.type === type).reduce((s, r) => s + (r[key] ?? 0), 0);

/** KPIs a partir das linhas do resumo (soma dos pontos). Cobertura = média das linhas TOTAL que a informam; ausente = "—". */
export function summaryKpis(s: RainSummary): Kpi[] {
  const fmt = (n: number) => n.toLocaleString('pt-BR');
  const cov = s.rows.filter((r) => r.type === 'TOTAL' && r.coverageFraction != null).map((r) => r.coverageFraction as number);
  return [
    { label: 'eventos', value: fmt(sumOf(s.rows, 'TOTAL', 'count')) },
    { label: 'sem lacuna', value: fmt(sumOf(s.rows, 'TOTAL', 'countWithoutGap')) },
    { label: 'fracos', value: fmt(sumOf(s.rows, 'FRACA', 'count')), tone: 'muted' },
    { label: 'médios', value: fmt(sumOf(s.rows, 'MEDIA', 'count')) },
    { label: 'eventos de chuva forte', value: fmt(sumOf(s.rows, 'FORTE', 'count')) },
    { label: 'acima da capacidade', value: fmt(sumOf(s.rows, 'TOTAL', 'eventsAboveCapacity')), tone: 'high' },
    { label: 'horas com valor', value: cov.length ? `${(cov.reduce((a, b) => a + b, 0) / cov.length * 100).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%` : '—', tone: 'muted' },
  ];
}

export const SWEEP = [1, 0.75, 0.5, 0.35, 0.25] as const;

/** Quantos eventos passam da fração da capacidade, por fonte; fonte ainda sem resposta fica null (nunca 0). */
export function sweepCounts(tables: ReadonlyArray<RainEventTable | undefined>, capacity: number, frac: number): Array<number | null> {
  return tables.map((t) => (t ? aboveCapacity(t.events, capacity, frac).length : null));
}
