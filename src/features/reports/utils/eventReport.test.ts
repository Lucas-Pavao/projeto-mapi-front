import { describe, it, expect } from 'vitest';
import { averageRain, pointRows, summaryText, toCsv, worstText } from './eventReport';
import type { Timeline } from '@/features/events/schemas/timeline.schema';
import type { AlagamentoHistorico } from '@/features/alagamento/schemas/alagamento.schema';

const H = 3_600_000;
const tl: Timeline = {
  from: new Date(0).toISOString(), to: new Date(8 * H).toISOString(), stepMinutes: 10,
  rain: [{ stationId: 'x', points: [{ t: new Date(H).toISOString(), v: 2 }] }, { stationId: 'y', points: [{ t: new Date(H).toISOString(), v: 4 }, { t: new Date(2 * H).toISOString(), v: null }] }],
  tide: { harbor: 'pe02', points: [{ t: new Date(3 * H).toISOString(), v: 2.3 }] },
  river: [],
} as Timeline;

const it_ = (level: 'ALERTA' | 'ATENCAO' | 'SEM_ALERTA' | 'SEM_DADO', t: number, hNowCm: number | null = 0) => ({ at: new Date(t).toISOString(), level, worstHorizonHours: level === 'SEM_DADO' ? null : 1, hNowCm });
const hist: AlagamentoHistorico = {
  from: new Date(0).toISOString(), to: new Date(8 * H).toISOString(),
  points: [
    { slug: 'a', name: 'A', items: [it_('SEM_ALERTA', 0), it_('ALERTA', 2 * H, 17.7), it_('ALERTA', 2 * H + 3 * 60_000, 18.2), it_('SEM_DADO', 2 * H + 6 * 60_000, null)] },
    { slug: 'b', name: 'B', items: [it_('SEM_DADO', 0, null)] },
    { slug: 'c', name: 'C', items: [it_('ATENCAO', H, 4)] },
  ],
};

describe('relatório do evento', () => {
  it('média de chuva ignora nulos', () => {
    expect(averageRain(tl)).toEqual([{ t: H, v: 3 }]);
  });
  it('linhas por ponto: pior nível, lâmina máxima, quando e tempo em alerta (intervalo entre ciclos, até 15 min)', () => {
    const rows = pointRows(hist, new Map([['a', 'Ponto A']]), 0, 8 * H);
    expect(rows.map((r) => [r.name, r.worst, r.maxSheetCm])).toEqual([['Ponto A', 'ALERTA', 18.2], ['C', 'ATENCAO', 4], ['B', 'SEM_DADO', null]]);
    expect(rows[0].worstAt).toBe(2 * H);
    expect(rows[0].alertMin).toBe(6);
    expect(worstText(rows[0])).toBe('alerta em 1 h · 18,2 cm');
    expect(worstText(rows[2])).toBe('sem dado');
  });
  it('resumo só afirma o que os dados mostram; sem dado nunca vira "sem alerta"; em teste diz que está em teste', () => {
    const rows = pointRows(hist, new Map([['a', 'Ponto A']]), 0, 8 * H);
    const t = summaryText(rows, averageRain(tl), [{ t: 3 * H, v: 2.3 }], 8 * H);
    expect(t).toContain('O pior nível na janela foi em Ponto A: alerta em 1 h · 18,2 cm');
    expect(t).toContain('3,0 mm/h');
    expect(t).toContain('2,30 m');
    expect(summaryText(pointRows({ ...hist, points: [hist.points[1]] }, new Map(), 0, 8 * H), [], [], 0)).toBe('Nenhum ponto chegou a alerta ou atenção na janela.');
    expect(summaryText([], [], [], 0)).toBe('Sem histórico do alerta de alagamento na janela.');
    expect(summaryText(null, [], [], 0)).toMatch(/está em teste/);
  });
  it('CSV escapa ponto e vírgula e aspas', () => {
    expect(toCsv(['a', 'b'], [['x;y', 'diz "oi"'], [1, null]])).toBe('a;b\n"x;y";"diz ""oi"""\n1;');
  });
});
