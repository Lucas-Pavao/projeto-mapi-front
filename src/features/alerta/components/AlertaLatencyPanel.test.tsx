import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderPage } from '@/test/render';
import { AlertaLatencyPanel } from './AlertaLatencyPanel';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => { server.resetHandlers(); cleanup(); });
afterAll(() => server.close());

const SEG = ['estacao_coleta', 'coleta_banco', 'banco_ciclo', 'ciclo_ia', 'ia_estado', 'estado_sse', 'total'];
const segs = (wet: boolean) => SEG.map((segment) => ({ segment, wetHour: wet, n: 10, medianS: 5, p90S: 9, maxS: 20 }));
const serve = (body: object) => server.use(
  http.get('/api/alerta/latencia', () => HttpResponse.json({ from: '2026-11-10', to: '2026-11-17', budgetP90Minutes: 5, ...body })),
  http.get('/api/alerta/latencia/relatorios', () => HttpResponse.json([])),
);

describe('AlertaLatencyPanel', () => {
  it('sem ciclo medido', async () => {
    serve({ segments: [] });
    renderPage(<AlertaLatencyPanel />);
    expect(await screen.findByText('Ainda sem ciclo medido.')).toBeInTheDocument();
  });
  it('só hora seca: orçamento ainda não medido e atraso na APAC', async () => {
    serve({ segments: segs(false) });
    renderPage(<AlertaLatencyPanel />);
    expect(await screen.findByText('Não choveu desde a implantação: o orçamento ainda não foi medido.')).toBeInTheDocument();
    expect(screen.getByTestId('latencia-apac')).toHaveTextContent('O atraso está na chegada pela APAC (estação → coleta), não no MAPi.');
  });
  it('com chuva dentro do orçamento', async () => {
    serve({ segments: [...segs(true), ...segs(false)], withinBudgetWet: true });
    renderPage(<AlertaLatencyPanel />);
    expect(await screen.findByTestId('latencia-orcamento')).toHaveTextContent('dentro');
    expect(screen.queryByTestId('latencia-sem-chuva')).toBeNull();
  });
  it('com chuva fora do orçamento', async () => {
    serve({ segments: [...segs(true), ...segs(false)], withinBudgetWet: false });
    renderPage(<AlertaLatencyPanel />);
    expect(await screen.findByTestId('latencia-orcamento')).toHaveTextContent('FORA');
  });
});
