import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import { RiskLegend } from './RiskLegend';

afterEach(cleanup);

describe('RiskLegend', () => {
  it('lista os 4 estados com rótulo em português e significado operacional', () => {
    render(<RiskLegend />);
    const items = screen.getAllByRole('listitem');
    expect(items.map((i) => i.getAttribute('data-risk'))).toEqual(['LOW', 'MEDIUM', 'HIGH', 'UNKNOWN']);
    for (const label of ['Baixo', 'Moderado', 'Alto', 'Previsão indisponível']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(within(items[3]).getByText(/não significa risco baixo/)).toBeInTheDocument();
    expect(within(items[2]).getByText(/não confirma alagamento/)).toBeInTheDocument();
  });
  it('não promete o que o modelo não faz (sem "garante", "certeza", "evacuar")', () => {
    const { container } = render(<RiskLegend />);
    expect(container.textContent).not.toMatch(/garant|certeza|evacu/i);
  });
  it('é um cartão sempre visível, com a nota experimental opcional', () => {
    const { rerender } = render(<RiskLegend />);
    expect(screen.getByRole('region', { name: 'Legenda de risco' })).toBeInTheDocument();
    expect(screen.getByText(/Classes experimentais/)).toBeInTheDocument();
    rerender(<RiskLegend showExperimentalNote={false} />);
    expect(screen.queryByText(/Classes experimentais/)).toBeNull();
  });
});
