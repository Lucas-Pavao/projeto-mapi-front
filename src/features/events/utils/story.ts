import type { Timeline } from '../schemas/timeline.schema';
import type { RiskLevel } from '@/features/map/schemas/floodPointResponse.schema';
import { toTimePts } from '@/components/charts/chartMath';

export interface StoryItem { t: number; title: string; tone: 'low' | 'moderate' | 'high' | 'unknown' | 'info' }

const RANK: Record<RiskLevel, number> = { UNKNOWN: -1, LOW: 0, MEDIUM: 1, HIGH: 2 };
const TONE = { LOW: 'low', MEDIUM: 'moderate', HIGH: 'high', UNKNOWN: 'unknown' } as const;
export const TIDE_HIGH_M = 2.0;

export function transitionText(name: string, from: RiskLevel | null, to: RiskLevel): string | null {
  if (from === to) return null;
  if (to === 'UNKNOWN') return `${name} ficou sem previsão`;
  if (from === 'UNKNOWN' || from === null) return to === 'LOW' ? null : `${name} passou para ${to === 'HIGH' ? 'alto' : 'moderado'}`;
  if (RANK[to] > RANK[from]) return `${name} passou para ${to === 'HIGH' ? 'alto' : 'moderado'}`;
  return from === 'HIGH' ? `${name} saiu do risco alto` : `${name} voltou para baixo`;
}

export interface RiverLevels { flood?: number | null; alert?: number | null; name?: string }

/** "O que aconteceu": mudanças de classe por ponto, alagamentos confirmados e cruzamentos de maré e de cota do rio. */
export function buildStory(t: Timeline, names: ReadonlyMap<string, string>, river: RiverLevels = {}): StoryItem[] {
  const out: StoryItem[] = [];
  for (const r of t.risk) {
    const name = names.get(r.slug) ?? r.slug;
    const sorted = [...r.items].sort((a, b) => Date.parse(a.issuedAt) - Date.parse(b.issuedAt));
    let prev: RiskLevel | null = null;
    for (const p of sorted) {
      const text = transitionText(name, prev, p.riskLevel);
      if (text) out.push({ t: Date.parse(p.issuedAt), title: text, tone: TONE[p.riskLevel] });
      prev = p.riskLevel;
    }
  }
  for (const e of t.floodEvents ?? []) out.push({ t: Date.parse(e.startTime), title: `Alagamento confirmado em ${names.get(e.slug) ?? e.slug}`, tone: 'high' });
  const tide = toTimePts(t.tide.points);
  for (let i = 1; i < tide.length; i++) {
    const a = tide[i - 1].v, b = tide[i].v;
    if (a != null && b != null && a <= TIDE_HIGH_M && b > TIDE_HIGH_M) out.push({ t: tide[i].t, title: 'Maré acima de 2,0 m', tone: 'moderate' });
  }
  const rv = toTimePts(t.river[0]?.points ?? []);
  const rname = river.name ?? 'Rio';
  for (let i = 1; i < rv.length; i++) {
    const a = rv[i - 1].v, b = rv[i].v;
    if (a == null || b == null) continue;
    if (river.flood != null && a < river.flood && b >= river.flood) out.push({ t: rv[i].t, title: `${rname} atingiu a cota de inundação`, tone: 'high' });
    else if (river.alert != null && a < river.alert && b >= river.alert) out.push({ t: rv[i].t, title: `${rname} atingiu a cota de alerta`, tone: 'moderate' });
  }
  return out.filter((s) => Number.isFinite(s.t)).sort((a, b) => b.t - a.t);
}
