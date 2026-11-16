import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PredictionProvenance } from './PredictionProvenance';
import { absentInputs, horizonPhrase, insufficientText, rainInputText, riskHeadline } from './provenance';
import type { FloodPrediction } from '@/features/map/schemas/floodPointResponse.schema';

const v3: FloodPrediction = {
  riskLevel: 'LOW', floodProbability: 0.00087, modelValidationStatus: 'NOT_VALIDATED', modelVersion: 'logreg_v3', horizonHours: 6,
  riskThresholds: { medium: 0.004, high: 0.03, source: 'metadata' }, trainingData: 'SYNTHETIC', rainSource: 'MEASURED',
  imputedFeatures: [{ featureId: 'rain_12_24h', label: 'Chuva de 12 a 24 horas atrás' }, { featureId: 'river_level', label: 'Nível do rio' }],
  rainInput: { source: 'MEASURED', ageMinutes: 16 }, probabilityKind: 'PRIOR_CORRECTED', floodProbabilityUncorrected: 0.048,
  contributors: [],
};

describe('procedência da previsão v3', () => {
  it('diz o horizonte no texto do risco', () => {
    expect(horizonPhrase(v3)).toBe('nas próximas 6 h');
    expect(riskHeadline(v3)).toBe('Risco de alagamento nas próximas 6 h');
    expect(riskHeadline({ horizonHours: null })).toBe('Risco de alagamento agora');
  });

  it('mostra as entradas ausentes que o modelo usa, com o aviso visível; o rio (fora do modelo) não', () => {
    expect(absentInputs(v3).map((a) => a.featureId)).toEqual(['rain_12_24h']);
    render(<PredictionProvenance prediction={v3} />);
    expect(screen.getByTestId('risk-headline')).toHaveTextContent('nas próximas 6 h');
    expect(screen.getByTestId('absent-inputs')).toHaveTextContent('Chuva de 12 a 24 horas atrás');
    expect(screen.getByTestId('absent-inputs')).not.toHaveTextContent('Nível do rio');
    expect(screen.getByTestId('rain-input')).toHaveTextContent('Chuva medida');
    expect(screen.getByTestId('rain-input')).toHaveTextContent('há 16 min');
  });

  it('UNKNOWN por falta de dado diz o que faltou', () => {
    expect(insufficientText({ imputedFeatures: [{ featureId: 'current_rainfall', label: '' }] })).toBe('sem chuva medida suficiente agora');
    expect(insufficientText({ imputedFeatures: [{ featureId: 'tide_level', label: '' }] })).toBe('sem maré prevista agora');
  });

  it('chuva estimada pelo recurso reserva é declarada como estimada', () => {
    expect(rainInputText({ rainSource: 'REANALYSIS_FALLBACK', rainInput: { source: 'REANALYSIS_FALLBACK' } })).toContain('ESTIMADA');
  });
});
