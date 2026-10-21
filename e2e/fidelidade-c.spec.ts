import { test, type Page } from '@playwright/test';
import { installApi, type ApiOptions } from './support/api';

/**
 * Capturas 1440×900 (escuro e claro) para comparar com design-ref/shots. Só desktop; dados sintéticos
 * via page.route. Saída em test-results/fidelidade/.
 */
test.use({ serviceWorkers: 'block', viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });

interface Tela { espera?: number; id: string; path: string; api?: ApiOptions; antes?: (page: Page) => Promise<void> }

const SIM = (body: unknown) => {
  const b = body as { rainfallMmH: number[]; f: number };
  let h = 0;
  const hMm = b.rainfallMmH.map((r) => (h = Math.max(0, h + r * 4 - 60)));
  const cross = hMm.findIndex((v) => v >= 150);
  return { model: 'M1a', illustrative: true, hMm, hmaxMm: Math.max(...hMm), tCrossH: cross >= 0 ? cross : null, nOutsideCurve: 0, paramsUsed: { C: 0.86, iT_mm_h: 60.1, f: b.f, hcrit_mm: 150, snap_m: 10, curve_scale: 1 } };
};

const AVAL = {
  sha256: 'f'.repeat(64), source: 'sintetico/resultado-etapa2.json', frozenAt: null,
  result: {
    n_pos_principal: 14, n_pos_extra: 4, n_neg_bruto: 700, n_neg: 689, episodios_principal: 13, episodios_18: 17,
    auc_B2: [0.777, [0.641, 0.89]], auc_B3: [0.891, [0.747, 0.97]],
    m1: { central: { auc: 0.891, auc_ic: [0.747, 0.97], d_h1: 0.113, d_h1_ic: [-0.01, 0.252], cat_h1: 'inconclusivo', d_h2: 0, d_h2_ic: [0, 0], cat_h2: 'nao_testada' }, f0_6: { auc: 0.88, auc_ic: [0.73, 0.96], d_h1: 0.1, d_h1_ic: [-0.02, 0.24], cat_h1: 'inconclusivo', d_h2: 0, d_h2_ic: [0, 0], cat_h2: 'nao_testada' } },
    class_h1: ['inconclusiva', []], class_h2: ['não testada', []],
    degenerado: { alerta_M1a_em_N: 0, S_zero_em_todos_positivos: true, S_max_N: 0 },
    auc_todos: { 'B3-24h · 30 mm em 24 h': { auc: 0.891, ic: [0.735, 0.976], exclui_05: true, auc18: 0.872, ic18: [0.73, 0.974] } },
    binarias: { 'M1a/B3': { k14: 0, ic14: [0, 0.23], k18: 0, ic18: [0, 0.18], k4: 0, kn: 0, icn: [0, 0.005] }, 'B3-24h': { k14: 4, ic14: [0.1, 0.5], k18: 5, ic18: [0.1, 0.5], k4: 4, kn: 4, icn: [0, 0.01] } },
  },
};

/** Tábua sintética do mês atual: 4 pontos por dia (2 preamares, 2 baixa-mares), amplitude variando com o dia. */
const tabuaMes = () => {
  const now = new Date();
  const dias = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const f = (n: number) => `${String(Math.floor(n / 60) % 24).padStart(2, '0')}:${String(Math.round(n % 60)).padStart(2, '0')}`;
  return {
    id: 1, year: now.getFullYear(), harborName: 'Recife', state: 'PE', timezone: 'America/Recife', card: 'pe02', dataCollectionInstitution: 'DHN', meanLevel: 1.3, geoLocations: [], currentTideHeight: 1.1,
    months: [{ monthName: new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(now), month: now.getMonth() + 1, days: Array.from({ length: dias }, (_, i) => {
      const amp = 0.4 + 0.5 * Math.abs(Math.sin((i / 14.8) * Math.PI));
      const t0 = (i * 50) % 745;
      const hi = 1.3 + amp;
      const lo = 1.3 - amp - 0.2;
      return { weekdayName: '', day: i + 1, hours: [{ hour: f(t0), level: Number(lo.toFixed(2)) }, { hour: f(t0 + 372), level: Number(hi.toFixed(2)) }, { hour: f(t0 + 745), level: Number(lo.toFixed(2)) }, { hour: f(t0 + 1117), level: Number(hi.toFixed(2)) }] };
    }) }],
  };
};

const agoMin = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const FONTES_PROTO = [
  { source: 'CEMADEN', status: 'OK', expectedEveryMinutes: 3, lastSuccessAt: agoMin(2), lastRunId: '7c2e0000-0000-0000-0000-000000000000', lastError: null, rowsLast24h: 1184 },
  { source: 'APAC', status: 'OK', expectedEveryMinutes: 5, lastSuccessAt: agoMin(4), lastRunId: 'a91f0000-0000-0000-0000-000000000000', lastError: null, rowsLast24h: 312 },
  { source: 'ANA', status: 'DELAYED', expectedEveryMinutes: 15, lastSuccessAt: agoMin(40), lastRunId: null, lastError: 'timeout', rowsLast24h: 0 },
  { source: 'OPEN_METEO', status: 'OK', expectedEveryMinutes: 60, lastSuccessAt: agoMin(27), lastRunId: null, lastError: null, rowsLast24h: 24 },
  { source: 'TABUA_MARE', status: 'OK', expectedEveryMinutes: 1440, lastSuccessAt: agoMin(307), lastRunId: null, lastError: null, rowsLast24h: 12 },
  { source: 'CKAN_RECIFE', status: 'IDLE', expectedEveryMinutes: null, lastSuccessAt: null, lastRunId: null, lastError: null, rowsLast24h: 0 },
];
const RUNS_PROTO = [
  { id: 'a91f0000', source: 'APAC', kind: 'LIVE', status: 'SUCCEEDED', fetched: 312, valid: 309, quarantined: 3, gaps: 0 },
  { id: '7c2e0000', source: 'CEMADEN', kind: 'LIVE', status: 'SUCCEEDED', fetched: 1184, valid: 1180, quarantined: 4, gaps: 1 },
  { id: '5d100000', source: 'ANA', kind: 'LIVE', status: 'FAILED', fetched: 0, valid: 0, quarantined: 0, gaps: 0, errorSummary: 'timeout' },
  { id: '33b80000', source: 'OPEN_METEO_ARCHIVE', kind: 'HISTORICAL', status: 'SUCCEEDED', fetched: 43824, valid: 43790, quarantined: 34, gaps: 12 },
  { id: '0e4a0000', source: 'CKAN_RECIFE', kind: 'REVALIDATE', status: 'SUCCEEDED', fetched: 619, valid: 619, quarantined: 0, gaps: 0 },
];

const PONTOS_PROTO = ['AGAMENON_DERBY|Av. Agamenon Magalhães (Derby)|Recife|-8.052554|-34.894371', 'MASCARENHAS_IMBIRIBEIRA|Av. Mascarenhas de Morais|Recife|-8.1181|-34.9049', 'AV_RECIFE_IBURA|Av. Recife - Entrada do Ibura|Recife|-8.1079|-34.9271', 'CIN_UFPE|CIn - UFPE|Recife|-8.0553|-34.9512', 'JABOATAO_CENTRO|Jaboatão Centro (Rio Duas Unas)|Jaboatão dos Guararapes|-8.1065|-35.0132'].map((l, i) => {
  const [slug, name, municipality, la, lo] = l.split('|');
  return { id: i + 1, slug, name, municipality, description: 'Maré bloqueando a saída da galeria', latitude: Number(la), longitude: Number(lo), altitudeM: 2.9, distanceToChannelM: 60, basinName: null, sensorConfig: { pluviometerStationIds: i < 3 ? ['A'] : [], riverLevelStationIds: i === 4 ? ['R'] : [] }, active: true, tideHeight: null, tideUnit: null };
});

const USUARIOS_PROTO = [
  { id: 1, name: 'Operador local', email: 'admin@bootstrap.local', role: 'ADMIN', active: true, lastLoginAt: agoMin(0) },
  { id: 2, name: 'Plantão Defesa Civil 1', email: 'plantao1@defesacivil.recife.pe.gov.br', role: 'OPERADOR', active: true, lastLoginAt: agoMin(2) },
  { id: 3, name: 'Plantão Defesa Civil 2', email: 'plantao2@defesacivil.recife.pe.gov.br', role: 'OPERADOR', active: false, lastLoginAt: agoMin(340) },
  { id: 4, name: 'COMDEC Jaboatão', email: 'comdec@jaboatao.pe.gov.br', role: 'USER', active: false, lastLoginAt: agoMin(1500) },
  { id: 5, name: 'Orientador', email: 'orientador@cin.ufpe.br', role: 'USER', active: false, lastLoginAt: agoMin(4300) },
  { id: 6, name: 'Pesquisa MAPi', email: 'pesquisa@cin.ufpe.br', role: 'USER', active: true, lastLoginAt: agoMin(12) },
];

const TELAS: Tela[] = [
  { id: '13-usuarios', path: '/admin/usuarios', api: { routes: { 'GET /api/admin/users': () => ({ page: 0, size: 20, totalElements: 6, content: USUARIOS_PROTO }) } } },
  { id: '10-pontos', espera: 2500, path: '/admin/pontos', api: { routes: { 'GET /api/pontos': () => PONTOS_PROTO } } },
  {
    id: '09-dados', path: '/admin/dados',
    api: { routes: {
      'GET /api/admin/ingestion/sources': () => FONTES_PROTO,
      'GET /api/admin/ingestion/runs': () => ({ page: 0, size: 20, totalElements: 5, content: RUNS_PROTO }),
      'GET /api/admin/ingestion/check-integrity': () => [
        { slug: 'sintetico-alto', totalWeatherRecords: 50808, totalSensorRecords: 3400, totalFloodEvents: 3, status: 'OK' },
        { slug: 'sintetico-baixo', totalWeatherRecords: 42924, totalSensorRecords: 900, totalFloodEvents: 0, status: 'INCOMPLETE' },
      ],
    } },
    antes: async (page) => { await page.getByRole('button', { name: 'Checar integridade' }).click(); await page.locator('[data-health]').first().waitFor(); },
  },
  { id: '08-mare', path: '/mare', api: { routes: { 'GET /api/tide/pe02': () => tabuaMes() } } },
  { id: '07-modelo', path: '/modelo', api: { routes: { 'GET /api/model/evaluation': () => AVAL } } },
  {
    id: '06-simulador', path: '/modelo/simulador',
    api: { routes: { 'POST /api/model/simulate/bucket': ({ body }) => SIM(body) } },
    antes: async (page) => {
      await page.getByLabel('Ponto', { exact: true }).selectOption('sintetico-alto');
      await page.getByRole('button', { name: 'Simular' }).click();
      await page.getByRole('region', { name: 'Resultado da simulação' }).waitFor();
    },
  },
];

const so = process.env.TELA;
for (const t of TELAS.filter((x) => !so || x.id.includes(so))) {
  for (const tema of ['dark', 'light'] as const) {
    test(`${t.id} ${tema}`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop', 'só desktop');
      await page.addInitScript((th) => { localStorage.setItem('mapi.theme', th); localStorage.setItem('mapi.accent', 'capibaribe'); }, tema);
      await installApi(page, t.api ?? {});
      await page.goto(t.path);
      await page.waitForLoadState('networkidle');
      await t.antes?.(page);
      await page.waitForTimeout(t.espera ?? 300);
      await page.screenshot({ path: `test-results/fidelidade/${t.id}-${tema}.png` });
    });
  }
}
