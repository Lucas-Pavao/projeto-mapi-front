import { describe, it, expect } from 'vitest';
import { dayCurve, dayExtremes, daySummary, dayPoints, hm, minutesAbove, parseHour } from './tideTable';

describe('tábua de maré', () => {
  it('lê horas HH:mm e descarta texto inválido', () => {
    expect(parseHour('07:40')).toBe(460);
    expect(parseHour('7:05')).toBe(425);
    expect(parseHour('abc')).toBeNull();
    expect(dayPoints({ weekdayName: 'qua', day: 1, hours: [{ hour: '12:00', level: 2 }, { hour: 'x', level: 1 }, { hour: '06:00', level: 0.5 }] })).toEqual([{ min: 360, v: 0.5 }, { min: 720, v: 2 }]);
  });
  it('resume preamar, baixa-mar e amplitude só dos pontos', () => {
    expect(daySummary([{ min: 60, v: 0.4 }, { min: 400, v: 2.1 }, { min: 700, v: 0.2 }])).toEqual({ hi: 2.1, hiMin: 400, lo: 0.2, range: 2.1 - 0.2 });
    expect(daySummary([])).toBeNull();
  });
  it('curva em cosseno passa pelos pontos e não inventa fora do alcance', () => {
    const c = dayCurve([], [{ min: 0, v: 0 }, { min: 720, v: 2 }, { min: 1440, v: 0 }], []);
    expect(c[0]).toBe(0);
    expect(c[36]).toBeCloseTo(2);
    expect(c[18]).toBeCloseTo(1);
    expect(dayCurve([], [{ min: 600, v: 1 }, { min: 900, v: 2 }], [])[0]).toBeNull();
  });
  it('classifica as quatro fases do dia pelos vizinhos, inclusive nas bordas', () => {
    // 21/10/2026 no Porto do Recife; vizinhos: baixa de 20/10 às 18:2x e baixa de 22/10 às 07:14
    const cur = [{ min: 4, v: 1.81 }, { min: 400, v: 0.68 }, { min: 758, v: 1.84 }, { min: 1133, v: 0.73 }];
    const out = dayExtremes([{ min: 1100, v: 0.8 }], cur, [{ min: 53, v: 1.98 }]);
    expect(out.map((e) => e.kind)).toEqual(['PREAMAR', 'BAIXA_MAR', 'PREAMAR', 'BAIXA_MAR']);
    expect(dayExtremes([], [{ min: 10, v: 1 }], [])).toEqual([]);
  });
  it('minutos acima do limite e formatação', () => {
    expect(minutesAbove([0, 2, 2.5, 1, 0], 2)).toBe(40);
    expect(hm(150)).toBe('2h30');
  });
});
