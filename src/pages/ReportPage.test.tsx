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
  it('monta a folha com resumo, pontos por probabilidade, gráficos e alertas', async () => {
    renderPage(<ReportPage />);
    const sheet = await screen.findByRole('article', { name: 'Relatório de situação' });
    expect(sheet).toHaveTextContent('Previsão experimental — modelo não validado');
    expect(sheet.closest('[data-theme="light"]')).not.toBeNull(); // folha sempre no tema claro
    const resumo = await within(sheet).findByRole('region', { name: 'Resumo' });
    expect(resumo).toHaveTextContent(/O ponto com maior probabilidade na janela foi Sintético: ponto de teste, com 78%/);
    const pts = await within(sheet).findByRole('region', { name: 'Pontos críticos' });
    const rows = await within(pts).findAllByRole('row');
    expect(rows[1]).toHaveTextContent('Sintético: ponto de teste');
    expect(within(pts).queryByText('Sintético: ponto sem previsão')).toBeNull(); // só pontos com previsão na janela
    expect(within(sheet).getByRole('img', { name: 'Chuva, maré e rio no período' })).toBeInTheDocument();
    expect(await within(sheet).findByText('Sintético: risco alto no ponto de teste')).toBeInTheDocument();
    expect(sheet).toHaveTextContent(/1 sem resposta recente/);
  });

  it('USER não recebe alertas nem relatos e a página não consulta essas rotas', async () => {
    role = 'USER';
    let called = 0;
    server.use(http.get('/api/alerts', () => { called++; return HttpResponse.json({}); }), http.get('/api/reports', () => { called++; return HttpResponse.json({}); }));
    renderPage(<ReportPage />);
    expect(await screen.findByText(/Seu perfil não lista alertas/)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Alertas disparados/ })).toBeDisabled();
    await screen.findByRole('region', { name: 'Resumo' });
    expect(called).toBe(0);
  });

  it('uma parte que falha não derruba o relatório', async () => {
    server.use(http.get('/api/events/timeline', () => HttpResponse.json({}, { status: 500 })));
    renderPage(<ReportPage />);
    const resumo = await screen.findByRole('region', { name: 'Resumo' });
    expect(await within(resumo).findByText(/Não foi possível carregar a linha do tempo/, {}, { timeout: 3000 })).toBeInTheDocument();
    expect(await screen.findByRole('region', { name: 'Principais alertas' })).toBeInTheDocument();
  });

  it('desligar uma seção a tira da folha; relatos confirmados começa desligado', async () => {
    renderPage(<ReportPage />);
    await screen.findByRole('region', { name: 'Gráficos' });
    expect(screen.queryByRole('region', { name: 'Relatos confirmados' })).toBeNull();
    fireEvent.click(screen.getByRole('checkbox', { name: /Gráficos de chuva/ }));
    expect(screen.queryByRole('region', { name: 'Gráficos' })).toBeNull();
    fireEvent.click(screen.getByRole('checkbox', { name: /Relatos confirmados/ }));
    expect(await screen.findByRole('region', { name: 'Relatos confirmados' })).toBeInTheDocument();
  });

  it('Gerar PDF chama window.print', async () => {
    const print = vi.fn();
    vi.stubGlobal('print', print);
    renderPage(<ReportPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Gerar PDF' }));
    expect(print).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
