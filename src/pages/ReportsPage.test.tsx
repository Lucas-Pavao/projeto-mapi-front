import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { screen, cleanup, within, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderPage } from '@/test/render';
import { ReportsPage } from './ReportsPage';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

const fila = async () => within(await screen.findByRole('list', { name: 'Relatos' }));
const detalhe = async () => within(await screen.findByRole('region', { name: 'Relato selecionado' }));

describe('ReportsPage', () => {
  it('fila de aguardando com altura da água, hora e status; o relato selecionado mostra a distância ao ponto', async () => {
    renderPage(<ReportsPage />);
    const li = (await (await fila()).findByText(/Relato #1 ·/)).closest('li')!;
    expect(within(li).getByText('aguardando')).toBeInTheDocument();
    expect(within(li).getByText(/Até o joelho/)).toBeInTheDocument();
    expect((await detalhe()).getByText(/a 250 m/)).toBeInTheDocument();
    expect((await detalhe()).getByRole('button', { name: 'Confirmar relato 1' })).toBeInTheDocument();
    expect((await fila()).queryByText(/Relato #3 ·/)).toBeNull(); // confirmados ficam fora da aba Aguardando
    expect(screen.getByRole('button', { name: /Aguardando/ })).toHaveTextContent('1');
  });

  it('texto do morador é exibido como texto (sem HTML)', async () => {
    server.use(http.get('/api/reports', () => HttpResponse.json({ page: 0, size: 100, totalElements: 1, content: [{ id: 9, latitude: -8, longitude: -34.9, observedAt: '2026-10-21T12:00:00Z', description: '<img src=x onerror=alert(1)>', status: 'PENDING', createdAt: '2026-10-21T12:00:00Z' }] })));
    const { container } = renderPage(<ReportsPage />);
    await (await fila()).findByText(/Relato #9 ·/);
    expect(container.querySelector('img')).toBeNull();
    expect((await detalhe()).getByText(/<img src=x/)).toBeInTheDocument();
  });

  it('confirmar: ponto sugerido e gravidade escolhida vão no PATCH; mostra aviso de sucesso', async () => {
    let sent: { id: string; body: unknown } | null = null;
    server.use(http.patch<{ id: string }>('/api/reports/:id', async ({ params, request }) => { sent = { id: params.id, body: await request.json() }; return HttpResponse.json({ id: 1, latitude: 0, longitude: 0, observedAt: 'x', status: 'CONFIRMED', createdAt: 'x' }); }));
    renderPage(<ReportsPage />);
    const d = await detalhe();
    fireEvent.click(await d.findByRole('radio', { name: 'Alta' }));
    fireEvent.click(d.getByRole('button', { name: 'Confirmar relato 1' }));
    await waitFor(() => expect(sent).not.toBeNull());
    expect(sent).toEqual({ id: '1', body: { status: 'CONFIRMED', floodPointSlug: 'sintetico-1', severity: 'HIGH' } });
    expect(await screen.findByText(/Relato confirmado e evento de alagamento criado/)).toBeInTheDocument();
  });

  it('previsão atual do ponto vem com risco rotulado e aviso experimental', async () => {
    renderPage(<ReportsPage />);
    const d = await detalhe();
    expect(await d.findByText(/Previsão experimental/)).toBeInTheDocument();
    expect(d.getByText('Previsão atual do ponto')).toBeInTheDocument();
  });

  it('confirmar sem ponto sugerido abre o formulário e bloqueia sem ponto', async () => {
    server.use(http.get('/api/reports', () => HttpResponse.json({ page: 0, size: 100, totalElements: 1, content: [{ id: 5, latitude: 0, longitude: 0, observedAt: '2026-10-21T12:00:00Z', status: 'PENDING', nearestPointSlug: null, createdAt: '2026-10-21T12:00:00Z' }] })));
    let called = false;
    server.use(http.patch('/api/reports/:id', () => { called = true; return HttpResponse.json({}); }));
    renderPage(<ReportsPage />);
    fireEvent.click(await (await detalhe()).findByRole('button', { name: 'Confirmar relato 5' }));
    const dlg = await screen.findByRole('dialog');
    fireEvent.click(within(dlg).getByRole('button', { name: 'Confirmar relato' }));
    expect(await within(dlg).findByText(/Escolha o ponto crítico/)).toBeInTheDocument();
    expect(called).toBe(false);
  });

  it('descartar exige motivo e envia reason', async () => {
    let body: unknown = null;
    server.use(http.patch('/api/reports/:id', async ({ request }) => { body = await request.json(); return HttpResponse.json({ id: 1, latitude: 0, longitude: 0, observedAt: 'x', status: 'DISCARDED', createdAt: 'x' }); }));
    renderPage(<ReportsPage />);
    fireEvent.click(await (await detalhe()).findByRole('button', { name: 'Descartar relato 1' }));
    const dlg = await screen.findByRole('dialog', { name: 'Descartar relato #1' });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Descartar relato' }));
    expect(await within(dlg).findByText(/Diga por que o relato foi descartado/)).toBeInTheDocument();
    expect(body).toBeNull();
    fireEvent.change(within(dlg).getByLabelText('Motivo'), { target: { value: 'duplicado' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Descartar relato' }));
    await waitFor(() => expect(body).toEqual({ status: 'DISCARDED', reason: 'duplicado' }));
    expect(await screen.findByText('Relato descartado.')).toBeInTheDocument();
  });

  it('409 (já revisado) fecha o diálogo, avisa e atualiza a fila', async () => {
    server.use(http.patch('/api/reports/:id', () => HttpResponse.json({}, { status: 409 })));
    renderPage(<ReportsPage />);
    fireEvent.click(await (await detalhe()).findByRole('button', { name: 'Descartar relato 1' }));
    const dlg = await screen.findByRole('dialog');
    fireEvent.change(within(dlg).getByLabelText('Motivo'), { target: { value: 'x' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Descartar relato' }));
    expect(await screen.findByText(/já foi revisado por outra pessoa/)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('aba Confirmados mostra o evento criado; aba sem itens tem estado próprio', async () => {
    renderPage(<ReportsPage />);
    await (await fila()).findByText(/Relato #1 ·/);
    fireEvent.click(screen.getByRole('button', { name: /Confirmados/ }));
    const li = (await (await fila()).findByText(/Relato #3 ·/)).closest('li')!;
    expect(li).toHaveAttribute('data-status', 'CONFIRMED');
    expect(await (await detalhe()).findByText(/Evento registrado \(#7\)/)).toBeInTheDocument();
    expect((await detalhe()).queryByRole('button', { name: /Confirmar relato/ })).toBeNull();
  });

  it('erro da API', async () => {
    server.use(http.get('/api/reports', () => HttpResponse.json({}, { status: 500 })));
    renderPage(<ReportsPage />);
    expect(await screen.findByText('Não foi possível carregar os relatos.', {}, { timeout: 3000 })).toBeInTheDocument();
  });
});
