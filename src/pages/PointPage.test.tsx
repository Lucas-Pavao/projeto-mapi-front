import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { screen, cleanup, within, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderPage } from '@/test/render';
import { PointPage } from './PointPage';
import { ALAGAMENTO_FIXTURES } from '@/mocks/alagamento';

let role = 'ADMIN';
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { username: 'sintetico', role } }) }));

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
  role = 'ADMIN';
});
afterAll(() => server.close());

const serve = (id: keyof typeof ALAGAMENTO_FIXTURES, slug = 'sintetico-1') =>
  server.use(http.get('/api/alagamento/pontos', () => HttpResponse.json([{ ...ALAGAMENTO_FIXTURES[id], slug }])));
const open = (slug = 'sintetico-1') => renderPage(<PointPage />, { route: `/pontos/${slug}`, path: '/pontos/:slug' });

describe('PointPage', () => {
  it('cabeçalho pelo alerta por regressão: selo, Experimental, horizonte 1, 3 e 6 h e rain_v1 + balde; sem %', async () => {
    serve('atencao_3h');
    open();
    expect(await screen.findByRole('heading', { name: 'Sintético: ponto de teste' })).toBeInTheDocument();
    const head = await screen.findByRole('region', { name: 'Alerta de alagamento do ponto' });
    await waitFor(() => expect(within(head).getByTestId('flood-chip')).toHaveTextContent('Atenção em 3 h'));
    expect(within(head).getByTestId('selo-experimental')).toBeInTheDocument();
    expect(head).toHaveTextContent('1, 3 e 6 h');
    expect(head).toHaveTextContent('rain_v1 + balde');
    expect(document.body.textContent).not.toMatch(/%|logreg|risco baixo|seguro|Probabilidade/i);
  });

  it('alagamento previsto: as 3 linhas por prazo e a lâmina a cada 10 min com 15 cm; por que este nível', async () => {
    serve('alerta_1h');
    open();
    const panel = await screen.findByRole('region', { name: 'Alagamento previsto' });
    await waitFor(() => expect(within(panel).getByTestId('horizonte-1')).toHaveTextContent(/18–33 cm · até/));
    expect(within(panel).getByTestId('balde-lamina')).toHaveAttribute('aria-label', expect.stringMatching(/15 cm/));
    expect(within(panel).queryByTestId('balde-vazoes')).toBeNull();
    const why = screen.getByRole('region', { name: 'Por que este nível' });
    expect(within(why).getByTestId('point-shap').children).toHaveLength(3);
    expect(within(why).getByTestId('point-cf')).toHaveTextContent(/15 cm/);
    expect(within(why).getByTestId('point-sens')).toHaveTextContent(/lâmina máxima entre/);
  });

  it.each(['sem_dado_chuva_ausente', 'sem_dado_previsao_fora', 'sem_dado_sem_terreno', 'sem_dado_terreno_em_revisao'] as const)(
    'SEM_DADO (%s): motivo, sem gráfico e nunca "Sem alerta"', async (id) => {
      serve(id);
      open();
      expect(await screen.findByTestId('point-empty')).toHaveTextContent(ALAGAMENTO_FIXTURES[id].reasonText!);
      expect(screen.queryByTestId('balde-lamina')).toBeNull();
      expect(document.body.textContent).not.toMatch(/Sem alerta/);
    });

  it('visitante: "Alerta experimental" e sem o nível', async () => {
    role = 'USER';
    open();
    const head = await screen.findByRole('region', { name: 'Alerta de alagamento do ponto' });
    expect(within(head).getByTestId('flood-chip')).toHaveTextContent('Alerta experimental');
    expect(await screen.findByTestId('point-empty')).toHaveTextContent(/só o administrador vê/);
  });

  it('terreno e maré trazem o aviso da ADR 0009', async () => {
    open();
    const tiles = await screen.findAllByTestId('water-tile');
    const cota = tiles.find((t) => t.textContent?.includes('Cota da rua'));
    await waitFor(() => expect(cota).toHaveTextContent('não comparar com maré'));
    expect(tiles.map((t) => t.querySelector('dt')?.textContent)).toEqual(['Chuva agora', 'Chuva 3 h', 'Chuva 6 h', 'Chuva 24 h', 'Maré', 'Rio', 'Cota da rua', 'Até o canal']);
  });

  it('ponto inexistente (404) mostra estado próprio', async () => {
    open('nao-existe');
    expect(await screen.findByRole('heading', { name: 'Ponto não encontrado' })).toBeInTheDocument();
  });

  it('erro da API: mensagem e botão de nova tentativa', async () => {
    server.use(http.get('/api/pontos/:slug', () => HttpResponse.json({}, { status: 500 })));
    open();
    expect(await screen.findByText('Não foi possível carregar o ponto.', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
  });

  it('ponto desativado avisa', async () => {
    open('sintetico-2');
    expect(await screen.findByText('Ponto desativado: sem alerta novo.')).toBeInTheDocument();
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
    expect(panel.querySelector('[data-role="USED"]')).toHaveTextContent('3,2 mm/h');
    expect(panel).toHaveTextContent('DADOS DA REDE OBSERVACIONAL DO CEMADEN/MCTIC');
    expect(within(panel).getByTestId('rain-reference-hour')).toHaveTextContent(/^dados até \d{2}\/\d{2} \d{2}:\d{2}$/);
  });
});
