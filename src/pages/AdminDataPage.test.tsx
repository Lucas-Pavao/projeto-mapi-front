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
    expect(screen.getByText(/3 fontes, 2 com atraso, falha ou quarentena/)).toBeInTheDocument();
  });

  it('lastRunId é UUID (texto), não número', async () => {
    renderPage(<AdminDataPage />);
    expect(await screen.findByRole('button', { name: 'Ver execuções de CEMADEN' })).toHaveTextContent('7c9e6679');
  });

  it('lista execuções e filtra por fonte', async () => {
    renderPage(<AdminDataPage />);
    await screen.findByText('Execuções');
    await waitFor(() => expect(document.querySelectorAll('tr[data-run-id]')).toHaveLength(2));
    fireEvent.click(screen.getByRole('button', { name: 'Ver execuções de APAC' }));
    await waitFor(() => expect(document.querySelectorAll('tr[data-run-id]')).toHaveLength(1));
    expect(screen.getByText('Sintético: tempo esgotado', { selector: 'td' })).toBeInTheDocument();
  });

  it('verificação de integridade só roda no clique', async () => {
    let called = 0;
    server.use(http.get('/api/admin/ingestion/check-integrity', () => { called++; return HttpResponse.json([{ slug: 'sintetico-1', totalWeatherRecords: 1, totalSensorRecords: 2, totalFloodEvents: 3, status: 'OK' }]); }));
    renderPage(<AdminDataPage />);
    await screen.findByText('Execuções');
    expect(called).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: 'Verificar agora' }));
    expect(await screen.findByText('sintetico-1', { selector: 'td' })).toBeInTheDocument();
    expect(called).toBe(1);
  });

  it('falha na verificação mostra erro de ação', async () => {
    server.use(http.get('/api/admin/ingestion/check-integrity', () => HttpResponse.json({}, { status: 503 })));
    renderPage(<AdminDataPage />);
    await screen.findByText('Execuções');
    fireEvent.click(screen.getByRole('button', { name: 'Verificar agora' }));
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
