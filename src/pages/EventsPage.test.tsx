import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { screen, cleanup, within, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderPage } from '@/test/render';
import { EventsPage } from './EventsPage';

const auth = vi.hoisted(() => ({ role: 'ADMIN' }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { username: 'sintetico', role: auth.role } }) }));

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
  auth.role = 'ADMIN';
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

  it('faixa por ponto pelo alerta por regressão: alerta com lâmina, sem dado nunca "sem alerta", legenda e selo Experimental', async () => {
    renderPage(<EventsPage />);
    const strip = await screen.findByRole('group', { name: 'Alerta de Sintético: ponto de teste' });
    const alerta = strip.querySelector('button[data-level="ALERTA"]');
    expect(alerta?.getAttribute('aria-label')).toMatch(/Alerta · lâmina 17,7 cm/);
    const semDado = Array.from(strip.querySelectorAll('button[data-level="SEM_DADO"]'));
    expect(semDado.length).toBeGreaterThan(0);
    expect(semDado.every((b) => /Sem dado/.test(b.getAttribute('aria-label') ?? ''))).toBe(true);
    expect(screen.getByText(/em alerta por \d+ min/)).toBeInTheDocument();
    expect(screen.getAllByTestId('selo-experimental').length).toBeGreaterThan(0);
    expect(document.body.textContent).not.toMatch(/risco baixo|seguro|%/i);
    expect(await screen.findByText('Sintético: ponto de teste: alerta em 1 h · lâmina 17,7 cm')).toBeInTheDocument();
  });

  it('visitante: o alerta está em teste e as faixas por ponto não aparecem', async () => {
    auth.role = 'USER';
    renderPage(<EventsPage />);
    expect(await screen.findByText(/está em teste: só o administrador vê/)).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: /^Alerta de/ })).toBeNull();
  });

  it('clicar numa coluna leva o resumo àquele momento; o teclado usa o controle de momento', async () => {
    renderPage(<EventsPage />);
    const strip = await screen.findByRole('group', { name: 'Alerta de Sintético: ponto de teste' });
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
      return HttpResponse.json({ from: u.searchParams.get('from'), to: u.searchParams.get('to'), stepMinutes: 10, rain: [], tide: { harbor: 'pe02', points: [{ t: u.searchParams.get('from'), v: 1 }] }, river: [] });
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
      return HttpResponse.json({ from: u.searchParams.get('from'), to: u.searchParams.get('to'), stepMinutes: 10, rain: [], tide: { harbor: 'pe02', points: [] }, river: [], floodEvents: [] });
    }));
    const { unmount } = renderPage(<EventsPage />);
    expect(await screen.findByText('Sem dados nesta janela.')).toBeInTheDocument();
    unmount();
    server.use(http.get('/api/events/timeline', () => HttpResponse.json({}, { status: 400 })));
    renderPage(<EventsPage />);
    expect(await screen.findByText('Não foi possível carregar a linha do tempo.', {}, { timeout: 3000 })).toBeInTheDocument();
  });
});
