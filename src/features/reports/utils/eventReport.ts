import { toTimePts, type TimePt } from '@/components/charts/chartMath';
import type { Timeline } from '@/features/events/schemas/timeline.schema';
import type { AlagamentoHistorico, FloodLevel } from '@/features/alagamento/schemas/alagamento.schema';
import { formatHoraCurta, num } from '@/features/operacao/utils/format';

/** Uma linha por ponto no relatório (5.10): pior nível, lâmina máxima, quando o pior nível começou e tempo em alerta. */
export interface PointRow {
  slug: string;
  name: string;
  worst: FloodLevel | null;
  worstHorizonHours: number | null;
  maxSheetCm: number | null;
  worstAt: number | null;
  alertMin: number;
}

/** Ordem do pior nível; SEM_DADO não é melhor que sem alerta, mas também não é alerta. */
const RANK: Record<FloodLevel, number> = { ALERTA: 3, ATENCAO: 2, SEM_DADO: 1, SEM_ALERTA: 0 };
/** Intervalo máximo entre ciclos contado como tempo contínuo (o ciclo roda a cada 3 min; buraco maior não é contado). */
const MAX_STEP_MS = 15 * 60_000;

/** Média da chuva horária entre os pluviômetros (t = fim da hora). */
export function averageRain(t: Timeline): TimePt[] {
  const by = new Map<number, number[]>();
  for (const s of t.rain) for (const p of toTimePts(s.points)) if (p.v != null) by.set(p.t, [...(by.get(p.t) ?? []), p.v]);
  return [...by.entries()].sort((a, b) => a[0] - b[0]).map(([tt, vs]) => ({ t: tt, v: vs.reduce((a, b) => a + b, 0) / vs.length }));
}

/** Linhas do relatório a partir do histórico do alerta por regressão, do pior nível ao melhor; empate pela lâmina. */
export function pointRows(h: AlagamentoHistorico, names: ReadonlyMap<string, string>, t0: number, t1: number): PointRow[] {
  return h.points
    .map((p) => {
      const items = p.items.map((i) => ({ ...i, t: Date.parse(i.at) })).filter((i) => i.t >= t0 && i.t <= t1).sort((a, b) => a.t - b.t);
      let worst: FloodLevel | null = null, worstAt: number | null = null, worstH: number | null = null, maxSheet: number | null = null, alertMs = 0;
      items.forEach((i, k) => {
        if (worst == null || RANK[i.level] > RANK[worst]) { worst = i.level; worstAt = i.t; worstH = i.worstHorizonHours ?? null; }
        if (i.hNowCm != null && (maxSheet == null || i.hNowCm > maxSheet)) maxSheet = i.hNowCm;
        if (i.level === 'ALERTA') alertMs += Math.min(MAX_STEP_MS, (items[k + 1]?.t ?? t1) - i.t);
      });
      return { slug: p.slug, name: names.get(p.slug) ?? p.name ?? p.slug, worst, worstHorizonHours: worstH, maxSheetCm: maxSheet, worstAt, alertMin: Math.round(alertMs / 60_000) };
    })
    .sort((a, b) => (b.worst ? RANK[b.worst] : -1) - (a.worst ? RANK[a.worst] : -1) || (b.maxSheetCm ?? -1) - (a.maxSheetCm ?? -1));
}

const at = (ms: number | null, now: number) => (ms == null ? '—' : (formatHoraCurta(new Date(ms).toISOString(), now) ?? '—'));
const LEVEL_TEXT: Record<FloodLevel, string> = { ALERTA: 'alerta', ATENCAO: 'atenção', SEM_ALERTA: 'sem alerta', SEM_DADO: 'sem dado' };

/** "alerta em 1 h · 17,7 cm" */
export const worstText = (r: PointRow) =>
  r.worst == null ? '—' : `${LEVEL_TEXT[r.worst]}${r.worstHorizonHours != null && r.worst !== 'SEM_DADO' ? ` em ${r.worstHorizonHours} h` : ''}${r.maxSheetCm != null ? ` · ${num(r.maxSheetCm)} cm` : ''}`;

/** Parágrafo de resumo só com o que os dados mostram: pior ponto, pico de chuva e maré acima de 2,0 m. */
export function summaryText(rows: readonly PointRow[] | null, rain: readonly TimePt[], tide: readonly TimePt[], now: number): string {
  const parts: string[] = [];
  if (rows == null) parts.push('O alerta de alagamento por regressão está em teste: o nível dos pontos não entra neste relatório.');
  else {
    const reached = rows.find((r) => r.worst === 'ALERTA' || r.worst === 'ATENCAO');
    if (reached) parts.push(`O pior nível na janela foi em ${reached.name}: ${worstText(reached)}, às ${at(reached.worstAt, now)}.`);
    else if (rows.some((r) => r.worst != null)) parts.push('Nenhum ponto chegou a alerta ou atenção na janela.');
    else parts.push('Sem histórico do alerta de alagamento na janela.');
  }
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
