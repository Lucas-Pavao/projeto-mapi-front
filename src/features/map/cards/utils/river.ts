import type { TimePt } from '@/components/charts/chartMath';

export type RiverState = 'NORMAL' | 'PRE_ALERT' | 'ALERT' | 'FLOOD' | 'NO_READING';

export interface RiverLevels { pre: number | null; alert: number | null; flood: number | null }

/** Estado da régua pelas cotas oficiais da APAC (>=). Sem leitura: NO_READING; sem cotas, a régua só mostra o nível. */
export function riverState(level: number | null | undefined, c: RiverLevels): RiverState {
  if (level == null) return 'NO_READING';
  if (c.flood != null && level >= c.flood) return 'FLOOD';
  if (c.alert != null && level >= c.alert) return 'ALERT';
  if (c.pre != null && level >= c.pre) return 'PRE_ALERT';
  return 'NORMAL';
}

export const RIVER_STATE_LABEL: Record<RiverState, string> = {
  NORMAL: 'Normal', PRE_ALERT: 'Pré-alerta', ALERT: 'Alerta', FLOOD: 'Inundação', NO_READING: 'Sem leitura',
};

/** Tendência em cm/h pela diferença entre a última leitura e a de ~1 h antes (null se a série não cobre a janela). */
export function riverTrendCmH(points: readonly TimePt[], now: number): number | null {
  const valid = points.filter((p) => p.v != null && p.t <= now);
  const last = valid[valid.length - 1];
  if (!last) return null;
  const ref = [...valid].reverse().find((p) => last.t - p.t >= 50 * 60_000 && last.t - p.t <= 120 * 60_000);
  if (!ref) return null;
  const hours = (last.t - ref.t) / 3_600_000;
  return (((last.v as number) - (ref.v as number)) * 100) / hours;
}

export function trendText(cmH: number | null): string {
  if (cmH == null) return 'tendência indisponível';
  const r = Math.round(cmH);
  if (r === 0) return 'estável';
  return `${r > 0 ? 'subindo' : 'descendo'} ${Math.abs(r)} cm/h`;
}
