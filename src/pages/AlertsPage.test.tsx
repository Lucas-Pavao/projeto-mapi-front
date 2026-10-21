import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { screen, cleanup, within, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { liveStreamHandler } from '@/mocks/handlers';
import { renderPage } from '@/test/render';
import { AlertsPage } from './AlertsPage';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

describe('AlertsPage: alertas', () => {
  it('lista os abertos com severidade, risco com rótulo experimental e UNKNOWN sem %', async () => {
    renderPage(<AlertsPage />);
    const alto = (await screen.findByText('Sintético: risco alto no ponto de teste')).closest('li')!;
    expect(within(alto).getByText('Crítico')).toBeInTheDocument();
    expect(within(alto).getByText('Alto')).toBeInTheDocument();
    expect(within(alto).getByText(/Previsão experimental/)).toBeInTheDocument();
    const unk = screen.getByText('Sintético: previsão indisponível').closest('li')!;
    expect(unk.querySelector('[data-risk="UNKNOWN"]')).toHaveTextContent('Previsão indisponível');
    expect(unk.textContent).not.toMatch(/%/);
    expect(within(unk).getByText(/o modelo demorou demais.*Isto não é queda de risco/)).toBeInTheDocument();
    expect(within(unk).queryByText(/Previsão experimental/)).toBeNull();
  });

  it('reconhecer chama POST /ack e avisa', async () => {
    let acked: string | null = null;
    server.use(http.post<{ id: string }>('/api/alerts/:id/ack', ({ params }) => { acked = params.id; return HttpResponse.json({ id: Number(params.id), kind: 'RISK_LEVEL', severity: 'CRITICAL', title: 'x', triggeredAt: '2026-10-21T12:00:00Z', acknowledgedAt: '2026-10-21T12:05:00Z' }); }));
    renderPage(<AlertsPage />);
    await screen.findByText('Sintético: risco alto no ponto de teste');
    fireEvent.click(screen.getByRole('button', { name: /Reconhecer alerta: Sintético: risco alto/ }));
    await waitFor(() => expect(acked).toBe('1'));
    expect(await screen.findByText('Alerta reconhecido.')).toBeInTheDocument();
  });

  it('403 no ack explica permissão/sessão', async () => {
    server.use(http.post('/api/alerts/:id/ack', () => HttpResponse.json({}, { status: 403 })));
    renderPage(<AlertsPage />);
    await screen.findByText('Sintético: risco alto no ponto de teste');
    fireEvent.click(screen.getAllByRole('button', { name: /Reconhecer alerta/ })[0]);
    expect(await screen.findByText(/Sem permissão para reconhecer o alerta/)).toBeInTheDocument();
  });

  it('filtro Reconhecidos mostra quem reconheceu e sem botão', async () => {
    renderPage(<AlertsPage />);
    await screen.findByText('Sintético: risco alto no ponto de teste');
    fireEvent.click(screen.getByRole('button', { name: 'Reconhecidos' }));
    const li = (await screen.findByText('Sintético: pluviômetro sem resposta')).closest('li')!;
    expect(within(li).getByText(/Reconhecido por sintetico.operador/)).toBeInTheDocument();
    expect(within(li).queryByRole('button')).toBeNull();
  });

  it('vazio, erro', async () => {
    server.use(http.get('/api/alerts', () => HttpResponse.json({ page: 0, size: 20, totalElements: 0, content: [] })));
    const { unmount } = renderPage(<AlertsPage />);
    expect(await screen.findByText('Nenhum alerta aberto.')).toBeInTheDocument();
    unmount();
    server.use(http.get('/api/alerts', () => HttpResponse.json({}, { status: 500 })));
    renderPage(<AlertsPage />);
    expect(await screen.findByText('Não foi possível carregar os alertas.', {}, { timeout: 3000 })).toBeInTheDocument();
  });

  it('alerta pelo stream entra na lista e avisa', async () => {
    server.use(liveStreamHandler({ heartbeatMs: 1000, maxBeats: 1, extraDelayMs: 300, extra: [{ event: 'alert', data: { id: 50, kind: 'RAIN_RATE', severity: 'WARNING', title: 'Sintético: chuva forte ao vivo', triggeredAt: new Date().toISOString() } }] }));
    renderPage(<AlertsPage />);
    await screen.findByText('Sintético: risco alto no ponto de teste');
    expect(await screen.findByText('Sintético: chuva forte ao vivo', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByText('Novo alerta: Sintético: chuva forte ao vivo')).toBeInTheDocument();
  });
});

describe('AlertsPage: regras', () => {
  const abre = async () => {
    renderPage(<AlertsPage />);
    fireEvent.click(await screen.findByRole('tab', { name: 'Regras' }));
    await screen.findByText('Chuva em 1 h');
  };

  it('lista regras com limiar, unidade e fonte', async () => {
    await abre();
    const chuva = screen.getByText('Chuva em 1 h').closest('li')!;
    expect(within(chuva).getByText(/55 mm\/h/)).toBeInTheDocument();
    expect(within(chuva).getByText(/fonte: Sintético/)).toBeInTheDocument();
  });

  it('criar regra exige fonte do limiar em RAIN_RATE e envia o corpo do contrato', async () => {
    let body: unknown = null;
    server.use(http.post('/api/alert-rules', async ({ request }) => { body = await request.json(); return HttpResponse.json({ ...(body as object), id: 9, createdBy: 'x', createdAt: '2026-10-21T12:00:00Z' }, { status: 201 }); }));
    await abre();
    fireEvent.click(screen.getByRole('button', { name: 'Nova regra' }));
    const dlg = await screen.findByRole('dialog', { name: 'Nova regra de alerta' });
    fireEvent.change(within(dlg).getByLabelText('Tipo de regra'), { target: { value: 'RAIN_RATE' } });
    fireEvent.change(within(dlg).getByLabelText('Limiar (mm/h)'), { target: { value: '60' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Salvar regra' }));
    expect(await within(dlg).findByText(/Informe de onde vem este limiar/)).toBeInTheDocument();
    expect(body).toBeNull();
    fireEvent.change(within(dlg).getByLabelText('Fonte do limiar (obrigatória)'), { target: { value: 'IDF TR 2 anos' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Salvar regra' }));
    await waitFor(() => expect(body).toMatchObject({ kind: 'RAIN_RATE', threshold: 60, thresholdSource: 'IDF TR 2 anos', enabled: true, channels: ['BROWSER'] }));
    expect(await screen.findByText('Regra salva.')).toBeInTheDocument();
  });

  it('TIDE_ABOVE mostra o aviso da ADR 0009', async () => {
    await abre();
    fireEvent.click(screen.getByRole('button', { name: 'Nova regra' }));
    const dlg = await screen.findByRole('dialog');
    fireEvent.change(within(dlg).getByLabelText('Tipo de regra'), { target: { value: 'TIDE_ABOVE' } });
    expect(within(dlg).getByTestId('tide-datum-notice')).toBeInTheDocument();
  });

  it('ativar/desativar manda PUT com a regra inteira', async () => {
    let put: { id: string; body: unknown } | null = null;
    server.use(http.put<{ id: string }>('/api/alert-rules/:id', async ({ params, request }) => { put = { id: params.id, body: await request.json() }; return HttpResponse.json({ ...(put.body as object), id: Number(params.id), createdBy: 'x', createdAt: '2026-10-21T12:00:00Z' }); }));
    await abre();
    fireEvent.click(screen.getByRole('switch', { name: 'Regra Sensor sem resposta ativa' }));
    await waitFor(() => expect(put?.id).toBe('3'));
    expect(put!.body).toMatchObject({ kind: 'SENSOR_STALE', threshold: 30, enabled: true });
    expect(put!.body).not.toHaveProperty('createdBy');
  });

  it('excluir pede confirmação e chama DELETE', async () => {
    let deleted: string | null = null;
    server.use(http.delete<{ id: string }>('/api/alert-rules/:id', ({ params }) => { deleted = params.id; return new HttpResponse(null, { status: 204 }); }));
    await abre();
    fireEvent.click(screen.getByRole('button', { name: 'Excluir regra Chuva em 1 h' }));
    const dlg = await screen.findByRole('dialog', { name: 'Excluir regra?' });
    expect(deleted).toBeNull();
    fireEvent.click(within(dlg).getByRole('button', { name: 'Excluir regra' }));
    await waitFor(() => expect(deleted).toBe('2'));
  });

  it('erro 400 ao salvar mostra mensagem no diálogo', async () => {
    server.use(http.put('/api/alert-rules/:id', () => HttpResponse.json({}, { status: 400 })));
    await abre();
    fireEvent.click(screen.getByRole('button', { name: 'Editar regra Chuva em 1 h' }));
    const dlg = await screen.findByRole('dialog');
    fireEvent.click(within(dlg).getByRole('button', { name: 'Salvar regra' }));
    expect(await within(dlg).findByText(/Dados inválidos ao salvar a regra/)).toBeInTheDocument();
  });
});
