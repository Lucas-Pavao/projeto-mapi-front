import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { screen, cleanup, fireEvent, waitFor, within } from '@testing-library/react';
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
  it('mostra o aviso da ADR 0009, a maré agora, o calendário do mês e a curva do dia', async () => {
    renderPage(<TidePage />);
    await waitFor(() => expect(screen.getByTestId('tide-now')).toHaveTextContent(/\d,\d\d m/));
    expect(await screen.findByRole('region', { name: 'Calendário do mês' })).toBeInTheDocument();
    expect(screen.getByTestId('tide-datum-notice')).toHaveTextContent('não são comparáveis');
    expect(screen.getByRole('img', { name: 'Maré ao longo do dia selecionado' })).toBeInTheDocument();
    expect(screen.getByText(/preamar máx\./)).toBeInTheDocument();
    expect(screen.getByText('baixa-mar mín.')).toBeInTheDocument();
  });

  it('escolher um dia do calendário troca a curva e o título', async () => {
    renderPage(<TidePage />);
    const cal = await screen.findByRole('region', { name: 'Calendário do mês' });
    const days = within(cal).getAllByRole('button');
    const first = days[0];
    expect(first).toHaveAttribute('aria-label', expect.stringMatching(/^1 de .*: preamar \d,\d\d m$/));
    fireEvent.click(first);
    expect(first).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('region', { name: 'Curva do dia' })).toHaveTextContent(/^DIA 1 DE /);
  });

  it('mês sem tábua mostra estado vazio, sem zeros', async () => {
    server.use(http.get('/api/tide/:harbor', () => HttpResponse.json({ id: 1, year: 2026, harborName: 'x', months: [] })));
    renderPage(<TidePage />);
    expect(await screen.findByText('Sem dados de maré neste mês.')).toBeInTheDocument();
  });

  it('maré agora sem ponto na linha do tempo não vira zero', async () => {
    server.use(http.get('/api/events/timeline', ({ request }) => {
      const u = new URL(request.url);
      return HttpResponse.json({ from: u.searchParams.get('from'), to: u.searchParams.get('to'), stepMinutes: 10, rain: [], tide: { harbor: 'pe02', points: [] }, river: [], risk: [] });
    }));
    renderPage(<TidePage />);
    await screen.findByRole('region', { name: 'Calendário do mês' });
    expect(screen.getByTestId('tide-now')).toHaveTextContent('—');
  });

  it('erro da tábua mostra nova tentativa', async () => {
    server.use(http.get('/api/tide/:harbor', () => HttpResponse.json({}, { status: 500 })));
    renderPage(<TidePage />);
    expect(await screen.findByText('Não foi possível carregar a tábua de maré.', {}, { timeout: 3000 })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument());
  });
});
