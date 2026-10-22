import { describe, it, expect } from 'vitest';
import type { SensorFreshness } from '@/features/sensors/schemas/sensor.schema';
import { pickRiver } from './river';

const pts = (n: number) => Array.from({ length: n }, (_, i) => ({ t: `2026-10-21T0${i}:00:00Z`, v: 100 + i }));

describe('pickRiver', () => {
  it('prefere o rio com cotas oficiais e, depois, a série mais longa (não a primeira em ordem alfabética)', () => {
    const series = [
      { stationId: 'ANA-TELE-ACUDE-DUAS-UNAS', points: pts(1) },
      { stationId: 'ANA-TELE-PAUDALHO', points: pts(5) },
      { stationId: 'APAC-RIO-260790119H', points: pts(3) },
    ];
    expect(pickRiver(series, [])?.stationId).toBe('ANA-TELE-PAUDALHO');
    const apac = { sensorId: 'APAC-RIO-260790119H', riverFloodLevel: 330 } as unknown as SensorFreshness;
    expect(pickRiver(series, [apac])?.stationId).toBe('APAC-RIO-260790119H');
    expect(pickRiver([], [])).toBeUndefined();
  });
});
