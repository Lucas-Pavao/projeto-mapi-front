import { describe, it, expect } from 'vitest';
import { getRiskVisual } from './risk';
import { RISK_LEVELS } from '../schemas/floodPointResponse.schema';

function lin(c: number) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}
function luminance(hex: string) {
  const n = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
export function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const BACKGROUND = '#09090b';

describe('contraste das cores de risco (WCAG 1.4.11)', () => {
  it.each(RISK_LEVELS)('%s: ícone branco >= 3:1 e cor contra o fundo >= 3:1', (level) => {
    const { hex } = getRiskVisual(level);
    expect(contrast('#ffffff', hex)).toBeGreaterThanOrEqual(3);
    expect(contrast(hex, BACKGROUND)).toBeGreaterThanOrEqual(3);
  });
  it('texto secundário zinc-400 >= 4,5:1 sobre o fundo', () => {
    expect(contrast('#a1a1aa', BACKGROUND)).toBeGreaterThanOrEqual(4.5);
  });
  it('as quatro cores são distintas', () => {
    expect(new Set(RISK_LEVELS.map((l) => getRiskVisual(l).hex)).size).toBe(4);
  });
});
