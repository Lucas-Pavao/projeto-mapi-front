import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/flood.service', () => ({ floodService: { getPointStatus: vi.fn(), getPreciseData: vi.fn() } }));
vi.mock('../services/map.service', () => ({ mapService: { getLatestBySensorId: vi.fn() } }));

import { floodService } from '../services/flood.service';
import { mapService } from '../services/map.service';
import { loadFloodPointStatus } from './floodPointStatus';

const target = { slug: 'p1', latitude: -8.05, longitude: -34.9 };
const point = vi.mocked(floodService.getPointStatus);
const precise = vi.mocked(floodService.getPreciseData);
const bySensor = vi.mocked(mapService.getLatestBySensorId);

beforeEach(() => vi.resetAllMocks());

describe('loadFloodPointStatus', () => {
  it('prefere liveData e predição do ponto sobre a análise da coordenada', async () => {
    point.mockResolvedValue({ liveData: { source: 'ponto' }, floodPrediction: { riskLevel: 'HIGH' } } as never);
    precise.mockResolvedValue({ preciseData: { source: 'coord' }, floodPrediction: { riskLevel: 'LOW' }, nearestSensor: 'x' } as never);
    const r = await loadFloodPointStatus(target);
    expect(r.preciseData.source).toBe('ponto');
    expect(r.floodPrediction?.riskLevel).toBe('HIGH');
    expect((r as unknown as { nearestSensor: string }).nearestSensor).toBe('x');
  });

  it('cai para a análise da coordenada quando o ponto não traz dado', async () => {
    point.mockResolvedValue({} as never);
    precise.mockResolvedValue({ preciseData: { source: 'coord' }, floodPrediction: { riskLevel: 'LOW' } } as never);
    const r = await loadFloodPointStatus(target);
    expect(r.preciseData.source).toBe('coord');
    expect(r.floodPrediction?.riskLevel).toBe('LOW');
  });

  it('completa métricas faltantes com as leituras individuais dos sensores próximos', async () => {
    point.mockResolvedValue({ nearbySensorIds: ['s1', 's2'] } as never);
    precise.mockResolvedValue({ preciseData: { latestReadings: [], temperature: null, windSpeed: 5 } } as never);
    bySensor.mockImplementation(async (id: string) => {
      if (id === 's2') throw new Error('fora');
      return { sensorId: 's1', value: 2, unit: 'mm', type: 'pluv', timestamp: '2026-10-21T10:00:00', latitude: 1, longitude: 2, temperature: 28, windSpeed: 99, accumulatedPrecipitation: 4, humidity: null, pressure: null, waterLevel: null, flowRate: null } as never;
    });
    const r = await loadFloodPointStatus(target);
    expect(r.preciseData.temperature).toBe(28); // preenchida
    expect(r.preciseData.windSpeed).toBe(5); // já existia: não sobrescreve
    expect(r.preciseData.precipitation).toBe(4);
    expect(r.preciseData.latestReadings?.map((x) => x.sensorId)).toEqual(['s1']);
  });

  it('abandona a etapa dos sensores individuais se a seleção mudou', async () => {
    point.mockResolvedValue({ nearbySensorIds: ['s1'] } as never);
    precise.mockResolvedValue({ preciseData: { latestReadings: [] } } as never);
    await loadFloodPointStatus(target, () => false);
    expect(bySensor).not.toHaveBeenCalled();
  });

  it('propaga erro do status do ponto', async () => {
    point.mockRejectedValue(new Error('500'));
    precise.mockResolvedValue({} as never);
    await expect(loadFloodPointStatus(target)).rejects.toThrow('500');
  });
});
