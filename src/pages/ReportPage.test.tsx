import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { screen, cleanup, within, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderPage } from '@/test/render';

let role = 'ADMIN';
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { username: 'sintetico.admin', role } }) }));
import { ReportPage } from './ReportPage';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
  role = 'ADMIN';
});
afterAll(() => server.close());

describe('ReportPage', () => {
  it('monta a folha com resumo, pontos por risco, chuva, sensores e alertas', async () => {
    renderPage(<ReportPage />);
    const sheet = await screen.findByRole('article', { name: 'Relatório de situação' });
    expect(sheet).toHaveTextContent('Previsão experimental — modelo não validado');
    expect(sheet.closest('[data-theme="light"]')).not.toBeNull(); // folha sempre no tema claro
    const summary = await screen.findByRole('region', { name: 'Resumo de risco' });
    await within(summary).findByText('Previsão indisponível');
    expect(summary.querySelector('[data-risk-count="HIGH"]')).toHaveTextContent('1');
    const pts = await screen.findByRole('region', { name: 'Pontos críticos' });
    const rows = await within(pts).findAllByRole('row');
    expect(rows[1]).toHaveTextContent('Sintético: ponto de teste'); // Alto primeiro; o inativo não entra
    expect(within(pts).queryByText('Sintético: ponto sem previsão')).toBeNull();
    expect(within(pts).getByText(/Previsão experimental/)).toBeInTheDocument();
    const rain = await screen.findByRole('region', { name: /Chuva nas últimas 24 h/ });
    expect(await within(rain).findByText('SINTETICO-PLUV-01', { selector: 'td' })).toBeInTheDocument();
    expect(await screen.findByText(/1 sem resposta recente/)).toBeInTheDocument();
    expect(await screen.findByText('Sintético: risco alto no ponto de teste')).toBeInTheDocument();
  });

  it('USER não recebe a parte de alertas e a página não consulta /api/alerts', async () => {
    role = 'USER';
    let called = 0;
    server.use(http.get('/api/alerts', () => { called++; return HttpResponse.json({}); }));
    renderPage(<ReportPage />);
    expect(await screen.findByText(/Seu perfil não lista alertas/)).toBeInTheDocument();
    await screen.findByRole('region', { name: 'Resumo de risco' });
    expect(called).toBe(0);
  });

  it('uma parte que falha não derruba o relatório', async () => {
    server.use(http.get('/api/sensors/latest', () => HttpResponse.json({}, { status: 500 })));
    renderPage(<ReportPage />);
    expect(await screen.findByText(/Não foi possível carregar os sensores/, {}, { timeout: 3000 })).toBeInTheDocument();
    expect(await screen.findByRole('region', { name: 'Resumo de risco' })).toBeInTheDocument();
    expect(await screen.findByText('Sintético: ponto de teste')).toBeInTheDocument();
  });

  it('chuva: total é a soma das barras horárias e hora sem leitura é dita', async () => {
    server.use(http.get('/api/events/timeline', ({ request }) => {
      const u = new URL(request.url);
      return HttpResponse.json({ from: u.searchParams.get('from'), to: u.searchParams.get('to'), stepMinutes: 10, rain: [{ stationId: 'P1', points: [{ t: '2026-10-21T13:00:00Z', v: 1.5 }, { t: '2026-10-21T14:00:00Z', v: null }, { t: '2026-10-21T15:00:00Z', v: 4.25 }] }], tide: { harbor: 'pe02', points: [] }, river: [], risk: [] });
    }));
    renderPage(<ReportPage />);
    const cell = await screen.findByText(/5,75 \(1 h sem leitura\)/);
    expect(cell).toBeInTheDocument();
  });

  it('botão Imprimir chama window.print', async () => {
    const print = vi.fn();
    vi.stubGlobal('print', print);
    renderPage(<ReportPage />);
    fireEvent.click(await screen.findByRole('button', { name: /Imprimir ou salvar PDF/ }));
    expect(print).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
