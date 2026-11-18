import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MapRiskLegend } from './MapRiskLegend';

describe('MapRiskLegend', () => {
  afterEach(cleanup);
  it('mostra os quatro estados e a nota com os limiares da API', () => {
    render(<MapRiskLegend thresholds={{ medium: 0.049, high: 0.928, source: 'orçamento de dias de alerta' }} modelVersion="logreg_v3" horizonHours={6} />);
    expect(screen.getByText('Previsão indisponível')).toBeInTheDocument();
    const note = screen.getByTestId('legend-source');
    expect(note).toHaveTextContent('Risco experimental em 6 h do logreg_v3: moderado a partir de 4,9%, alto a partir de 92,8% (orçamento de dias de alerta).');
  });

  it('sem limiares não inventa a nota', () => {
    render(<MapRiskLegend thresholds={null} />);
    expect(screen.queryByTestId('legend-source')).toBeNull();
  });
});
