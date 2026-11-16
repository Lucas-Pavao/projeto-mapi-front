import { useEffect, useMemo, useReducer, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parseTab, type AnalysisTab } from '../utils/analysis';
import { cardsReducer, EMPTY_CARDS, type CardsAction, type CardsState } from '../utils/cardsState';
import { coordParam, parseCoordParam } from '../utils/locationView';

/** Estado inicial vindo da URL: ?ponto=<slug>&aba=<aba> abre o painel; ?local=lat,lon abre o card de local. */
export function stateFromParams(p: URLSearchParams): CardsState {
  const slug = p.get('ponto');
  if (slug) return { ...EMPTY_CARDS, analysis: { slug, tab: parseTab(p.get('aba')) } };
  const loc = parseCoordParam(p.get('local'));
  return loc ? { ...EMPTY_CARDS, location: { ...loc, side: 'right' } } : EMPTY_CARDS;
}

/** Parâmetros da URL para o estado: só o painel e o local ficam na URL (cards de resumo são efêmeros). */
export function paramsFromState(s: CardsState, current: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(current);
  for (const k of ['ponto', 'aba', 'local']) next.delete(k);
  if (s.analysis) { next.set('ponto', s.analysis.slug); next.set('aba', s.analysis.tab); }
  else if (s.location) next.set('local', coordParam(s.location.lat, s.location.lon));
  return next;
}

type CloseType = Extract<CardsAction['type'], 'closeStation' | 'closePoint' | 'closeAnalysis' | 'closeRiver' | 'closeLocation'>;

/** Gerenciador "um card por vez" do mapa, com a URL como espelho do painel de análise e do local. */
export function useMapCards() {
  const [params, setParams] = useSearchParams();
  const [state, dispatch] = useReducer(cardsReducer, params, stateFromParams);
  const paramsRef = useRef(params);
  useEffect(() => { paramsRef.current = params; }, [params]);
  useEffect(() => {
    const next = paramsFromState(state, paramsRef.current);
    if (next.toString() !== paramsRef.current.toString()) setParams(next, { replace: true });
  }, [state, setParams]);
  const act = useMemo(() => ({
    openPoint: (slug: string) => dispatch({ type: 'openPoint', slug }),
    openAnalysis: (slug: string, tab?: AnalysisTab) => dispatch({ type: 'openAnalysis', slug, tab }),
    setTab: (tab: AnalysisTab) => dispatch({ type: 'setTab', tab }),
    openStation: (id: string) => dispatch({ type: 'openStation', id }),
    openStationFromLocation: (id: string) => dispatch({ type: 'openStation', id, fromLocation: true }),
    openRiver: (id: string) => dispatch({ type: 'openRiver', id }),
    openLocation: (lat: number, lon: number, side: 'left' | 'right') => dispatch({ type: 'openLocation', lat, lon, side }),
    close: (type: CloseType) => dispatch({ type }),
    escape: () => dispatch({ type: 'escape' }),
    closeAll: () => dispatch({ type: 'closeAll' }),
  }), []);
  return { state, ...act };
}
