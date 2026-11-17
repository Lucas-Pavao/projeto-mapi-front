import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { renderPage } from '@/test/render';
import { FloodPointPopup } from '@/features/map/components/FloodPointPopup';
import { RiskLegend } from './RiskLegend';
import { EXPERIMENTAL_LABEL, showsExperimentalLabel } from './risk';
import type { FloodPointResponseDTO } from '@/features/map/types';

afterEach(cleanup);
// Alerta por ponto em modo sombra (ADR 0026 da API): para USER o popup não consulta a rota do alerta.
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { username: 'sintetico', role: 'USER' } }) }));

/** O risco do logreg_v3 fica na aba Experimental do cartão do ponto. */
const abrirExperimental = () => fireEvent.click(screen.getByRole('tab', { name: 'Experimental' }));

const point = { id: 1, slug: 'p', name: 'Ponto', latitude: 0, longitude: 0, active: true } as unknown as FloodPointResponseDTO;
const status = (floodPrediction: Record<string, unknown>) =>
  ({ floodPrediction, preciseData: null, latestReadings: [] }) as never;

describe('rótulo experimental', () => {
  it('popup mostra o rótulo com classe e ausência do campo (NOT_VALIDATED)', () => {
    renderPage(<FloodPointPopup point={point} status={status({ riskLevel: 'HIGH', floodProbability: 0.8 })} onClose={() => {}} />);
    abrirExperimental();
    expect(screen.getByText(EXPERIMENTAL_LABEL)).toBeInTheDocument();
    expect(screen.getByText('Alto')).toBeInTheDocument();
  });
  it('popup com VALIDATED não mostra o rótulo', () => {
    renderPage(<FloodPointPopup point={point} status={status({ riskLevel: 'HIGH', floodProbability: 0.8, modelValidationStatus: 'VALIDATED' })} onClose={() => {}} />);
    abrirExperimental();
    expect(screen.queryByText(EXPERIMENTAL_LABEL)).toBeNull();
  });
  it('UNKNOWN mantém estado próprio, sem rótulo experimental', () => {
    renderPage(<FloodPointPopup point={point} status={status({ riskLevel: 'UNKNOWN', floodProbability: null })} onClose={() => {}} />);
    abrirExperimental();
    expect(screen.queryByText(EXPERIMENTAL_LABEL)).toBeNull();
    expect(screen.getAllByText('Previsão indisponível').length).toBeGreaterThan(0);
    expect(showsExperimentalLabel({ riskLevel: 'UNKNOWN' })).toBe(false);
  });
  it('legenda explica em uma frase', () => {
    render(<RiskLegend />);
    expect(screen.getByText(/Classes experimentais: modelo não validado\./)).toBeInTheDocument();
  });
});
