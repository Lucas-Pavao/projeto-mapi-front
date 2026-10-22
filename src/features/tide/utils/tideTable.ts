import type { DayDataDTO, MonthDataDTO } from '@/features/map/types';

/** Preamar a partir da qual a maré é tratada como de sizígia no painel (referência da tábua, não do terreno: ADR 0009). */
export const SPRING_M = 2.0;

export interface DayPt { min: number; v: number }
export interface DaySummary { hi: number; hiMin: number; lo: number; range: number }

/** "HH:mm" (ou "H:mm") em minutos desde 0h; texto fora do formato vira null. */
export function parseHour(h: string): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(h.trim());
  if (!m) return null;
  const v = Number(m[1]) * 60 + Number(m[2]);
  return v >= 0 && v <= 24 * 60 ? v : null;
}

export function dayPoints(day: DayDataDTO | undefined): DayPt[] {
  if (!day) return [];
  return day.hours
    .flatMap((h) => {
      const min = parseHour(h.hour);
      return min == null || !Number.isFinite(h.level) ? [] : [{ min, v: h.level }];
    })
    .sort((a, b) => a.min - b.min);
}

/** Preamar máxima, baixa-mar mínima e amplitude, só dos pontos da tábua daquele dia. */
export function daySummary(pts: DayPt[]): DaySummary | null {
  if (pts.length === 0) return null;
  const hi = pts.reduce((a, b) => (b.v > a.v ? b : a));
  const lo = Math.min(...pts.map((p) => p.v));
  return { hi: hi.v, hiMin: hi.min, lo, range: hi.v - lo };
}

export type TideKind = 'PREAMAR' | 'BAIXA_MAR';
export interface DayExtreme extends DayPt { kind: TideKind }

/**
 * Os extremos do dia (em geral 4: duas preamares e duas baixa-mares, maré semidiurna) com o tipo de cada um, pelos
 * vizinhos na sequência da tábua, incluindo o último ponto do dia anterior e o primeiro do seguinte. Ponto sem
 * vizinho nenhum fica de fora.
 */
export function dayExtremes(prev: DayPt[], cur: DayPt[], next: DayPt[]): DayExtreme[] {
  const before = prev.at(-1);
  const after = next[0];
  return cur.flatMap((p, i) => {
    const a = i > 0 ? cur[i - 1] : before;
    const b = i < cur.length - 1 ? cur[i + 1] : after;
    const ref = [a, b].filter((x): x is DayPt => !!x);
    if (ref.length === 0) return [];
    if (ref.every((r) => p.v > r.v)) return [{ ...p, kind: 'PREAMAR' as const }];
    if (ref.every((r) => p.v < r.v)) return [{ ...p, kind: 'BAIXA_MAR' as const }];
    return [];
  });
}

export const findDay = (month: MonthDataDTO | undefined, day: number) => month?.days.find((d) => d.day === day);

/**
 * Curva do dia por interpolação em cosseno entre os pontos da tábua (incluindo o fim do dia anterior e o
 * início do seguinte). Não é previsão nova: só liga os pontos publicados. Fora do alcance dos pontos, null.
 */
export function dayCurve(prev: DayPt[], cur: DayPt[], next: DayPt[], stepMin = 20): Array<number | null> {
  const all = [...prev.map((p) => ({ min: p.min - 1440, v: p.v })), ...cur, ...next.map((p) => ({ min: p.min + 1440, v: p.v }))];
  const out: Array<number | null> = [];
  for (let m = 0; m <= 1440; m += stepMin) {
    let a: DayPt | undefined;
    let b: DayPt | undefined;
    for (let i = 0; i < all.length; i++) {
      if (all[i].min <= m) a = all[i];
      if (all[i].min >= m) { b = all[i]; break; }
    }
    if (!a || !b) out.push(null);
    else if (a.min === b.min) out.push(a.v);
    else {
      const f = (m - a.min) / (b.min - a.min);
      out.push(a.v + (b.v - a.v) * ((1 - Math.cos(Math.PI * f)) / 2));
    }
  }
  return out;
}

/** Minutos do dia com a curva em `limit` ou acima. */
export function minutesAbove(curve: Array<number | null>, limit: number, stepMin = 20): number {
  return curve.slice(0, -1).reduce<number>((acc, v) => (v != null && v >= limit ? acc + stepMin : acc), 0);
}

/** 150 min -> "2h30". */
export const hm = (min: number) => `${Math.floor(min / 60)}h${String(Math.round(min % 60)).padStart(2, '0')}`;

/** Data e minuto do dia em Recife para um instante. */
export function recifeParts(ms: number): { year: number; month: number; day: number; minute: number } {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Recife', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return { year: Number(p.year), month: Number(p.month), day: Number(p.day), minute: Number(p.hour) * 60 + Number(p.minute) };
}
