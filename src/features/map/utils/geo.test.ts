import { describe, it, expect } from 'vitest';
import { distanceM, formatDistance, nearestTo } from './geo';

describe('geo', () => {
  it('distância de ~1 km em latitude', () => {
    expect(distanceM({ lat: -8.05, lng: -34.9 }, { lat: -8.059, lng: -34.9 })).toBeGreaterThan(990);
    expect(distanceM({ lat: -8.05, lng: -34.9 }, { lat: -8.059, lng: -34.9 })).toBeLessThan(1010);
  });
  it('mais próximo e formato', () => {
    const items = [{ latitude: -8.1, longitude: -34.9, n: 'longe' }, { latitude: -8.0501, longitude: -34.9, n: 'perto' }];
    expect(nearestTo({ lat: -8.05, lng: -34.9 }, items)?.item.n).toBe('perto');
    expect(nearestTo({ lat: 0, lng: 0 }, [])).toBeNull();
    expect(formatDistance(830)).toBe('830 m');
    expect(formatDistance(1234)).toBe('1,2 km');
  });
});
