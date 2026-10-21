import { describe, it, expect } from 'vitest';
import { DEFAULT_ACTIVE_LAYERS, LAYER_OPTIONS, filterFloodPointsForMap, filterSensorsForMap } from './layers';
import type { FloodPointResponseDTO, SensorResponseDTO } from '../types';

const sensor = (over: Partial<SensorResponseDTO>): SensorResponseDTO =>
  ({ id: 1, sensorId: 's1', value: 1, unit: 'mm', batteryStatus: null, timestamp: '2026-10-21T10:00:00Z', stationName: null, latitude: -8.05, longitude: -34.9, municipality: null, type: 'pluviometro', source: 'CEMADEN', fogValueReference: null, code: null, temperature: null, humidity: null, pressure: null, windSpeed: null, windDirection: null, solarRadiation: null, accumulatedPrecipitation: null, soilHumidity: null, waterLevel: null, flowRate: null, basinName: null, ...over }) as SensorResponseDTO;
const point = (over: Partial<FloodPointResponseDTO>): FloodPointResponseDTO =>
  ({ id: 1, slug: 'p', name: 'P', municipality: null, description: null, latitude: -8.05, longitude: -34.9, altitudeM: null, distanceToChannelM: null, basinName: null, sensorConfig: null, active: true, tideHeight: null, tideUnit: null, ...over });

describe('camadas do mapa', () => {
  it('toda camada padrão existe nas opções', () => {
    const ids = LAYER_OPTIONS.map((l) => l.id);
    expect(DEFAULT_ACTIVE_LAYERS.every((l) => ids.includes(l))).toBe(true);
  });

  it('descarta sensor sem coordenada ou em 0,0', () => {
    const all = [sensor({ id: 1 }), sensor({ id: 2, latitude: null }), sensor({ id: 3, latitude: 0, longitude: 0 })];
    expect(filterSensorsForMap(all, DEFAULT_ACTIVE_LAYERS).map((s) => s.id)).toEqual([1]);
  });

  it('camada desligada esconde o sensor', () => {
    expect(filterSensorsForMap([sensor({})], [])).toEqual([]);
  });

  it('entrada que não é lista vira lista vazia', () => {
    expect(filterSensorsForMap(null as unknown as SensorResponseDTO[], DEFAULT_ACTIVE_LAYERS)).toEqual([]);
    expect(filterFloodPointsForMap(undefined as unknown as FloodPointResponseDTO[], DEFAULT_ACTIVE_LAYERS)).toEqual([]);
  });

  it('pontos críticos dependem da camada e de coordenada válida', () => {
    const pts = [point({ id: 1 }), point({ id: 2, latitude: 0 })];
    expect(filterFloodPointsForMap(pts, DEFAULT_ACTIVE_LAYERS).map((p) => p.id)).toEqual([1]);
    expect(filterFloodPointsForMap(pts, ['Chuva'])).toEqual([]);
  });
});
