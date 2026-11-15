import { describe, it, expect } from 'vitest';
import { applyPredictionToPoint } from './livePrediction';
import type { FloodPointResponseDTO } from '@/features/map/types';
import type { PredictionSummary } from '../schemas/prediction.schema';

const point = (issuedAt?: string): FloodPointResponseDTO =>
  ({ id: 1, slug: 'p1', name: 'P', latitude: 0, longitude: 0, active: true, floodPrediction: { riskLevel: 'LOW', floodProbability: 0.1, issuedAt } }) as FloodPointResponseDTO;
const pred = (over: Partial<PredictionSummary>): PredictionSummary => ({ slug: 'p1', riskLevel: 'HIGH', probability: 0.8, issuedAt: '2026-10-21T12:00:00Z', modelValidationStatus: 'NOT_VALIDATED', ...over });

describe('applyPredictionToPoint', () => {
  it('previsão mais nova substitui', () => {
    const r = applyPredictionToPoint(point('2026-10-21T11:00:00Z'), pred({}));
    expect(r.floodPrediction?.riskLevel).toBe('HIGH');
    expect(r.floodPrediction?.floodProbability).toBe(0.8);
  });
  it('previsão mais velha é ignorada (mesmo objeto)', () => {
    const p = point('2026-10-21T13:00:00Z');
    expect(applyPredictionToPoint(p, pred({}))).toBe(p);
  });
  it('outro slug não muda nada', () => {
    const p = point();
    expect(applyPredictionToPoint(p, pred({ slug: 'outro' }))).toBe(p);
  });
  it('UNKNOWN zera a probabilidade e guarda o motivo e a última previsão válida', () => {
    const r = applyPredictionToPoint(point(), pred({ riskLevel: 'UNKNOWN', probability: 0.9, degradationReason: 'AI_ERROR', lastValidIssuedAt: '2026-10-21T10:00:00Z' }));
    expect(r.floodPrediction).toMatchObject({ riskLevel: 'UNKNOWN', floodProbability: null, degradationReason: 'AI_ERROR', lastValidIssuedAt: '2026-10-21T10:00:00Z' });
  });
  it('Etapa 8: a previsão do stream traz a etiqueta de sintético e os limiares para o ponto', () => {
    const r = applyPredictionToPoint(point('2026-10-21T11:00:00Z'), pred({
      trainingData: 'SYNTHETIC', syntheticWarning: 'rótulo SINTÉTICO', riskThresholds: { medium: 0.02, high: 0.24, source: 'metadata' },
    }));
    expect(r.floodPrediction).toMatchObject({ trainingData: 'SYNTHETIC', syntheticWarning: 'rótulo SINTÉTICO', riskThresholds: { high: 0.24 } });
  });
  it('sem previsão anterior também aplica', () => {
    const p = { ...point(), floodPrediction: undefined };
    expect(applyPredictionToPoint(p, pred({})).floodPrediction?.riskLevel).toBe('HIGH');
  });
});
