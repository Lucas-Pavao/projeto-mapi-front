import { sourceKindsOf, type SourceKind } from '@/components/risk/sourceKinds';
import { num } from '@/features/operacao/utils/format';
import { MONTH_STATUS_TEXT } from '@/features/points/utils/rainCandidates';
import type { MeasuredRain } from '@/features/map/schemas/measuredRain.schema';
import type { CanonicalStation, StationHour } from '../schemas/station.schema';
import type { SensorFreshness } from '../schemas/sensor.schema';
import type { ListItem } from './sensorView';

/** Textos longos dos motivos da checagem do mês (ADR 0022). */
export const REASON_LONG: Record<string, string> = {
  UNDERCATCH: 'Entupimento: mede menos da metade das vizinhas',
  OVERCATCH: 'Excesso: mede mais do dobro das vizinhas',
  STUCK_ZERO: 'Travado: quase zero enquanto as vizinhas mediam chuva',
  PARTIAL_COVERAGE: 'Cobertura parcial: blocos cobrem menos de 80% das horas com valor',
  FEW_WET_NEIGHBORS: 'Menos de 2 vizinhas com chuva suficiente para comparar: usada sem checagem',
};

export const quarantineTotal = (s: Pick<CanonicalStation, 'quarantine'>): number => Object.values(s.quarantine).reduce((a, b) => a + b, 0);

/** Apelidos da estação (CEMADEN:..., CEMADEN_PED:...) casam com o sensor ao vivo de mesma identidade. */
export function aliasedSensorIds(stations: readonly CanonicalStation[]): Set<string> {
  const ids = new Set<string>();
  for (const st of stations) for (const a of st.aliases) { ids.add(a); ids.add(a.slice(a.indexOf(':') + 1)); }
  return ids;
}

export const isAliased = (s: Pick<SensorFreshness, 'sensorId' | 'code'>, aliased: ReadonlySet<string>) =>
  aliased.has(s.sensorId) || (s.code != null && aliased.has(s.code));

/** Linha da lista para uma estação canônica: tags de fonte, status do mês, valor da última hora (nunca 0 sem dado). */
export function stationListItem(st: CanonicalStation, acc: MeasuredRain['stations'][number] | undefined): ListItem {
  const month = st.monthCheck?.status;
  const off = acc?.status === 'NO_DATA' || month === 'OFFLINE';
  const gap = !off && acc != null && acc.acc1hMm == null;
  const divergences = st.divergenceCount ?? 0;
  const problem = off || gap || month === 'FAIL' || divergences > 0;
  const sub = off ? 'sem resposta' : gap ? 'lacuna agora' : month === 'FAIL' ? '' : divergences > 0 ? `${divergences} divergência(s)` : '';
  return {
    key: st.canonicalId, kind: 'chuva', name: st.name || st.canonicalId, sub,
    value: off ? '—' : gap ? 'sem dado' : acc?.acc1hMm != null ? `${num(acc.acc1hMm)} mm` : '—',
    dot: 'var(--chart-3)', off: off || gap, problem, fail: month === 'FAIL',
    sources: sourceKindsOf(st.sources),
    monthTag: month && month !== 'OK' ? { text: MONTH_STATUS_TEXT[month], tone: month === 'FAIL' ? 'destructive' : month === 'OFFLINE' ? 'muted' : 'warning' } : undefined,
  };
}

export type { SourceKind };

/** --- Gráfico horário (B2) --- */
export const MAX_MM_H = 60;
export const STRONG_MM_H = 25.15;
export const IDF_MM_H = 50.3;
export const CHART_W = 720;
export const CHART_H = 260;

export interface Bar { x: number; y: number; h: number; source: 'CEMADEN' | 'CEMADEN_PED'; key: string }
export interface Gap { x: number; w: number }
export interface Mark { x: number; y: number }
export interface HourlyModel { bars: Bar[]; gaps: Gap[]; marks: Mark[]; slot: number }

/** Barras por fonte usada, faixa cinza onde não há dado (lacuna nunca vira zero) e marcador onde o pico isolado saiu da série. */
export function hourlyModel(hours: readonly StationHour[]): HourlyModel {
  const n = Math.max(1, hours.length);
  const slot = CHART_W / n;
  const bars: Bar[] = [];
  const gaps: Gap[] = [];
  const marks: Mark[] = [];
  let gapStart: number | null = null;
  const close = (end: number) => { if (gapStart != null) { gaps.push({ x: gapStart * slot, w: (end - gapStart) * slot }); gapStart = null; } };
  hours.forEach((h, i) => {
    if (h.isolatedPeakRemoved) {
      // O valor foi removido: a tela mostra só o marcador (14 mm/h de altura de referência), não o número.
      // A API manda valueMm = null (usedSource e as fontes ficam preenchidas): marcador, nem barra nem lacuna.
      marks.push({ x: (i + 0.5) * slot, y: CHART_H - (14 / MAX_MM_H) * CHART_H });
      close(i);
      return;
    }
    if (h.valueMm == null || h.usedSource == null) {
      if (gapStart == null) gapStart = i;
      return;
    }
    close(i);
    const hh = (Math.min(h.valueMm, MAX_MM_H) / MAX_MM_H) * CHART_H;
    bars.push({ x: i * slot + slot * 0.15, y: CHART_H - hh, h: hh, source: h.usedSource, key: h.hourEndUtc });
  });
  close(hours.length);
  return { bars, gaps, marks, slot };
}

export const yPct = (mm: number): number => 1 - Math.min(mm, MAX_MM_H) / MAX_MM_H;

/** Horas em que PED e ao vivo diferem além da tolerância (as mais recentes primeiro). */
export function divergentHours(hours: readonly StationHour[], max = 5): StationHour[] {
  return hours.filter((h) => h.divergent && h.pedMm != null && h.liveMm != null).slice(-max).reverse();
}

export const sourceLabel = (s: StationHour['usedSource']): string => (s === 'CEMADEN_PED' ? 'PED' : s === 'CEMADEN' ? 'ao vivo' : 'sem dado');

export function hourlyCsv(hours: readonly StationHour[]): string {
  return ['hora_fim_utc;valor_mm;fonte_usada;ped_mm;ao_vivo_mm;divergente', ...hours.map((h) => [h.hourEndUtc, h.valueMm ?? '', h.usedSource ?? '', h.pedMm ?? '', h.liveMm ?? '', h.divergent ? 'sim' : 'nao'].join(';'))].join('\n');
}

/** Últimas horas com valor ao vivo ou PED (as mais recentes primeiro), para a tabela "ao vivo × PED". */
export function recentComparedHours(hours: readonly StationHour[], max = 5): StationHour[] {
  return hours.filter((h) => h.liveMm != null || h.pedMm != null).slice(-max).reverse();
}

/** Soma das horas com valor usado; null quando nenhuma hora tem valor (nunca 0 inventado). */
export function accumulated(hours: readonly StationHour[]): number | null {
  const v = hours.filter((h) => h.valueMm != null);
  return v.length === 0 ? null : v.reduce((a, h) => a + (h.valueMm as number), 0);
}
