import type { PredictionSummary } from '@/features/points/schemas/prediction.schema';
import type { RiskLevel } from '@/features/map/schemas/floodPointResponse.schema';

export const CELLS = 72;
/** Uma previsão vale para as células até 3 h depois de emitida; depois disso a célula fica "sem previsão". */
const MAX_AGE_MS = 3 * 3_600_000;

export interface Cell { i: number; start: number; end: number; level: RiskLevel | null; probability: number | null }

/** Divide [t0, t1] em `n` células e dá a cada uma a última previsão emitida até o fim dela. */
export function buildCells(items: readonly PredictionSummary[], t0: number, t1: number, n = CELLS): Cell[] {
  const sorted = items.map((p) => ({ t: Date.parse(p.issuedAt), p })).filter((x) => Number.isFinite(x.t)).sort((a, b) => a.t - b.t);
  const step = (t1 - t0) / n;
  const out: Cell[] = [];
  let k = -1;
  for (let i = 0; i < n; i++) {
    const end = t0 + (i + 1) * step;
    while (k + 1 < sorted.length && sorted[k + 1].t <= end) k++;
    const cur = k >= 0 && end - sorted[k].t <= MAX_AGE_MS ? sorted[k].p : null;
    out.push({ i, start: t0 + i * step, end, level: cur?.riskLevel ?? null, probability: cur && cur.riskLevel !== 'UNKNOWN' ? (cur.probability ?? null) : null });
  }
  return out;
}

/** Minutos em risco alto até `upTo` (células já ocorridas). */
export const highMinutes = (cells: readonly Cell[], upTo: number): number =>
  cells.filter((c) => c.level === 'HIGH' && c.start <= upTo).reduce((s, c) => s + (Math.min(c.end, upTo) - c.start) / 60_000, 0);
