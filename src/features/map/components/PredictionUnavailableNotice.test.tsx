import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { PredictionUnavailableNotice } from './PredictionUnavailableNotice';

describe('PredictionUnavailableNotice', () => {
  afterEach(cleanup);
  it('mostra texto, motivo e última previsão válida, sem porcentagem', () => {
    const { container } = render(
      <PredictionUnavailableNotice
        prediction={{ riskLevel: 'UNKNOWN', floodProbability: 0.0, degradationReason: 'AI_UNAVAILABLE', lastValidIssuedAt: '2026-10-10T15:30:00Z' }}
      />,
    );
    expect(screen.getByText('Previsão indisponível')).toBeInTheDocument();
    expect(screen.getByText(/fora do ar/)).toBeInTheDocument();
    expect(screen.getByText(/Última previsão válida: 10\/10\/2026 12:30/)).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/%/);
  });

  it('sem motivo → "motivo não informado"; sem lastValidIssuedAt → sem a linha', () => {
    render(<PredictionUnavailableNotice prediction={{ riskLevel: 'UNKNOWN', floodProbability: null }} />);
    expect(screen.getByText(/motivo não informado/)).toBeInTheDocument();
    expect(screen.queryByText(/Última previsão válida/)).toBeNull();
  });
});
