import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderPage } from '@/test/render';
import { PointAlertTabs } from './PointAlertTabs';

const auth = vi.hoisted(() => ({ role: 'ADMIN' }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { username: 'sintetico', role: auth.role } }) }));

const estado = [{ slug: 'IBURA', name: 'Ibura', rainAlert: 'ATENCAO', pointFlood: 'NAO', shadow: true, rainTeMm: 3.2, hNowCm: 0,
  physicalModelLabel: 'Estimativa do modelo físico, ainda não validada contra alagamento observado' }];

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

describe('PointAlertTabs', () => {
  it('ADMIN vê o alerta em teste como destaque e o risco do logreg_v3 só na aba Experimental, com o rótulo sintético', async () => {
    auth.role = 'ADMIN';
    server.use(http.get('/api/alerta/pontos', () => HttpResponse.json(estado)));
    renderPage(<PointAlertTabs slug="IBURA" pointName="Ibura" experimental={<p>risco v3</p>} />);
    expect(await screen.findByTestId('alerta-rain-ATENCAO')).toBeInTheDocument();
    expect(screen.getByTestId('alerta-chip')).toHaveTextContent('Atenção · chuva forte provável');
    expect(screen.getByTestId('alerta-em-teste')).toBeInTheDocument();
    expect(screen.queryByText('risco v3')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Experimental' }));
    expect(screen.getByText('risco v3')).toBeInTheDocument();
    expect(screen.getByTestId('rotulo-sintetico')).toHaveTextContent('SINTÉTICO');
  });

  it('em modo sombra quem não é ADMIN não vê o alerta nem consulta a rota', async () => {
    auth.role = 'USER';
    const pedido = vi.fn();
    server.use(http.get('/api/alerta/pontos', () => {
      pedido();
      return HttpResponse.json(estado);
    }));
    renderPage(<PointAlertTabs slug="IBURA" pointName="Ibura" experimental={<p>risco v3</p>} fallback={<p>chuva medida</p>} />);
    expect(screen.getByTestId('alerta-oculto')).toHaveTextContent('em teste');
    expect(screen.getByTestId('alerta-chip')).toHaveTextContent('Alerta em teste');
    expect(screen.getByText('chuva medida')).toBeInTheDocument();
    expect(screen.queryByTestId('alerta-panel')).not.toBeInTheDocument();
    expect(pedido).not.toHaveBeenCalled();
  });

  it('ADMIN com falha ao ler o alerta: selo "Alerta sem dado" tracejado, nunca "sem alerta"', async () => {
    auth.role = 'ADMIN';
    server.use(http.get('/api/alerta/pontos', () => HttpResponse.json({ message: 'erro' }, { status: 500 })));
    renderPage(<PointAlertTabs slug="IBURA" pointName="Ibura" experimental={<p>risco v3</p>} />);
    expect(await screen.findByTestId('alerta-sem-dado')).toBeInTheDocument();
    const chip = screen.getByTestId('alerta-chip');
    expect(chip).toHaveTextContent('Alerta sem dado');
    expect(chip.className).toContain('border-dashed');
  });
});
