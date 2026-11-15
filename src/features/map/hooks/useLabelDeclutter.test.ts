import { describe, it, expect } from 'vitest';
import { pickVisibleLabels } from './useLabelDeclutter';

const box = (key: string, x: number, y: number, w = 60, h = 22) => ({ key, x, y, w, h });

describe('pickVisibleLabels', () => {
  it('mantém os rótulos que não se encostam', () => {
    expect(pickVisibleLabels([box('a', 0, 0), box('b', 100, 0), box('c', 0, 40)])).toEqual(new Set(['a', 'b', 'c']));
  });

  it('no conflito vence quem vem antes (maior prioridade)', () => {
    expect(pickVisibleLabels([box('rio', 0, 0), box('chuva', 30, 5)])).toEqual(new Set(['rio']));
  });

  it('respeita a folga entre rótulos', () => {
    // Bordas a 2 px uma da outra: com folga de 4 px, colidem; sem folga, cabem.
    expect(pickVisibleLabels([box('a', 0, 0), box('b', 62, 0)])).toEqual(new Set(['a']));
    expect(pickVisibleLabels([box('a', 0, 0), box('b', 62, 0)], [], 0)).toEqual(new Set(['a', 'b']));
  });

  it('nunca cobre as áreas reservadas (pontos críticos)', () => {
    expect(pickVisibleLabels([box('a', 10, 0), box('b', 200, 0)], [box('p1', 0, 0, 44, 44)])).toEqual(new Set(['b']));
  });
});
