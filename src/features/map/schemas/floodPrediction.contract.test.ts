import { describe, it, expect, vi, afterEach } from 'vitest';
import { floodPredictionSchema, RISK_LEVELS } from './floodPointResponse.schema';
import { validationStatusOf } from '../utils/risk';

afterEach(() => vi.restoreAllMocks());

describe('contrato de predição (ADR 0007)', () => {
  it('aceita o payload ANTIGO (0.0, UNKNOWN, sem campos novos)', () => {
    const r = floodPredictionSchema.parse({ floodProbability: 0.0, riskLevel: 'UNKNOWN', message: 'x' });
    expect(r.riskLevel).toBe('UNKNOWN');
    expect(r.modelVersion).toBeUndefined();
  });

  it('aceita o payload NOVO (null + degradationReason + contributors)', () => {
    const r = floodPredictionSchema.parse({
      riskLevel: 'UNKNOWN',
      floodProbability: null,
      degradationReason: 'AI_TIMEOUT',
      lastValidIssuedAt: '2026-10-10T12:00:00Z',
      contributors: [{ featureId: 'tide_height_t1', label: 'Maré', contribution: 0.18 }],
      imputedFeatures: [{ featureId: 'river_level', label: 'Nível do rio' }],
    });
    expect(r.floodProbability).toBeNull();
    expect(r.degradationReason).toBe('AI_TIMEOUT');
    expect(r.contributors).toHaveLength(1);
  });

  it("converte 'CRITICAL' em 'UNKNOWN' e registra console.warn com o valor recebido", () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const r = floodPredictionSchema.parse({ floodProbability: 0.9, riskLevel: 'CRITICAL' });
    expect(r.riskLevel).toBe('UNKNOWN');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]).toContain('CRITICAL');
  });

  it('não emite warn para valores válidos', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (const riskLevel of RISK_LEVELS) {
      floodPredictionSchema.parse({ floodProbability: 0.5, riskLevel });
    }
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('modelValidationStatus (ADR 0007, emenda 1)', () => {
  it('aceita NOT_VALIDATED e VALIDATED', () => {
    for (const s of ['NOT_VALIDATED', 'VALIDATED']) {
      expect(floodPredictionSchema.parse({ floodProbability: 0.5, riskLevel: 'LOW', modelValidationStatus: s }).modelValidationStatus).toBe(s);
    }
  });
  it('ausente é aceito e tratado como NOT_VALIDATED', () => {
    const r = floodPredictionSchema.parse({ floodProbability: 0.5, riskLevel: 'LOW' });
    expect(validationStatusOf(r)).toBe('NOT_VALIDATED');
  });
  it('valor desconhecido nunca vira VALIDATED', () => {
    const r = floodPredictionSchema.parse({ floodProbability: 0.5, riskLevel: 'LOW', modelValidationStatus: 'OK' });
    expect(r.modelValidationStatus).toBe('NOT_VALIDATED');
  });
});
