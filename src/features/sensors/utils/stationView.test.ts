import { describe, expect, it } from 'vitest';
import { divergentHours, hourlyModel, stationListItem } from './stationView';
import { canonicalStations, hourlyHours } from '@/mocks/handlers-cenarios';

describe('hourlyModel', () => {
  const m = hourlyModel(hourlyHours());
  it('hora sem dado vira faixa, nunca barra de zero', () => {
    expect(m.gaps).toHaveLength(1);
    expect(m.bars).toHaveLength(24 - 1 - 1); // 1 lacuna e 1 pico removido
  });
  it('pico isolado removido é marcador, sem barra nem lacuna', () => {
    expect(m.marks).toHaveLength(1);
    expect(m.gaps.some((g) => g.x <= m.marks[0].x && m.marks[0].x <= g.x + g.w)).toBe(false);
  });
  it('as duas fontes têm barras', () => {
    expect(new Set(m.bars.map((b) => b.source))).toEqual(new Set(['CEMADEN', 'CEMADEN_PED']));
  });
});

describe('divergentHours', () => {
  it('só horas divergentes, mais recentes primeiro', () => {
    const d = divergentHours(hourlyHours());
    expect(d).toHaveLength(2);
    expect(Date.parse(d[0].hourEndUtc)).toBeGreaterThan(Date.parse(d[1].hourEndUtc));
  });
});

describe('stationListItem', () => {
  it('só PED + mês reprovado: tags e marca de problema', () => {
    const it = stationListItem(canonicalStations[1], undefined);
    expect(it.sources).toEqual(['PED_ONLY']);
    expect(it.monthTag?.text).toBe('reprovada no mês');
    expect(it.problem).toBe(true);
  });
  it('NO_DATA: traço e sem resposta; lacuna agora: "sem dado", nunca 0', () => {
    const base = { canonicalId: 'X', aliases: [], sources: ['CEMADEN'], quarantine: {} };
    const acc = (status: 'OK' | 'NO_DATA', acc1hMm: number | null) => ({ status, acc1hMm }) as never;
    expect(stationListItem(base, acc('NO_DATA', null)).value).toBe('—');
    expect(stationListItem(base, acc('OK', null)).value).toBe('sem dado');
  });
});
