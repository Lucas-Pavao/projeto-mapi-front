import { describe, it, expect } from 'vitest';
import { collectNearbySensorIds } from './nearbySensors';
import type { PreciseDataResponse } from '../types';

const status = (sensorIds: string[], readings: string[]): PreciseDataResponse =>
  ({ preciseData: { sensorIds, latestReadings: readings.map((sensorId) => ({ sensorId })) } }) as unknown as PreciseDataResponse;

describe('collectNearbySensorIds', () => {
  it('sem seleção devolve conjunto vazio', () => {
    const r = collectNearbySensorIds({ locationInfo: null, floodPointStatus: null, selectedFloodPoint: undefined, sensorStatus: null });
    expect(r.size).toBe(0);
  });

  it('une as quatro origens sem repetir', () => {
    const r = collectNearbySensorIds({
      locationInfo: status(['a'], ['b']),
      floodPointStatus: status(['b'], ['c']),
      selectedFloodPoint: { nearbySensorIds: ['d', 'a'] } as never,
      sensorStatus: status([], ['e']),
    });
    expect([...r].sort()).toEqual(['a', 'b', 'c', 'd', 'e']);
  });
});
