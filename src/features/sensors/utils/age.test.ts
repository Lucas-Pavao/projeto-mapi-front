import { describe, it, expect } from 'vitest';
import { formatAge } from './age';

describe('formatAge', () => {
  it.each([
    [0, 'agora'], [59, 'agora'], [60, 'há 1 min'], [3599, 'há 59 min'], [3600, 'há 1 h'], [47 * 3600, 'há 47 h'], [48 * 3600, 'há 2 dias'],
  ])('%s s -> %s', (s, out) => expect(formatAge(s)).toBe(out));
  it('inválido vira agora', () => {
    expect(formatAge(null)).toBe('agora');
    expect(formatAge(NaN)).toBe('agora');
  });
});
