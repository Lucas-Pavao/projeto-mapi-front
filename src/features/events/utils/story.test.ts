import { describe, it, expect } from 'vitest';
import { transitionText, buildStory } from './story';
import { buildCells, alertMinutes } from './strips';
import type { Timeline } from '../schemas/timeline.schema';
import type { AlagamentoHistorico } from '@/features/alagamento/schemas/alagamento.schema';

const H = 3_600_000;
const it_ = (level: 'ALERTA' | 'ATENCAO' | 'SEM_ALERTA' | 'SEM_DADO', t: number, hNowCm: number | null = null, worstHorizonHours: number | null = 1) =>
  ({ at: new Date(t).toISOString(), level, hNowCm, worstHorizonHours });

describe('transitionText (alerta por regressão)', () => {
  it('entrada, saída e sem dado; nunca "risco baixo" nem "seguro"', () => {
    expect(transitionText('A', 'SEM_ALERTA', it_('ALERTA', 0, 17.7))).toBe('A: alerta em 1 h · lâmina 17,7 cm');
    expect(transitionText('A', 'SEM_ALERTA', it_('ATENCAO', 0, null, 3))).toBe('A: atenção em 3 h');
    expect(transitionText('A', 'ALERTA', it_('SEM_ALERTA', 0))).toBe('A: saiu do alerta');
    expect(transitionText('A', 'ALERTA', it_('ATENCAO', 0))).toBe('A: saiu do alerta (atenção)');
    expect(transitionText('A', 'ATENCAO', it_('SEM_ALERTA', 0))).toBe('A: saiu da atenção');
    expect(transitionText('A', 'SEM_ALERTA', it_('SEM_DADO', 0))).toBe('A: alerta sem dado');
    expect(transitionText('A', null, it_('SEM_ALERTA', 0))).toBeNull();
    expect(transitionText('A', 'ALERTA', it_('ALERTA', 0))).toBeNull();
  });
});

describe('buildStory', () => {
  it('junta transições do alerta, alagamento, maré e rio em ordem do mais recente', () => {
    const t: Timeline = {
      from: new Date(0).toISOString(), to: new Date(10 * H).toISOString(), stepMinutes: 10, rain: [],
      tide: { harbor: 'pe02', points: [{ t: new Date(1 * H).toISOString(), v: 1.9 }, { t: new Date(2 * H).toISOString(), v: 2.1 }] },
      river: [{ stationId: 'r', points: [{ t: new Date(3 * H).toISOString(), v: 2.7 }, { t: new Date(4 * H).toISOString(), v: 2.85 }] }],
      floodEvents: [{ id: 1, slug: 'a', startTime: new Date(7 * H).toISOString(), severity: 'MEDIUM' }],
    };
    const hist: AlagamentoHistorico = { from: t.from, to: t.to, points: [{ slug: 'a', items: [it_('SEM_ALERTA', 0), it_('ALERTA', 5 * H, 17.7), it_('SEM_ALERTA', 6 * H)] }] };
    const s = buildStory(t, hist, new Map([['a', 'Ponto A']]), { flood: 2.8, alert: 2.3, name: 'Rio X' });
    expect(s.map((x) => x.title)).toEqual(['Alagamento confirmado em Ponto A', 'Ponto A: saiu do alerta', 'Ponto A: alerta em 1 h · lâmina 17,7 cm', 'Rio X atingiu a cota de inundação', 'Maré acima de 2,0 m']);
    expect(buildStory(t, null, new Map()).some((x) => x.title.includes('alerta'))).toBe(false);
  });
});

describe('buildCells', () => {
  it('cada célula pega o último ciclo; sem ciclo recente fica "sem cálculo"; tempo em alerta', () => {
    const cells = buildCells([it_('SEM_ALERTA', 0), it_('ALERTA', 4 * H, 20)], 0, 8 * H, 8);
    expect(cells.map((c) => c.level)).toEqual(['SEM_ALERTA', null, null, 'ALERTA', 'ALERTA', null, null, null]);
    expect(cells[3].hNowCm).toBe(20);
    expect(alertMinutes(cells, 8 * H)).toBe(120);
    expect(alertMinutes(cells, 4.5 * H)).toBe(90);
  });
  it('SEM_DADO fica SEM_DADO, nunca sem alerta', () => {
    expect(buildCells([it_('SEM_DADO', 0)], 0, 3_600_000, 1)[0]).toMatchObject({ level: 'SEM_DADO' });
  });
});
