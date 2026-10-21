import { describe, it, expect } from 'vitest';
import { rainTotal, sortByRisk } from './situation';

describe('sortByRisk', () => {
  it('Alto, Moderado, indisponível, Baixo; empate por nome', () => {
    const pts = [
      { name: 'B', floodPrediction: { riskLevel: 'LOW' as const } },
      { name: 'A', floodPrediction: { riskLevel: 'UNKNOWN' as const } },
      { name: 'C', floodPrediction: { riskLevel: 'HIGH' as const } },
      { name: 'D', floodPrediction: { riskLevel: 'MEDIUM' as const } },
      { name: 'E', floodPrediction: undefined },
    ];
    expect(sortByRisk(pts).map((p) => p.name)).toEqual(['C', 'D', 'A', 'E', 'B']);
  });
});

describe('rainTotal', () => {
  it('soma, máximo da hora e horas sem leitura', () => {
    const r = rainTotal([{ t: 'a', v: 1.5 }, { t: 'b', v: null }, { t: 'c', v: 4.25 }, { t: 'd', v: 0 }]);
    expect(r).toEqual({ totalMm: 5.75, maxHourMm: 4.25, maxHourEnd: 'c', missingHours: 1 });
  });
  it('sem pontos', () => {
    expect(rainTotal([])).toEqual({ totalMm: 0, maxHourMm: 0, maxHourEnd: null, missingHours: 0 });
  });
});
