import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { screen, cleanup, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderPage } from '@/test/render';
import { PointPage } from './PointPage';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

const open = (slug = 'sintetico-1') => renderPage(<PointPage />, { route: `/pontos/${slug}`, path: '/pontos/:slug' });

describe('PointPage', () => {
  it('mostra o ponto, o risco atual (UNKNOWN mais recente, sem %) e o histórico', async () => {
    open();
    expect(await screen.findByRole('heading', { name: 'Sintético: ponto de teste' })).toBeInTheDocument();
    const now = await screen.findByRole('region', { name: 'Risco atual' });
    // a previsão mais recente da fixture é UNKNOWN: motivo e última válida, sem porcentagem
    const unknown = within(now).getByTestId('unknown-detail');
    expect(unknown).toHaveTextContent('o modelo está fora do ar');
    expect(unknown).toHaveTextContent(/Última previsão válida:\s*\d{2}\/\d{2}\/\d{4}/);
    expect(now.textContent).not.toMatch(/%/);
    const hist = await screen.findByRole('region', { name: 'Histórico de risco' });
    expect(within(hist).getAllByText('Alto').length).toBeGreaterThan(0);
    expect(within(hist).getAllByText(/Previsão experimental/).length).toBeGreaterThan(0); // junto das classes LOW/MEDIUM/HIGH
  });

  it('terreno e maré trazem o aviso da ADR 0009', async () => {
    open();
    expect(await screen.findByTestId('tide-datum-notice')).toHaveTextContent('não é comparável');
    expect(await screen.findByTestId('terrain-facts')).toBeInTheDocument();
  });

  it('ponto inexistente (404) mostra estado próprio', async () => {
    open('nao-existe');
    expect(await screen.findByRole('heading', { name: 'Ponto não encontrado' })).toBeInTheDocument();
  });

  it('série vazia: estado vazio, sem inventar risco', async () => {
    server.use(http.get('/api/pontos/:slug/predictions', ({ params }) => HttpResponse.json({ slug: params.slug, from: 'a', to: 'b', items: [] })));
    open();
    expect(await screen.findByText('Sem previsões nas últimas 24 h.')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Histórico de risco' })).toBeNull();
  });

  it('erro da API: mensagem e botão de nova tentativa', async () => {
    server.use(http.get('/api/pontos/:slug', () => HttpResponse.json({}, { status: 500 })));
    open();
    expect(await screen.findByText('Não foi possível carregar o ponto.', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
  });

  it('ponto desativado avisa', async () => {
    open('sintetico-2');
    expect(await screen.findByText('Ponto desativado: sem previsões novas.')).toBeInTheDocument();
  });
});
