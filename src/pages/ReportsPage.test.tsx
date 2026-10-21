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

describe('ReportsPage', () => {
  it('fila de pendentes com altura da água, distância ao ponto e ações', async () => {
    renderPage(<ReportsPage />);
    const li = (await screen.findByText('Relato #1')).closest('li')!;
    expect(within(li).getByText('Pendente')).toBeInTheDocument();
    expect(within(li).getByText(/Até o joelho/)).toBeInTheDocument();
    expect(within(li).getByText(/a 250 m/)).toBeInTheDocument();
    expect(within(li).getByRole('button', { name: 'Confirmar relato 1' })).toBeInTheDocument();
    expect(screen.queryByText('Relato #3')).toBeNull(); // confirmados ficam fora do filtro Pendentes
  });

  it('texto do morador é exibido como texto (sem HTML)', async () => {
    server.use(http.get('/api/reports', () => HttpResponse.json({ page: 0, size: 20, totalElements: 1, content: [{ id: 9, latitude: -8, longitude: -34.9, observedAt: '2026-10-21T12:00:00Z', description: '<img src=x onerror=alert(1)>', status: 'PENDING', createdAt: '2026-10-21T12:00:00Z' }] })));
    const { container } = renderPage(<ReportsPage />);
    await screen.findByText('Relato #9');
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText(/<img src=x/)).toBeInTheDocument();
  });

  it('confirmar: ponto sugerido, gravidade e nota vão no PATCH; mostra aviso de sucesso', async () => {
    let sent: { id: string; body: unknown } | null = null;
    server.use(http.patch<{ id: string }>('/api/reports/:id', async ({ params, request }) => { sent = { id: params.id, body: await request.json() }; return HttpResponse.json({ id: 1, latitude: 0, longitude: 0, observedAt: 'x', status: 'CONFIRMED', createdAt: 'x' }); }));
    renderPage(<ReportsPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar relato 1' }));
    const dlg = await screen.findByRole('dialog', { name: 'Confirmar relato #1' });
    await waitFor(() => expect(within(dlg).getByLabelText('Ponto crítico')).toHaveValue('sintetico-1')); // lista de pontos carregada
    fireEvent.change(within(dlg).getByLabelText('Gravidade observada'), { target: { value: 'HIGH' } });
    fireEvent.change(within(dlg).getByLabelText('Nota (opcional)'), { target: { value: 'confirmado em campo' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Confirmar relato' }));
    await waitFor(() => expect(sent).not.toBeNull());
    expect(sent).toEqual({ id: '1', body: { status: 'CONFIRMED', floodPointSlug: 'sintetico-1', severity: 'HIGH', note: 'confirmado em campo' } });
    expect(await screen.findByText(/Relato confirmado e evento de alagamento criado/)).toBeInTheDocument();
  });

  it('confirmar sem ponto é bloqueado no formulário', async () => {
    server.use(http.get('/api/reports', () => HttpResponse.json({ page: 0, size: 20, totalElements: 1, content: [{ id: 5, latitude: 0, longitude: 0, observedAt: '2026-10-21T12:00:00Z', status: 'PENDING', nearestPointSlug: null, createdAt: '2026-10-21T12:00:00Z' }] })));
    let called = false;
    server.use(http.patch('/api/reports/:id', () => { called = true; return HttpResponse.json({}); }));
    renderPage(<ReportsPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar relato 5' }));
    const dlg = await screen.findByRole('dialog');
    fireEvent.click(within(dlg).getByRole('button', { name: 'Confirmar relato' }));
    expect(await within(dlg).findByText(/Escolha o ponto crítico/)).toBeInTheDocument();
    expect(called).toBe(false);
  });

  it('descartar exige motivo e envia reason', async () => {
    let body: unknown = null;
    server.use(http.patch('/api/reports/:id', async ({ request }) => { body = await request.json(); return HttpResponse.json({ id: 1, latitude: 0, longitude: 0, observedAt: 'x', status: 'DISCARDED', createdAt: 'x' }); }));
    renderPage(<ReportsPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Descartar relato 1' }));
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
    fireEvent.click(await screen.findByRole('button', { name: 'Descartar relato 1' }));
    const dlg = await screen.findByRole('dialog');
    fireEvent.change(within(dlg).getByLabelText('Motivo'), { target: { value: 'x' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Descartar relato' }));
    expect(await screen.findByText(/já foi revisado por outra pessoa/)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('filtro Confirmados mostra o evento criado; vazio e erro têm estado próprio', async () => {
    renderPage(<ReportsPage />);
    await screen.findByText('Relato #1');
    fireEvent.click(screen.getByRole('button', { name: 'Confirmados' }));
    const li = (await screen.findByText('Relato #3')).closest('li')!;
    expect(within(li).getByText(/evento de alagamento #7/)).toBeInTheDocument();
    server.use(http.get('/api/reports', () => HttpResponse.json({ page: 0, size: 20, totalElements: 0, content: [] })));
    fireEvent.click(screen.getByRole('button', { name: 'Descartados' }));
    expect(await screen.findByText('Nenhum relato nesta lista.')).toBeInTheDocument();
  });

  it('erro da API', async () => {
    server.use(http.get('/api/reports', () => HttpResponse.json({}, { status: 500 })));
    renderPage(<ReportsPage />);
    expect(await screen.findByText('Não foi possível carregar os relatos.', {}, { timeout: 3000 })).toBeInTheDocument();
  });
});
