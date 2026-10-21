import { expect, type Page, type Route, type TestInfo } from '@playwright/test';

/**
 * Dados e rotas sintéticos para o e2e (page.route; sem MSW e sem API real). Nada aqui é medição,
 * previsão ou ocorrência: todo nome começa com "Sintético".
 */
const MIN = 60_000;
export const ago = (m: number) => new Date(Date.now() - m * MIN).toISOString();
export const ahead = (m: number) => new Date(Date.now() + m * MIN).toISOString();

export type Role = 'USER' | 'OPERADOR' | 'ADMIN';

const pointBase = { municipality: 'Recife', description: null, altitudeM: 3, distanceToChannelM: 100, basinName: null, sensorConfig: null, active: true, tideHeight: null, tideUnit: null };
export const PONTO_ALTO = { ...pointBase, id: 1, slug: 'sintetico-alto', name: 'Sintético: ponto alto', latitude: -8.05, longitude: -34.9, floodPrediction: { riskLevel: 'HIGH', floodProbability: 0.78, modelValidationStatus: 'NOT_VALIDATED', issuedAt: ago(10), horizonHours: 1 } };
export const PONTO_INDISP = { ...pointBase, id: 2, slug: 'sintetico-indisponivel', name: 'Sintético: ponto sem previsão', latitude: -8.05, longitude: -34.907, floodPrediction: { riskLevel: 'UNKNOWN', floodProbability: null, degradationReason: 'AI_UNAVAILABLE', lastValidIssuedAt: ago(90), modelValidationStatus: 'NOT_VALIDATED', issuedAt: ago(5) } };
export const PONTO_BAIXO = { ...pointBase, id: 3, slug: 'sintetico-baixo', name: 'Sintético: ponto baixo', latitude: -8.06, longitude: -34.92, floodPrediction: { riskLevel: 'LOW', floodProbability: 0.12, modelValidationStatus: 'NOT_VALIDATED', issuedAt: ago(10), horizonHours: 1 } };
export const PONTOS = [PONTO_INDISP, PONTO_ALTO, PONTO_BAIXO];

export const prediction = (slug: string, riskLevel: string, minutesAgo: number, extra: Record<string, unknown> = {}) => ({
  slug, riskLevel, probability: riskLevel === 'UNKNOWN' ? null : riskLevel === 'HIGH' ? 0.78 : riskLevel === 'MEDIUM' ? 0.41 : 0.12,
  issuedAt: ago(minutesAgo), validUntil: ago(minutesAgo - 60), horizonHours: 1, modelVersion: 'sintetico-0', degradationReason: null, modelValidationStatus: 'NOT_VALIDATED', ...extra,
});
export const predictionsFor = (slug: string) => [
  prediction(slug, 'LOW', 300), prediction(slug, 'LOW', 240), prediction(slug, 'MEDIUM', 180), prediction(slug, 'HIGH', 120), prediction(slug, 'HIGH', 60),
  prediction(slug, 'UNKNOWN', 10, { modelVersion: null, validUntil: null, horizonHours: null, degradationReason: 'AI_TIMEOUT', lastValidIssuedAt: ago(60) }),
];

export const SENSORES = [
  { sensorId: 'SINTETICO-PLUV-01', type: 'PRECIPITATION', value: 2.4, unit: 'mm', observedAt: ago(8), ageSeconds: 480, stale: false, stationName: 'Sintético: pluviômetro 1', municipality: 'Recife', source: 'CEMADEN' },
  { sensorId: 'SINTETICO-RIO-01', type: 'RIVER_LEVEL', value: 1.82, unit: 'm', observedAt: ago(9), ageSeconds: 540, stale: false, stationName: 'Sintético: rio 1', municipality: 'Recife', source: 'APAC' },
  { sensorId: 'SINTETICO-PLUV-02', type: 'PRECIPITATION', value: null, unit: 'mm', observedAt: ago(300), ageSeconds: 18000, stale: true, stationName: 'Sintético: pluviômetro 2', municipality: 'Olinda', source: 'CEMADEN' },
];

export const ALERTAS = [
  { id: 1, ruleId: 1, kind: 'RISK_LEVEL', severity: 'CRITICAL', floodPointSlug: 'sintetico-alto', title: 'Sintético: risco alto no ponto de teste', detail: 'Dado sintético para desenho de tela.', riskLevel: 'HIGH', modelValidationStatus: 'NOT_VALIDATED', triggeredAt: ago(20), acknowledgedAt: null, acknowledgedBy: null },
  { id: 2, ruleId: 2, kind: 'PREDICTION_UNAVAILABLE', severity: 'WARNING', floodPointSlug: 'sintetico-indisponivel', title: 'Sintético: previsão indisponível', detail: 'O modelo não respondeu.', riskLevel: 'UNKNOWN', degradationReason: 'AI_TIMEOUT', modelValidationStatus: 'NOT_VALIDATED', triggeredAt: ago(45), acknowledgedAt: null, acknowledgedBy: null },
  { id: 3, ruleId: 3, kind: 'SENSOR_STALE', severity: 'INFO', stationId: 'SINTETICO-PLUV-02', title: 'Sintético: pluviômetro sem resposta', detail: null, triggeredAt: ago(200), acknowledgedAt: ago(150), acknowledgedBy: 'sintetico.operador' },
];
export const REGRAS = [
  { id: 1, kind: 'RISK_LEVEL', floodPointSlug: null, stationId: null, threshold: null, thresholdSource: null, minRisk: 'HIGH', enabled: true, channels: ['BROWSER'], createdBy: 'sistema', createdAt: ago(5000), updatedAt: null },
  { id: 2, kind: 'RAIN_RATE', floodPointSlug: null, stationId: null, threshold: 55, thresholdSource: 'IDF TR 2 anos (pré-registro)', minRisk: null, enabled: true, channels: ['BROWSER'], createdBy: 'sistema', createdAt: ago(5000), updatedAt: null },
  { id: 3, kind: 'SENSOR_STALE', floodPointSlug: null, stationId: null, threshold: 30, thresholdSource: null, minRisk: null, enabled: false, channels: ['BROWSER'], createdBy: 'sintetico.operador', createdAt: ago(4000), updatedAt: ago(100) },
];

export const RELATOS = [
  { id: 1, latitude: -8.05, longitude: -34.9, observedAt: ago(15), waterDepth: 'KNEE', description: 'Sintético: água na altura do joelho', status: 'PENDING', nearestPointSlug: 'sintetico-alto', nearestPointDistanceM: 250, createdAt: ago(12) },
  { id: 2, latitude: -8.06, longitude: -34.95, observedAt: ago(200), waterDepth: null, status: 'DISCARDED', nearestPointSlug: null, nearestPointDistanceM: null, createdAt: ago(190), reviewedAt: ago(150), reviewedBy: 'sintetico.operador', discardReason: 'Sintético: duplicado' },
  { id: 3, latitude: -8.05, longitude: -34.905, observedAt: ago(500), waterDepth: 'WAIST', status: 'CONFIRMED', nearestPointSlug: 'sintetico-alto', nearestPointDistanceM: 80, createdAt: ago(480), reviewedAt: ago(400), reviewedBy: 'sintetico.operador', floodEventId: 7 },
];

export const FONTES = [
  { source: 'CEMADEN', status: 'OK', expectedEveryMinutes: 10, lastSuccessAt: ago(4), lastRunId: '7c9e6679-7425-40de-944b-e07fc1f90ae7', lastError: null, rowsLast24h: 1440 },
  { source: 'APAC', status: 'DELAYED', expectedEveryMinutes: 10, lastSuccessAt: ago(55), lastRunId: '1b4e28ba-2fa1-11d2-883f-0016d3cca427', lastError: null, rowsLast24h: 900 },
  { source: 'OPEN_METEO', status: 'FAILING', expectedEveryMinutes: 60, lastSuccessAt: ago(600), lastRunId: null, lastError: 'Sintético: tempo esgotado', rowsLast24h: 3 },
  { source: 'TABUA_MARE', status: 'IDLE', expectedEveryMinutes: null, lastSuccessAt: null, lastRunId: null, lastError: null, rowsLast24h: 0 },
];
export const EXECUCOES = [
  { id: '7c9e6679-7425-40de-944b-e07fc1f90ae7', source: 'CEMADEN', kind: 'LIVE', mode: 'REFETCH', status: 'SUCCEEDED', startedAt: ago(4), finishedAt: ago(3), fetched: 120, valid: 118, quarantined: 2, errorSummary: null },
  { id: '1b4e28ba-2fa1-11d2-883f-0016d3cca427', source: 'APAC', kind: 'LIVE', mode: 'REFETCH', status: 'FAILED', startedAt: ago(55), finishedAt: ago(54), fetched: 0, valid: 0, quarantined: 0, errorSummary: 'Sintético: tempo esgotado' },
];

export const USUARIOS = [
  { id: 1, name: 'Sintético Admin', email: 'admin@example.org', role: 'ADMIN', active: true, lastLoginAt: ago(30) },
  { id: 2, name: 'Sintético Operador', email: 'operador@example.org', role: 'OPERADOR', active: true, lastLoginAt: ago(600) },
  { id: 3, name: null, email: null, role: 'USER', active: false, lastLoginAt: null }, // criado antes da V19
];

/** Série sintética para a janela pedida: chuva horária (t = fim da hora), maré e rio a cada 10 min. */
export function timeline(fromMs: number, toMs: number) {
  const HOUR = 3_600_000;
  const rain: Array<{ t: string; v: number }> = [];
  for (let end = Math.ceil((fromMs + 1) / HOUR) * HOUR; end <= toMs; end += HOUR) rain.push({ t: new Date(end).toISOString(), v: [0, 0, 0.4, 1.2, 4.8, 9.6, 3.2, 0.8, 0, 0][Math.floor(end / HOUR) % 10] });
  const tide: Array<{ t: string; v: number }> = [];
  const river: Array<{ t: string; v: number }> = [];
  for (let x = fromMs; x <= toMs; x += 600_000) {
    tide.push({ t: new Date(x).toISOString(), v: Number((1.2 + 1.1 * Math.sin((x / HOUR / 12.4) * Math.PI * 2)).toFixed(2)) });
    river.push({ t: new Date(x).toISOString(), v: Number((1.5 + 0.6 * Math.sin(x / HOUR / 6)).toFixed(2)) });
  }
  return {
    from: new Date(fromMs).toISOString(), to: new Date(toMs).toISOString(), stepMinutes: 10,
    rain: [{ stationId: 'SINTETICO-PLUV-01', points: rain }],
    tide: { harbor: 'pe02', points: tide },
    river: [{ stationId: 'SINTETICO-RIO-01', points: river }],
    risk: [
      { slug: 'sintetico-alto', items: predictionsFor('sintetico-alto') },
      { slug: 'sintetico-baixo', items: [prediction('sintetico-baixo', 'LOW', 240), prediction('sintetico-baixo', 'LOW', 60)] },
    ],
    floodEvents: [{ id: 7, slug: 'sintetico-alto', startTime: ago(90), severity: 'MEDIUM' }],
  };
}

/** Estrutura real de resultado_etapa2.json, com números sintéticos (a tela só repassa o que a API manda). */
export const AVALIACAO = {
  sha256: 'f'.repeat(64),
  source: 'sintetico/resultado-fake.json',
  frozenAt: null,
  result: {
    n_pos_principal: 10, n_pos_extra: 2, n_neg_bruto: 100, n_neg: 100, episodios_principal: 9, episodios_18: 11,
    auc_B2: [0.6, [0.4, 0.8]], auc_B3: [0.7, [0.5, 0.9]],
    m1: { central: { auc: 0.7, auc_ic: [0.5, 0.9], d_h1: 0.1, d_h1_ic: [-0.05, 0.25], cat_h1: 'inconclusivo', d_h2: 0, d_h2_ic: [0, 0], cat_h2: 'inconclusivo' } },
    class_h1: ['inconclusivo', []], class_h2: ['inconclusivo', []],
    degenerado: { alerta_M1a_em_N: 0, S_zero_em_todos_positivos: true, S_max_N: 0 },
    mcnemar: { pos: [0, 0, 1], neg: [0, 0, 1] },
  },
};

export const SIMULACAO = (hours: number) => {
  let h = 0;
  const hMm = Array.from({ length: hours }, (_, i) => (h = Math.max(0, h + (i < 4 ? 14 : 0) - 3)));
  return { model: 'M1a', illustrative: true, hMm, hmaxMm: Math.max(...hMm), tCrossH: hMm.findIndex((v) => v >= 150) >= 0 ? hMm.findIndex((v) => v >= 150) : null, nOutsideCurve: 0, paramsUsed: { C: 0.86, iT_mm_h: 60.1, f: 1, hcrit_mm: 150, snap_m: 10, curve_scale: 1 } };
};

export const TERRENO = { floodPointSlug: 'sintetico-alto', status: 'OK', streetElevationM: 2.31, contributingAreaM2: 18450, diagnostics: { contributingAreaBySnapM2: { '0m': 17000, '5m': 18450, '10m': 19000, '20m': 21000 }, basinTouchesWindowEdge: false }, provenance: { flightYear: 2016, verticalReference: 'datum do MDT' }, tideComparabilityWarning: null };

type Json = unknown;
export interface ApiReply { status?: number; json?: Json; body?: string; headers?: Record<string, string> }
export type Handler = (ctx: { url: URL; method: string; body: unknown }) => ApiReply | Json | Promise<ApiReply | Json>;
export interface ApiOptions {
  role?: Role | null;
  /** Sobrescreve ou acrescenta rotas: chave "MÉTODO /caminho-exato". Têm prioridade sobre as padrão. */
  routes?: Record<string, Handler>;
  /** Eventos SSE entregues em /api/stream (já em texto). */
  stream?: string;
}

const isReply = (v: unknown): v is ApiReply => typeof v === 'object' && v !== null && !Array.isArray(v) && ((typeof (v as ApiReply).status === 'number') || 'body' in v || 'json' in v);

export const sse = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

/** Registra todas as rotas /api/** do e2e. Devolve a lista de chamadas para asserções (ex.: POST de ack). */
export async function installApi(page: Page, opts: ApiOptions = {}) {
  const { role = 'ADMIN', routes = {}, stream = '' } = opts;
  const calls: Array<{ method: string; path: string; body: unknown }> = [];
  const defaults: Record<string, Handler> = {
    'GET /api/auth/me': () => (role ? { json: { username: 'sintetico.operador', role } } : { status: 403, json: { message: 'forbidden' } }),
    'POST /api/auth/logout': () => ({ status: 204 }),
    'GET /api/pontos': () => PONTOS,
    'GET /api/pontos/risk-summary': () => ({ LOW: 1, MEDIUM: 0, HIGH: 1, UNKNOWN: 1, computedAt: ago(1) }),
    'GET /api/sensors/latest': ({ url }) => {
      const t = url.searchParams.get('type');
      return t ? SENSORES.filter((s) => s.type === t) : SENSORES;
    },
    'GET /api/alerts': ({ url }) => {
      const st = url.searchParams.get('status') ?? 'OPEN';
      const list = ALERTAS.filter((a) => (st === 'ALL' ? true : st === 'OPEN' ? !a.acknowledgedAt : !!a.acknowledgedAt));
      return { page: 0, size: 20, totalElements: list.length, content: list };
    },
    'GET /api/alert-rules': () => REGRAS,
    'GET /api/reports': ({ url }) => {
      const st = url.searchParams.get('status');
      const list = st ? RELATOS.filter((r) => r.status === st) : RELATOS;
      return { page: 0, size: 20, totalElements: list.length, content: list };
    },
    'GET /api/events/timeline': ({ url }) => {
      const from = Date.parse(url.searchParams.get('from') ?? '');
      const to = Date.parse(url.searchParams.get('to') ?? '');
      const t = Number.isFinite(to) ? to : Date.now();
      return timeline(Number.isFinite(from) ? from : t - 24 * 3_600_000, t);
    },
    'GET /api/model/evaluation': () => AVALIACAO,
    'POST /api/model/simulate/bucket': ({ body }) => SIMULACAO(((body as { rainfallMmH?: number[] })?.rainfallMmH ?? [0]).length),
    'GET /api/admin/ingestion/sources': () => FONTES,
    'GET /api/admin/ingestion/runs': ({ url }) => {
      const src = url.searchParams.get('source');
      const list = EXECUCOES.filter((r) => !src || r.source === src);
      return { page: 0, size: 20, totalElements: list.length, content: list };
    },
    'GET /api/admin/ingestion/check-integrity': () => [{ slug: 'sintetico-alto', totalWeatherRecords: 1200, totalSensorRecords: 3400, totalFloodEvents: 3, status: 'OK' }],
    'GET /api/admin/users': () => ({ page: 0, size: 20, totalElements: USUARIOS.length, content: USUARIOS }),
    'GET /api/pontos/station-suggestions': () => [{ stationId: 'SINTETICO-PLUV-01', name: 'Sintético: pluviômetro 1', type: 'PRECIPITATION', source: 'CEMADEN', distanceM: 900, lastReadingAt: ago(8) }],
    'GET /api/public/risk': ({ url }) => {
      const lat = Number(url.searchParams.get('lat'));
      const lon = Number(url.searchParams.get('lon'));
      if (!(lat >= -8.4 && lat <= -7.8 && lon >= -35.2 && lon <= -34.8)) return { status: 422, json: { message: 'fora da RMR' } };
      return { nearestPoint: { slug: 'sintetico-alto', name: 'Sintético: ponto alto', distanceM: 300, riskLevel: 'MEDIUM', issuedAt: ago(10), validUntil: null, degradationReason: null }, rainLastHourMm: 3.2, rainStationId: 'SINTETICO-PLUV-01', modelValidationStatus: 'NOT_VALIDATED', meaning: 'Probabilidade intermediária. Vale acompanhar o ponto e conferir os sensores próximos.' };
    },
    'GET /api/tide/pe02': () => ({ harbor: 'pe02', name: 'Recife', year: 2026, months: [] }),
    'GET /api/tabua-mare/nearest': () => ({ data: null }),
  };
  const all: Record<string, Handler> = { ...defaults, ...routes };

  const respond = async (route: Route) => {
    const req = route.request();
    const url = new URL(req.url());
    const method = req.method();
    const path = url.pathname;
    if (path === '/api/stream') {
      return route.fulfill({ status: role ? 200 : 403, contentType: 'text/event-stream', headers: { 'Cache-Control': 'no-cache' }, body: role ? `${stream}event: heartbeat\ndata: {}\n\n` : '' });
    }
    let body: unknown;
    try { body = req.postDataJSON(); } catch { body = req.postData(); }
    calls.push({ method, path: path + url.search, body });
    // Caminhos dinâmicos: /api/pontos/:slug, /predictions, /terrain, /alerts/:id/ack etc.
    let handler = all[`${method} ${path}`];
    if (!handler) {
      const dyn: Array<[RegExp, string]> = [
        [/^\/api\/pontos\/([^/]+)\/predictions$/, 'GET /api/pontos/:slug/predictions'],
        [/^\/api\/pontos\/([^/]+)\/terrain$/, 'GET /api/pontos/:slug/terrain'],
        [/^\/api\/pontos\/([^/]+)$/, `${method} /api/pontos/:slug`],
        [/^\/api\/alerts\/(\d+)\/ack$/, 'POST /api/alerts/:id/ack'],
        [/^\/api\/alert-rules\/(\d+)$/, `${method} /api/alert-rules/:id`],
        [/^\/api\/reports\/(\d+)$/, `${method} /api/reports/:id`],
        [/^\/api\/admin\/users\/(\d+)$/, `${method} /api/admin/users/:id`],
      ];
      for (const [re, key] of dyn) if (re.test(path) && all[key]) { handler = all[key]; break; }
    }
    if (!handler) {
      const m = path.match(/^\/api\/pontos\/([^/]+)(\/predictions|\/terrain)?$/);
      if (m && method === 'GET') {
        const [, slug, sub] = m;
        if (sub === '/predictions') return route.fulfill({ json: { slug, from: url.searchParams.get('from'), to: url.searchParams.get('to'), items: predictionsFor(slug) } });
        if (sub === '/terrain') return route.fulfill({ json: { ...TERRENO, floodPointSlug: slug } });
        const p = PONTOS.find((x) => x.slug === slug);
        return p ? route.fulfill({ json: p }) : route.fulfill({ status: 404, json: { message: 'não encontrado' } });
      }
      return route.fulfill({ status: 404, json: { message: `sem rota de teste: ${method} ${path}` } });
    }
    const out = await handler({ url, method, body });
    if (isReply(out)) return route.fulfill({ status: out.status ?? (out.json === undefined && out.body === undefined ? 204 : 200), json: out.json, body: out.body, headers: out.headers });
    return route.fulfill({ json: out });
  };
  await page.route('**/api/**', respond);
  // Ambiente de dados do mapa: leitura ambiental e predição por coordenada (rotas já existentes).
  await page.route(/\/api\/environmental-data/, (r) =>
    r.fulfill({ json: { requestedLatitude: -8.05, requestedLongitude: -34.9, preciseData: { timestamp: new Date().toISOString(), temperature: 28.1, humidity: 80, pressure: 1010, windSpeed: 10, precipitation: 0, waterLevel: null, flowRate: null, tideHeight: null, latestReadings: [] }, nearestSensor: null, openMeteoData: { current: { precipitation: 0 } }, distanceToNearestSensorKm: null } }),
  );
  await page.route(/\/api\/flood-predictions/, (r) => r.fulfill({ json: { riskLevel: 'HIGH', floodProbability: 0.78, modelValidationStatus: 'NOT_VALIDATED', issuedAt: new Date().toISOString(), horizonHours: 1 } }));
  return { calls };
}

/** Tema claro, destaque padrão: telas comparáveis entre execuções. */
export async function lightTheme(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('mapi.theme', 'light');
    localStorage.setItem('mapi.accent', 'capibaribe');
  });
}

/** Salva o screenshot em test-results/ (outputPath e telas/) e anexa ao relatório. Nome inclui o projeto (desktop/celular). */
export async function shot(page: Page, testInfo: TestInfo, nome: string) {
  // Uma cópia com nome curto em test-results/telas/ (os diretórios por teste têm nomes longos).
  // O conteúdo rola dentro de <main>; para ver a tela inteira a janela cresce até a altura do conteúdo (máx. 3200 px).
  const vp = page.viewportSize();
  const alto = await page.evaluate(() => document.querySelector('#conteudo')?.scrollHeight ?? 0);
  if (vp && alto > vp.height - 60) {
    await page.setViewportSize({ width: vp.width, height: Math.min(alto + 70, 3200) });
    await page.waitForTimeout(150);
  }
  await page.screenshot({ path: `test-results/telas/${nome}-${testInfo.project.name}.png` });
  if (vp) await page.setViewportSize(vp);
  const buf = await page.screenshot({ path: testInfo.outputPath(`${nome}-${testInfo.project.name}.png`), fullPage: false });
  await testInfo.attach(`${nome}-${testInfo.project.name}`, { body: buf, contentType: 'image/png' });
}

/**
 * Cabe na largura da janela: nada passa da borda direita, a não ser dentro de um contêiner com rolagem
 * própria (tabelas largas). Pega também o estouro que o layout esconde com overflow no corpo.
 */
export async function semRolagemHorizontal(page: Page) {
  const sobra = await page.evaluate(() => {
    const w = window.innerWidth;
    const rola = (el: Element | null): boolean => {
      for (let e = el; e && e !== document.body; e = e.parentElement) {
        const o = getComputedStyle(e).overflowX;
        if ((o === 'auto' || o === 'scroll') && e.scrollWidth > e.clientWidth) return true;
        if (o === 'auto' || o === 'scroll') return true;
      }
      return false;
    };
    return Array.from(document.querySelectorAll('main *, [role=main] *'))
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.right > w + 1 && !rola(el.parentElement) && getComputedStyle(el).position !== 'fixed';
      })
      .slice(0, 5)
      .map((el) => `${el.tagName}.${(el as HTMLElement).className?.toString().slice(0, 60)} right=${Math.round(el.getBoundingClientRect().right)} > ${w}`);
  });
  expect(sobra).toEqual([]);
}
