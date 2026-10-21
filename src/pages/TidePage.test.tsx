import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderPage } from '@/test/render';
import { TidePage } from './TidePage';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

describe('TidePage', () => {
  it('mostra o aviso da ADR 0009, a maré agora, a linha e os extremos', async () => {
    const { container } = renderPage(<TidePage />);
    expect(screen.getByTestId('tide-datum-notice')).toHaveTextContent('não são comparáveis');
    expect(await screen.findByTestId('tide-now')).toHaveTextContent(/\d,\d\d m agora \(previsto\)/);
    expect(container.querySelector('[data-series="tide"] path')).not.toBeNull(); // maré em linha
    expect(container.querySelector('[data-series="tide"] rect')).toBeNull(); // e não em barras
    await waitFor(() => expect(document.querySelectorAll('[data-extreme]').length).toBeGreaterThan(0));
    expect(screen.getAllByText(/Preamar|Baixa-mar/).length).toBeGreaterThan(0);
  });

  it('janela: pede ao backend de -past a +future e nunca mais que 72 h', async () => {
    const seen: Array<[string, string]> = [];
    server.use(http.get('/api/events/timeline', ({ request }) => {
      const u = new URL(request.url);
      seen.push([u.searchParams.get('from')!, u.searchParams.get('to')!]);
      return HttpResponse.json({ from: seen.at(-1)![0], to: seen.at(-1)![1], stepMinutes: 10, rain: [], tide: { harbor: 'pe02', points: [] }, river: [], risk: [] });
    }));
    renderPage(<TidePage />);
    await waitFor(() => expect(seen.length).toBe(1));
    fireEvent.click(screen.getByRole('button', { name: 'Próximas 72 h' }));
    await waitFor(() => expect(seen.length).toBe(2));
    for (const [f, t] of seen) expect((Date.parse(t) - Date.parse(f)) / 3_600_000).toBeLessThanOrEqual(72);
    // "Próximas 72 h": começa em agora e termina em agora + 72 h (limite do contrato)
    const [f2, t2] = seen[1];
    expect(Math.abs(Date.parse(f2) - Date.now())).toBeLessThan(15 * 60_000);
    expect((Date.parse(t2) - Date.now()) / 3_600_000).toBeGreaterThan(71.5);
    expect((Date.parse(t2) - Date.now()) / 3_600_000).toBeLessThanOrEqual(72.01);
    expect(await screen.findByText('Sem dados de maré nesta janela.')).toBeInTheDocument();
  });

  it('previsão futura em tracejado, passado contínuo, fundo e legenda; marca "agora"', async () => {
    const { container } = renderPage(<TidePage />);
    await screen.findByTestId('tide-now');
    const solid = container.querySelectorAll('[data-series="tide"] path[data-dashed="false"]');
    const dashed = container.querySelectorAll('[data-series="tide"] path[data-dashed="true"]');
    expect(solid).toHaveLength(1);
    expect(dashed).toHaveLength(1);
    expect(dashed[0].getAttribute('stroke-dasharray')).toBeTruthy();
    expect(solid[0].getAttribute('stroke-dasharray')).toBeNull();
    expect(container.querySelector('[data-future-band]')).not.toBeNull();
    expect(container.textContent).toContain('agora');
    expect(screen.getByTestId('future-legend')).toHaveTextContent('tracejada');
  });

  it('"Próximas 72 h" não tem trecho passado: tudo tracejado', async () => {
    const { container } = renderPage(<TidePage />);
    await screen.findByTestId('tide-now');
    fireEvent.click(screen.getByRole('button', { name: 'Próximas 72 h' }));
    await waitFor(() => expect(container.querySelectorAll('[data-series="tide"] path[data-dashed="true"]').length).toBe(1));
    await waitFor(() => expect(container.querySelectorAll('[data-series="tide"] path[data-dashed="false"]').length).toBe(0));
  });

  it('maré com valores nulos não vira zero: aparece buraco', async () => {
    server.use(http.get('/api/events/timeline', ({ request }) => {
      const u = new URL(request.url);
      const f = Date.parse(u.searchParams.get('from')!);
      const pts = [1, 2, null, 2, 1].map((v, i) => ({ t: new Date(f + i * 600_000).toISOString(), v }));
      return HttpResponse.json({ from: u.searchParams.get('from'), to: u.searchParams.get('to'), stepMinutes: 10, rain: [], tide: { harbor: 'pe02', points: pts }, river: [], risk: [] });
    }));
    const { container } = renderPage(<TidePage />);
    await screen.findByRole('region', { name: 'Maré agora' });
    expect(container.querySelectorAll('[data-series="tide"] path')).toHaveLength(2);
  });

  it('erro mostra nova tentativa', async () => {
    server.use(http.get('/api/events/timeline', () => HttpResponse.json({}, { status: 500 })));
    renderPage(<TidePage />);
    expect(await screen.findByText('Não foi possível carregar a maré.', {}, { timeout: 3000 })).toBeInTheDocument();
  });
});
