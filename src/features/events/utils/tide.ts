import type { TimePt } from '@/components/charts/chartMath';

export interface TideExtreme {
  kind: 'HIGH' | 'LOW';
  t: number;
  v: number;
}

/**
 * Pontos extremos da série exibida (máximos e mínimos locais). Calculado só dos pontos recebidos, sem
 * ajuste de curva: com passo de 10 min o horário tem essa resolução. Valores nulos interrompem a busca.
 * Planícies (valores iguais seguidos) contam uma vez, no primeiro ponto.
 */
export function tideExtremes(points: readonly TimePt[]): TideExtreme[] {
  const pts = points.filter((p): p is { t: number; v: number } => p.v != null);
  const out: TideExtreme[] = [];
  let lastDir = 0;
  for (let i = 1; i < pts.length; i++) {
    const dir = Math.sign(pts[i].v - pts[i - 1].v);
    if (dir === 0) continue;
    if (lastDir !== 0 && dir !== lastDir) {
      // virou no ponto anterior (primeiro ponto da planície, se houver)
      let j = i - 1;
      while (j > 0 && pts[j - 1].v === pts[j].v) j--;
      out.push({ kind: lastDir > 0 ? 'HIGH' : 'LOW', t: pts[j].t, v: pts[j].v });
    }
    lastDir = dir;
  }
  return out;
}

/** Ponto da série mais próximo de `t` (até `maxGapMs`), ou null. */
export function nearestPoint(points: readonly TimePt[], t: number, maxGapMs = 30 * 60_000): { t: number; v: number } | null {
  let best: { t: number; v: number } | null = null;
  for (const p of points) {
    if (p.v == null) continue;
    if (best === null || Math.abs(p.t - t) < Math.abs(best.t - t)) best = { t: p.t, v: p.v };
  }
  return best && Math.abs(best.t - t) <= maxGapMs ? best : null;
}
