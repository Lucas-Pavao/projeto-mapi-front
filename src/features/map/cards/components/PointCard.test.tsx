import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { POINT_CARD_FIXTURES as P, pointRain } from '@/mocks/cards';
import { ALAGAMENTO_FIXTURES, type AlagamentoFixtureId } from '@/mocks/alagamento';
import { alagamentoPontoSchema } from '@/features/alagamento/schemas/alagamento.schema';
import { PointCard, VISITOR_INFO } from './PointCard';

afterEach(cleanup);

const fx = (id: AlagamentoFixtureId) => alagamentoPontoSchema.parse(ALAGAMENTO_FIXTURES[id]);
const card = (extra: Partial<React.ComponentProps<typeof PointCard>> = {}) =>
  render(<MemoryRouter><PointCard point={P.high} rain={pointRain()} {...extra} /></MemoryRouter>);

const noRiskWords = () => expect(document.body.textContent).not.toMatch(/risco baixo|seguro|logreg_v3|xgb_v2|%/i);

describe('PointCard (ADMIN): alerta por regressão, 10 estados da prancha Nível 6', () => {
  it.each(Object.keys(ALAGAMENTO_FIXTURES) as AlagamentoFixtureId[])('%s', (id) => {
    const a = fx(id);
    card({ isAdmin: true, alagamento: a });
    expect(screen.getByTestId('regressao-card')).toHaveAttribute('data-level', a.level);
    expect(screen.getByTestId('flood-chip')).toHaveAttribute('data-level', a.level);
    expect(screen.getByTestId('selo-experimental')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: P.high.name })).toBeInTheDocument();
    if (a.level === 'SEM_DADO') expect(screen.getByTestId('flood-chip').textContent).not.toMatch(/Sem alerta/);
    expect(screen.queryByRole('tab')).toBeNull();
    noRiskWords();
  });

  it('carregando, falha de leitura e ponto ainda sem cálculo: estado próprio, nunca "Sem alerta"', () => {
    for (const [props, state, text] of [
      [{ alagamentoLoading: true }, 'loading', 'Lendo o alerta de alagamento…'],
      [{ alagamentoError: true }, 'error', 'Não foi possível ler o alerta de alagamento agora.'],
      [{}, 'absent', 'Alerta de alagamento ainda não calculado para este ponto.'],
    ] as const) {
      card({ isAdmin: true, ...props });
      expect(screen.getByRole('dialog')).toHaveAttribute('data-state', state);
      expect(screen.getByTestId('alagamento-estado')).toHaveTextContent(text);
      expect(document.body.textContent).not.toMatch(/Sem alerta/);
      noRiskWords();
      cleanup();
    }
  });

  it('"Análise completa" chama o callback e o atalho leva à página do ponto', () => {
    const open = vi.fn();
    card({ isAdmin: true, alagamento: fx('alerta_1h'), onOpenAnalysis: open });
    fireEvent.click(screen.getByRole('button', { name: 'Análise completa' }));
    expect(open).toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Abrir a página do ponto' })).toHaveAttribute('href', `/pontos/${P.high.slug}`);
  });
});

describe('PointCard (visitante)', () => {
  it('chip "Alerta experimental" com ⓘ e 3 números: chuva agora, chuva 3 h, maré; sem o nível nem a lâmina', () => {
    card({ alagamento: fx('alerta_1h') });
    const chip = screen.getByTestId('flood-chip');
    expect(chip).toHaveTextContent('Alerta experimental');
    expect(within(chip).getByTestId('info-tip')).toHaveAttribute('aria-label', VISITOR_INFO);
    expect(screen.getAllByTestId('tile').map((t) => t.firstElementChild?.textContent)).toEqual(['Chuva agora', 'Chuva 3 h', 'Maré']);
    expect(screen.queryByTestId('regressao-card')).toBeNull();
    expect(document.body.textContent).not.toMatch(/Alerta em|lâmina/i);
    noRiskWords();
  });

  it('chuva de 3 h ausente: "incompleto" com estação válida e "sem dado" sem ela, em amarelo; nunca 0', () => {
    card();
    expect(screen.getAllByTestId('tile')[1]).toHaveTextContent('12,4 mm');
    cleanup();
    const noAgg = { ...P.high, liveData: { historicalAggregates: {} } } as typeof P.high;
    render(<MemoryRouter><PointCard point={noAgg} rain={pointRain()} /></MemoryRouter>);
    expect(screen.getAllByTestId('tile')[1]).toHaveTextContent('incompleto');
    expect(screen.getAllByTestId('tile')[1].querySelector('.text-warning')).not.toBeNull();
    cleanup();
    render(<MemoryRouter><PointCard point={noAgg} rain={pointRain({ valueMm: null, usedStationId: null })} /></MemoryRouter>);
    expect(screen.getAllByTestId('tile')[0]).toHaveTextContent('sem dado');
    expect(screen.getAllByTestId('tile')[1]).toHaveTextContent('sem dado');
  });

  it('com a chuva medida (onda 16, 7.3): 3 h medida, 6 e 24 h no rodapé; janela com lacuna fica "—", nunca 0', () => {
    const measured = { slug: 'x', hourEndUtc: '2026-11-23T03:00:00Z', rain1hMm: 2, rain3hMm: 6, rain6hMm: 7.5, rain24hMm: null,
      n3h: 3, n6h: 6, n24h: 23, source: 'CEMADEN_PED', stationId: 'A', stationDistanceM: 3483, ruleVersion: 'chuva-ponto-v4',
      rule: 'r', attribution: 'DADOS DA REDE OBSERVACIONAL DO CEMADEN/MCTIC' };
    render(<MemoryRouter><PointCard point={P.high} rain={pointRain()} measured={measured} /></MemoryRouter>);
    const t = screen.getAllByTestId('tile')[1];
    expect(t).toHaveTextContent('6,0 mm');
    expect(t).toHaveTextContent('medida · 6 h 7,5 · 24 h —');
    expect(t).not.toHaveTextContent(/Open-Meteo/);
    cleanup();
    render(<MemoryRouter><PointCard point={P.high} rain={pointRain()} measured={{ ...measured, rain3hMm: null }} /></MemoryRouter>);
    expect(screen.getAllByTestId('tile')[1]).toHaveTextContent('lacuna');
    expect(screen.getAllByTestId('tile')[1].querySelector('.text-warning')).not.toBeNull();
  });
});
