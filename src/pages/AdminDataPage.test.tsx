import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { screen, cleanup, within, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderPage } from '@/test/render';
import { AdminDataPage } from './AdminDataPage';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

describe('AdminDataPage', () => {
  it('mostra o estado de cada fonte com ícone e rótulo e conta os problemas', async () => {
    renderPage(<AdminDataPage />);
    const apac = (await screen.findByRole('list', { name: 'Fontes de dados' })).querySelector('[data-source="APAC"]') as HTMLElement;
    expect(within(apac).getByText('Atrasada')).toBeInTheDocument();
    const om = document.querySelector('[data-source="OPEN_METEO"]') as HTMLElement;
    expect(within(om).getByText('Com falha')).toBeInTheDocument();
    expect(within(om).getByText(/Último erro: Sintético: tempo esgotado/)).toBeInTheDocument();
    expect(screen.getByText(/de 3 fontes em dia/)).toBeInTheDocument();
    expect(screen.getByText(/2 com atraso, falha ou quarentena/)).toBeInTheDocument();
  });

  it('junta as chaves da API nas fontes da tela e marca fonte sem ciclo como sob demanda', async () => {
    const live = new Date(Date.now() - 5 * 60_000).toISOString();
    server.use(http.get('/api/admin/ingestion/sources', () => HttpResponse.json([
      { source: 'ANA_SOAP', status: 'OK', expectedEveryMinutes: 15, lastSuccessAt: live, lastRunId: 'a1', rowsLast24h: 10 },
      { source: 'APAC_METEO24H', status: 'QUARANTINED', expectedEveryMinutes: 5, lastSuccessAt: live, lastRunId: 'b1', rowsLast24h: 0 },
      { source: 'APAC_PORTAL', status: 'IDLE', expectedEveryMinutes: null, lastSuccessAt: null, lastRunId: null, rowsLast24h: 0 },
      { source: 'TABUAMARE_PE02', status: 'OK', expectedEveryMinutes: null, lastSuccessAt: live, lastRunId: 'c1', rowsLast24h: 54 },
      { source: 'DHN_TABUA_PE02', status: 'IDLE', expectedEveryMinutes: null, lastSuccessAt: null, lastRunId: null, rowsLast24h: 0 },
      { source: 'TIDE_PE02_HOURLY', status: 'IDLE', expectedEveryMinutes: null, lastSuccessAt: null, lastRunId: null, rowsLast24h: 0 },
    ])));
    renderPage(<AdminDataPage />);
    const list = await screen.findByRole('list', { name: 'Fontes de dados' });
    expect(list.querySelectorAll('li')).toHaveLength(3);
    const apac = list.querySelector('[data-source="APAC"]') as HTMLElement;
    expect(within(apac).getByText('Em quarentena')).toBeInTheDocument();
    expect(within(apac).getByText('A última coleta ficou toda na quarentena.')).toBeInTheDocument();
    const tabua = list.querySelector('[data-source="TABUA"]') as HTMLElement;
    expect(within(tabua).getByText('Sob demanda')).toBeInTheDocument();
    expect(within(tabua).getByText('TabuaMare / DHN')).toBeInTheDocument();
    expect(within(list.querySelector('[data-source="ANA"]') as HTMLElement).getByText('ANA · telemetria')).toBeInTheDocument();
    expect(screen.getByText(/de 3 fontes em dia/)).toBeInTheDocument();
  });

  it('lastRunId é UUID (texto), não número', async () => {
    renderPage(<AdminDataPage />);
    expect(await screen.findByRole('button', { name: 'Ver execuções de CEMADEN' })).toHaveTextContent('7c9e6679');
  });

  it('lista execuções e filtra por fonte', async () => {
    renderPage(<AdminDataPage />);
    await screen.findByRole('region', { name: 'Execuções de ingestão' });
    await waitFor(() => expect(document.querySelectorAll('tr[data-run-id]')).toHaveLength(2));
    fireEvent.click(screen.getByRole('button', { name: 'Ver execuções de APAC' }));
    await waitFor(() => expect(document.querySelectorAll('tr[data-run-id]')).toHaveLength(1));
    expect(screen.getByText(/· Sintético: tempo esgotado/)).toBeInTheDocument();
  });

  it('verificação de integridade só roda no clique', async () => {
    let called = 0;
    server.use(http.get('/api/admin/ingestion/check-integrity', () => { called++; return HttpResponse.json([{ slug: 'sintetico-1', totalWeatherRecords: 1, totalSensorRecords: 2, totalFloodEvents: 3, status: 'OK' }]); }));
    renderPage(<AdminDataPage />);
    await screen.findByRole('region', { name: 'Execuções de ingestão' });
    expect(called).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: 'Checar integridade' }));
    expect(await screen.findByText('Sintético: ponto de teste')).toBeInTheDocument();
    expect(screen.getByText(/1 de clima · 2 de sensores · 3 alagamentos/)).toBeInTheDocument();
    expect(called).toBe(1);
  });

  it('falha na verificação mostra erro de ação', async () => {
    server.use(http.get('/api/admin/ingestion/check-integrity', () => HttpResponse.json({}, { status: 503 })));
    renderPage(<AdminDataPage />);
    await screen.findByRole('region', { name: 'Execuções de ingestão' });
    fireEvent.click(screen.getByRole('button', { name: 'Checar integridade' }));
    expect(await screen.findByText(/Serviço indisponível ao verificar a integridade/)).toBeInTheDocument();
  });

  it('vazio e erro nas fontes', async () => {
    server.use(http.get('/api/admin/ingestion/sources', () => HttpResponse.json([])));
    const { unmount } = renderPage(<AdminDataPage />);
    expect(await screen.findByText('Nenhuma fonte cadastrada.')).toBeInTheDocument();
    unmount();
    server.use(http.get('/api/admin/ingestion/sources', () => HttpResponse.json({}, { status: 403 })));
    renderPage(<AdminDataPage />);
    expect(await screen.findByText('Não foi possível carregar as fontes.', {}, { timeout: 3000 })).toBeInTheDocument();
  });

  it('status fora do contrato é rejeitado na borda', async () => {
    server.use(http.get('/api/admin/ingestion/sources', () => HttpResponse.json([{ source: 'X', status: 'EXPLODIU' }])));
    renderPage(<AdminDataPage />);
    expect(await screen.findByRole('alert', {}, { timeout: 3000 })).toBeInTheDocument();
  });
});
