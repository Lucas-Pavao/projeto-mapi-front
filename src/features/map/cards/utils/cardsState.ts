import type { AnalysisTab } from './analysis';

/**
 * Estado dos cards do mapa: um por vez. Abrir um fecha o outro; o painel de análise (lateral) convive com o card de uma
 * estação aberta ao lado dele. Esc fecha o de cima: estação, depois o painel, depois o resto.
 */
export interface CardsState {
  point: string | null;
  analysis: { slug: string; tab: AnalysisTab } | null;
  station: string | null;
  river: string | null;
  location: { lat: number; lon: number; side: 'left' | 'right' } | null;
}

export const EMPTY_CARDS: CardsState = { point: null, analysis: null, station: null, river: null, location: null };

export type CardsAction =
  | { type: 'openPoint'; slug: string }
  | { type: 'openAnalysis'; slug: string; tab?: AnalysisTab }
  | { type: 'setTab'; tab: AnalysisTab }
  | { type: 'openStation'; id: string }
  | { type: 'openRiver'; id: string }
  | { type: 'openLocation'; lat: number; lon: number; side: 'left' | 'right' }
  | { type: 'closeStation' }
  | { type: 'closePoint' }
  | { type: 'closeAnalysis' }
  | { type: 'closeRiver' }
  | { type: 'closeLocation' }
  | { type: 'escape' }
  | { type: 'closeAll' };

export function cardsReducer(s: CardsState, a: CardsAction): CardsState {
  switch (a.type) {
    // Com o painel aberto, escolher outro ponto troca o painel sem fechá-lo.
    case 'openPoint':
      return s.analysis ? { ...EMPTY_CARDS, analysis: { slug: a.slug, tab: s.analysis.tab } } : { ...EMPTY_CARDS, point: a.slug };
    case 'openAnalysis':
      return { ...EMPTY_CARDS, analysis: { slug: a.slug, tab: a.tab ?? s.analysis?.tab ?? 'why' } };
    case 'setTab':
      return s.analysis ? { ...s, analysis: { ...s.analysis, tab: a.tab } } : s;
    // A estação abre ao lado do painel (candidata) ou sozinha (clique no mapa); fecha ponto, rio e local.
    case 'openStation':
      return { ...EMPTY_CARDS, analysis: s.analysis, station: a.id };
    case 'openRiver':
      return { ...EMPTY_CARDS, river: a.id };
    case 'openLocation':
      return { ...EMPTY_CARDS, location: { lat: a.lat, lon: a.lon, side: a.side } };
    case 'closeStation': return { ...s, station: null };
    case 'closePoint': return { ...s, point: null };
    case 'closeAnalysis': return { ...s, analysis: null, station: null };
    case 'closeRiver': return { ...s, river: null };
    case 'closeLocation': return { ...s, location: null };
    case 'escape':
      if (s.station) return { ...s, station: null };
      if (s.analysis) return { ...s, analysis: null };
      return EMPTY_CARDS;
    case 'closeAll': return EMPTY_CARDS;
  }
}

export const anyCardOpen = (s: CardsState): boolean => Boolean(s.point || s.analysis || s.station || s.river || s.location);

/** Lado do popup do ponto: à direita do marcador, e à esquerda quando falta espaço até a borda direita. */
export function popupSide(markerX: number, mapWidth: number, cardWidth = 340): 'left' | 'right' {
  return markerX + cardWidth + 40 > mapWidth ? 'right' : 'left';
}

/** Card de local do lado oposto ao clique. */
export const oppositeSide = (clickX: number, mapWidth: number): 'left' | 'right' => (clickX < mapWidth / 2 ? 'right' : 'left');
