import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { screen, cleanup, within, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderPage } from '@/test/render';
import { AdminPointsPage } from './AdminPointsPage';

// MapLibre não roda no jsdom (sem WebGL): o mapa vira uma área clicável que devolve uma coordenada fixa.
vi.mock('@/components/ui/map', () => ({
  Map: ({ children, onClick }: { children?: React.ReactNode; onClick?: (e: { lngLat: { lat: number; lng: number } }) => void }) => (
    <div data-testid="mapa" role="button" tabIndex={0} aria-label="Mapa de posição" onClick={() => onClick?.({ lngLat: { lat: -8.1, lng: -34.95 } })}>{children}</div>
  ),
  MapMarker: ({ children }: { children?: React.ReactNode }) => <div data-testid="marcador">{children}</div>,
  MarkerContent: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  MapCircle: () => <div data-testid="raio" />,
}));

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

const editar = async (nome: string) => fireEvent.click(await screen.findByRole('button', { name: `Editar ${nome}` }));
const form = () => screen.getByRole('form', { name: 'Editar ponto' });

describe('AdminPointsPage', () => {
  it('lista os pontos com slug, coordenada e ativo; o primeiro já vem aberto no formulário', async () => {
    renderPage(<AdminPointsPage />);
    const li = (await screen.findByText('Sintético: ponto de teste')).closest('li')!;
    expect(li).toHaveAttribute('data-active', 'true');
    expect(li).toHaveTextContent('sintetico-1');
    expect(screen.getByRole('switch', { name: 'Sintético: ponto sem previsão: ponto ativo' })).not.toBeChecked();
    expect(screen.getByText(/cadastrados · \d+ ativos no ciclo de previsão/)).toBeInTheDocument();
    expect(within(form()).getByText(/Editar · Sintético: ponto de teste/)).toBeInTheDocument();
    expect(within(form()).getByLabelText(/Slug/)).toHaveAttribute('readonly');
  });

  it('editar manda PATCH só com os campos alterados', async () => {
    let sent: { slug: string; body: unknown } | null = null;
    server.use(http.patch<{ slug: string }>('/api/pontos/:slug', async ({ params, request }) => { sent = { slug: params.slug, body: await request.json() }; return HttpResponse.json({}); }));
    renderPage(<AdminPointsPage />);
    await editar('Sintético: ponto de teste');
    fireEvent.click(within(form()).getByRole('button', { name: 'Salvar ponto' }));
    expect(await within(form()).findByText('Nada mudou.')).toBeInTheDocument();
    expect(sent).toBeNull();
    fireEvent.change(within(form()).getByLabelText(/Nome do local/), { target: { value: 'Novo nome' } });
    fireEvent.change(within(form()).getByLabelText(/Limiar de alerta de chuva/), { target: { value: '45' } });
    fireEvent.click(within(form()).getByRole('button', { name: 'Salvar ponto' }));
    await waitFor(() => expect(sent).not.toBeNull());
    expect(sent).toEqual({ slug: 'sintetico-1', body: { name: 'Novo nome', alertThresholdMm: 45 } });
    expect(await screen.findByText('Ponto salvo. Entra no próximo ciclo de previsão.')).toBeInTheDocument();
  });

  it('clicar no mapa move a coordenada e o PATCH leva latitude e longitude', async () => {
    let body: unknown = null;
    server.use(http.patch('/api/pontos/:slug', async ({ request }) => { body = await request.json(); return HttpResponse.json({}); }));
    renderPage(<AdminPointsPage />);
    await editar('Sintético: ponto de teste');
    fireEvent.click(screen.getByTestId('mapa'));
    expect(within(form()).getByLabelText(/Latitude/)).toHaveValue('-8.1');
    fireEvent.click(within(form()).getByRole('button', { name: 'Salvar ponto' }));
    await waitFor(() => expect(body).toEqual({ latitude: -8.1, longitude: -34.95 }));
  });

  it('coordenada inválida bloqueia o envio', async () => {
    let called = false;
    server.use(http.patch('/api/pontos/:slug', () => { called = true; return HttpResponse.json({}); }));
    renderPage(<AdminPointsPage />);
    await editar('Sintético: ponto de teste');
    fireEvent.change(within(form()).getByLabelText(/Latitude/), { target: { value: '200' } });
    fireEvent.click(within(form()).getByRole('button', { name: 'Salvar ponto' }));
    expect(await within(form()).findByText('Latitude entre -90 e 90.')).toBeInTheDocument();
    expect(called).toBe(false);
  });

  it('estações no raio: marcar liga a estação ao PATCH', async () => {
    let body: unknown = null;
    server.use(http.patch('/api/pontos/:slug', async ({ request }) => { body = await request.json(); return HttpResponse.json({}); }));
    renderPage(<AdminPointsPage />);
    await editar('Sintético: ponto sem previsão');
    const box = await within(form()).findByRole('checkbox', { name: /Sintético: pluviômetro/ }, { timeout: 3000 });
    fireEvent.click(box);
    fireEvent.click(within(form()).getByRole('button', { name: 'Salvar ponto' }));
    await waitFor(() => expect(body).toEqual({ pluviometerStationIds: ['SINTETICO-PLUV-01'] }));
  });

  it('ativar/desativar pelo interruptor manda {active}', async () => {
    let body: unknown = null;
    server.use(http.patch('/api/pontos/:slug', async ({ request }) => { body = await request.json(); return HttpResponse.json({}); }));
    renderPage(<AdminPointsPage />);
    fireEvent.click(await screen.findByRole('switch', { name: 'Sintético: ponto sem previsão: ponto ativo' }));
    await waitFor(() => expect(body).toEqual({ active: true }));
  });

  it('403 ao salvar explica o motivo', async () => {
    server.use(http.patch('/api/pontos/:slug', () => HttpResponse.json({}, { status: 403 })));
    renderPage(<AdminPointsPage />);
    await editar('Sintético: ponto de teste');
    fireEvent.change(within(form()).getByLabelText(/Nome do local/), { target: { value: 'x' } });
    fireEvent.click(within(form()).getByRole('button', { name: 'Salvar ponto' }));
    expect(await screen.findByText(/Sem permissão para salvar o ponto/)).toBeInTheDocument();
  });

  it('novo ponto valida o slug e envia o corpo do cadastro', async () => {
    let body: unknown = null;
    server.use(http.post('/api/pontos', async ({ request }) => { body = await request.json(); return HttpResponse.json({ slug: 'novo-ponto' }, { status: 201 }); }));
    renderPage(<AdminPointsPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Novo ponto' }));
    expect(within(form()).getByText('Novo ponto crítico')).toBeInTheDocument();
    fireEvent.change(within(form()).getByLabelText(/Slug/), { target: { value: 'com espaço' } });
    fireEvent.click(within(form()).getByRole('button', { name: 'Salvar ponto' }));
    expect(await within(form()).findByText(/sem espaços/)).toBeInTheDocument();
    fireEvent.change(within(form()).getByLabelText(/Slug/), { target: { value: 'novo-ponto' } });
    fireEvent.change(within(form()).getByLabelText(/Nome do local/), { target: { value: 'Novo' } });
    fireEvent.change(within(form()).getByLabelText(/Latitude/), { target: { value: '-8,06' } });
    fireEvent.change(within(form()).getByLabelText(/Longitude/), { target: { value: '-34,88' } });
    fireEvent.change(within(form()).getByLabelText(/Altitude/), { target: { value: '2,9' } });
    fireEvent.click(within(form()).getByRole('button', { name: 'Salvar ponto' }));
    await waitFor(() => expect(body).toEqual({ slug: 'novo-ponto', name: 'Novo', municipality: 'Recife', latitude: -8.06, longitude: -34.88, altitudeM: 2.9 }));
  });

  it('vazio e erro', async () => {
    server.use(http.get('/api/pontos', () => HttpResponse.json([])));
    const { unmount } = renderPage(<AdminPointsPage />);
    expect(await screen.findByText('Nenhum ponto cadastrado.')).toBeInTheDocument();
    unmount();
    server.use(http.get('/api/pontos', () => HttpResponse.json({}, { status: 500 })));
    renderPage(<AdminPointsPage />);
    expect(await screen.findByText('Não foi possível carregar os pontos.', {}, { timeout: 3000 })).toBeInTheDocument();
  });
});
