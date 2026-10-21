import { describe, it, expect } from 'vitest';
import { buildPatch, formFromPoint } from './pointPatch';
import type { FloodPointResponseDTO } from '@/features/map/types';

const point = { id: 1, slug: 'p', name: 'P', description: null, municipality: null, latitude: -8.05, longitude: -34.9, altitudeM: null, distanceToChannelM: null, basinName: null, sensorConfig: { pluviometerStationIds: ['A'], riverLevelStationIds: [] }, active: true, tideHeight: null, tideUnit: null, alertThresholdMm: 40 } as unknown as FloodPointResponseDTO;

describe('buildPatch', () => {
  it('sem mudança o patch é vazio', () => {
    expect(buildPatch(point, formFromPoint(point))).toEqual({ patch: {}, errors: {} });
  });
  it('manda só o que mudou', () => {
    const f = { ...formFromPoint(point), name: ' Novo ', active: false, alertThresholdMm: '55,5', pluviometerStationIds: ['A', 'B'] };
    expect(buildPatch(point, f).patch).toEqual({ name: 'Novo', active: false, alertThresholdMm: 55.5, pluviometerStationIds: ['A', 'B'] });
  });
  it('limpar o limiar manda null; limpar a descrição manda null', () => {
    const p2 = { ...point, description: 'x' } as FloodPointResponseDTO;
    const f = { ...formFromPoint(p2), alertThresholdMm: '', description: '' };
    expect(buildPatch(p2, f).patch).toEqual({ alertThresholdMm: null, description: null });
  });
  it('reordenar estações não conta como mudança', () => {
    const p2 = { ...point, sensorConfig: { pluviometerStationIds: ['A', 'B'], riverLevelStationIds: [] } } as FloodPointResponseDTO;
    expect(buildPatch(p2, { ...formFromPoint(p2), pluviometerStationIds: ['B', 'A'] }).patch).toEqual({});
  });
  it('valida nome, coordenadas e limiar', () => {
    const f = { ...formFromPoint(point), name: ' ', latitude: '99', longitude: 'abc', alertThresholdMm: '-1' };
    expect(Object.keys(buildPatch(point, f).errors).sort()).toEqual(['alertThresholdMm', 'latitude', 'longitude', 'name']);
  });
});
