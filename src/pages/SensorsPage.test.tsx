import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { screen, cleanup, within, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderPage } from '@/test/render';
import { SensorsPage } from './SensorsPage';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

describe('SensorsPage', () => {
  it('lista sensores com valor, unidade e hora; o velho vem como "sem resposta"', async () => {
    renderPage(<SensorsPage />);
    const pluv1 = (await screen.findByText('Sintético: pluviômetro 1')).closest('li')!;
    expect(within(pluv1).getByText(/2,4/)).toBeInTheDocument();
    expect(within(pluv1).getByText('mm')).toBeInTheDocument();
    expect(pluv1).toHaveAttribute('data-stale', 'false');
    const pluv2 = screen.getByText('Sintético: pluviômetro 2').closest('li')!;
    expect(pluv2).toHaveAttribute('data-stale', 'true');
    expect(within(pluv2).getByRole('status')).toHaveTextContent('Sem resposta recente');
    expect(within(pluv2).getByText('—')).toBeInTheDocument(); // sem valor: nunca zero
    expect(screen.getByText(/3 sensores, 1 sem resposta recente/)).toBeInTheDocument();
  });

  it('filtra por tipo (consulta com ?type=)', async () => {
    renderPage(<SensorsPage />);
    await screen.findByText('Sintético: rio 1');
    fireEvent.click(screen.getByRole('button', { name: 'Nível do rio' }));
    await waitFor(() => expect(screen.queryByText('Sintético: pluviômetro 1')).toBeNull());
    expect(screen.getByText('Sintético: rio 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nível do rio' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('vazio', async () => {
    server.use(http.get('/api/sensors/latest', () => HttpResponse.json([])));
    renderPage(<SensorsPage />);
    expect(await screen.findByText('Nenhum sensor com leitura.')).toBeInTheDocument();
  });

  it('erro mostra nova tentativa', async () => {
    server.use(http.get('/api/sensors/latest', () => HttpResponse.json({}, { status: 500 })));
    renderPage(<SensorsPage />);
    expect(await screen.findByText('Não foi possível carregar sensores.', {}, { timeout: 3000 })).toBeInTheDocument();
  });

  it('payload fora do contrato (tipo desconhecido) cai no estado de erro, sem tela quebrada', async () => {
    server.use(http.get('/api/sensors/latest', () => HttpResponse.json([{ sensorId: 'x', type: 'OUTRO', observedAt: 'a', ageSeconds: 1, stale: false }])));
    renderPage(<SensorsPage />);
    expect(await screen.findByRole('alert', {}, { timeout: 3000 })).toBeInTheDocument();
  });
});
