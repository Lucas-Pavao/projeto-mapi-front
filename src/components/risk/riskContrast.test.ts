import { describe, it, expect } from 'vitest';
import { getRiskVisual } from './risk';
import { RISK_LEVELS } from '@/features/map/schemas/floodPointResponse.schema';

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

const BACKGROUND = '#0a1419'; // token background (dark)

describe('contraste das cores de risco (WCAG 1.4.11)', () => {
  it.each(RISK_LEVELS)('%s: ícone on-risk >= 3:1 sobre o preenchimento e preenchimento >= 3:1 contra o fundo', (level) => {
    const { hex, onHex } = getRiskVisual(level);
    expect(contrast(onHex, hex)).toBeGreaterThanOrEqual(3);
    expect(contrast(hex, BACKGROUND)).toBeGreaterThanOrEqual(3);
  });
  it('texto secundário (muted-foreground) >= 4,5:1 sobre o fundo', () => {
    expect(contrast('#9db1ba', BACKGROUND)).toBeGreaterThanOrEqual(4.5);
  });
  it('baixo e alto têm >= 3:1 de luminância entre si (escada claro->escuro)', () => {
    expect(contrast(getRiskVisual('LOW').hex, getRiskVisual('HIGH').hex)).toBeGreaterThanOrEqual(3);
  });
  it('as quatro cores são distintas', () => {
    expect(new Set(RISK_LEVELS.map((l) => getRiskVisual(l).hex)).size).toBe(4);
  });
});
