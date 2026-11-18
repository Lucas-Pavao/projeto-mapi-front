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
    expect(pluv1).toHaveAttribute('data-stale', 'false');
    expect(within(pluv1).getByText(/Pluviômetro · 2,4 mm/)).toBeInTheDocument();
    const pluv2 = screen.getByText('Sintético: pluviômetro 2').closest('li')!;
    expect(pluv2).toHaveAttribute('data-stale', 'true');
    expect(within(pluv2).getByText(/sem resposta há/)).toBeInTheDocument();
    expect(within(pluv2).getByText('—')).toBeInTheDocument(); // sem valor: nunca zero
    expect(await screen.findByText('5 de 6 com dado agora')).toBeInTheDocument();
  });

  it('seleciona o sensor e mostra o detalhe; sensor velho vem com aviso', async () => {
    renderPage(<SensorsPage />);
    fireEvent.click(await screen.findByRole('button', { name: /Sintético: pluviômetro 2/ }));
    const det = await screen.findByRole('region', { name: 'Sensor selecionado' });
    expect(within(det).getByText('Sem resposta recente')).toBeInTheDocument();
    expect(within(det).getByText('—')).toBeInTheDocument();
  });

  it('filtra por tipo na lista', async () => {
    renderPage(<SensorsPage />);
    const lista = within(await screen.findByRole('complementary', { name: 'Estações' }));
    await lista.findByText('Sintético: rio 1');
    fireEvent.click(screen.getByRole('radio', { name: /^Rio/ }));
    await waitFor(() => expect(lista.queryByText('Sintético: pluviômetro 1')).toBeNull());
    expect(lista.getByText('Sintético: rio 1')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /^Rio/ })).toHaveAttribute('aria-checked', 'true');
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

  it('estação canônica: tags ao vivo/PED e só PED, status do mês e filtro "Com problema"', async () => {
    renderPage(<SensorsPage />);
    const lista = within(await screen.findByRole('complementary', { name: 'Estações' }));
    const areias = (await lista.findByText('Sintético: Areias')).closest('li')!;
    expect(within(areias).getByText('ao vivo')).toBeInTheDocument();
    expect(within(areias).getByText('PED')).toBeInTheDocument();
    const boa = lista.getByText('Sintético: Boa Viagem').closest('li')!;
    expect(within(boa).getByText('só PED')).toBeInTheDocument();
    expect(within(boa).getByText('reprovada no mês')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: /^Com problema/ }));
    await waitFor(() => expect(lista.queryByText('Sintético: rio 1')).toBeNull());
    expect(lista.getByText('Sintético: Boa Viagem')).toBeInTheDocument();
    expect(lista.getByText('Sintético: Areias')).toBeInTheDocument(); // 2 divergências
    expect(screen.getAllByText('DADOS DA REDE OBSERVACIONAL DO CEMADEN/MCTIC').length).toBeGreaterThan(0);
  });

  it('detalhe da estação: barras por fonte, lacuna, pico removido, divergências e apelidos', async () => {
    renderPage(<SensorsPage />);
    fireEvent.click(await screen.findByRole('button', { name: /Sintético: Areias/ }));
    const chart = await screen.findByTestId('station-chart');
    expect(chart.querySelectorAll('[data-source="CEMADEN_PED"]').length).toBeGreaterThan(0);
    expect(chart.querySelectorAll('[data-source="CEMADEN"]').length).toBeGreaterThan(0);
    expect(chart.querySelectorAll('[data-testid="gap"]')).toHaveLength(1);
    expect(chart.querySelectorAll('[data-testid="peak-mark"]')).toHaveLength(1);
    expect(chart).toHaveTextContent('50,3');
    expect(chart).toHaveTextContent('25,15');
    expect(within(screen.getByTestId('divergences')).getAllByRole('row')).toHaveLength(6); // cabeçalho + as 5 últimas horas com leitura
    expect(screen.getByTestId('aliases')).toHaveTextContent('CEMADEN_PED:SINT-A');
    expect(screen.getByTestId('quarantine')).toHaveTextContent('AFTER_GAP');
  });

  it('API de estações fora do ar: a lista segue com os sensores ao vivo', async () => {
    server.use(http.get('/api/stations/canonical', () => HttpResponse.json({}, { status: 500 })));
    renderPage(<SensorsPage />);
    expect(await screen.findByText('Sintético: pluviômetro 1')).toBeInTheDocument();
  });
});
