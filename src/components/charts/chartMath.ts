/** Matemática dos gráficos de série temporal (sem DOM, testável). */

export interface TimePt {
  t: number;
  v: number | null;
}

export const HOUR_MS = 3_600_000;

/** Pontos {t: ISO, v} da API para epoch ms, ordenados por tempo. Instante inválido é descartado. */
export function toTimePts(points: ReadonlyArray<{ t: string; v: number | null }>): TimePt[] {
  return points
    .map((p) => ({ t: Date.parse(p.t), v: p.v }))
    .filter((p) => Number.isFinite(p.t))
    .sort((a, b) => a.t - b.t);
}

/** Escala linear [d0,d1] -> [r0,r1]. Domínio vazio vira o ponto médio. */
export function scaleLinear(d0: number, d1: number, r0: number, r1: number) {
  const span = d1 - d0;
  return (x: number) => (span === 0 ? (r0 + r1) / 2 : r0 + ((x - d0) / span) * (r1 - r0));
}

/** Passo "bonito" (1, 2, 5 × 10^n) para ~`count` divisões. */
export function niceStep(range: number, count: number): number {
  if (!(range > 0)) return 1;
  const raw = range / Math.max(1, count);
  const pow = 10 ** Math.floor(Math.log10(raw));
  const f = raw / pow;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow;
}

/** Domínio y com folga e ticks bonitos. `zero` força a base em 0 (barras de chuva). */
export function yDomain(values: ReadonlyArray<number | null>, opts: { zero?: boolean; ticks?: number } = {}) {
  const vs = values.filter((v): v is number => v != null && Number.isFinite(v));
  const ticks = opts.ticks ?? 4;
  if (vs.length === 0) return { min: 0, max: 1, ticks: [0, 1], step: 1 };
  let lo = opts.zero ? Math.min(0, ...vs) : Math.min(...vs);
  let hi = Math.max(...vs);
  if (hi === lo) hi = lo + 1;
  const step = niceStep(hi - lo, ticks);
  lo = Math.floor(lo / step) * step;
  hi = Math.ceil(hi / step) * step;
  const out: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) out.push(Number(v.toFixed(6)));
  return { min: lo, max: hi, ticks: out, step };
}

/** Ticks de tempo alinhados à hora cheia, a cada 1, 2, 3, 6, 12 ou 24 h conforme a janela e a largura. */
export function timeTicks(from: number, to: number, maxTicks: number): number[] {
  const hours = (to - from) / HOUR_MS;
  const steps = [1, 2, 3, 6, 12, 24];
  const step = steps.find((s) => hours / s <= maxTicks) ?? 24;
  const first = Math.ceil(from / (step * HOUR_MS)) * step * HOUR_MS;
  const out: number[] = [];
  for (let t = first; t <= to; t += step * HOUR_MS) out.push(t);
  return out;
}

/** Quebra a série em trechos contínuos (valor nulo abre um buraco; nunca interpola). */
export function segments(points: readonly TimePt[]): Array<Array<{ t: number; v: number }>> {
  const out: Array<Array<{ t: number; v: number }>> = [];
  let cur: Array<{ t: number; v: number }> = [];
  for (const p of points) {
    if (p.v == null || !Number.isFinite(p.v)) {
      if (cur.length) out.push(cur);
      cur = [];
    } else cur.push({ t: p.t, v: p.v });
  }
  if (cur.length) out.push(cur);
  return out;
}

/**
 * Barra de chuva horária: o ponto da API tem `t` = FIM da hora, então a barra ocupa [t - 1 h, t].
 * Devolve o intervalo recortado à janela visível; barra totalmente fora vira null.
 */
export function hourBar(t: number, from: number, to: number): { start: number; end: number } | null {
  const start = Math.max(t - HOUR_MS, from);
  const end = Math.min(t, to);
  return end > start ? { start, end } : null;
}
