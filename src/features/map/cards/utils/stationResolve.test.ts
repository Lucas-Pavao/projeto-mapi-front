import { describe, it, expect } from 'vitest';
import { resolveCanonical, stationAnchors } from './stationResolve';
import type { CanonicalStation } from '@/features/sensors/schemas/station.schema';
import type { StationAccumulation } from '../../schemas/measuredRain.schema';

const canon = (over: Partial<CanonicalStation>): CanonicalStation => ({ canonicalId: 'C1', name: 'Areias', aliases: ['CEMADEN:260790107A', 'CEMADEN_PED:C1'], sources: ['CEMADEN', 'CEMADEN_PED'], quarantine: {}, lat: -8.1, lon: -34.9, ...over }) as CanonicalStation;
const measured = (over: Partial<StationAccumulation>): StationAccumulation => ({ canonicalId: 'C1', name: 'Areias (medida)', lat: -8.2, lon: -35, aliases: [], ...over }) as StationAccumulation;

describe('stationAnchors', () => {
  it('junta canônica e chuva medida sem repetir, com a coordenada que existir', () => {
    const a = stationAnchors([canon({})], [measured({}), measured({ canonicalId: 'C2', name: 'Ibura', lat: -8.3, lon: -35.1 })]);
    expect(a).toHaveLength(2);
    expect(a[0]).toMatchObject({ canonicalId: 'C1', name: 'Areias', lat: -8.1, lon: -34.9 });
    expect(a[1]).toMatchObject({ canonicalId: 'C2', lat: -8.3 });
  });
  it('canônica sem coordenada pega a da chuva medida', () => {
    const a = stationAnchors([canon({ lat: null, lon: null })], [measured({})]);
    expect(a[0]).toMatchObject({ lat: -8.2, lon: -35 });
  });
});

describe('resolveCanonical', () => {
  const anchors = stationAnchors([canon({})], []);
  it('pluviômetro ao vivo alias CEMADEN:<code> resolve a canônica', () => {
    expect(resolveCanonical({ sensorId: 'x', code: '260790107A', source: 'CEMADEN', type: 'PRECIPITATION' }, anchors)?.canonicalId).toBe('C1');
  });
  it('a própria canônica e o sensorId como alias também resolvem', () => {
    expect(resolveCanonical({ sensorId: 'C1', code: null, source: 'CEMADEN', type: 'PRECIPITATION' }, anchors)?.canonicalId).toBe('C1');
    expect(resolveCanonical({ sensorId: '260790107A', code: null, source: 'CEMADEN', type: 'PRECIPITATION' }, anchors)?.canonicalId).toBe('C1');
  });
  it('sensor sem alias e régua de rio não resolvem (ficam no popup atual)', () => {
    expect(resolveCanonical({ sensorId: 'ANA-1', code: 'ANA-1', source: 'ANA', type: 'PRECIPITATION' }, anchors)).toBeUndefined();
    expect(resolveCanonical({ sensorId: '260790107A', code: '260790107A', source: 'APAC', type: 'RIVER_LEVEL' }, anchors)).toBeUndefined();
  });
});
