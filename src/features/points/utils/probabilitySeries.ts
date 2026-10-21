import type { PredictionSummary } from '../schemas/prediction.schema';

export const VB_W = 640;
export const VB_H = 200;
const HOUR = 3_600_000;

export interface ChartWindow { t0: number; t1: number }

/** Janela do gráfico: 9 h antes de agora até 3 h depois (horizonte da previsão). "Agora" fica a 75 %. */
export function chartWindow(now: number, pastH = 9, futureH = 3): ChartWindow {
  return { t0: now - pastH * HOUR, t1: now + futureH * HOUR };
}

export const xOf = (t: number, w: ChartWindow) => ((t - w.t0) / (w.t1 - w.t0)) * VB_W;
/** 0 em baixo, 1 em cima: as faixas 50 % (y=100) e 80 % (y=40) do protótipo. */
export const yOf = (p: number) => (1 - Math.min(1, Math.max(0, p))) * VB_H;

export interface Run { points: Array<{ x: number; y: number }> }

/** Trechos contínuos de probabilidade: UNKNOWN ou sem valor quebra a linha (nunca vira 0 %). */
export function probabilityRuns(items: readonly PredictionSummary[], w: ChartWindow): Run[] {
  const sorted = [...items].sort((a, b) => Date.parse(a.issuedAt) - Date.parse(b.issuedAt));
  const runs: Run[] = [];
  let cur: Run | null = null;
  for (const p of sorted) {
    const t = Date.parse(p.issuedAt);
    if (!Number.isFinite(t) || t < w.t0 || t > w.t1) continue;
    if (p.riskLevel === 'UNKNOWN' || p.probability == null) { cur = null; continue; }
    if (!cur) { cur = { points: [] }; runs.push(cur); }
    cur.points.push({ x: xOf(t, w), y: yOf(p.probability) });
  }
  return runs;
}

export const toPoints = (r: Run) => r.points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
export const toArea = (r: Run) => {
  const f = r.points[0];
  const l = r.points[r.points.length - 1];
  return `${f.x.toFixed(1)},${VB_H} ${toPoints(r)} ${l.x.toFixed(1)},${VB_H}`;
};
