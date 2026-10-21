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
  it('chuva em barras que terminam no fim da hora; maré e rio em linha', async () => {
    const { container } = renderPage(<EventsPage />);
    await screen.findByRole('region', { name: 'Chuva' });
    const bars = Array.from(container.querySelectorAll('[data-series="SINTETICO-PLUV-01"] rect[data-bar-end]'));
    expect(bars.length).toBeGreaterThan(10);
    expect(bars.every((b) => Number(b.getAttribute('data-bar-end')) % 3_600_000 === 0)).toBe(true); // t = fim da hora cheia
    expect(container.querySelector('[data-series="tide"] path')).not.toBeNull();
    expect(container.querySelector('[data-series="tide"] rect')).toBeNull();
    expect(container.querySelector('[data-series="SINTETICO-RIO-01"] path')).not.toBeNull();
    expect(container.querySelector('[data-series="SINTETICO-RIO-01"] rect')).toBeNull();
  });

  it('risco por ponto: UNKNOWN sem %, experimental ao lado das classes, nome do ponto vem da lista', async () => {
    renderPage(<EventsPage />);
    const risk = await screen.findByRole('region', { name: 'Risco por ponto' });
    const li = await within(risk).findByText('Sintético: ponto de teste');
    const item = li.closest('li')!;
    expect(within(item).getByText(/Previsão experimental/)).toBeInTheDocument();
    const unknown = item.querySelector('li[data-risk="UNKNOWN"]')!;
    expect(unknown.textContent).not.toMatch(/%/);
    expect(unknown.querySelector('svg')).not.toBeNull();
  });

  it('aviso da ADR 0009 junto da maré e alagamentos confirmados listados', async () => {
    renderPage(<EventsPage />);
    expect(await screen.findByTestId('tide-datum-notice')).toBeInTheDocument();
    const ev = await screen.findByRole('region', { name: 'Eventos de alagamento' });
    expect(ev).toHaveTextContent('gravidade observada: Média');
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
    expect(await screen.findByText('Nenhum pluviômetro com dado nesta janela.')).toBeInTheDocument();
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
