import type { AlagamentoHistorico, FloodLevel } from '@/features/alagamento/schemas/alagamento.schema';

export const CELLS = 72;
/** Um ciclo do alerta vale até o seguinte, por no máximo 15 min (o ciclo roda a cada 3 min); depois, "sem cálculo". */
const MAX_AGE_MS = 15 * 60_000;
const LAST_GRACE_MS = 10 * 60_000;

type Item = AlagamentoHistorico['points'][number]['items'][number];

export interface Cell { i: number; start: number; end: number; level: FloodLevel | null; hNowCm: number | null; worstHorizonHours: number | null }

/** Divide [t0, t1] em `n` células e dá a cada uma o último ciclo do alerta por regressão até o fim dela. */
export function buildCells(items: readonly Item[], t0: number, t1: number, n = CELLS): Cell[] {
  const sorted = items.map((p) => ({ t: Date.parse(p.at), p })).filter((x) => Number.isFinite(x.t)).sort((a, b) => a.t - b.t);
  const step = (t1 - t0) / n;
  const out: Cell[] = [];
  let k = -1;
  for (let i = 0; i < n; i++) {
    const end = t0 + (i + 1) * step;
    const reach = i === n - 1 ? end + LAST_GRACE_MS : end;
    while (k + 1 < sorted.length && sorted[k + 1].t <= reach) k++;
    const cur = k >= 0 && end - sorted[k].t <= Math.max(MAX_AGE_MS, step) ? sorted[k].p : null;
    out.push({ i, start: t0 + i * step, end, level: cur?.level ?? null, hNowCm: cur?.hNowCm ?? null, worstHorizonHours: cur?.worstHorizonHours ?? null });
  }
  return out;
}

/** Minutos em ALERTA até `upTo` (células já ocorridas). */
export const alertMinutes = (cells: readonly Cell[], upTo: number): number =>
  cells.filter((c) => c.level === 'ALERTA' && c.start <= upTo).reduce((s, c) => s + (Math.min(c.end, upTo) - c.start) / 60_000, 0);
