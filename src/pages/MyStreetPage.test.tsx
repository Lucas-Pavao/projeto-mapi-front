import React from 'react';
import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach, vi } from 'vitest';
import { screen, cleanup, fireEvent, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { HEADLINE } from '@/features/public-risk/utils/headlines';
import { renderPage } from '@/test/render';
// O mapa precisa de WebGL: aqui vira um botão que "clica" em coordenadas escolhidas pelo teste.
let clickAt: { lat: number; lng: number } = { lat: -8.0476, lng: -34.877 };
vi.mock('@/components/ui/map', () => ({
  Map: ({ children, onClick }: { children?: React.ReactNode; onClick?: (e: { lngLat: { lat: number; lng: number } }) => void }) => (
    <div><button type="button" onClick={() => onClick?.({ lngLat: clickAt })}>mapa-clique</button>{children}</div>
  ),
  MapMarker: ({ children, latitude, longitude }: { children?: React.ReactNode; latitude: number; longitude: number }) => <div data-testid="marcador" data-lat={latitude} data-lon={longitude}>{children}</div>,
  MarkerContent: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  useMap: () => ({ map: null, isLoaded: false }),
}));
import { MyStreetPage } from './MyStreetPage';

const pontos = http.get('/api/pontos', () => HttpResponse.json([]));
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => server.use(pontos));
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
const go = () => fireEvent.click(screen.getByRole('button', { name: 'Onde estou' }));
const risk = (nearestPoint: unknown, extra: Record<string, unknown> = {}) => http.get('/api/public/risk', () => HttpResponse.json({ nearestPoint, rainLastHourMm: 3.2, rainStationId: 'P1', experimental: true, inTest: false, meaning: HEADLINE.ATENCAO, ...extra }));
const pt = (over: Record<string, unknown>) => ({ slug: 's', name: 'Sintético: ponto', distanceM: 300, level: 'ATENCAO', worstHorizonHours: 3, issuedAt: '2026-10-21T15:00:00Z', reason: null, ...over });

describe('aviso público (pergunta 52)', () => {
  it('sem telefone enquanto o número oficial não for informado (TODO F3-PUBLICO-TELEFONE)', async () => {
    const { PUBLIC_WARNING } = await import('@/features/public-risk/utils/headlines');
    expect(PUBLIC_WARNING).not.toMatch(/\d{3,}/);
    expect(PUBLIC_WARNING).not.toMatch(/\(\d{2}\)|0800|tel/i);
    expect(PUBLIC_WARNING).toContain('Defesa Civil');
  });
});

describe('MyStreetPage', () => {
  it('traz os atalhos de emergência e de relato, sem prometer busca por endereço', () => {
    renderPage(<MyStreetPage />);
    expect(screen.getByRole('link', { name: 'Emergência: 199' })).toHaveAttribute('href', 'tel:199');
    expect(screen.getByRole('link', { name: 'Está alagado aqui? Avise' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).toBeNull();
  });
  it('estado inicial traz o aviso fixo e não consulta nada', () => {
    renderPage(<MyStreetPage />);
    expect(screen.getByText('Informe onde você está.')).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent('não confirma nem descarta alagamento');
  });

  it('envia a posição arredondada a 3 casas (ADR 0013), sem login', async () => {
    here();
    let url: URL | null = null;
    server.use(http.get('/api/public/risk', ({ request }) => { url = new URL(request.url); return HttpResponse.json({ nearestPoint: null, experimental: true, inTest: true, meaning: '' }); }));
    renderPage(<MyStreetPage />);
    go();
    await screen.findByText('Não há ponto monitorado perto deste endereço.');
    expect(url!.searchParams.get('lat')).toBe('-8.057');
    expect(url!.searchParams.get('lon')).toBe('-34.877');
  });

  it('modo sombra (padrão do serviço): "em teste", sem selo de nível, nunca "sem alerta" nem "seguro"', async () => {
    here();
    renderPage(<MyStreetPage />);
    go();
    const sec = await screen.findByRole('region', { name: 'Alerta perto de você' });
    expect(within(sec).getByTestId('public-headline')).toHaveTextContent('O alerta de alagamento ainda está em teste.');
    expect(within(sec).queryByTestId('public-chip')).toBeNull();
    expect(sec.textContent).not.toMatch(/Sem alerta|%|risco baixo/);
    expect(sec.textContent).toMatch(/Isto não quer dizer que está seguro/);
    expect(within(sec).getByText(/a cerca de 300 m/)).toBeInTheDocument();
    expect(await screen.findByText(/3,2 mm/)).toBeInTheDocument();
  });

  it.each([
    ['ALERTA', 'Alerta', HEADLINE.ALERTA],
    ['ATENCAO', 'Atenção', HEADLINE.ATENCAO],
    ['SEM_ALERTA', 'Sem alerta', HEADLINE.SEM_ALERTA],
    ['SEM_DADO', 'Sem dado', HEADLINE.SEM_DADO],
  ])('fora do modo sombra, %s: selo e manchete pelo nível, sem porcentagem', async (level, chip, headline) => {
    here();
    server.use(risk(pt({ level }), { meaning: headline }));
    renderPage(<MyStreetPage />);
    go();
    const sec = await screen.findByRole('region', { name: 'Alerta perto de você' });
    expect(within(sec).getByTestId('public-chip')).toHaveTextContent(chip);
    expect(within(sec).getByTestId('public-headline')).toHaveTextContent(headline);
    expect(sec.textContent).not.toMatch(/%|risco baixo/);
    if (level === 'SEM_DADO') expect(sec.textContent).toMatch(/Isto não quer dizer que está seguro/);
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

  it('toque no mapa escolhe o local: marcador no ponto, consulta com posição arredondada, sem busca por endereço', async () => {
    let url: URL | null = null;
    server.use(http.get('/api/public/risk', ({ request }) => { url = new URL(request.url); return HttpResponse.json({ nearestPoint: pt({}), rainLastHourMm: null, rainStationId: null, experimental: true, inTest: false, meaning: HEADLINE.ATENCAO }); }));
    renderPage(<MyStreetPage />);
    expect(screen.getByText(/Sem busca por endereço/)).toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(screen.queryByLabelText(/endereço/i)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'mapa-clique' }));
    await screen.findByRole('region', { name: 'Alerta perto de você' });
    expect(url!.searchParams.get('lat')).toBe('-8.048');
    expect(url!.searchParams.get('lon')).toBe('-34.877');
    expect(screen.getByTestId('marcador')).toHaveAttribute('data-lat', '-8.0476');
    expect(screen.getByRole('img', { name: 'Local escolhido' })).toBeInTheDocument();
  });

  it('toque no mapa fora da RMR não consulta e explica', async () => {
    let called = 0;
    server.use(http.get('/api/public/risk', () => { called++; return HttpResponse.json({}); }));
    clickAt = { lat: -23.55, lng: -46.63 };
    renderPage(<MyStreetPage />);
    fireEvent.click(screen.getByRole('button', { name: 'mapa-clique' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('fora da Região Metropolitana do Recife');
    expect(called).toBe(0);
    expect(screen.queryByTestId('marcador')).toBeNull();
    clickAt = { lat: -8.0476, lng: -34.877 };
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
