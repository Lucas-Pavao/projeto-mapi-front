import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(cleanup);
import { LiveAccuracy } from './RainForecastView';
import { loadRainCard, rainForecastAccuracySchema } from '../schemas/rainForecast.schema';

describe('previsão de chuva na tela Modelo', () => {
  it('o cartão versionado bate com o contrato e traz os três horizontes', () => {
    const card = loadRainCard();
    expect(card).not.toBeNull();
    expect(card!.target).toBe('MEASURED');
    expect(card!.horizons.map((h) => h.horizonHours)).toEqual([1, 3, 6]);
    expect(card!.attribution).toContain('CEMADEN/MCTIC');
  });

  it('mostra o acerto dos 30 dias, com "sem medida" separado e sem inventar zero', () => {
    const data = rainForecastAccuracySchema.parse({
      days: 30, from: '2026-10-17T00:00:00Z', to: '2026-11-16T00:00:00Z', lastVerifiedAt: '2026-11-16T03:30:00Z', pending: 12,
      horizons: [{ horizonHours: 1, forecasts: 1200, withoutMeasure: 7, pinballMm: 0.1234, coverageQ50: 0.84, coverageQ80: 0.9, coverageQ95: 0.964,
        meanObservedMm: 0.41, forteEvents: 2, forteAlerts: 5, forteHits: 1 },
      { horizonHours: 3, forecasts: 3, withoutMeasure: 3, pinballMm: null, coverageQ50: null, coverageQ80: null, coverageQ95: null,
        meanObservedMm: null, forteEvents: 0, forteAlerts: 0, forteHits: 0 }],
      attribution: 'DADOS DA REDE OBSERVACIONAL DO CEMADEN/MCTIC',
    });
    render(<LiveAccuracy data={data} />);
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('1 h');
    expect(rows[1]).toHaveTextContent('1.200');
    expect(rows[1]).toHaveTextContent('0,123');
    expect(rows[1]).toHaveTextContent('96,4%');
    expect(rows[2]).toHaveTextContent('—');
    expect(rows[2]).not.toHaveTextContent('0,000');
    expect(screen.getByText(/12 previsão\(ões\) aguardando/)).toBeInTheDocument();
  });
});
