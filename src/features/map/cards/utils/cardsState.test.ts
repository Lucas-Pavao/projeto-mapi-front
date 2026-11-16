import { describe, it, expect } from 'vitest';
import { cardsReducer, EMPTY_CARDS, oppositeSide, popupSide, type CardsState } from './cardsState';
import { paramsFromState, stateFromParams } from '../hooks/useMapCards';

const run = (s: CardsState, ...a: Parameters<typeof cardsReducer>[1][]) => a.reduce(cardsReducer, s);

describe('um card por vez', () => {
  it('abrir um fecha o outro', () => {
    let s = run(EMPTY_CARDS, { type: 'openPoint', slug: 'A' });
    expect(s.point).toBe('A');
    s = run(s, { type: 'openStation', id: 'E1' });
    expect(s).toMatchObject({ point: null, station: 'E1' });
    s = run(s, { type: 'openLocation', lat: -8, lon: -34.9, side: 'right' });
    expect(s).toMatchObject({ station: null, location: { lat: -8 } });
    s = run(s, { type: 'openRiver', id: 'R' });
    expect(s).toMatchObject({ location: null, river: 'R' });
  });
  it('análise: troca de ponto não fecha o painel e mantém a aba', () => {
    let s = run(EMPTY_CARDS, { type: 'openPoint', slug: 'A' }, { type: 'openAnalysis', slug: 'A', tab: 'inputs' });
    expect(s).toMatchObject({ point: null, analysis: { slug: 'A', tab: 'inputs' } });
    s = run(s, { type: 'openPoint', slug: 'B' });
    expect(s.analysis).toEqual({ slug: 'B', tab: 'inputs' });
    expect(s.point).toBeNull();
  });
  it('candidata abre a estação ao lado do painel', () => {
    const s = run(EMPTY_CARDS, { type: 'openAnalysis', slug: 'A' }, { type: 'openStation', id: 'E1' });
    expect(s).toMatchObject({ analysis: { slug: 'A' }, station: 'E1' });
  });
  it('Esc fecha o de cima: estação, depois o painel, depois o resto', () => {
    let s = run(EMPTY_CARDS, { type: 'openAnalysis', slug: 'A' }, { type: 'openStation', id: 'E1' });
    s = run(s, { type: 'escape' });
    expect(s).toMatchObject({ station: null, analysis: { slug: 'A' } });
    s = run(s, { type: 'escape' });
    expect(s.analysis).toBeNull();
    s = run(EMPTY_CARDS, { type: 'openPoint', slug: 'A' }, { type: 'escape' });
    expect(s).toEqual(EMPTY_CARDS);
  });
  it('setTab só vale com o painel aberto', () => {
    expect(run(EMPTY_CARDS, { type: 'setTab', tab: 'prov' })).toEqual(EMPTY_CARDS);
  });
  it('lado do popup do ponto e do card de local', () => {
    expect(popupSide(300, 1400)).toBe('left');
    expect(popupSide(1300, 1400)).toBe('right');
    expect(oppositeSide(200, 1400)).toBe('right');
    expect(oppositeSide(1000, 1400)).toBe('left');
  });
});

describe('URL', () => {
  it('?ponto&aba abre o painel e o estado volta para a URL', () => {
    const s = stateFromParams(new URLSearchParams('ponto=AGAMENON_DERBY&aba=prov'));
    expect(s.analysis).toEqual({ slug: 'AGAMENON_DERBY', tab: 'prov' });
    expect(paramsFromState(s, new URLSearchParams('x=1')).toString()).toBe('x=1&ponto=AGAMENON_DERBY&aba=prov');
  });
  it('aba inválida vira "Por quê"; ?local abre o card de local', () => {
    expect(stateFromParams(new URLSearchParams('ponto=A&aba=zzz')).analysis?.tab).toBe('why');
    const s = stateFromParams(new URLSearchParams('local=-8.1039,-34.9509'));
    expect(s.location).toMatchObject({ lat: -8.1039, lon: -34.9509 });
    expect(paramsFromState(s, new URLSearchParams()).get('local')).toBe('-8.1039,-34.9509');
  });
  it('fechar tudo limpa os parâmetros do card e preserva os outros', () => {
    expect(paramsFromState(EMPTY_CARDS, new URLSearchParams('ponto=A&aba=why&x=1')).toString()).toBe('x=1');
  });
});
