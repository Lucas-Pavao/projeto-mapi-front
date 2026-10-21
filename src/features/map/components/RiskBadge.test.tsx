import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { RiskBadge } from './RiskBadge';
import { RiskLegendList } from './RiskLegendList';
import { ExperimentalBadge } from './ExperimentalBadge';
import { EXPERIMENTAL_LABEL, RISK_MEANING } from '../utils/risk';

afterEach(cleanup);

describe('RiskBadge', () => {
  it('pill mostra ícone (svg), rótulo e porcentagem em mono', () => {
    const { container } = render(<RiskBadge level="HIGH" probability={0.47} />);
    expect(screen.getByText('Alto')).toBeInTheDocument();
    expect(container.querySelector('svg')).not.toBeNull();
    expect(screen.getByText('47%')).toHaveClass('font-mono');
  });
  it('UNKNOWN: tracejado, sem porcentagem mesmo com probabilidade', () => {
    const { container } = render(<RiskBadge level="UNKNOWN" probability={0.9} />);
    expect(screen.getByText('Previsão indisponível')).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/%/);
    expect(container.firstElementChild).toHaveClass('border-dashed');
  });
  it('level ausente é tratado como UNKNOWN, nunca como baixo', () => {
    render(<RiskBadge level={null} />);
    expect(screen.queryByText('Baixo')).toBeNull();
    expect(screen.getByText('Previsão indisponível')).toBeInTheDocument();
  });
  it('marker tem nome acessível e pulso opcional', () => {
    const { container } = render(<RiskBadge level="MEDIUM" variant="marker" pulse />);
    expect(screen.getByRole('img', { name: 'Risco Moderado' })).toBeInTheDocument();
    expect(container.querySelector('.animate-ping')).not.toBeNull();
  });
});

describe('RiskLegendList e ExperimentalBadge', () => {
  it('usa RISK_MEANING sem reescrever e mantém a ordem', () => {
    render(<RiskLegendList />);
    const items = screen.getAllByRole('listitem');
    expect(items.map((i) => i.getAttribute('data-risk'))).toEqual(['LOW', 'MEDIUM', 'HIGH', 'UNKNOWN']);
    expect(items[2]).toHaveTextContent(RISK_MEANING.HIGH);
  });
  it('showExperimentalNote=false omite a nota', () => {
    render(<RiskLegendList showExperimentalNote={false} />);
    expect(screen.queryByText(/Classes experimentais/)).toBeNull();
  });
  it('ExperimentalBadge exibe o texto fixo', () => {
    render(<ExperimentalBadge />);
    expect(screen.getByText(EXPERIMENTAL_LABEL)).toBeInTheDocument();
  });
});
