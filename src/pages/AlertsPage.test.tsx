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

const lista = async () => within(await screen.findByRole('list', { name: 'Lista de alertas' }));

describe('AlertsPage: alertas', () => {
  it('lista os abertos com severidade, risco com rótulo experimental e UNKNOWN sem %', async () => {
    renderPage(<AlertsPage />);
    const alto = (await (await lista()).findByText('Sintético: risco alto no ponto de teste')).closest('li')!;
    expect(within(alto).getByText('Crítico')).toBeInTheDocument();
    expect(within(alto).getByText('Alto')).toBeInTheDocument();
    expect(within(alto).getByText(/Previsão experimental/)).toBeInTheDocument();
    const unk = (await lista()).getByText('Sintético: previsão indisponível').closest('li')!;
    expect(unk.querySelector('[data-risk="UNKNOWN"]')).toHaveTextContent('Previsão indisponível');
    expect(unk.textContent).not.toMatch(/%/);
    expect(within(unk).getByText(/o modelo demorou demais.*Isto não é queda de risco/)).toBeInTheDocument();
    expect(within(unk).queryByText(/Previsão experimental/)).toBeNull();
  });

  it('reconhecer chama POST /ack e avisa', async () => {
    let acked: string | null = null;
    server.use(http.post<{ id: string }>('/api/alerts/:id/ack', ({ params }) => { acked = params.id; return HttpResponse.json({ id: Number(params.id), kind: 'RISK_LEVEL', severity: 'CRITICAL', title: 'x', triggeredAt: '2026-10-21T12:00:00Z', acknowledgedAt: '2026-10-21T12:05:00Z' }); }));
    renderPage(<AlertsPage />);
    await (await lista()).findByText('Sintético: risco alto no ponto de teste');
    fireEvent.click(screen.getByRole('button', { name: /Reconhecer alerta: Sintético: risco alto/ }));
    await waitFor(() => expect(acked).toBe('1'));
    expect(await screen.findByText('Alerta reconhecido.')).toBeInTheDocument();
  });

  it('403 no ack explica permissão/sessão', async () => {
    server.use(http.post('/api/alerts/:id/ack', () => HttpResponse.json({}, { status: 403 })));
    renderPage(<AlertsPage />);
    await (await lista()).findByText('Sintético: risco alto no ponto de teste');
    fireEvent.click(screen.getAllByRole('button', { name: /Reconhecer alerta/ })[0]);
    expect(await screen.findByText(/Sem permissão para reconhecer o alerta/)).toBeInTheDocument();
  });

  it('alerta reconhecido aparece lido, com quem reconheceu e sem botão', async () => {
    renderPage(<AlertsPage />);
    const li = (await (await lista()).findByText('Sintético: pluviômetro sem resposta')).closest('li')!;
    expect(li).toHaveAttribute('data-open', 'false');
    expect(within(li).getByText(/Reconhecido por sintetico.operador/)).toBeInTheDocument();
    expect(within(li).queryByRole('button')).toBeNull();
    expect(screen.getByText(/não lidos de 3/)).toHaveTextContent('2 não lidos de 3');
  });

  it('filtros em pílula mostram a contagem e filtram a lista', async () => {
    renderPage(<AlertsPage />);
    await (await lista()).findByText('Sintético: risco alto no ponto de teste');
    expect(screen.getByRole('radio', { name: /Risco 2/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Sensores 1/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: /Sensores/ }));
    expect((await lista()).queryByText('Sintético: risco alto no ponto de teste')).toBeNull();
    expect((await lista()).getByText('Sintético: pluviômetro sem resposta')).toBeInTheDocument();
  });

  it('vazio, erro', async () => {
    server.use(http.get('/api/alerts', () => HttpResponse.json({ page: 0, size: 20, totalElements: 0, content: [] })));
    const { unmount } = renderPage(<AlertsPage />);
    expect(await screen.findByText('Nada por aqui ainda.')).toBeInTheDocument();
    unmount();
    server.use(http.get('/api/alerts', () => HttpResponse.json({}, { status: 500 })));
    renderPage(<AlertsPage />);
    expect(await screen.findByText('Não foi possível carregar os alertas.', {}, { timeout: 3000 })).toBeInTheDocument();
  });

  it('alerta pelo stream entra na lista e avisa', async () => {
    server.use(liveStreamHandler({ heartbeatMs: 1000, maxBeats: 1, extraDelayMs: 300, extra: [{ event: 'alert', data: { id: 50, kind: 'RAIN_RATE', severity: 'WARNING', title: 'Sintético: chuva forte ao vivo', triggeredAt: new Date().toISOString() } }] }));
    renderPage(<AlertsPage />);
    await (await lista()).findByText('Sintético: risco alto no ponto de teste');
    expect(await (await lista()).findByText('Sintético: chuva forte ao vivo', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByText('Novo alerta: Sintético: chuva forte ao vivo')).toBeInTheDocument();
  });
});

describe('AlertsPage: regras', () => {
  const abre = async () => {
    renderPage(<AlertsPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Todas as regras' }));
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
    const dlg = await screen.findByRole('dialog', { name: 'Nova regra de alerta' });
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
    const dlg = await screen.findByRole('dialog', { name: 'Editar regra de alerta' });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Salvar regra' }));
    expect(await within(dlg).findByText(/Dados inválidos ao salvar a regra/)).toBeInTheDocument();
  });
});

describe('AlertsPage: painel de regras', () => {
  it('nível mínimo grava a regra de risco; canais por vir ficam desabilitados', async () => {
    let put: { id: string; body: unknown } | null = null;
    server.use(http.put<{ id: string }>('/api/alert-rules/:id', async ({ params, request }) => { put = { id: params.id, body: await request.json() }; return HttpResponse.json({ ...(put.body as object), id: Number(params.id), createdBy: 'x', createdAt: '2026-10-21T12:00:00Z' }); }));
    renderPage(<AlertsPage />);
    const grupo = await screen.findByRole('radiogroup', { name: 'Nível mínimo' });
    await waitFor(() => expect(within(grupo).getByRole('radio', { name: 'Só alto' })).toHaveAttribute('aria-checked', 'true'));
    fireEvent.click(within(grupo).getByRole('radio', { name: 'Moderado ou alto' }));
    await waitFor(() => expect(put?.id).toBe('1'));
    expect(put!.body).toMatchObject({ kind: 'RISK_LEVEL', minRisk: 'MEDIUM' });
    for (const nome of ['E-mail', 'WhatsApp', 'Telegram']) expect(screen.getByRole('checkbox', { name: new RegExp(nome) })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: /Navegador/ })).not.toBeDisabled();
    expect(screen.getAllByText('em breve')).toHaveLength(3);
  });

  it('limiar de chuva só grava ao soltar e registra o ajuste na fonte', async () => {
    let body: Record<string, unknown> | null = null;
    server.use(http.put('/api/alert-rules/:id', async ({ request }) => { body = (await request.json()) as Record<string, unknown>; return HttpResponse.json({ ...body, id: 2, createdBy: 'x', createdAt: '2026-10-21T12:00:00Z' }); }));
    renderPage(<AlertsPage />);
    const slider = await screen.findByLabelText(/Chuva forte a partir de/);
    await waitFor(() => expect(slider).toHaveValue('55'));
    fireEvent.change(slider, { target: { value: '40' } });
    expect(body).toBeNull();
    fireEvent.pointerUp(slider);
    await waitFor(() => expect(body).toMatchObject({ kind: 'RAIN_RATE', threshold: 40 }));
    expect(String(body!.thresholdSource)).toContain('Ajuste do operador');
    expect(String(body!.thresholdSource)).toContain('antes: Sintético');
  });
});
