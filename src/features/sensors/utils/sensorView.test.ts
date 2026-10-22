import { describe, it, expect } from 'vitest';
import type { Timeline } from '@/features/events/schemas/timeline.schema';
import type { SensorFreshness } from '../schemas/sensor.schema';
import { buildItems } from './sensorView';

const NOW = Date.parse('2026-10-22T02:00:00Z');
const iso = (h: number) => new Date(NOW - h * 3_600_000).toISOString();
const sensor = (o: Partial<SensorFreshness>): SensorFreshness =>
  ({ sensorId: 'X', type: 'PRECIPITATION', observedAt: iso(0), ageSeconds: 60, stale: false, ...o }) as SensorFreshness;
const tl = {
  from: iso(18), to: iso(-6), stepMinutes: 60,
  rain: [{ stationId: '260345401A', points: [{ t: iso(2), v: 1.5 }, { t: iso(1), v: 0.5 }] }],
  river: [], risk: [],
  tide: { harbor: 'pe02', points: [{ t: iso(1), v: 1.2 }, { t: iso(0), v: 1.4 }] },
} as unknown as Timeline;

describe('buildItems', () => {
  it('acha a série de chuva pelo código da estação quando o sensorId é outro', () => {
    const items = buildItems([sensor({ sensorId: 'APAC-PLUVIO-260345401A', code: '260345401A' })], tl, NOW);
    expect(items.find((i) => i.key === 'APAC-PLUVIO-260345401A')?.value).toBe('2,0 mm');
  });

  it('ordena rio, maré e chuva, com os sensores sem resposta no fim', () => {
    const items = buildItems([
      sensor({ sensorId: 'RIO-PARADO', type: 'RIVER_LEVEL', stale: true }),
      sensor({ sensorId: 'CHUVA-1' }),
      sensor({ sensorId: 'RIO-1', type: 'RIVER_LEVEL', value: 1.9, unit: 'm' }),
    ], tl, NOW);
    expect(items.map((i) => i.key)).toEqual(['RIO-1', 'mare', 'CHUVA-1', 'RIO-PARADO']);
  });
});
