import { describe, it, expect } from 'vitest';
import { resolveRain, snapAreaRange, sourceName, fmtPt, TIDE_UNIT } from './provenance';
import type { PreciseData, SensorResponseDTO } from '../types';

const precise = (o: Record<string, unknown>) => ({ source: 'CEMADEN', unitPrecipitation: 'mm', ...o }) as unknown as PreciseData;
const sensor = (o: Record<string, unknown>) => ({ source: 'APAC', stationName: 'Recife', ...o }) as unknown as SensorResponseDTO;

describe('resolveRain', () => {
  it('agregado de 24 h é rotulado como 24 h, com a fonte', () => {
    const r = resolveRain({ precise: precise({ historicalAggregates: { rain24h: 12.5 } }) });
    expect(r).toMatchObject({ value: 12.5, quantity: 'Chuva 24 h', source: 'Cemaden', unit: 'mm' });
  });
  it('sem 24 h e com acumulado do sensor, não rotula como 24 h', () => {
    const r = resolveRain({ precise: precise({}), sensor: sensor({ accumulatedPrecipitation: 3 }) });
    expect(r.quantity).not.toMatch(/24/);
    expect(r.quantity).toMatch(/janela não informada/);
    expect(r.source).toBe('pluviômetro APAC — Recife');
  });
  it('só Open-Meteo: chuva na última hora', () => {
    const r = resolveRain({ openMeteoPrecipitation: 0.4 });
    expect(r).toMatchObject({ value: 0.4, quantity: 'Chuva na última hora', source: 'Open-Meteo' });
  });
  it('sem nada: sem valor e sem rótulo de 24 h', () => {
    const r = resolveRain({});
    expect(r.value).toBeNull();
    expect(r.quantity).not.toMatch(/24/);
  });
  it('zero é valor válido (não cai para o próximo degrau)', () => {
    const r = resolveRain({ precise: precise({ historicalAggregates: { rain24h: 0 } }), openMeteoPrecipitation: 5 });
    expect(r.value).toBe(0);
    expect(r.quantity).toBe('Chuva 24 h');
  });
});

describe('utilitários', () => {
  it('nome de fonte e formatação pt-BR', () => {
    expect(sourceName('cemaden')).toBe('Cemaden');
    expect(sourceName(' ')).toBeNull();
    expect(fmtPt(573046, 0)).toBe(new Intl.NumberFormat('pt-BR').format(573046));
    expect(TIDE_UNIT).toBe('m (NR da DHN)');
  });
  it('faixa do snap usa 5, 10 e 20 m e a área; ausente vira null', () => {
    expect(snapAreaRange({ '0m': 52, '5m': 572882, '10m': 573046, '20m': 583696 }, 573046)).toEqual({ min: 572882, max: 583696 });
    expect(snapAreaRange(undefined, 10)).toBeNull();
    expect(snapAreaRange({ '5m': null, '10m': null, '20m': null }, 10)).toBeNull();
  });
});
