import { describe, it, expect } from 'vitest';
import { normalizeFloodPrediction, normalizePreciseData } from './flood.service';
import type { PreciseData } from '../types';

// Regressão do bug real: o backend serializa FloodPredictionResponseDTO com
// @JsonProperty em snake_case (flood_probability, risk_level, estimated_time_to_event)
// enquanto o contrato TS declara camelCase. Sem a normalização, esses campos ficam
// `undefined` e toda a visualização de risco no mapa quebra silenciosamente.
describe('normalizeFloodPrediction', () => {
  it('preenche os campos camelCase a partir do payload snake_case do backend', () => {
    const rawFromBackend = {
      flood_probability: 0.82,
      risk_level: 'HIGH',
      estimated_time_to_event: '2026-08-19T12:00:00',
      message: 'Risco alto',
    } as unknown as Parameters<typeof normalizeFloodPrediction>[0];

    const result = normalizeFloodPrediction(rawFromBackend);

    expect(result?.floodProbability).toBe(0.82);
    expect(result?.riskLevel).toBe('HIGH');
    expect(result?.estimatedTimeToEvent).toBe('2026-08-19T12:00:00');
  });

  it('não quebra quando a predição é null/undefined', () => {
    expect(normalizeFloodPrediction(null)).toBeNull();
    expect(normalizeFloodPrediction(undefined)).toBeUndefined();
  });

  it('preserva valores já camelCase se o backend mudar de formato', () => {
    const alreadyCamelCase = {
      floodProbability: 0.5,
      riskLevel: 'MEDIUM',
      estimatedTimeToEvent: '2026-08-19T18:00:00',
      message: 'Risco moderado',
    };

    const result = normalizeFloodPrediction(alreadyCamelCase);
    expect(result?.floodProbability).toBe(0.5);
    expect(result?.riskLevel).toBe('MEDIUM');
  });
});

describe('normalizePreciseData', () => {
  it('preenche sensorId/distanceKm a partir dos aliases snake_case do backend', () => {
    const raw: unknown = {
      source: 'SENSOR',
      timestamp: '2026-08-19T12:00:00',
      precipitation: 1.2,
      temperature: 28,
      humidity: null,
      pressure: null,
      windSpeed: null,
      waterLevel: null,
      flowRate: null,
      tideHeight: null,
      waveHeight: null,
      waveDirection: null,
      wavePeriod: null,
      tideHeightTabuaMare: null,
      solarRadiation: null,
      unitPrecipitation: 'mm',
      unitTemperature: '°C',
      unitWaterLevel: null,
      unitTide: null,
      unitWave: null,
      unitWindSpeed: null,
      unitPressure: null,
      unitSolarRadiation: null,
      unitFlowRate: null,
      message: null,
      latestReadings: [
        { sensor_id: 'ANA-123', distance_km: 1.5, latitude: -8.05, longitude: -34.9, value: 10, unit: 'mm', type: 'PRECIPITATION', timestamp: '2026-08-19T12:00:00' },
      ],
    };

    const result = normalizePreciseData(raw as PreciseData);

    expect(result?.latestReadings?.[0].sensorId).toBe('ANA-123');
    expect(result?.latestReadings?.[0].distanceKm).toBe(1.5);
  });

  it('não quebra quando não há leituras de sensores', () => {
    const raw = { source: 'OPEN_METEO', timestamp: '2026-08-19T12:00:00' } as PreciseData;
    expect(normalizePreciseData(raw)).toEqual(raw);
  });
});
