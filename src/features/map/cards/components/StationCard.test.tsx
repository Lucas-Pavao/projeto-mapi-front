import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { STATION_CARD_FIXTURES as F } from '@/mocks/cards';
import { StationCard } from './StationCard';

afterEach(cleanup);
const show = (k: keyof typeof F, onClose?: () => void) => render(<MemoryRouter><StationCard card={F[k]} onClose={onClose} /></MemoryRouter>);

describe('StationCard: os 8 estados', () => {
  it('1 normal: ao vivo + PED, sem aviso, valor da PED', () => {
    show('normal');
    expect(screen.getByTestId('state-chip')).toHaveTextContent('Ao vivo + PED');
    expect(screen.getByTestId('now')).toHaveTextContent('3,2 mm/h');
    expect(screen.getByText('PED (consolidada)')).toBeInTheDocument();
    expect(screen.queryByTestId('note')).toBeNull();
  });
  it('2 divergente: aviso com ao vivo × PED e a diferença', () => {
    show('divergent');
    expect(screen.getByTestId('state-chip')).toHaveTextContent('Fontes divergem');
    expect(screen.getByTestId('note')).toHaveTextContent(/ao vivo 2,0 mm × PED 3,2 mm \(diferença 1,2 mm > 0,5 mm\)\. Vale a PED/);
  });
  it('3 pico removido: barra cinza e aviso', () => {
    show('peak');
    expect(screen.getByTestId('state-chip')).toHaveTextContent('Pico isolado removido');
    expect(screen.getByTestId('station-bars').querySelectorAll('[data-block="peak"]')).toHaveLength(1);
    expect(screen.getByTestId('note')).toHaveTextContent('barra cinza');
  });
  it('4 checagem inconclusiva: aviso neutro e continua usada', () => {
    show('unchecked');
    expect(screen.getByTestId('note')).toHaveTextContent('Continua sendo usada');
    expect(screen.getByText(/mês sem checagem \(poucas vizinhas com chuva\)/)).toBeInTheDocument();
  });
  it('5 lacuna agora: "sem dado", blocos tracejados e acumulados incompletos (nunca 0)', () => {
    show('gap');
    expect(screen.getByTestId('now')).toHaveTextContent('sem dado');
    expect(screen.getByTestId('station-bars').querySelectorAll('[data-block="gap"]').length).toBeGreaterThan(0);
    expect(screen.getByTestId('accs')).toHaveTextContent('incompleto');
    expect(screen.getByTestId('accs').textContent).not.toMatch(/\b0 mm|0,0 mm/);
    expect(screen.getByTestId('note')).toHaveTextContent('não vira zero');
  });
  it('6 sem resposta: traço, hora da última leitura e pontos sem valor', () => {
    show('noResponse');
    expect(screen.getByTestId('state-chip')).toHaveTextContent('Sem resposta');
    expect(screen.getByTestId('now')).toHaveTextContent('—');
    expect(screen.getByTestId('note')).toHaveTextContent(/Parou de responder às \d{2}:\d{2}/);
    expect(document.querySelector('[data-use="NO_VALUE"]')).toHaveTextContent('sem valor');
  });
  it('7 reprovada no mês: fora da chuva do ponto, motivo e tag "fora · reprovada"', () => {
    show('failMonth');
    expect(screen.getByTestId('state-chip')).toHaveTextContent('Reprovada no mês · fora da chuva do ponto');
    expect(screen.getByTestId('note')).toHaveTextContent('UNDERCATCH');
    expect(document.querySelector('[data-use="EXCLUDED"]')).toHaveTextContent('fora · reprovada');
  });
  it('8 só PED: ao vivo "não existe" e fonte "única fonte"', () => {
    show('pedOnly');
    expect(screen.getByTestId('state-chip')).toHaveTextContent('Só PED · sem ao vivo');
    expect(screen.getByTestId('live')).toHaveTextContent('não existe');
    expect(screen.getByText('PED (única fonte)')).toBeInTheDocument();
  });
  it('tem citação do Cemaden, o link da série e fecha no X', () => {
    const onClose = vi.fn();
    show('normal', onClose);
    expect(screen.getByRole('dialog', { name: /Pluviômetro Sintético: Areias/ })).toHaveTextContent('DADOS DA REDE OBSERVACIONAL DO CEMADEN/MCTIC');
    expect(screen.getByRole('link', { name: 'Ver série e divergências' })).toHaveAttribute('href', '/sensores');
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Fechar card do pluviômetro' }));
    expect(onClose).toHaveBeenCalled();
  });
});
