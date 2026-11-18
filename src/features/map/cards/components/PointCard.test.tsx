import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { POINT_CARD_FIXTURES as P, pointRain, pointSeries } from '@/mocks/cards';
import { PointCard } from './PointCard';
import type { AlertaPonto } from '@/features/alerta/schemas/alerta.schema';

afterEach(cleanup);
const now = Date.now();
/** Os testes dos 5 estados olham a aba Experimental (o risco do logreg_v3); a aba Alerta é a padrão. */
const show = (k: keyof typeof P, opts: { gap?: boolean; rain?: ReturnType<typeof pointRain>; alerta?: boolean } = {}, onOpenAnalysis?: () => void) => {
  const r = render(<MemoryRouter><PointCard point={P[k]} series={pointSeries(opts.gap)} rain={opts.rain ?? pointRain()} now={now} onClose={() => {}} onOpenAnalysis={onOpenAnalysis} /></MemoryRouter>);
  if (!opts.alerta) fireEvent.click(screen.getByRole('tab', { name: 'Experimental' }));
  return r;
};

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

const al = (over: Partial<AlertaPonto> = {}): AlertaPonto => ({ slug: P.high.slug, rainAlert: 'NENHUM', pointFlood: 'NAO', shadow: true, rainTeMm: 0, hNowCm: 1, probForte1h: 0.1, probOn: 0.2, ...over });
const card = (point: typeof P.high, extra: Partial<React.ComponentProps<typeof PointCard>> = {}) =>
  render(<MemoryRouter><PointCard point={point} series={pointSeries()} rain={pointRain()} now={now} {...extra} /></MemoryRouter>);

describe('PointCard: alerta por ponto', () => {
  it('ADMIN: abre na aba Alerta com o chip, o painel e a borda pela cor do alerta', () => {
    card(P.high, { isAdmin: true, alerta: al({ rainAlert: 'ATENCAO' }) });
    expect(screen.getByRole('tab', { name: 'Alerta' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('alerta-chip')).toHaveTextContent('Atenção · chuva forte provável');
    expect(screen.getByTestId('alerta-panel')).toBeInTheDocument();
    expect(screen.getByRole('dialog').className).toContain('border-t-warning');
    expect(screen.queryByTestId('rotulo-sintetico')).toBeNull();
  });
  it('ADMIN com erro ou carregando: "Alerta sem dado" tracejado, nunca "sem alerta"', () => {
    card(P.high, { isAdmin: true, alertaError: true });
    expect(screen.getByTestId('alerta-chip')).toHaveTextContent('Alerta sem dado');
    expect(screen.getByRole('dialog').className).toContain('[border-top-style:dashed]');
    cleanup();
    card(P.high, { isAdmin: true, alertaLoading: true });
    expect(screen.getByTestId('alerta-chip')).toHaveTextContent('Alerta sem dado');
  });
  it('visitante: chip "Alerta em teste", a nota do painel Agora na RMR e os 3 blocos; sem o alerta', () => {
    card(P.high, { isAdmin: false, alerta: al({ rainAlert: 'ALERTA' }) });
    expect(screen.getByTestId('alerta-chip')).toHaveTextContent('Alerta em teste');
    expect(screen.getByTestId('alerta-oculto')).toHaveTextContent('O alerta de chuva por ponto está em teste e ainda não é oficial. Enquanto isso, veja a chuva medida e o aviso oficial do INMET no painel "Agora na RMR".');
    expect(screen.getAllByTestId('tile')).toHaveLength(3);
    expect(screen.queryByTestId('alerta-panel')).toBeNull();
  });
  it('maré de reserva: o bloco da maré diz "reserva harmônica" quando a API serve a harmônica', () => {
    card({ ...P.high, tideSource: 'HARMONIC' }, { isAdmin: false });
    expect(screen.getAllByTestId('tile')[2]).toHaveTextContent('maré · reserva harmônica');
  });
  it('Experimental: aviso sintético e o conteúdo atual do card, com a borda pelo risco', () => {
    card(P.high, { isAdmin: true, alerta: al() });
    fireEvent.click(screen.getByRole('tab', { name: 'Experimental' }));
    expect(screen.getByTestId('rotulo-sintetico')).toHaveTextContent('SINTÉTICO');
    expect(screen.getByTestId('point-reason')).toBeInTheDocument();
    expect(screen.getByRole('dialog').className).toContain('border-t-risk-high');
  });
  it('UNKNOWN na aba Experimental: sem porcentagem e sem aviso sintético', () => {
    card(P.unavailable, { isAdmin: true, alerta: al() });
    fireEvent.click(screen.getByRole('tab', { name: 'Experimental' }));
    expect(screen.getByRole('dialog')).toHaveAttribute('data-state', 'UNAVAILABLE');
    expect(screen.getByTestId('point-reason').textContent).not.toMatch(/\d%/);
    expect(screen.queryByTestId('synthetic-warning')).toBeNull();
  });
});
