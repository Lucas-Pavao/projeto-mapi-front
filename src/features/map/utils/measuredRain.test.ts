import { describe, it, expect } from 'vitest';
import { liveAliasCodes, mappableStations, measuredKind, measuredText, recifeWithReference, withoutCanonicalDuplicates } from './measuredRain';
import { measuredRainSchema, type StationAccumulation } from '../schemas/measuredRain.schema';
import type { SensorResponseDTO } from '../types';

const st = (over: Partial<StationAccumulation>): StationAccumulation => ({
  canonicalId: '261160610A', stationCode: '261160610A', name: 'Alto Mandu', municipality: 'RECIFE', lat: -8.019, lon: -34.931,
  aliases: ['CEMADEN:261160610A', 'CEMADEN_PED:261160610A'], status: 'OK', lastReadingUtc: '2026-11-15T17:20:00Z',
  acc1hMm: 0, acc3hMm: 0, acc6hMm: 0, acc12hMm: 0, acc24hMm: 0, acc48hMm: 0, acc72hMm: 0, acc96hMm: 0, acc120hMm: 0, ...over,
});

describe('chuva medida: sem dado ≠ zero', () => {
  it('distingue os três estados', () => {
    expect(measuredKind(null)).toBe('no-data');
    expect(measuredKind(undefined)).toBe('no-data');
    expect(measuredKind(0)).toBe('zero');
    expect(measuredKind(12.4)).toBe('value');
    expect(measuredText(null)).toBe('sem dado');
    expect(measuredText(0)).toBe('0,0 mm');
    expect(measuredText(12.44)).toBe('12,4 mm');
  });

  it('converte UTC para Recife e diz a referência', () => {
    expect(recifeWithReference('2026-11-15T17:20:00Z')).toBe('15/11/2026 14:20 (horário de Recife, UTC−3)');
    expect(recifeWithReference(null)).toBeNull();
  });

  it('só estações canônicas com coordenada vão ao mapa', () => {
    expect(mappableStations([st({}), st({ canonicalId: null, lat: null, lon: null, stationCode: 'A301' })])).toHaveLength(1);
  });

  it('o pluviômetro ao vivo que já é apelido da canônica sai do mapa; os outros ficam', () => {
    const codes = liveAliasCodes([st({})]);
    expect([...codes]).toEqual(['261160610A']);
    const sensors = [
      { id: 1, source: 'APAC/Cemaden', code: '261160610A' },
      { id: 2, source: 'APAC/Cemaden', code: '261160699A' },
      { id: 3, source: 'ANA', code: '261160610A' },
    ] as SensorResponseDTO[];
    expect(withoutCanonicalDuplicates(sensors, codes).map((s) => s.id)).toEqual([2, 3]);
  });

  it('o schema recusa resposta que não é medida', () => {
    const base = {
      computedAtUtc: '2026-11-15T17:27:20.8286Z', fetchedAtUtc: '2026-11-15T17:28:00Z', stale: false, timezone: 'UTC', unit: 'mm',
      rainOrigin: 'MEASURED', source: 'CEMADEN_PED', attribution: 'DADOS DA REDE OBSERVACIONAL DO CEMADEN/MCTIC',
      municipalitiesQueried: ['2611606'], municipalitiesWithoutData: [], municipalitiesFailed: [], stations: [st({ acc3hMm: null })],
    };
    expect(measuredRainSchema.parse(base).stations[0].acc3hMm).toBeNull();
    expect(() => measuredRainSchema.parse({ ...base, rainOrigin: 'REANALYSIS' })).toThrow();
  });
});
