import { describe, it, expect } from 'vitest';
import { meanRainSeries, rainNow, riverState, sortPoints, tideNow, fmtNum, probabilityByPoint } from './overview';
import type { FloodPointResponseDTO } from '../types';

const T = (min: number) => new Date(Date.UTC(2026, 9, 21, 12, min)).toISOString();
const pt = (name: string, riskLevel: string, p: number | null) => ({ name, floodPrediction: { riskLevel, floodProbability: p } }) as unknown as FloodPointResponseDTO;

describe('overview', () => {
  it('chuva média por instante ignora nulos; sem nenhum fica nulo', () => {
    const s = meanRainSeries([
      { stationId: 'a', points: [{ t: T(0), v: 1 }, { t: T(60), v: null }] },
      { stationId: 'b', points: [{ t: T(0), v: 3 }, { t: T(60), v: null }] },
    ]);
    expect(s.map((p) => p.v)).toEqual([2, null]);
    expect(rainNow(s, Date.parse(T(70)))).toBe(2);
  });
  it('maré agora e direção', () => {
    const series = [0, 10, 20, 30, 40].map((m, i) => ({ t: Date.parse(T(m)), v: 1 + i * 0.1 }));
    expect(tideNow(series, Date.parse(T(0)))?.rising).toBe(true);
    expect(tideNow(series, Date.parse(T(300)))).toBeNull();
    expect(tideNow([...series].reverse().map((p, i) => ({ t: series[i].t, v: p.v })), Date.parse(T(0)))?.rising).toBe(false);
  });
  it('ordena Alto, Moderado, Indisponível, Baixo e, no nível, por probabilidade', () => {
    const out = sortPoints([pt('b', 'LOW', 0.1), pt('c', 'UNKNOWN', null), pt('a', 'LOW', 0.2), pt('d', 'HIGH', 0.7), pt('e', 'MEDIUM', 0.4)]);
    expect(out.map((p) => p.name)).toEqual(['d', 'e', 'c', 'a', 'b']);
  });
  it('probabilidade por ponto: UNKNOWN vira buraco', () => {
    const m = probabilityByPoint([{ slug: 'x', items: [{ slug: 'x', riskLevel: 'LOW', probability: 0.2, issuedAt: T(10) }, { slug: 'x', riskLevel: 'UNKNOWN', probability: 0.9, issuedAt: T(0) }] as never }]);
    expect(m.get('x')).toEqual([null, 0.2]);
  });
  it('estado do rio pelas cotas', () => {
    const lv = { riverPreAlertLevel: 1.7, riverAlertLevel: 2.4, riverFloodLevel: 3.1 };
    expect([1.0, 1.8, 2.5, 3.2].map((v) => riverState(v, lv))).toEqual(['normal', 'Pré-alerta', 'Alerta', 'Inundação']);
    expect(riverState(1.8, {})).toBeNull();
    expect(riverState(null, lv)).toBeNull();
  });
  it('formata com vírgula', () => {
    expect(fmtNum(0.22, 2)).toBe('0,22');
  });
});
