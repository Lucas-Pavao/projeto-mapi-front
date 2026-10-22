import { describe, it, expect } from 'vitest';
import { averageRain, pointRows, summaryText, toCsv } from './eventReport';
import type { Timeline } from '@/features/events/schemas/timeline.schema';

const H = 3_600_000;
const pr = (riskLevel: 'LOW' | 'HIGH' | 'UNKNOWN', probability: number | null, t: number) => ({ slug: 'a', riskLevel, probability, issuedAt: new Date(t).toISOString(), modelValidationStatus: 'NOT_VALIDATED' as const });
const tl: Timeline = {
  from: new Date(0).toISOString(), to: new Date(8 * H).toISOString(), stepMinutes: 10,
  rain: [{ stationId: 'x', points: [{ t: new Date(H).toISOString(), v: 2 }] }, { stationId: 'y', points: [{ t: new Date(H).toISOString(), v: 4 }, { t: new Date(2 * H).toISOString(), v: null }] }],
  tide: { harbor: 'pe02', points: [{ t: new Date(3 * H).toISOString(), v: 2.3 }] },
  river: [],
  risk: [{ slug: 'a', items: [pr('LOW', 0.2, 0), pr('HIGH', 0.9, 2 * H), pr('UNKNOWN', null, 5 * H)] }, { slug: 'b', items: [pr('UNKNOWN', null, 0)] }],
};

describe('relatório do evento', () => {
  it('média de chuva ignora nulos', () => {
    expect(averageRain(tl)).toEqual([{ t: H, v: 3 }]);
  });
  it('linhas por ponto: maior probabilidade ignora UNKNOWN; sem previsão válida vai por último', () => {
    const rows = pointRows(tl, new Map([['a', 'Ponto A']]), 0, 8 * H);
    expect(rows.map((r) => [r.name, r.maxProb, r.maxLevel])).toEqual([['Ponto A', 0.9, 'HIGH'], ['b', null, null]]);
    expect(rows[0].highMin).toBeGreaterThan(0);
  });
  it('resumo só afirma o que os dados mostram', () => {
    const rows = pointRows(tl, new Map([['a', 'Ponto A']]), 0, 8 * H);
    const t = summaryText(rows, averageRain(tl), [{ t: 3 * H, v: 2.3 }], 8 * H);
    expect(t).toContain('Ponto A, com 90%');
    expect(t).toContain('3,0 mm/h');
    expect(t).toContain('2,30 m');
    expect(summaryText([], [], [{ t: 0, v: 1 }], 0)).toBe('Nenhum ponto teve previsão válida na janela.');
  });
  it('CSV escapa ponto e vírgula e aspas', () => {
    expect(toCsv(['a', 'b'], [['x;y', 'diz "oi"'], [1, null]])).toBe('a;b\n"x;y";"diz ""oi"""\n1;');
  });
});
