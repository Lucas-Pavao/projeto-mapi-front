import { describe, it, expect } from 'vitest';
import { tipPosition } from './tipPosition';

const btn = (x: number, y: number) => ({ left: x, right: x + 16, top: y, bottom: y + 16 });

describe('tipPosition: balão do ⓘ sempre dentro da janela', () => {
  it('centrado no botão quando cabe', () => {
    expect(tipPosition(btn(500, 400), 60, 1440, 900, 'top', 'center')).toEqual({ left: 380, top: 332, width: 256 });
  });
  it('perto da borda esquerda (painel "Agora na RMR"): encosta em 8 px, nunca negativo', () => {
    expect(tipPosition(btn(20, 300), 60, 1440, 900, 'top', 'center').left).toBe(8);
  });
  it('perto da borda direita: não passa da janela', () => {
    const p = tipPosition(btn(1430, 300), 60, 1440, 900, 'bottom', 'center');
    expect(p.left + p.width).toBeLessThanOrEqual(1432);
  });
  it('sem espaço em cima, desce; sem espaço embaixo, sobe', () => {
    expect(tipPosition(btn(500, 20), 80, 1440, 900, 'top', 'center').top).toBe(44);
    expect(tipPosition(btn(500, 860), 80, 1440, 900, 'bottom', 'center').top).toBe(772);
  });
  it('janela mais estreita que o balão: largura cabe com margem', () => {
    expect(tipPosition(btn(120, 300), 60, 260, 800, 'top', 'center').width).toBe(244);
  });
});
