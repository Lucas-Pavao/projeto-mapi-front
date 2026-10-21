import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import { RiskSummaryBar } from './RiskSummaryBar';
import { newestRiskSummary } from '@/features/points/hooks/useRiskSummary';

afterEach(cleanup);

const summary = { LOW: 5, MEDIUM: 2, HIGH: 1, UNKNOWN: 3, computedAt: '2026-10-21T18:00:00Z' };

describe('RiskSummaryBar', () => {
  it('mostra os quatro níveis com rótulo e número; UNKNOWN fica à parte do baixo', () => {
    render(<RiskSummaryBar summary={summary} liveStatus="open" />);
    const region = screen.getByRole('region', { name: 'Pontos por nível de risco' });
    for (const [level, label, n] of [['LOW', 'Baixo', '5'], ['MEDIUM', 'Moderado', '2'], ['HIGH', 'Alto', '1'], ['UNKNOWN', 'Previsão indisponível', '3']]) {
      const item = region.querySelector(`[data-risk-count="${level}"]`)!;
      expect(within(item as HTMLElement).getByText(label)).toBeInTheDocument();
      expect(within(item as HTMLElement).getByText(n)).toBeInTheDocument();
      expect(item.querySelector('svg')).not.toBeNull(); // ícone junto do rótulo
    }
    expect(screen.getByText(/Ao vivo/)).toBeInTheDocument();
    expect(screen.getByText(/às 15:00/)).toBeInTheDocument(); // America/Recife
  });

  it('sem dado: carregando ou indisponível', () => {
    const { rerender } = render(<RiskSummaryBar summary={undefined} />);
    expect(screen.getByText('Contando pontos…')).toBeInTheDocument();
    rerender(<RiskSummaryBar summary={undefined} failed />);
    expect(screen.getByText('Contagem de risco indisponível')).toBeInTheDocument();
  });

  it('stream fora do ar é dito, não escondido', () => {
    render(<RiskSummaryBar summary={summary} liveStatus="error" />);
    expect(screen.getByText(/Sem atualização ao vivo/)).toBeInTheDocument();
  });
});

describe('newestRiskSummary', () => {
  it('mantém o mais novo', () => {
    const newer = { ...summary, LOW: 9, computedAt: '2026-10-21T19:00:00Z' };
    expect(newestRiskSummary(newer, summary)).toBe(newer);
    expect(newestRiskSummary(summary, newer)).toEqual(newer);
    expect(newestRiskSummary(undefined, summary)).toEqual(summary);
  });
});
