import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { POINT_CARD_FIXTURES as P, pointRain, pointSeries } from '@/mocks/cards';
import { PointCard } from './PointCard';

afterEach(cleanup);
const now = Date.now();
const show = (k: keyof typeof P, opts: { gap?: boolean; rain?: ReturnType<typeof pointRain> } = {}, onOpenAnalysis?: () => void) =>
  render(<MemoryRouter><PointCard point={P[k]} series={pointSeries(opts.gap)} rain={opts.rain ?? pointRain()} now={now} onClose={() => {}} onOpenAnalysis={onOpenAnalysis} /></MemoryRouter>);

describe('PointCard: os 5 estados', () => {
  it('1 alto: selo com porcentagem de 1 casa, por quê com limiar, o que mais pesou e aviso de sintético', () => {
    show('high');
    expect(screen.getByRole('dialog')).toHaveAttribute('data-state', 'HIGH');
    expect(screen.getByText('31,0%')).toBeInTheDocument();
    expect(screen.getByTestId('point-reason')).toHaveTextContent('Por quê: Alto: probabilidade 31,0% ≥ limiar alto 24,4%');
    expect(screen.getByTestId('top-contributor')).toHaveTextContent('Chuva acumulada em 3 horas (12,4 mm)+21 p.p.');
    expect(screen.getByTestId('synthetic-warning')).toBeInTheDocument();
  });
  it('2 moderado: faixa entre os dois limiares', () => {
    show('medium');
    expect(screen.getByTestId('point-reason')).toHaveTextContent('Moderado: 1,6% ≤ probabilidade 12,0% < limiar alto 24,4%');
  });
  it('3 baixo: abaixo do limiar moderado, e o aviso sintético continua', () => {
    show('low');
    expect(screen.getByTestId('point-reason')).toHaveTextContent('Baixo: probabilidade 0,4% < limiar moderado 1,6%');
    expect(screen.getByTestId('synthetic-warning')).toBeInTheDocument();
  });
  it('4 sem dado suficiente: sem porcentagem, trecho tracejado e a estação da chuva', () => {
    show('insufficient', { gap: true });
    expect(screen.getByRole('dialog')).toHaveAttribute('data-state', 'INSUFFICIENT');
    expect(screen.getByTestId('point-reason')).toHaveTextContent('Sem chuva medida suficiente agora: falta chuva medida');
    expect(document.querySelector('[data-risk="UNKNOWN"]')?.textContent).toBe('Previsão indisponível'); // selo sem porcentagem
    expect(screen.getByTestId('point-reason').textContent).not.toMatch(/\d%/);
    expect(screen.getAllByTestId('chart-gap').length).toBeGreaterThan(0);
    expect(screen.queryByTestId('synthetic-warning')).toBeNull();
    expect(screen.queryByTestId('top-contributor')).toBeNull();
  });
  it('5 modelo indisponível: motivo, sem porcentagem e sem usar o último valor como atual', () => {
    show('unavailable');
    expect(screen.getByRole('dialog')).toHaveAttribute('data-state', 'UNAVAILABLE');
    expect(screen.getByTestId('point-reason')).toHaveTextContent('Modelo indisponível: o modelo está fora do ar');
    expect(screen.getByTestId('point-reason')).toHaveTextContent('não é mostrado como atual');
    expect(document.querySelector('[data-risk="UNKNOWN"]')?.textContent).toBe('Previsão indisponível'); // selo sem porcentagem
    expect(screen.getByTestId('point-reason').textContent).not.toMatch(/\d%/);
  });
  it('chuva agora cita a estação usada; sem estação com valor mostra traço', () => {
    show('high');
    expect(screen.getAllByTestId('tile')[0]).toHaveTextContent('3,2 mm/hSintético: Areias · 690 m');
    cleanup();
    show('high', { rain: pointRain({ valueMm: null, usedStationId: null }) });
    expect(screen.getAllByTestId('tile')[0]).toHaveTextContent('—nenhuma estação');
  });
  it('chuva de 3 h ausente: "incompleto" com estação válida e "sem dado" sem ela, em amarelo; nunca 0', () => {
    show('high');
    const t3 = screen.getAllByTestId('tile')[1];
    expect(t3).toHaveTextContent('12,4 mm');
    cleanup();
    const noAgg = { ...P.high, liveData: { historicalAggregates: {} } } as typeof P.high;
    render(<MemoryRouter><PointCard point={noAgg} series={pointSeries()} rain={pointRain()} now={now} /></MemoryRouter>);
    expect(screen.getAllByTestId('tile')[1]).toHaveTextContent('incompleto');
    expect(screen.getAllByTestId('tile')[1].querySelector('.text-warning')).not.toBeNull();
    cleanup();
    render(<MemoryRouter><PointCard point={noAgg} series={pointSeries()} rain={pointRain({ valueMm: null, usedStationId: null })} now={now} /></MemoryRouter>);
    expect(screen.getAllByTestId('tile')[1]).toHaveTextContent('sem dado');
  });
  it('"Análise completa" chama o callback', () => {
    const open = vi.fn();
    show('high', {}, open);
    fireEvent.click(screen.getByRole('button', { name: 'Análise completa' }));
    expect(open).toHaveBeenCalled();
  });
});
