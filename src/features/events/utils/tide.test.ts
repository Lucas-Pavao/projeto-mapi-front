import { describe, it, expect } from 'vitest';
import { nearestPoint, tideExtremes } from './tide';

const s = (vs: Array<number | null>) => vs.map((v, i) => ({ t: i * 600_000, v }));

describe('tideExtremes', () => {
  it('acha preamar e baixa-mar', () => {
    const r = tideExtremes(s([1, 2, 3, 2, 1, 0.5, 1, 2]));
    expect(r.map((e) => [e.kind, e.v])).toEqual([['HIGH', 3], ['LOW', 0.5]]);
  });
  it('planície conta uma vez, no primeiro ponto', () => {
    const r = tideExtremes(s([1, 3, 3, 3, 1]));
    expect(r).toHaveLength(1);
    expect(r[0].t).toBe(600_000);
  });
  it('série monótona ou curta não tem extremos', () => {
    expect(tideExtremes(s([1, 2, 3]))).toEqual([]);
    expect(tideExtremes(s([]))).toEqual([]);
  });
  it('ignora nulos', () => {
    expect(tideExtremes(s([1, null, 3, 1])).map((e) => e.kind)).toEqual(['HIGH']);
  });
});

describe('nearestPoint', () => {
  it('acha o mais próximo dentro do limite e devolve null fora dele', () => {
    const pts = s([1, 2, 3]);
    expect(nearestPoint(pts, 650_000)?.v).toBe(2);
    expect(nearestPoint(pts, 10 * 3_600_000)).toBeNull();
    expect(nearestPoint([], 0)).toBeNull();
  });
});
