import { distanceText, MONTH_STATUS_TEXT, REASON_TEXT } from '@/features/points/utils/rainCandidates';
import { num } from '@/features/operacao/utils/format';
import { formatRecifeHourMs } from '../../utils/datetime';
import type { StationCardData, StationState } from '../schemas/stationCard.schema';

export type Tone = 'warning' | 'destructive' | 'muted' | 'success' | 'primary';

export interface StateMeta { label: string; tone: Tone; dashed: boolean }

/** Rótulo e cor do estado. Cor nunca é o único sinal: o rótulo vai sempre junto. */
export function stateMeta(c: Pick<StationCardData, 'state' | 'pedOnly'>): StateMeta {
  switch (c.state) {
    case 'NO_RESPONSE': return { label: 'Sem resposta', tone: 'warning', dashed: true };
    case 'GAP_NOW': return { label: 'Lacuna agora', tone: 'warning', dashed: true };
    case 'FAIL_MONTH': return { label: 'Reprovada no mês · fora da chuva do ponto', tone: 'destructive', dashed: false };
    case 'DIVERGENT': return { label: 'Fontes divergem', tone: 'warning', dashed: false };
    case 'PEAK_REMOVED': return { label: 'Pico isolado removido', tone: 'warning', dashed: false };
    case 'UNCHECKED': return { label: 'Checagem inconclusiva', tone: 'muted', dashed: false };
    case 'NORMAL': return c.pedOnly ? { label: 'Só PED · sem ao vivo', tone: 'primary', dashed: false } : { label: 'Ao vivo + PED', tone: 'success', dashed: false };
  }
}

export const TONE_TEXT: Record<Tone, string> = { warning: 'text-warning', destructive: 'text-destructive', muted: 'text-muted-foreground', success: 'text-success', primary: 'text-primary' };
export const TONE_TOP: Record<Tone, string> = { warning: 'border-t-warning', destructive: 'border-t-destructive', muted: 'border-t-muted-foreground', success: 'border-t-success', primary: 'border-t-primary' };
export const TONE_BORDER: Record<Tone, string> = { warning: 'border-warning', destructive: 'border-destructive', muted: 'border-muted-foreground', success: 'border-success', primary: 'border-primary' };

const hour = (iso: string | null | undefined) => (iso ? formatRecifeHourMs(Date.parse(iso)) : '—');
const mm1 = (v: number | null | undefined) => (v == null ? '—' : `${num(v, 1)} mm`);

export interface NoteView { tone: Tone; title: string; text: string }

/** O aviso do estado (um só), com os números que a API mandou. NORMAL não tem aviso. */
export function stateNote(c: StationCardData): NoteView | null {
  const n = c.note;
  switch (c.state) {
    case 'NO_RESPONSE':
      return { tone: 'warning', title: `Parou de responder${c.lastReadingUtc ? ` às ${hour(c.lastReadingUtc)}` : ''}.`, text: 'Os pontos que usavam esta estação passam para a próxima válida até 5 km. Sem nenhuma, o risco fica indisponível.' };
    case 'GAP_NOW':
      return { tone: 'warning', title: 'Sem dado nas duas fontes.', text: 'A hora fica vazia, não vira zero. Previsões que dependem dela ficam indisponíveis ou declaram imputação.' };
    case 'FAIL_MONTH': {
      const r = c.monthCheck?.reasons ?? [];
      const text = r.includes('UNDERCATCH') ? 'Mede bem menos que as vizinhas em dias de chuva (UNDERCATCH). Pode ser funil entupido.'
        : r.includes('STUCK_ZERO') ? 'Fica em zero enquanto as vizinhas registram chuva (STUCK_ZERO).'
        : r.length ? `Motivo: ${r.map((x) => REASON_TEXT[x] ?? x).join(', ')}.` : 'Reprovada na checagem espacial do mês.';
      return { tone: 'destructive', title: 'Não entra na chuva do ponto este mês.', text };
    }
    case 'DIVERGENT':
      return { tone: 'warning', title: `Fontes divergem${n?.hourEndUtc ? ` em ${hour(n.hourEndUtc)}` : ''}:`, text: `ao vivo ${mm1(n?.liveMm)} × PED ${mm1(n?.pedMm)} (diferença ${mm1(n?.diffMm)} > 0,5 mm). Vale a PED.` };
    case 'PEAK_REMOVED':
      return { tone: 'warning', title: `Pico isolado removido${n?.hourEndUtc ? ` às ${hour(n.hourEndUtc)}` : ''}.`, text: 'Pico de 10 mm ou mais com vizinhas abaixo de 1 mm a até 6 km. A barra cinza mostra o valor corrigido.' };
    case 'UNCHECKED':
      return { tone: 'muted', title: 'Checagem inconclusiva.', text: 'Poucas vizinhas com chuva no mês (FEW_WET_NEIGHBORS). Continua sendo usada.' };
    case 'NORMAL':
      return null;
  }
}

export function nowText(c: StationCardData): { value: string; warn: boolean } {
  if (c.state === 'NO_RESPONSE') return { value: '—', warn: true };
  if (c.state === 'GAP_NOW' || c.nowMmH == null) return { value: 'sem dado', warn: true };
  return { value: `${num(c.nowMmH, 1)} mm/h`, warn: false };
}

export function sourceText(c: StationCardData): string {
  if (c.state === 'NO_RESPONSE' || c.state === 'GAP_NOW' || c.nowSource == null) return '—';
  if (c.pedOnly) return 'PED (única fonte)';
  return c.nowSource === 'CEMADEN_PED' ? 'PED (consolidada)' : 'ao vivo (PED ainda não chegou)';
}

export function liveText(c: StationCardData): string {
  if (c.pedOnly) return 'não existe';
  return c.liveMmH == null ? 'sem dado' : `${num(c.liveMmH, 1)} mm/h`;
}

export function pedText(c: StationCardData): string {
  if (c.pedPending) return 'ainda não chegou (atraso ~20 min)';
  return c.pedMmH == null ? 'sem dado' : `${num(c.pedMmH, 1)} mm/h`;
}

/** Acumulado: null = incompleto (alguma hora da janela faltou), nunca 0. */
export const accText = (v: number | null | undefined): string => (v == null ? 'incompleto' : `${num(v, 1)} mm`);

export function monthText(c: StationCardData): { text: string; tone: Tone } {
  const m = c.monthCheck;
  if (!m) return { text: 'sem checagem', tone: 'muted' };
  const reasons = m.reasons.length ? ` (${m.reasons.map((r) => REASON_TEXT[r] ?? r).join(', ')})` : '';
  const tone: Tone = m.status === 'OK' ? 'success' : m.status === 'FAIL' ? 'destructive' : m.status === 'OFFLINE' ? 'muted' : 'warning';
  return { text: `${MONTH_STATUS_TEXT[m.status]}${reasons}`, tone };
}

export function quarantineText(q: Record<string, number>): string {
  const parts = [q.GAP ? `${q.GAP} h por lacuna (GAP)` : '', q.AFTER_GAP ? `${q.AFTER_GAP} h após lacuna (AFTER_GAP)` : '', q.SUSPECT_QUALIFIER ? `${q.SUSPECT_QUALIFIER} h com qualificador suspeito` : ''].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'nenhuma';
}

export function roleTag(u: StationCardData['uses'][number]): { text: string; tone: Tone } {
  switch (u.role) {
    case 'USED': return { text: 'usada agora', tone: 'primary' };
    case 'LOWER': return { text: `menor que ${u.usedStationName ?? '—'}`, tone: 'muted' };
    case 'EXCLUDED': return { text: 'fora · reprovada', tone: 'destructive' };
    case 'NO_VALUE': return { text: 'sem valor', tone: 'warning' };
  }
}

export const aliasText = (c: Pick<StationCardData, 'aliases' | 'aliasDistanceM'>): string =>
  c.aliases.length ? `${c.aliases.join(' · ')}${c.aliasDistanceM != null ? ` (${distanceText(c.aliasDistanceM)})` : ''}` : '—';

export type { StationState };
