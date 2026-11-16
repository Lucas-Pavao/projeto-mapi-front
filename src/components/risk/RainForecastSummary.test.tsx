import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(cleanup);
import { RainForecastSummary } from './RainForecastSummary';
import type { FloodPrediction } from '@/features/map/schemas/floodPointResponse.schema';

const base = {
  riskLevel: 'LOW',
  rainInput: { source: 'MEASURED', values: [{ featureId: 'current_rainfall', valueMm: 0.4 }, { featureId: 'rainfall_3h_accumulated', valueMm: null }] },
  rainForecast: {
    modelVersion: 'rain_v1', sources: ['CEMADEN_PED', 'OPEN_METEO_FORECAST'], usedByModel: false,
    horizons: [{ horizonHours: 1, q50Mm: 0.2, q80Mm: 1.1, q95Mm: 4, probForte: 0.001 }, { horizonHours: 3, q50Mm: 0.6, q80Mm: 3.2, q95Mm: 11.5, probForte: 0.004 }],
  },
} as unknown as FloodPrediction;

describe('RainForecastSummary', () => {
  it('mostra a prevista como faixa, ao lado da medida, com textos distintos', () => {
    render(<RainForecastSummary prediction={base} />);
    expect(screen.getByTestId('rain-measured')).toHaveTextContent('Chuva medida');
    expect(screen.getByTestId('rain-measured')).toHaveTextContent('0,4 mm na última hora · 3 h sem dado');
    const fc = screen.getByTestId('rain-forecast');
    expect(fc).toHaveTextContent('Chuva prevista (estimativa, não medição)');
    expect(fc).toHaveTextContent('1 h: de 0,2 a 4,0 mm');
    expect(fc).toHaveTextContent('3 h: de 0,6 a 11,5 mm');
    expect(fc).toHaveTextContent('modelo rain_v1 · pluviômetros do Cemaden e previsão do Open-Meteo');
    expect(screen.getByTestId('rain-forecast-not-used')).toBeInTheDocument();
    expect(screen.getByText('DADOS DA REDE OBSERVACIONAL DO CEMADEN/MCTIC')).toBeInTheDocument();
  });

  it('aparece mesmo com risco UNKNOWN e diz quando não há chuva medida, sem zero', () => {
    render(<RainForecastSummary prediction={{ ...base, riskLevel: 'UNKNOWN', rainInput: null } as unknown as FloodPrediction} />);
    expect(screen.getByTestId('rain-measured')).toHaveTextContent('sem chuva medida agora');
    expect(screen.getByTestId('rain-measured')).not.toHaveTextContent('0,0');
  });

  it('não desenha nada sem previsão de chuva', () => {
    const { container } = render(<RainForecastSummary prediction={{ ...base, rainForecast: null } as unknown as FloodPrediction} />);
    expect(container).toBeEmptyDOMElement();
  });
});
