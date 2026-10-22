import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { screen, cleanup, within, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderPage } from '@/test/render';
import { EventsPage } from './EventsPage';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

describe('EventsPage', () => {
  it('faixas de chuva, maré e rio na mesma escala de tempo, com resumo à direita', async () => {
    renderPage(<EventsPage />);
    expect(await screen.findByRole('img', { name: 'Chuva média ao longo do evento' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Maré ao longo do evento' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Nível do rio ao longo do evento' })).toBeInTheDocument();
    const resumo = screen.getByRole('complementary', { name: 'Resumo do evento' });
    expect(within(resumo).getByText('alagamentos confirmados').previousElementSibling).toHaveTextContent('1');
    expect(within(resumo).getByRole('link', { name: 'Gerar relatório do evento' })).toHaveAttribute('href', '/relatorio');
  });

  it('faixa por ponto: UNKNOWN sem %, rótulo experimental na legenda, nome do ponto vem da lista', async () => {
    renderPage(<EventsPage />);
    const strip = await screen.findByRole('group', { name: 'Risco de Sintético: ponto de teste' });
    const unk = Array.from(strip.querySelectorAll('button[data-risk="UNKNOWN"]'));
    expect(unk.length).toBeGreaterThan(0);
    expect(unk.every((b) => !/%/.test(b.getAttribute('aria-label') ?? ''))).toBe(true);
    expect(unk[0].getAttribute('aria-label')).toMatch(/Previsão indisponível/);
    const alto = strip.querySelector('button[data-risk="HIGH"]');
    expect(alto?.getAttribute('aria-label')).toMatch(/Alto \d+%/);
    expect(screen.getByText(/Previsão experimental/)).toBeInTheDocument();
  });

  it('clicar numa coluna leva o resumo àquele momento; o teclado usa o controle de momento', async () => {
    renderPage(<EventsPage />);
    const strip = await screen.findByRole('group', { name: 'Risco de Sintético: ponto de teste' });
    expect(screen.getByRole('complementary', { name: 'Resumo do evento' })).toHaveTextContent(/\(agora\)/);
    const cols = strip.querySelectorAll('button');
    fireEvent.click(cols[10]);
    await waitFor(() => expect(screen.getByRole('complementary', { name: 'Resumo do evento' })).not.toHaveTextContent(/\(agora\)/));
    expect(screen.getByLabelText('Momento do evento')).toBeInTheDocument();
  });

  it('trocar a janela refaz a consulta com 48 h', async () => {
    const spans: number[] = [];
    server.use(http.get('/api/events/timeline', ({ request }) => {
      const u = new URL(request.url);
      spans.push((Date.parse(u.searchParams.get('to')!) - Date.parse(u.searchParams.get('from')!)) / 3_600_000);
      return HttpResponse.json({ from: u.searchParams.get('from'), to: u.searchParams.get('to'), stepMinutes: 10, rain: [], tide: { harbor: 'pe02', points: [{ t: u.searchParams.get('from'), v: 1 }] }, river: [], risk: [] });
    }));
    renderPage(<EventsPage />);
    await waitFor(() => expect(spans).toEqual([24]));
    fireEvent.click(screen.getByRole('button', { name: 'Últimas 48 h' }));
    await waitFor(() => expect(spans).toEqual([24, 48]));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Últimas 48 h' })).toHaveAttribute('aria-pressed', 'true'));
  });

  it('vazio total e erro', async () => {
    server.use(http.get('/api/events/timeline', ({ request }) => {
      const u = new URL(request.url);
      return HttpResponse.json({ from: u.searchParams.get('from'), to: u.searchParams.get('to'), stepMinutes: 10, rain: [], tide: { harbor: 'pe02', points: [] }, river: [], risk: [], floodEvents: [] });
    }));
    const { unmount } = renderPage(<EventsPage />);
    expect(await screen.findByText('Sem dados nesta janela.')).toBeInTheDocument();
    unmount();
    server.use(http.get('/api/events/timeline', () => HttpResponse.json({}, { status: 400 })));
    renderPage(<EventsPage />);
    expect(await screen.findByText('Não foi possível carregar a linha do tempo.', {}, { timeout: 3000 })).toBeInTheDocument();
  });
});
