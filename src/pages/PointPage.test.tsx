import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { screen, cleanup, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderPage } from '@/test/render';
import { PointPage } from './PointPage';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

const open = (slug = 'sintetico-1') => renderPage(<PointPage />, { route: `/pontos/${slug}`, path: '/pontos/:slug' });

describe('PointPage', () => {
  it('mostra o ponto, o risco atual (UNKNOWN mais recente, sem %) e o histórico', async () => {
    open();
    expect(await screen.findByRole('heading', { name: 'Sintético: ponto de teste' })).toBeInTheDocument();
    const now = await screen.findByRole('region', { name: 'Risco atual' });
    // a previsão mais recente da fixture é UNKNOWN: motivo e última válida, sem porcentagem
    const unknown = within(now).getByTestId('unknown-detail');
    expect(unknown).toHaveTextContent('o modelo está fora do ar');
    expect(unknown).toHaveTextContent(/Última previsão válida:\s*\d{2}\/\d{2}\/\d{4}/);
    expect(now.textContent).not.toMatch(/%/);
    const hist = await screen.findByRole('region', { name: 'Histórico de risco' });
    expect(within(hist).getAllByText('Alto').length).toBeGreaterThan(0);
    expect(within(hist).getAllByText(/Previsão experimental/).length).toBeGreaterThan(0); // junto das classes LOW/MEDIUM/HIGH
  });

  it('terreno e maré trazem o aviso da ADR 0009', async () => {
    open();
    expect(await screen.findByTestId('tide-datum-notice')).toHaveTextContent('não é comparável');
    expect(await screen.findByTestId('terrain-facts')).toBeInTheDocument();
  });

  it('ponto inexistente (404) mostra estado próprio', async () => {
    open('nao-existe');
    expect(await screen.findByRole('heading', { name: 'Ponto não encontrado' })).toBeInTheDocument();
  });

  it('série vazia: estado vazio, sem inventar risco', async () => {
    server.use(http.get('/api/pontos/:slug/predictions', ({ params }) => HttpResponse.json({ slug: params.slug, from: 'a', to: 'b', items: [] })));
    open();
    expect(await screen.findByText('Sem previsões nas últimas 24 h.')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Histórico de risco' })).toBeNull();
  });

  it('erro da API: mensagem e botão de nova tentativa', async () => {
    server.use(http.get('/api/pontos/:slug', () => HttpResponse.json({}, { status: 500 })));
    open();
    expect(await screen.findByText('Não foi possível carregar o ponto.', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
  });

  it('ponto desativado avisa', async () => {
    open('sintetico-2');
    expect(await screen.findByText('Ponto desativado: sem previsões novas.')).toBeInTheDocument();
  });

  it('gráfico traz os limiares do metadata, não 50 % e 80 %', async () => {
    open();
    const chart = await screen.findByTestId('probability-chart');
    expect(await within(chart).findByTestId('threshold-high')).toHaveTextContent('24,4%');
    expect(within(chart).getByTestId('threshold-medium')).toHaveTextContent('1,6%');
    expect(chart.textContent).not.toMatch(/80%|50%/);
  });

  it('mostra o aviso de sintético quando a previsão é sintética', async () => {
    server.use(http.get('/api/pontos/:slug', ({ params }) => HttpResponse.json({ id: 1, slug: params.slug, name: 'Sintético: ponto', active: true, latitude: -8, longitude: -34.9, floodPrediction: { riskLevel: 'LOW', floodProbability: 0.01, trainingData: 'SYNTHETIC', contributors: [{ featureId: 'rain_3h', label: 'Chuva 3 h', contribution: 0.031, value: 12.4, unit: 'mm' }, { featureId: 'tide', label: 'Nível da maré', contribution: -0.01, value: 0, unit: 'm' }], imputedFeatures: [{ featureId: 'rain_1h', label: 'Chuva 1 h' }, { featureId: 'tide', label: 'Nível da maré' }] } })));
    open();
    expect(await screen.findByTestId('synthetic-warning')).toHaveTextContent(/SINTÉTICO/);
    expect(await screen.findByTestId('contributors')).toHaveTextContent('Chuva 3 h: 12,4 mm');
    expect(screen.getByTestId('contributors')).toHaveTextContent('+3,1 p.p.');
    expect(screen.getAllByTestId('imputed')[0]).toHaveTextContent('Chuva 1 h');
    expect(screen.getByTestId('contributors')).toHaveTextContent('Nível da maré: imputado');
    expect(screen.getByTestId('contributors')).not.toHaveTextContent('0 m');
  });

  it('Chuva agora cita a estação usada e o rio fica fora do modelo', async () => {
    open();
    const tiles = await screen.findAllByTestId('water-tile');
    await screen.findByText(/Sintético: Ibura · 690 m/);
    expect(tiles.some((t) => t.textContent?.includes('fora do modelo'))).toBe(true);
  });

  it('candidatas até 5 km: usada, menor, fora (com motivo) e sem valor (nunca zero)', async () => {
    open();
    const panel = await screen.findByTestId('rain-candidates');
    const rows = await within(panel).findAllByText(/Sintético:/);
    expect(rows.length).toBe(4);
    expect(panel.querySelector('[data-role="USED"]')).toHaveTextContent('usada');
    expect(panel.querySelector('[data-role="EXCLUDED"]')).toHaveTextContent('reprovada no mês (zero travado, subestima)');
    expect(panel.querySelector('[data-role="EXCLUDED"]')).toHaveTextContent('—');
    expect(panel.querySelector('[data-role="NO_VALUE"]')).toHaveTextContent('sem dado');
    expect(panel).toHaveTextContent('DADOS DA REDE OBSERVACIONAL DO CEMADEN/MCTIC');
    expect(within(panel).getByTestId('rain-reference-hour')).toHaveTextContent(/^dados até \d{2}\/\d{2} \d{2}:\d{2}$/);
  });
});
