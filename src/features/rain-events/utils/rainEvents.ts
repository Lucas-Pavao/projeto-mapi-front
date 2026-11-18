import type { RainEvent, RainSource, RainSourceData } from '../schemas/rain-events.schema';

export const SOURCE_LABEL: Record<RainSource, string> = { CEMADEN_PED: 'Cemaden', ANA: 'ANA', OPEN_METEO_ARCHIVE: 'Reanálise' };

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

export interface Kpi { label: string; value: string; tone?: 'high' | 'muted'; testid?: string }

const nf = (n: number, d: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
/** "24–28" entre os pontos; um só valor quando a faixa some no arredondamento. Sem valor: "—". */
const range = (xs: number[], d: number, suffix = ''): string => {
  if (xs.length === 0) return '—';
  const lo = nf(Math.min(...xs), d), hi = nf(Math.max(...xs), d);
  return `${lo === hi ? lo : `${lo}–${hi}`}${suffix}`;
};
/** CIN_UFPE → "Cin Ufpe", como o card do ponto na referência. */
export const prettySlug = (slug: string): string => slug.toLowerCase().split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

/**
 * KPIs da fonte, um por pergunta da referência. Cada um é calculado por ponto (linhas TOTAL/FORTE do resumo e eventos completos);
 * com "todos os pontos" mostra a faixa entre eles, com um ponto só, o valor dele. Ausente = "—", nunca 0.
 * "Chuva forte" é a contagem de eventos do tipo FORTE (pico horário a partir de typeBoundsMmH.FORTE_fromMmH), não horas.
 */
export function sourceKpis(d: RainSourceData, slug: string): Kpi[] {
  const slugs = slug === 'all' ? slugsOf(d) : [slug];
  const row = (s: string, type: string) => d.summary.find((r) => r.slug === s && r.type === type);
  const per = (type: string, key: 'count' | 'countPerYear' | 'meanDurationMin' | 'coverageFraction' | 'fractionOfTime') =>
    slugs.map((s) => row(s, type)?.[key]).filter((v): v is number => v != null);
  const capacity = d.params.capacityMmH;
  const peakOf = (s: string) => Math.max(-1, ...eventsOf(d, s).filter((e) => !e.truncated && e.maxHourlyMmH != null).map((e) => e.maxHourlyMmH as number));
  const peaks = slugs.map((s) => ({ s, v: peakOf(s) })).filter((x) => x.v >= 0);
  const top = peaks.reduce<{ s: string; v: number } | null>((m, x) => (m == null || x.v > m.v ? x : m), null);
  const strong = d.params.typeBoundsMmH?.FORTE_fromMmH;
  const above = peaks.filter((x) => x.v > capacity).length;
  const hours = per('TOTAL', 'meanDurationMin').map((m) => m / 60);
  return [
    { label: `pico em mm/h${top ? ` · ${prettySlug(top.s)}` : ''}${peaks.length > 1 ? `; faixa ${range(peaks.map((x) => x.v), 1)}` : ''}`, value: top ? nf(top.v, 1) : '—', tone: top && top.v > capacity ? 'high' : undefined, testid: 'kpi-peak' },
    { label: `eventos de chuva forte${strong != null ? ` (pico ≥ ${nf(strong, 0)} mm/h)` : ''}${slugs.length > 1 ? ' por ponto' : ''}`, value: range(per('FORTE', 'count'), 0) },
    { label: `pontos com pico acima de ${nf(capacity, 1)} mm/h`, value: peaks.length ? (slugs.length > 1 ? `${above} em ${peaks.length} pontos` : above ? 'sim' : 'não') : '—', tone: above > 0 ? 'high' : undefined },
    { label: 'eventos por ano', value: range(per('TOTAL', 'countPerYear'), 0) },
    { label: 'duração média do evento', value: hours.length ? range(hours, 1, ' h') : '—' },
    { label: `cobertura de horas · fração úmida ${range(per('TOTAL', 'fractionOfTime'), 2)}`, value: range(per('TOTAL', 'coverageFraction'), 3), tone: 'muted' },
  ];
}

export const SWEEP = [1, 0.75, 0.5, 0.35, 0.25] as const;

/** "out/2021" a partir do instante UTC do período, em America/Recife. */
export function monthYear(iso: string): string {
  const p = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric', timeZone: 'America/Recife' }).formatToParts(new Date(iso));
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? '';
  return `${get('month').replace('.', '')}/${get('year')}`;
}
