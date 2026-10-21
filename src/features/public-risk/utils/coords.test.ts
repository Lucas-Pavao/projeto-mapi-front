import { describe, it, expect } from 'vitest';
import { geoFailureText, insideRmr, roundCoord } from './coords';

describe('coords públicas', () => {
  it('arredonda a 3 casas', () => {
    expect(roundCoord(-8.057384)).toBe(-8.057);
    expect(roundCoord(-34.8771999)).toBe(-34.877);
  });
  it('caixa da RMR', () => {
    expect(insideRmr(-8.05, -34.9)).toBe(true);
    expect(insideRmr(-9, -34.9)).toBe(false);
    expect(insideRmr(-8.05, -36)).toBe(false);
  });
  it('mensagens de geolocalização existem para todos os casos', () => {
    for (const f of ['denied', 'unavailable', 'timeout', 'unsupported'] as const) expect(geoFailureText(f).length).toBeGreaterThan(20);
  });
});
