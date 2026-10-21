import { describe, it, expect } from 'vitest';
import { transitionText, buildStory } from './story';
import { buildCells, highMinutes } from './strips';
import type { Timeline } from '../schemas/timeline.schema';

describe('transitionText', () => {
  it('descreve subida, descida e perda de previsão', () => {
    expect(transitionText('A', 'LOW', 'MEDIUM')).toBe('A passou para moderado');
    expect(transitionText('A', 'MEDIUM', 'HIGH')).toBe('A passou para alto');
    expect(transitionText('A', 'HIGH', 'MEDIUM')).toBe('A saiu do risco alto');
    expect(transitionText('A', 'MEDIUM', 'LOW')).toBe('A voltou para baixo');
    expect(transitionText('A', 'LOW', 'UNKNOWN')).toBe('A ficou sem previsão');
    expect(transitionText('A', null, 'LOW')).toBeNull();
    expect(transitionText('A', 'LOW', 'LOW')).toBeNull();
  });
});

const p = (slug: string, riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN', t: number) => ({ slug, riskLevel, probability: riskLevel === 'UNKNOWN' ? null : 0.5, issuedAt: new Date(t).toISOString(), modelValidationStatus: 'NOT_VALIDATED' as const });

describe('buildStory', () => {
  it('junta transições, alagamento, maré e rio em ordem do mais recente', () => {
    const H = 3_600_000;
    const t: Timeline = {
      from: new Date(0).toISOString(), to: new Date(10 * H).toISOString(), stepMinutes: 10, rain: [],
      tide: { harbor: 'pe02', points: [{ t: new Date(1 * H).toISOString(), v: 1.9 }, { t: new Date(2 * H).toISOString(), v: 2.1 }] },
      river: [{ stationId: 'r', points: [{ t: new Date(3 * H).toISOString(), v: 2.7 }, { t: new Date(4 * H).toISOString(), v: 2.85 }] }],
      risk: [{ slug: 'a', items: [p('a', 'LOW', 0), p('a', 'HIGH', 5 * H), p('a', 'MEDIUM', 6 * H)] }],
      floodEvents: [{ id: 1, slug: 'a', startTime: new Date(7 * H).toISOString(), severity: 'MEDIUM' }],
    };
    const s = buildStory(t, new Map([['a', 'Ponto A']]), { flood: 2.8, alert: 2.3, name: 'Rio X' });
    expect(s.map((x) => x.title)).toEqual(['Alagamento confirmado em Ponto A', 'Ponto A saiu do risco alto', 'Ponto A passou para alto', 'Rio X atingiu a cota de inundação', 'Maré acima de 2,0 m']);
  });
});

describe('buildCells', () => {
  it('cada célula pega a última previsão; passou de 3 h, fica sem previsão', () => {
    const H = 3_600_000;
    const cells = buildCells([p('a', 'LOW', 0), p('a', 'HIGH', 4 * H)], 0, 8 * H, 8);
    expect(cells.map((c) => c.level)).toEqual(['LOW', 'LOW', 'LOW', 'HIGH', 'HIGH', 'HIGH', 'HIGH', null]);
    expect(highMinutes(cells, 8 * H)).toBe(240);
    expect(highMinutes(cells, 5 * H)).toBe(120);
  });
  it('UNKNOWN não carrega probabilidade', () => {
    expect(buildCells([p('a', 'UNKNOWN', 0)], 0, 3_600_000, 1)[0]).toMatchObject({ level: 'UNKNOWN', probability: null });
  });
});
