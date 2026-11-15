import { describe, expect, it } from 'vitest';
import { buildCells, highMinutes, levelOf } from './strips';
import type { PredictionSummary } from '@/features/points/schemas/prediction.schema';

const TH = { medium: 0.0159, high: 0.2441, source: 'metadata' };
const H = 3_600_000;
const pr = (riskLevel: PredictionSummary['riskLevel'], probability: number | null, t: number, thresholds: typeof TH | null = TH): PredictionSummary =>
  ({ slug: 'a', riskLevel, probability, issuedAt: new Date(t).toISOString(), modelValidationStatus: 'NOT_VALIDATED', riskThresholds: thresholds });

describe('levelOf', () => {
  it('usa >= nos limiares do metadata, não 0,5 nem 0,8', () => {
    expect(levelOf(pr('LOW', 0.2441, 0))).toBe('HIGH');
    expect(levelOf(pr('LOW', 0.0159, 0))).toBe('MEDIUM');
    expect(levelOf(pr('HIGH', 0.01, 0))).toBe('LOW');
  });
  it('UNKNOWN e sem limiares: mantém o que a API mandou, sem % inventado', () => {
    expect(levelOf(pr('UNKNOWN', null, 0))).toBe('UNKNOWN');
    expect(levelOf(pr('MEDIUM', 0.9, 0, null))).toBe('MEDIUM');
  });
});

describe('tempo em alto', () => {
  it('conta a hora cuja probabilidade é exatamente o limiar alto', () => {
    const cells = buildCells([pr('LOW', 0.2441, 0)], 0, 2 * H, 2);
    expect(highMinutes(cells, 2 * H)).toBeGreaterThan(0);
  });
});
