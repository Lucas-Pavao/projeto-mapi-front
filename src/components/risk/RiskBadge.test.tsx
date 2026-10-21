import { describe, it, expect, afterEach } from 'vitest';
import css from '@/styles/theme.css?raw';
import { render, screen, cleanup } from '@testing-library/react';
import { RiskBadge, UNKNOWN_BORDER_MARKER, UNKNOWN_BORDER_PILL } from './RiskBadge';
import { RiskLegendList } from './RiskLegendList';
import { ExperimentalBadge } from './ExperimentalBadge';
import { EXPERIMENTAL_LABEL, RISK_MEANING } from './risk';

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

function lum(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const ratio = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe('RiskBadge UNKNOWN: borda tracejada visível', () => {
  it('pill: tracejado >= 2 px, cor risk-unknown-edge e vão mostrando o fundo (bg-clip-padding)', () => {
    const { container } = render(<RiskBadge level="UNKNOWN" />);
    const el = container.firstElementChild!;
    expect(el).toHaveClass('border-2', 'border-dashed', 'bg-clip-padding', 'border-risk-unknown-edge');
    expect(UNKNOWN_BORDER_PILL).toMatch(/border-2/);
  });
  it('marker: tracejado de 3 px com a mesma cor', () => {
    const { container } = render(<RiskBadge level="UNKNOWN" variant="marker" />);
    const inner = container.querySelector('[data-risk] > span:last-child')!;
    expect(inner).toHaveClass('border-[3px]', 'border-dashed', 'bg-clip-padding', 'border-risk-unknown-edge');
    expect(UNKNOWN_BORDER_MARKER).toMatch(/border-\[3px\]/);
  });
  it('níveis conhecidos mantêm borda contínua', () => {
    const { container } = render(<RiskBadge level="LOW" />);
    expect(container.firstElementChild).not.toHaveClass('border-dashed');
  });
  it.each(['dark', 'light'])('tema %s: risk-unknown-edge tem >= 3:1 contra o fundo e difere do preenchimento', (theme) => {
    const block = theme === 'dark' ? css.slice(0, css.indexOf(':root[data-theme="light"]')) : css.slice(css.indexOf(':root[data-theme="light"]'), css.indexOf('/* Cor de destaque'));
    const tok = (n: string) => block.match(new RegExp(`--${n}: (#[0-9a-fA-F]{6})`))![1];
    expect(ratio(tok('risk-unknown-edge'), tok('background'))).toBeGreaterThanOrEqual(3);
    expect(tok('risk-unknown-edge')).not.toBe(tok('risk-unknown'));
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
