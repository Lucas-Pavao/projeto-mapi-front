import type { Timeline } from '../schemas/timeline.schema';
import type { AlagamentoHistorico, FloodLevel } from '@/features/alagamento/schemas/alagamento.schema';
import { toTimePts, type TimePt } from '@/components/charts/chartMath';
import { fmt1 } from '@/features/alagamento/utils/alagamentoText';

export interface StoryItem { t: number; title: string; tone: 'ok' | 'moderate' | 'high' | 'unknown' | 'info' }

const RANK: Record<FloodLevel, number> = { SEM_DADO: -1, SEM_ALERTA: 0, ATENCAO: 1, ALERTA: 2 };
const TONE = { SEM_ALERTA: 'ok', ATENCAO: 'moderate', ALERTA: 'high', SEM_DADO: 'unknown' } as const;
export const TIDE_HIGH_M = 2.0;

type Item = AlagamentoHistorico['points'][number]['items'][number];

/** "Mascarenhas: alerta em 1 h · lâmina 17,7 cm", "Mascarenhas: saiu do alerta", "Mascarenhas: alerta sem dado". */
export function transitionText(name: string, from: FloodLevel | null, to: Item): string | null {
  if (from === to.level) return null;
  const sheet = to.hNowCm != null ? ` · lâmina ${fmt1(to.hNowCm)} cm` : '';
  if (to.level === 'SEM_DADO') return from === null ? null : `${name}: alerta sem dado`;
  if (to.level === 'ALERTA') return `${name}: alerta em ${to.worstHorizonHours ?? '?'} h${sheet}`;
  if (to.level === 'ATENCAO') return from === 'ALERTA' ? `${name}: saiu do alerta (atenção)` : `${name}: atenção em ${to.worstHorizonHours ?? '?'} h`;
  // SEM_ALERTA
  if (from === 'ALERTA') return `${name}: saiu do alerta`;
  if (from === 'ATENCAO') return `${name}: saiu da atenção`;
  return null;
}

/** `points`: a série do rio já escolhida (pickRiver); sem ela, a primeira da API. */
export interface RiverLevels { flood?: number | null; alert?: number | null; name?: string; points?: TimePt[] }

/** "O que aconteceu": mudanças de nível do alerta por ponto, alagamentos confirmados e cruzamentos de maré e de cota do rio. */
export function buildStory(t: Timeline, hist: AlagamentoHistorico | null | undefined, names: ReadonlyMap<string, string>, river: RiverLevels = {}): StoryItem[] {
  const out: StoryItem[] = [];
  for (const r of hist?.points ?? []) {
    const name = names.get(r.slug) ?? r.name ?? r.slug;
    const sorted = [...r.items].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
    let prev: FloodLevel | null = null;
    for (const p of sorted) {
      const text = transitionText(name, prev, p);
      if (text) out.push({ t: Date.parse(p.at), title: text, tone: TONE[p.level] });
      if (prev == null || RANK[p.level] >= 0 || p.level === 'SEM_DADO') prev = p.level;
    }
  }
  for (const e of t.floodEvents ?? []) out.push({ t: Date.parse(e.startTime), title: `Alagamento confirmado em ${names.get(e.slug) ?? e.slug}`, tone: 'high' });
  const tide = toTimePts(t.tide.points);
  for (let i = 1; i < tide.length; i++) {
    const a = tide[i - 1].v, b = tide[i].v;
    if (a != null && b != null && a <= TIDE_HIGH_M && b > TIDE_HIGH_M) out.push({ t: tide[i].t, title: 'Maré acima de 2,0 m', tone: 'moderate' });
  }
  const rv = river.points ?? toTimePts(t.river[0]?.points ?? []);
  const rname = river.name ?? 'Rio';
  for (let i = 1; i < rv.length; i++) {
    const a = rv[i - 1].v, b = rv[i].v;
    if (a == null || b == null) continue;
    if (river.flood != null && a < river.flood && b >= river.flood) out.push({ t: rv[i].t, title: `${rname} atingiu a cota de inundação`, tone: 'high' });
    else if (river.alert != null && a < river.alert && b >= river.alert) out.push({ t: rv[i].t, title: `${rname} atingiu a cota de alerta`, tone: 'moderate' });
  }
  return out.filter((s) => Number.isFinite(s.t)).sort((a, b) => b.t - a.t);
}
