import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { RiskLegend } from './RiskLegend';

afterEach(cleanup);

describe('RiskLegend', () => {
  const abrir = () => fireEvent.click(screen.getByRole('button', { name: 'Legenda de risco' }));
  it('lista os 4 estados com rótulo em português e significado operacional', () => {
    render(<RiskLegend />);
    abrir();
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
    abrir();
    expect(container.textContent).not.toMatch(/garant|certeza|evacu/i);
  });
  it('é um botão da barra: começa fechado, abre e fecha o painel (aria-expanded)', () => {
    render(<RiskLegend />);
    const toggle = screen.getByRole('button', { name: 'Legenda de risco' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(document.getElementById('risk-legend-body')).toBeNull();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById('risk-legend-body')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Fechar legenda de risco/ }));
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(document.getElementById('risk-legend-body')).toBeNull();
  });
});
