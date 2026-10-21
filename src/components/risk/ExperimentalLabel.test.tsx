import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FloodPointPopup } from '@/features/map/components/FloodPointPopup';
import { RiskLegend } from './RiskLegend';
import { EXPERIMENTAL_LABEL, showsExperimentalLabel } from './risk';
import type { FloodPointResponseDTO } from '@/features/map/types';

afterEach(cleanup);

const point = { id: 1, slug: 'p', name: 'Ponto', latitude: 0, longitude: 0, active: true } as unknown as FloodPointResponseDTO;
const status = (floodPrediction: Record<string, unknown>) =>
  ({ floodPrediction, preciseData: null, latestReadings: [] }) as never;

describe('rótulo experimental', () => {
  it('popup mostra o rótulo com classe e ausência do campo (NOT_VALIDATED)', () => {
    render(<MemoryRouter><FloodPointPopup point={point} status={status({ riskLevel: 'HIGH', floodProbability: 0.8 })} onClose={() => {}} /></MemoryRouter>);
    expect(screen.getByText(EXPERIMENTAL_LABEL)).toBeInTheDocument();
    expect(screen.getByText('Alto')).toBeInTheDocument();
  });
  it('popup com VALIDATED não mostra o rótulo', () => {
    render(<MemoryRouter><FloodPointPopup point={point} status={status({ riskLevel: 'HIGH', floodProbability: 0.8, modelValidationStatus: 'VALIDATED' })} onClose={() => {}} /></MemoryRouter>);
    expect(screen.queryByText(EXPERIMENTAL_LABEL)).toBeNull();
  });
  it('UNKNOWN mantém estado próprio, sem rótulo experimental', () => {
    render(<MemoryRouter><FloodPointPopup point={point} status={status({ riskLevel: 'UNKNOWN', floodProbability: null })} onClose={() => {}} /></MemoryRouter>);
    expect(screen.queryByText(EXPERIMENTAL_LABEL)).toBeNull();
    expect(screen.getAllByText('Previsão indisponível').length).toBeGreaterThan(0);
    expect(showsExperimentalLabel({ riskLevel: 'UNKNOWN' })).toBe(false);
  });
  it('legenda explica em uma frase', () => {
    render(<RiskLegend />);
    expect(screen.getByText(/Classes experimentais: modelo não validado\./)).toBeInTheDocument();
  });
});
