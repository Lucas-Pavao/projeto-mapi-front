import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { screen, cleanup, fireEvent, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { RISK_MEANING } from '@/components/risk/risk';
import { renderPage } from '@/test/render';
import { MyStreetPage } from './MyStreetPage';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
  vi.unstubAllGlobals();
});
afterAll(() => server.close());

type Ok = (p: { coords: { latitude: number; longitude: number } }) => void;
type Fail = (e: { code: number; PERMISSION_DENIED: 1; POSITION_UNAVAILABLE: 2; TIMEOUT: 3 }) => void;
const geo = (impl: (ok: Ok, fail: Fail) => void) => vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: impl } });
const here = () => geo((ok) => ok({ coords: { latitude: -8.057384, longitude: -34.8771999 } }));
const denied = (code: number) => geo((_ok, fail) => fail({ code, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 }));
const go = () => fireEvent.click(screen.getByRole('button', { name: 'Usar minha localização' }));
const risk = (nearestPoint: unknown, extra: Record<string, unknown> = {}) => http.get('/api/public/risk', () => HttpResponse.json({ nearestPoint, rainLastHourMm: 3.2, rainStationId: 'P1', modelValidationStatus: 'NOT_VALIDATED', meaning: RISK_MEANING.MEDIUM, ...extra }));
const pt = (over: Record<string, unknown>) => ({ slug: 's', name: 'Sintético: ponto', distanceM: 300, riskLevel: 'MEDIUM', issuedAt: '2026-10-21T15:00:00Z', validUntil: null, degradationReason: null, ...over });

describe('MyStreetPage', () => {
  it('estado inicial traz o aviso fixo e não consulta nada', () => {
    renderPage(<MyStreetPage />);
    expect(screen.getByText('Informe onde você está.')).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent('não confirma nem descarta alagamento');
  });

  it('envia a posição arredondada a 3 casas (ADR 0013), sem login', async () => {
    here();
    let url: URL | null = null;
    server.use(http.get('/api/public/risk', ({ request }) => { url = new URL(request.url); return HttpResponse.json({ nearestPoint: null, modelValidationStatus: 'NOT_VALIDATED', meaning: '' }); }));
    renderPage(<MyStreetPage />);
    go();
    await screen.findByText('Não há ponto monitorado perto deste endereço.');
    expect(url!.searchParams.get('lat')).toBe('-8.057');
    expect(url!.searchParams.get('lon')).toBe('-34.877');
  });

  it('classe com ícone, rótulo, selo experimental e o texto RISK_MEANING sem reescrita', async () => {
    here();
    renderPage(<MyStreetPage />);
    go();
    const sec = await screen.findByRole('region', { name: 'Risco perto de você' });
    expect(sec.querySelector('[data-risk="MEDIUM"]')).toHaveTextContent('Moderado');
    expect(sec.querySelector('[data-risk="MEDIUM"] svg')).not.toBeNull();
    expect(sec.querySelector('[data-risk="MEDIUM"]')?.textContent).not.toMatch(/%/); // sem porcentagem no público
    expect(within(sec).getByText('Previsão experimental — modelo não validado')).toBeInTheDocument();
    expect(within(sec).getByText(RISK_MEANING.MEDIUM)).toBeInTheDocument();
    expect(within(sec).getByText(/a cerca de 300 m/)).toBeInTheDocument();
    expect(await screen.findByText(/3,2 mm/)).toBeInTheDocument();
  });

  it('UNKNOWN: sem % e sem selo experimental, com o motivo', async () => {
    here();
    server.use(risk(pt({ riskLevel: 'UNKNOWN', degradationReason: 'AI_UNAVAILABLE' }), { meaning: RISK_MEANING.UNKNOWN }));
    renderPage(<MyStreetPage />);
    go();
    const sec = await screen.findByRole('region', { name: 'Risco perto de você' });
    expect(sec.querySelector('[data-risk="UNKNOWN"]')).toHaveClass('border-dashed');
    expect(sec.textContent).not.toMatch(/%/);
    expect(within(sec).queryByText(/Previsão experimental/)).toBeNull();
    expect(screen.getByTestId('unknown-reason')).toHaveTextContent('o modelo está fora do ar');
  });

  it('sem pluviômetro perto: diz que não há leitura (não zero)', async () => {
    here();
    server.use(risk(pt({}), { rainLastHourMm: null, rainStationId: null }));
    renderPage(<MyStreetPage />);
    go();
    expect(await screen.findByText('Sem leitura de chuva da última hora num pluviômetro próximo.')).toBeInTheDocument();
  });

  it('fora da RMR (422) e limite de taxa (429 com Retry-After)', async () => {
    here();
    server.use(http.get('/api/public/risk', () => HttpResponse.json({}, { status: 422 })));
    const { unmount } = renderPage(<MyStreetPage />);
    go();
    expect(await screen.findByText(/fora da Região Metropolitana do Recife/)).toBeInTheDocument();
    unmount();
    server.use(http.get('/api/public/risk', () => HttpResponse.json({}, { status: 429, headers: { 'Retry-After': '30' } })));
    renderPage(<MyStreetPage />);
    go();
    expect(await screen.findByText(/Espere 30 segundos/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull();
  });

  it('erro de servidor oferece nova tentativa', async () => {
    here();
    server.use(http.get('/api/public/risk', () => HttpResponse.json({}, { status: 500 })));
    renderPage(<MyStreetPage />);
    go();
    expect(await screen.findByText(/Não foi possível consultar agora/, {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
  });

  it.each([[1, /não permitiu/], [3, /demorou demais/], [2, /Não foi possível descobrir/]])('geolocalização código %s tem mensagem própria', (code, re) => {
    denied(code);
    renderPage(<MyStreetPage />);
    go();
    expect(screen.getByRole('alert')).toHaveTextContent(re);
  });

  it('navegador sem geolocalização', () => {
    vi.stubGlobal('navigator', {});
    renderPage(<MyStreetPage />);
    go();
    expect(screen.getByRole('alert')).toHaveTextContent('não informa a localização');
  });
});
