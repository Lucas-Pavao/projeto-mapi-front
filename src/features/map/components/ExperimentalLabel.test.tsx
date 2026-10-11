import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { FloodPointPopup } from './FloodPointPopup';
import { RiskLegend } from './RiskLegend';
import { EXPERIMENTAL_LABEL, showsExperimentalLabel } from '../utils/risk';
import type { FloodPointResponseDTO } from '../types';

afterEach(cleanup);

const point = { id: 1, slug: 'p', name: 'Ponto', latitude: 0, longitude: 0, active: true } as unknown as FloodPointResponseDTO;
const status = (floodPrediction: Record<string, unknown>) =>
  ({ floodPrediction, preciseData: null, latestReadings: [] }) as never;

describe('rótulo experimental', () => {
  it('popup mostra o rótulo com classe e ausência do campo (NOT_VALIDATED)', () => {
    render(<FloodPointPopup point={point} status={status({ riskLevel: 'HIGH', floodProbability: 0.8 })} onShowDetails={() => {}} />);
    expect(screen.getByText(EXPERIMENTAL_LABEL)).toBeInTheDocument();
    expect(screen.getByText('Alto')).toBeInTheDocument();
  });
  it('popup com VALIDATED não mostra o rótulo', () => {
    render(<FloodPointPopup point={point} status={status({ riskLevel: 'HIGH', floodProbability: 0.8, modelValidationStatus: 'VALIDATED' })} onShowDetails={() => {}} />);
    expect(screen.queryByText(EXPERIMENTAL_LABEL)).toBeNull();
  });
  it('UNKNOWN mantém estado próprio, sem rótulo experimental', () => {
    render(<FloodPointPopup point={point} status={status({ riskLevel: 'UNKNOWN', floodProbability: null })} onShowDetails={() => {}} />);
    expect(screen.queryByText(EXPERIMENTAL_LABEL)).toBeNull();
    expect(screen.getAllByText('Previsão indisponível').length).toBeGreaterThan(0);
    expect(showsExperimentalLabel({ riskLevel: 'UNKNOWN' })).toBe(false);
  });
  it('legenda explica em uma frase', () => {
    render(<RiskLegend />);
    expect(screen.getByText(/Classes experimentais: modelo não validado\./)).toBeInTheDocument();
  });
});
