import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { screen, cleanup, within, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderPage } from '@/test/render';
import { SimulatorPage } from './SimulatorPage';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

const choosePoint = async () => {
  const sel = (await screen.findByLabelText('Ponto')) as HTMLSelectElement;
  await waitFor(() => expect(within(sel).getByRole('option', { name: 'Sintético: ponto de teste' })).toBeInTheDocument());
  fireEvent.change(sel, { target: { value: 'sintetico-1' } });
};

describe('SimulatorPage', () => {
  it('tem o aviso "não é previsão" e o estado inicial', async () => {
    renderPage(<SimulatorPage />);
    expect(screen.getByRole('note')).toHaveTextContent('Simulação — não é previsão');
    expect(screen.getByText('Nenhuma simulação ainda.')).toBeInTheDocument();
    expect(screen.getByTestId('tide-datum-notice')).toBeInTheDocument();
  });

  it('simula chuva constante: envia o corpo do contrato (chuva completada com zeros) e mostra o resultado com unidades', async () => {
    let body: unknown = null;
    server.use(http.post('/api/model/simulate/bucket', async ({ request }) => {
      body = await request.json();
      return HttpResponse.json({ model: 'M1a', illustrative: true, hMm: [10, 160, 90, 20, 0, 0], hmaxMm: 160, tCrossH: 1, nOutsideCurve: 2, paramsUsed: { C: 0.86, iT_mm_h: 60.1, f: 1, hcrit_mm: 150, snap_m: 10, curve_scale: 1 } });
    }));
    renderPage(<SimulatorPage />);
    await choosePoint();
    fireEvent.click(screen.getByRole('radio', { name: 'Constante' }));
    fireEvent.change(screen.getByLabelText(/Intensidade da chuva/), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText(/^Duração/), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simular' }));
    const res = await screen.findByRole('region', { name: 'Resultado da simulação' });
    expect(body).toEqual({ slug: 'sintetico-1', rainfallMmH: [30, 30, 30, 0, 0, 0], f: 1, curveScale: 1 });
    expect(within(res).getByTestId('cross')).toHaveTextContent('2 h');
    expect(res).toHaveTextContent('16,0 cm');
    expect(res).toHaveTextContent(/2 horas caíram fora da curva/);
    expect(res).toHaveTextContent('A rua alaga');
    expect(res.querySelector('[data-risk]')).toBeNull(); // nenhuma classe de risco: não é previsão
  });

  it('só oferece os controles reais do M1a (f e escala da curva) e avisa o que ficou de fora', async () => {
    renderPage(<SimulatorPage />);
    expect(screen.getByLabelText(/Fração da capacidade f/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Escala da curva/)).toHaveAttribute('min', '0.7');
    expect(screen.queryByLabelText(/Coeficiente de escoamento/)).toBeNull();
    expect(screen.queryByLabelText(/Nível lá fora/)).toBeNull();
    expect(screen.getByText('Fora do M1a real')).toBeInTheDocument();
  });

  it('modo hora a hora aceita vírgula decimal e valida faixas antes de enviar', async () => {
    let calls = 0;
    server.use(http.post('/api/model/simulate/bucket', () => { calls++; return HttpResponse.json({}); }));
    renderPage(<SimulatorPage />);
    await choosePoint();
    fireEvent.click(screen.getByRole('radio', { name: 'Hora a hora' }));
    fireEvent.change(screen.getByLabelText('Chuva por hora (mm/h)'), { target: { value: '5 301' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simular' }));
    expect(await screen.findByText('Máximo de 300 mm/h por hora.')).toBeInTheDocument();
    expect(calls).toBe(0);
  });

  it('sem ponto escolhido pede o ponto', async () => {
    renderPage(<SimulatorPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Simular' }));
    expect(await screen.findByText('Escolha um ponto.')).toBeInTheDocument();
  });

  it('422 (ponto sem terreno) e 503 (IA fora) têm mensagens próprias', async () => {
    server.use(http.get('/api/pontos', () => HttpResponse.json([{ id: 2, slug: 'sintetico-2', name: 'Sem terreno', latitude: 0, longitude: 0, active: true }])));
    renderPage(<SimulatorPage />);
    const sel = (await screen.findByLabelText('Ponto')) as HTMLSelectElement;
    await waitFor(() => expect(within(sel).getByRole('option', { name: 'Sem terreno' })).toBeInTheDocument());
    fireEvent.change(sel, { target: { value: 'sintetico-2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simular' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('não tem terreno carregado');
    server.use(http.post('/api/model/simulate/bucket', () => HttpResponse.json({}, { status: 503 })));
    fireEvent.click(screen.getByRole('button', { name: 'Simular' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('serviço do modelo está indisponível'));
  });
});
