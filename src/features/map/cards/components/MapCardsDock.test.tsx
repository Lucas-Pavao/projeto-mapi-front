import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { screen, cleanup, fireEvent, within, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderPage } from '@/test/render';
import { POINT_CARD_FIXTURES as P } from '@/mocks/cards';
import { useMapCards } from '../hooks/useMapCards';
import { MapCardsDock } from './MapCards';
import type { FloodPointResponseDTO } from '../../types';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { username: 'sintetico', role: 'ADMIN' } }) }));

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => { server.resetHandlers(); cleanup(); });
afterAll(() => server.close());

const A = { ...P.high, slug: 'sintetico-1', name: 'Sintético: A' } as FloodPointResponseDTO;
const B = { ...P.medium, slug: 'sintetico-2', name: 'Sintético: B' } as FloodPointResponseDTO;

const Harness = ({ mobile = false }: { mobile?: boolean }) => {
  const cards = useMapCards();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') cards.escape(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [cards]);
  return (
    <div>
      <button type="button" onClick={() => cards.openAnalysis('sintetico-2')}>trocar para B</button>
      <output data-testid="state">{JSON.stringify(cards.state)}</output>
      <MapCardsDock cards={cards} floodPoints={[A, B]} floodPointStatus={null} isMobile={mobile} stations={[]} riverSensor={undefined}
        onSelectPoint={(p) => cards.openPoint(p.slug)} onCloseSelection={cards.closeAll} onReportAt={() => {}} />
    </div>
  );
};
const open = (url: string, mobile = false) => renderPage(<Harness mobile={mobile} />, { route: url });

describe('MapCardsDock (painel, estação ao lado e card de local)', () => {
  it('?ponto&aba abre o painel na aba pedida; candidata abre o card da estação ao lado; Esc fecha a estação e depois o painel', async () => {
    open('/map?ponto=sintetico-1&aba=prov');
    const panel = await screen.findByTestId('analysis-panel');
    expect(screen.getByRole('tab', { name: 'Origem' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(await within(panel).findByText(/Sintético: Ibura/)); // candidata do ponto
    expect(await screen.findByRole('dialog', { name: /Pluviômetro Sintético: SINT-A/ })).toBeInTheDocument();
    expect(screen.getByTestId('analysis-panel')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /Pluviômetro/ })).toBeNull());
    expect(screen.getByTestId('analysis-panel')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByTestId('analysis-panel')).toBeNull());
  });

  it('trocar de ponto não fecha o painel e a aba continua', async () => {
    open('/map?ponto=sintetico-1&aba=prov');
    await screen.findByTestId('analysis-panel');
    fireEvent.click(screen.getByRole('button', { name: 'trocar para B' }));
    expect(await screen.findByRole('dialog', { name: 'Análise completa de Sintético: B' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Origem' })).toHaveAttribute('aria-selected', 'true');
  });

  it('?local=lat,lon abre o card de local com os dados da análise (B7) e fecha no X', async () => {
    open('/map?local=-8.1039,-34.9509');
    const card = await screen.findByRole('dialog', { name: /Análise do local -8,1039, -34,9509/ });
    expect(await within(card).findByTestId('rain-source-tag')).toHaveTextContent('medida · Cemaden');
    fireEvent.click(within(card).getByRole('button', { name: 'Fechar análise de local' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /Análise do local/ })).toBeNull());
  });

  it('erro na análise de local mostra mensagem, não tela quebrada', async () => {
    server.use(http.get('/api/locations/analysis', () => HttpResponse.json({}, { status: 500 })));
    open('/map?local=-8.1,-34.9');
    expect(await screen.findByText(/Não foi possível analisar este local/)).toBeInTheDocument();
  });

  it('estação inexistente (404) mostra "não encontrada"', async () => {
    server.use(http.get('/api/stations/:id/card', () => HttpResponse.json({}, { status: 404 })));
    open('/map?ponto=sintetico-1&aba=prov');
    fireEvent.click(await screen.findByText(/Sintético: Ibura/));
    expect(await screen.findByText('Estação não encontrada.')).toBeInTheDocument();
  });

  it('celular: a análise abre em folha com as 3 abas e, ao fechar, volta ao resumo do ponto', async () => {
    open('/map?ponto=sintetico-1&aba=why', true);
    const sheet = (await screen.findByTestId('analysis-panel')).parentElement as HTMLElement;
    expect(within(sheet).getAllByRole('tab').map((t) => t.textContent)).toEqual(['Por quê', 'Balde', 'Origem']);
    fireEvent.click(within(sheet).getByRole('button', { name: 'Fechar análise' }));
    await waitFor(() => expect(JSON.parse(screen.getByTestId('state').textContent as string)).toMatchObject({ analysis: null, point: 'sintetico-1' }));
  });
});
