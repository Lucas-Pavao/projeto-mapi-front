import { toTimePts, type TimePt } from '@/components/charts/chartMath';
import { buildCells, highMinutes } from '@/features/events/utils/strips';
import type { Timeline } from '@/features/events/schemas/timeline.schema';
import type { RiskLevel } from '@/features/map/schemas/floodPointResponse.schema';
import { formatHoraCurta, num } from '@/features/operacao/utils/format';

export interface PointRow {
  slug: string;
  name: string;
  /** Maior probabilidade da janela (nunca de previsão UNKNOWN) e quando ocorreu. */
  maxProb: number | null;
  maxAt: number | null;
  maxLevel: RiskLevel | null;
  highMin: number;
}

/** Média da chuva horária entre os pluviômetros (t = fim da hora). */
export function averageRain(t: Timeline): TimePt[] {
  const by = new Map<number, number[]>();
  for (const s of t.rain) for (const p of toTimePts(s.points)) if (p.v != null) by.set(p.t, [...(by.get(p.t) ?? []), p.v]);
  return [...by.entries()].sort((a, b) => a[0] - b[0]).map(([tt, vs]) => ({ t: tt, v: vs.reduce((a, b) => a + b, 0) / vs.length }));
}

/** Uma linha por ponto da linha do tempo, do mais provável ao menos; ponto sem previsão válida vai por último. */
export function pointRows(t: Timeline, names: ReadonlyMap<string, string>, t0: number, t1: number): PointRow[] {
  return t.risk
    .map((r) => {
      let maxProb: number | null = null, maxAt: number | null = null, maxLevel: RiskLevel | null = null;
      for (const p of r.items) {
        if (p.riskLevel === 'UNKNOWN' || p.probability == null) continue;
        if (maxProb == null || p.probability > maxProb) { maxProb = p.probability; maxAt = Date.parse(p.issuedAt); maxLevel = p.riskLevel; }
      }
      return { slug: r.slug, name: names.get(r.slug) ?? r.slug, maxProb, maxAt, maxLevel, highMin: Math.round(highMinutes(buildCells(r.items, t0, t1), t1)) };
    })
    .sort((a, b) => (b.maxProb ?? -1) - (a.maxProb ?? -1));
}

const at = (ms: number | null, now: number) => (ms == null ? '—' : (formatHoraCurta(new Date(ms).toISOString(), now) ?? '—'));

/** Parágrafo de resumo só com o que os dados mostram: ponto mais provável, pico de chuva e maré acima de 2,0 m. */
export function summaryText(rows: readonly PointRow[], rain: readonly TimePt[], tide: readonly TimePt[], now: number): string {
  const parts: string[] = [];
  const worst = rows.find((r) => r.maxProb != null);
  if (worst) parts.push(`O ponto com maior probabilidade na janela foi ${worst.name}, com ${Math.round((worst.maxProb as number) * 100)}% às ${at(worst.maxAt, now)}.`);
  else parts.push('Nenhum ponto teve previsão válida na janela.');
  const peak = rain.reduce<TimePt | null>((m, p) => (p.v != null && (m == null || p.v > (m.v as number)) ? p : m), null);
  if (peak) parts.push(`O pico de chuva média foi de ${num(peak.v)} mm/h, na hora que terminou às ${at(peak.t, now)}.`);
  const high = tide.filter((p) => p.v != null && p.v > 2.0);
  if (high.length) {
    const top = high.reduce((m, p) => ((p.v as number) > (m.v as number) ? p : m));
    parts.push(`A maré passou de 2,0 m e chegou a ${num(top.v, 2)} m às ${at(top.t, now)}.`);
  }
  return parts.join(' ');
}

export function toCsv(header: string[], rows: Array<Array<string | number | null>>): string {
  const esc = (v: string | number | null) => { const s = v == null ? '' : String(v); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [header, ...rows].map((r) => r.map(esc).join(';')).join('\n');
}
