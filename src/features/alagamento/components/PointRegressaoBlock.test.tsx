import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { screen, cleanup, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderPage } from '@/test/render';
import { ALAGAMENTO_FIXTURES, type AlagamentoFixtureId } from '@/mocks/alagamento';
import { PointRegressaoBlock } from './PointRegressaoBlock';

let role = 'ADMIN';
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { username: 'sintetico', role } }) }));

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => { server.resetHandlers(); cleanup(); role = 'ADMIN'; });
afterAll(() => server.close());

const serve = (body: unknown, status = 200) =>
  server.use(http.get('/api/alagamento/pontos', () => HttpResponse.json(body as object, { status })));

describe('PointRegressaoBlock (folha do celular e popup): 10 estados', () => {
  it.each(Object.keys(ALAGAMENTO_FIXTURES) as AlagamentoFixtureId[])('%s', async (id) => {
    const a = ALAGAMENTO_FIXTURES[id];
    serve([{ ...a, slug: 'p1' }]);
    renderPage(<PointRegressaoBlock slug="p1" />);
    await waitFor(() => expect(screen.getByTestId('regressao-bloco')).toHaveAttribute('data-level', a.level));
    expect(screen.getByTestId('flood-chip')).toHaveAttribute('data-level', a.level);
    if (a.level === 'SEM_DADO') expect(screen.getByTestId('flood-chip').textContent).not.toMatch(/Sem alerta/);
    expect(document.body.textContent).not.toMatch(/risco baixo|seguro|%/i);
  });

  it('ponto ainda sem cálculo e falha de leitura: nunca "Sem alerta"', async () => {
    serve([]);
    renderPage(<PointRegressaoBlock slug="p1" />);
    expect(await screen.findByText('Alerta de alagamento ainda não calculado para este ponto.')).toBeInTheDocument();
    cleanup();
    serve({ error: 'x' }, 500);
    renderPage(<PointRegressaoBlock slug="p1" />);
    expect(await screen.findByText('Não foi possível ler o alerta de alagamento agora.')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Sem alerta/);
  });

  it('visitante: só "Alerta experimental", sem pedir a rota em modo sombra', () => {
    role = 'USER';
    renderPage(<PointRegressaoBlock slug="p1" />);
    expect(screen.getByTestId('flood-chip')).toHaveTextContent('Alerta experimental');
    expect(screen.queryByTestId('regressao-bloco')).toBeNull();
  });
});
