import { describe, expect, it } from 'vitest';
import { cmToM, riverState, riverTrendCmH } from './river';

describe('régua do rio: unidades', () => {
  it('cota da APAC em cm vira metros; ausente continua ausente', () => {
    expect(cmToM(135.3)).toBeCloseTo(1.353);
    expect(cmToM(null)).toBeNull();
    expect(cmToM(undefined)).toBeNull();
  });

  it('estado compara nível e cotas na mesma unidade (m)', () => {
    const levels = { pre: cmToM(200), alert: cmToM(230), flood: cmToM(330) };
    expect(riverState(cmToM(135.3), levels)).toBe('NORMAL');
    expect(riverState(cmToM(230), levels)).toBe('ALERT');   // >=
  });

  it('tendência em cm/h a partir da série convertida para metros', () => {
    const t0 = Date.UTC(2026, 10, 16, 9);
    const serie = [{ t: t0, v: cmToM(130) }, { t: t0 + 3_600_000, v: cmToM(136) }];
    expect(riverTrendCmH(serie, t0 + 3_600_000)).toBeCloseTo(6);
  });
});
