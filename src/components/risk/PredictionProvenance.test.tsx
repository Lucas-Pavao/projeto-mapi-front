import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { PredictionProvenance } from './PredictionProvenance';
import { thresholdReason, syntheticWarningOf } from './provenance';
import type { FloodPrediction } from '@/features/map/schemas/floodPointResponse.schema';

afterEach(cleanup);

const base = {
  riskLevel: 'HIGH', floodProbability: 0.31, modelValidationStatus: 'NOT_VALIDATED',
  riskThresholds: { medium: 0.0159, high: 0.2441, source: 'metadata' }, rainSource: 'MEASURED',
  trainingData: 'SYNTHETIC', syntheticWarning: 'Modelo treinado com rótulo SINTÉTICO (experimento controlado).',
  contributors: [
    { featureId: 'rainfall_3h_accumulated', label: 'Chuva acumulada em 3 horas', contribution: 0.21, value: 60, unit: 'mm' },
    { featureId: 'tide_level', label: 'Nível da maré', contribution: 0.05, value: 2.2, unit: 'm (NR DHN)' },
    { featureId: 'current_rainfall', label: 'Chuva atual', contribution: -0.01, value: 0, unit: 'mm' },
    { featureId: 'latitude', label: 'Latitude do ponto', contribution: 0.001, value: -8, unit: 'graus' },
  ],
} as unknown as FloodPrediction;

describe('PredictionProvenance (Etapa 8 do IN1165)', () => {
  it('mostra o aviso de sintético em texto visível, a faixa com o limiar e 3 fatores em unidade física', () => {
    render(<PredictionProvenance prediction={base} />);
    expect(screen.getByTestId('synthetic-warning')).toHaveTextContent('SINTÉTICO');
    expect(screen.getByTestId('threshold-reason')).toHaveTextContent('Alto: probabilidade 31,0% ≥ limiar alto 24,4%');
    const items = screen.getByTestId('top-contributors').querySelectorAll('li');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('Chuva acumulada em 3 horas: 60 mm');
    expect(items[0]).toHaveTextContent('+21 p.p.');
    expect(items[2]).toHaveTextContent('−1 p.p.');
  });

  it('sem os campos novos (previsão antiga) não inventa nada', () => {
    const old = { riskLevel: 'LOW', floodProbability: 0.1, modelValidationStatus: 'NOT_VALIDATED' } as unknown as FloodPrediction;
    const { container } = render(<PredictionProvenance prediction={old} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('UNKNOWN não mostra limiar nem fatores', () => {
    const { container } = render(<PredictionProvenance prediction={{ ...base, riskLevel: 'UNKNOWN', floodProbability: null }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('treino sintético sem texto da API ganha o aviso padrão', () => {
    expect(syntheticWarningOf({ trainingData: 'SYNTHETIC', syntheticWarning: null })).toContain('SINTÉTICO');
    expect(syntheticWarningOf({ trainingData: 'REAL', syntheticWarning: null })).toBeNull();
  });

  it('faixa moderada e baixa citam o limiar certo', () => {
    const t = { medium: 0.1, high: 0.5, source: 'metadata' };
    expect(thresholdReason('MEDIUM', 0.2, t)).toBe('Moderado: 10,0% ≤ probabilidade 20,0% < limiar alto 50,0%');
    expect(thresholdReason('LOW', 0.05, t)).toBe('Baixo: probabilidade 5,0% < limiar moderado 10,0%');
  });
});
