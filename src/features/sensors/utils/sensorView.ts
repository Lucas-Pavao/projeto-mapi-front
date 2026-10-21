import { HOUR_MS, toTimePts, type TimePt } from '@/components/charts/chartMath';
import { tideExtremes } from '@/features/events/utils/tide';
import type { Timeline } from '@/features/events/schemas/timeline.schema';
import { num } from '@/features/operacao/utils/format';
import type { SensorFreshness } from '../schemas/sensor.schema';
import { SENSOR_TYPE_UNIT, formatAge } from './age';

export type Kind = 'chuva' | 'rio' | 'mare';
export const TIDE_KEY = 'mare';
export const TIDE_HIGH_M = 2.0;

export interface ListItem { key: string; kind: Kind; name: string; sub: string; value: string; dot: string; off: boolean }

/** Último valor da série até `now` (ou null). */
export function valueAt(points: readonly TimePt[], now: number): number | null {
  let v: number | null = null;
  for (const p of points) if (p.t <= now && p.v != null) v = p.v;
  return v;
}

/** Soma da chuva horária nas últimas `hours` h até `now` (t = fim da hora). */
export function rainAccum(points: readonly TimePt[], now: number, hours: number): number | null {
  const win = points.filter((p) => p.t > now - hours * HOUR_MS && p.t <= now + 1 && p.v != null);
  return win.length === 0 ? null : win.reduce((s, p) => s + (p.v as number), 0);
}

export function tideRising(points: readonly TimePt[], now: number): boolean | null {
  const a = valueAt(points, now);
  const b = valueAt(points, now - 30 * 60_000);
  return a == null || b == null || a === b ? null : a > b;
}

export function seriesOf(tl: Timeline | undefined, kind: Kind, key: string): TimePt[] {
  if (!tl) return [];
  if (kind === 'mare') return toTimePts(tl.tide.points);
  const list = kind === 'rio' ? tl.river : tl.rain;
  return toTimePts(list.find((s) => s.stationId === key)?.points ?? []);
}

/** Itens da lista lateral: sensores da API, mais a maré quando a linha do tempo a traz. */
export function buildItems(sensors: readonly SensorFreshness[], tl: Timeline | undefined, now: number): ListItem[] {
  const items: ListItem[] = sensors.map((s) => {
    const kind: Kind = s.type === 'RIVER_LEVEL' ? 'rio' : 'chuva';
    const unit = s.unit || SENSOR_TYPE_UNIT[s.type];
    const name = s.stationName || s.sensorId;
    if (kind === 'rio') {
      return { key: s.sensorId, kind, name, sub: s.stale ? `sem resposta ${formatAge(s.ageSeconds)}` : 'Nível do rio', value: s.stale || s.value == null ? '—' : `${num(s.value, 2)} ${unit}`, dot: 'var(--primary)', off: s.stale };
    }
    const acc = s.stale ? null : rainAccum(seriesOf(tl, 'chuva', s.sensorId), now, 24);
    return {
      key: s.sensorId, kind, name,
      sub: s.stale ? `sem resposta ${formatAge(s.ageSeconds)}` : `Pluviômetro · ${s.value != null ? `${num(s.value)} ${unit}` : 'sem leitura'}`,
      value: s.stale || acc == null ? '—' : `${num(acc)} mm`, dot: 'var(--chart-3)', off: s.stale,
    };
  });
  const tide = seriesOf(tl, 'mare', TIDE_KEY);
  const cur = valueAt(tide, now);
  if (tl && tide.length > 0) {
    const up = tideRising(tide, now);
    items.splice(Math.min(1, items.length), 0, { key: TIDE_KEY, kind: 'mare', name: `Maré · porto ${tl.tide.harbor}`, sub: `Maré prevista${up == null ? '' : up ? ' · enchendo' : ' · vazando'}`, value: cur == null ? '—' : `${num(cur, 2)} m`, dot: 'var(--sand)', off: false });
  }
  return items;
}

export interface SideRow { label: string; value: string; tone?: 'high' | 'moderate' | 'muted' }

export function tideSide(points: readonly TimePt[], now: number): SideRow[] {
  const ex = tideExtremes(points).filter((e) => e.t <= now + 24 * HOUR_MS);
  const hour = (t: number) => new Date(t).toLocaleTimeString('pt-BR', { timeZone: 'America/Recife', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).replace(':', 'h');
  const hi = ex.filter((e) => e.kind === 'HIGH').sort((a, b) => b.v - a.v)[0];
  const lo = ex.filter((e) => e.kind === 'LOW').sort((a, b) => a.v - b.v)[0];
  return [
    { label: 'Preamar', value: hi ? `${num(hi.v, 2)} m · ${hour(hi.t)}` : '—' },
    { label: 'Baixa-mar', value: lo ? `${num(lo.v, 2)} m · ${hour(lo.t)}` : '—' },
    { label: 'Amplitude', value: hi && lo ? `${num(hi.v - lo.v, 2)} m` : '—', tone: 'muted' },
  ];
}

export function toCsv(rows: Array<[string, string | number | null]>, header: [string, string]): string {
  return [header.join(';'), ...rows.map(([t, v]) => `${t};${v ?? ''}`)].join('\n');
}
