import { describe, it, expect } from 'vitest';
import { HOUR_MS, hourBar, niceStep, scaleLinear, segments, timeTicks, toTimePts, yDomain } from './chartMath';

describe('chartMath', () => {
  it('toTimePts ordena e descarta instante inválido', () => {
    const r = toTimePts([{ t: '2026-10-21T12:00:00Z', v: 2 }, { t: 'lixo', v: 1 }, { t: '2026-10-21T11:00:00Z', v: null }]);
    expect(r.map((p) => p.v)).toEqual([null, 2]);
  });

  it('scaleLinear mapeia extremos e tolera domínio vazio', () => {
    const s = scaleLinear(0, 10, 100, 200);
    expect([s(0), s(5), s(10)]).toEqual([100, 150, 200]);
    expect(scaleLinear(3, 3, 0, 10)(3)).toBe(5);
  });

  it('niceStep usa 1, 2, 5 x 10^n', () => {
    expect(niceStep(10, 4)).toBe(5);
    expect(niceStep(0.9, 4)).toBe(0.5);
    expect(niceStep(0, 4)).toBe(1);
  });

  it('yDomain com base em zero para chuva e sem dados', () => {
    const d = yDomain([0, 0.4, 9.6], { zero: true });
    expect(d.min).toBe(0);
    expect(d.max).toBeGreaterThanOrEqual(9.6);
    expect(d.ticks[0]).toBe(0);
    expect(yDomain([null, null]).ticks).toEqual([0, 1]);
  });

  it('yDomain de série constante não zera a altura', () => {
    const d = yDomain([2, 2]);
    expect(d.max).toBeGreaterThan(d.min);
  });

  it('timeTicks alinha à hora cheia e respeita o máximo', () => {
    const from = Date.parse('2026-10-21T10:30:00Z');
    const to = from + 24 * HOUR_MS;
    const t = timeTicks(from, to, 6);
    expect(t.length).toBeLessThanOrEqual(7);
    expect(t.every((x) => x % HOUR_MS === 0)).toBe(true);
  });

  it('segments abre buraco no valor nulo (não interpola)', () => {
    const s = segments([{ t: 1, v: 1 }, { t: 2, v: null }, { t: 3, v: 3 }, { t: 4, v: 4 }]);
    expect(s).toHaveLength(2);
    expect(s[1]).toHaveLength(2);
  });

  it('hourBar: barra termina no fim da hora e é recortada à janela', () => {
    const end = Date.parse('2026-10-21T13:00:00Z');
    expect(hourBar(end, end - 24 * HOUR_MS, end)).toEqual({ start: end - HOUR_MS, end });
    expect(hourBar(end, end - 30 * 60_000, end + HOUR_MS)).toEqual({ start: end - 30 * 60_000, end });
    expect(hourBar(end - 5 * HOUR_MS, end - HOUR_MS, end)).toBeNull();
  });
});
