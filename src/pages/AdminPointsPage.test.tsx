import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { screen, cleanup, within, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderPage } from '@/test/render';
import { AdminPointsPage } from './AdminPointsPage';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

describe('AdminPointsPage', () => {
  it('lista pontos com risco (ícone + rótulo + experimental) e inativo sem selo de risco', async () => {
    renderPage(<AdminPointsPage />);
    const ativo = (await screen.findByText('Sintético: ponto de teste')).closest('li')!;
    expect(ativo.querySelector('[data-risk="HIGH"]')).toHaveTextContent('Alto');
    expect(within(ativo).getByText(/Previsão experimental/)).toBeInTheDocument();
    const inativo = screen.getByText('Sintético: ponto sem previsão').closest('li')!;
    expect(inativo).toHaveAttribute('data-active', 'false');
    expect(within(inativo).getByText('Inativo', { selector: 'span.rounded-md' })).toBeInTheDocument();
  });

  it('editar manda PATCH só com os campos alterados', async () => {
    let sent: { slug: string; body: unknown } | null = null;
    server.use(http.patch<{ slug: string }>('/api/pontos/:slug', async ({ params, request }) => { sent = { slug: params.slug, body: await request.json() }; return HttpResponse.json({}); }));
    renderPage(<AdminPointsPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Editar Sintético: ponto de teste' }));
    const dlg = await screen.findByRole('dialog');
    fireEvent.click(within(dlg).getByRole('button', { name: 'Salvar alterações' }));
    expect(await within(dlg).findByText('Nada mudou.')).toBeInTheDocument();
    expect(sent).toBeNull();
    fireEvent.change(within(dlg).getByLabelText('Nome'), { target: { value: 'Novo nome' } });
    fireEvent.change(within(dlg).getByLabelText('Limiar de alerta de chuva (mm)'), { target: { value: '45' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Salvar alterações' }));
    await waitFor(() => expect(sent).not.toBeNull());
    expect(sent).toEqual({ slug: 'sintetico-1', body: { name: 'Novo nome', alertThresholdMm: 45 } });
    expect(await screen.findByText('Ponto atualizado.')).toBeInTheDocument();
  });

  it('coordenada inválida bloqueia o envio', async () => {
    let called = false;
    server.use(http.patch('/api/pontos/:slug', () => { called = true; return HttpResponse.json({}); }));
    renderPage(<AdminPointsPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Editar Sintético: ponto de teste' }));
    const dlg = await screen.findByRole('dialog');
    fireEvent.change(within(dlg).getByLabelText('Latitude'), { target: { value: '200' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Salvar alterações' }));
    expect(await within(dlg).findByText('Latitude entre -90 e 90.')).toBeInTheDocument();
    expect(called).toBe(false);
  });

  it('sugestões de estação: marcar liga a estação ao PATCH', async () => {
    let body: unknown = null;
    server.use(http.patch('/api/pontos/:slug', async ({ request }) => { body = await request.json(); return HttpResponse.json({}); }));
    renderPage(<AdminPointsPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Editar Sintético: ponto sem previsão' }));
    const dlg = await screen.findByRole('dialog');
    fireEvent.click(within(dlg).getByRole('button', { name: /Sugerir estações/ }));
    const box = await within(dlg).findByRole('checkbox', { name: /Sintético: pluviômetro/ });
    fireEvent.click(box);
    fireEvent.click(within(dlg).getByRole('button', { name: 'Salvar alterações' }));
    await waitFor(() => expect(body).toEqual({ pluviometerStationIds: ['SINTETICO-PLUV-01'] }));
  });

  it('ativar/desativar pelo interruptor manda {active}', async () => {
    let body: unknown = null;
    server.use(http.patch('/api/pontos/:slug', async ({ request }) => { body = await request.json(); return HttpResponse.json({}); }));
    renderPage(<AdminPointsPage />);
    fireEvent.click(await screen.findByRole('switch', { name: 'Sintético: ponto sem previsão: ponto ativo' }));
    await waitFor(() => expect(body).toEqual({ active: true }));
  });

  it('403 ao salvar explica; 409/validação não somem', async () => {
    server.use(http.patch('/api/pontos/:slug', () => HttpResponse.json({}, { status: 403 })));
    renderPage(<AdminPointsPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Editar Sintético: ponto de teste' }));
    const dlg = await screen.findByRole('dialog');
    fireEvent.change(within(dlg).getByLabelText('Nome'), { target: { value: 'x' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Salvar alterações' }));
    expect(await within(dlg).findByText(/Sem permissão para salvar o ponto/)).toBeInTheDocument();
  });

  it('criar ponto valida o slug e envia o corpo', async () => {
    let body: unknown = null;
    server.use(http.post('/api/pontos', async ({ request }) => { body = await request.json(); return HttpResponse.json({}, { status: 201 }); }));
    renderPage(<AdminPointsPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Novo ponto' }));
    const dlg = await screen.findByRole('dialog', { name: 'Novo ponto crítico' });
    fireEvent.change(within(dlg).getByLabelText('Identificador (slug)'), { target: { value: 'com espaço' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Criar ponto' }));
    expect(await within(dlg).findByText(/sem espaços/)).toBeInTheDocument();
    fireEvent.change(within(dlg).getByLabelText('Identificador (slug)'), { target: { value: 'novo-ponto' } });
    fireEvent.change(within(dlg).getByLabelText('Nome'), { target: { value: 'Novo' } });
    fireEvent.change(within(dlg).getByLabelText('Latitude'), { target: { value: '-8,06' } });
    fireEvent.change(within(dlg).getByLabelText('Longitude'), { target: { value: '-34,88' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Criar ponto' }));
    await waitFor(() => expect(body).toEqual({ slug: 'novo-ponto', name: 'Novo', latitude: -8.06, longitude: -34.88 }));
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
