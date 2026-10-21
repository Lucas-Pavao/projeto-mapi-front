import { test } from '@playwright/test';
import { capturar, ago, ahead } from './support/fidelidade';

test.use({ serviceWorkers: 'block' });
test.skip(({ isMobile }) => isMobile, 'captura só em desktop 1440×900');

const base = { municipality: 'Recife', altitudeM: 3, distanceToChannelM: 60, sensorConfig: null, active: true, tideHeight: 0.31, tideUnit: 'm' };
const pt = (id: number, slug: string, name: string, basin: string, risk: string, prob: number | null) => ({
  ...base, id, slug, name, basinName: basin, description: null, latitude: -8.05 - id / 100, longitude: -34.9 - id / 100,
  floodPrediction: { riskLevel: risk, floodProbability: prob, modelValidationStatus: 'NOT_VALIDATED', issuedAt: ago(20), validUntil: ahead(160), horizonHours: 3, modelVersion: 'unversioned' },
});
const PONTOS = [
  pt(1, 'agamenon-derby', 'Agamenon (Derby)', 'Derby', 'LOW', 0.15),
  pt(2, 'mascarenhas', 'Mascarenhas', 'Imbiribeira', 'LOW', 0.32),
  pt(3, 'av-recife-ibura', 'Av. Recife (Ibura)', 'Ibura', 'LOW', 0.11),
  pt(4, 'cin-ufpe', 'CIn - UFPE', 'Cidade Universitária', 'LOW', 0.03),
  pt(5, 'jaboatao-centro', 'Jaboatão Centro', 'Centro', 'LOW', 0.03),
];
const DETALHE = {
  ...PONTOS[0], name: 'Av. Agamenon Magalhães (Derby)', description: 'Maré bloqueando a saída da galeria', municipality: 'Derby, Recife',
  liveData: { source: 'CEMADEN', timestamp: ago(5), precipitation: 9.4, unitPrecipitation: 'mm/h', temperature: 26.2, humidity: 83, windSpeed: 14, unitWindSpeed: 'km/h', waterLevel: 1.8, unitWaterLevel: 'm', tideHeight: 0.31, unitTide: 'm', waveHeight: 1.5, unitWave: 'm',
    historicalAggregates: { rain3h: 30, rain6h: 67.1, rain12h: 90, rain24h: 108.2, rainSource: 'OPEN_METEO_FORECAST' } },
  floodPrediction: { ...PONTOS[0].floodPrediction, contributors: [
    { featureId: 'rain3h', label: 'Chuva acumulada em 3 horas', contribution: 0.61 },
    { featureId: 'rain6h', label: 'Chuva acumulada em 6 horas', contribution: 0.27 },
    { featureId: 'rain', label: 'Chuva atual', contribution: 0.11 } ] },
};
const curva = [0.01, 0.01, 0.02, 0.05, 0.3, 0.55, 0.6, 0.4, 0.1, 0.05, 0.1, 0.15];
const serie = curva.map((p, i) => ({ slug: 'agamenon-derby', riskLevel: p >= 0.8 ? 'HIGH' : p >= 0.5 ? 'MEDIUM' : 'LOW', probability: p, issuedAt: ago((11 - i) * 45), validUntil: ahead(160), horizonHours: 3, modelVersion: 'unversioned', degradationReason: null, modelValidationStatus: 'NOT_VALIDATED' }));

for (const tema of ['dark', 'light'] as const) {
  test(`fidelidade ponto ${tema}`, async ({ page }) => {
    const fim = await capturar(page, '02-ponto', tema, {
      routes: {
        'GET /api/pontos': () => PONTOS,
        'GET /api/pontos/:slug': () => DETALHE,
        'GET /api/pontos/:slug/predictions': () => ({ slug: 'agamenon-derby', from: ago(1440), to: ago(0), items: serie }),
        'GET /api/pontos/:slug/terrain': () => ({ floodPointSlug: 'agamenon-derby', status: 'OK', streetElevationM: 2.9, contributingAreaM2: 1000, diagnostics: {}, provenance: {}, tideComparabilityWarning: null }),
      },
    }, '/pontos/agamenon-derby');
    await fim();
  });
}

// ---------- Sensores ----------
const HORA = 3_600_000;
const estacoes = ['Várzea 1', 'Areias', 'Ibura', 'Imbiribeira', 'Pina', 'San Martin', 'Torreão'];
const SENSORES = [
  { sensorId: '260790119H', type: 'RIVER_LEVEL', value: 1.8, unit: 'm', observedAt: ago(5), ageSeconds: 300, stale: false, stationName: 'Rio Duas Unas · Engenho Velho', municipality: 'Jaboatão dos Guararapes', source: 'APAC', riverPreAlertLevel: 1.8, riverAlertLevel: 2.3, riverFloodLevel: 2.8 },
  ...estacoes.map((n, i) => ({ sensorId: `PLUV-${i}`, type: 'PRECIPITATION', value: n === 'San Martin' ? null : [0.4, 0.6, 0.4, 1.1, 5.1, 0, 5.8][i], unit: 'mm', observedAt: n === 'San Martin' ? ago(420) : ago(3), ageSeconds: n === 'San Martin' ? 25200 : 180, stale: n === 'San Martin', stationName: n, municipality: 'Recife', source: 'Cemaden' })),
];
function tl(from: number, to: number) {
  const chuva = (k: number) => { const out = []; for (let e = Math.ceil(from / HORA) * HORA; e <= to; e += HORA) { const h = (e - from) / HORA; out.push({ t: new Date(e).toISOString(), v: e > Date.now() ? null : Math.max(0, +(Math.sin((h - 4 - k) / 3) * 12 + 5).toFixed(1)) }); } return out; };
  const rio = [], mare = [];
  for (let x = from; x <= to; x += 600_000) {
    const h = (x - from) / HORA;
    rio.push({ t: new Date(x).toISOString(), v: x > Date.now() ? null : +(1.8 + 1.0 * Math.exp(-((h - 9) ** 2) / 4)).toFixed(2) });
    mare.push({ t: new Date(x).toISOString(), v: +(1.2 + 1.1 * Math.sin((x / HORA / 12.4) * Math.PI * 2)).toFixed(2) });
  }
  return { from: new Date(from).toISOString(), to: new Date(to).toISOString(), stepMinutes: 10, rain: estacoes.map((_, i) => ({ stationId: `PLUV-${i}`, points: chuva(i) })), tide: { harbor: 'pe02', points: mare }, river: [{ stationId: '260790119H', points: rio }], risk: [], floodEvents: [] };
}
const rotaTimeline = ({ url }: { url: URL }) => tl(Date.parse(url.searchParams.get('from') ?? ''), Date.parse(url.searchParams.get('to') ?? ''));

for (const tema of ['dark', 'light'] as const) {
  test(`fidelidade sensores ${tema}`, async ({ page }) => {
    const fim = await capturar(page, '03-sensores', tema, { routes: { 'GET /api/sensors/latest': () => SENSORES, 'GET /api/events/timeline': rotaTimeline } }, '/sensores');
    await fim();
    await page.getByRole('button', { name: /Várzea 1/ }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `test-results/fidelidade/03-sensores-chuva-${tema}.png` });
    await page.getByRole('button', { name: /Maré/ }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `test-results/fidelidade/03-sensores-mare-${tema}.png` });
  });
}

// ---------- Alertas ----------
const al = (id: number, kind: string, severity: string, title: string, detail: string, min: number, extra: Record<string, unknown> = {}) => ({ id, ruleId: 1, kind, severity, title, detail, triggeredAt: ago(min), acknowledgedAt: null, acknowledgedBy: null, ...extra });
const ALERTAS_F = [
  al(1, 'RISK_LEVEL', 'WARNING', 'Mascarenhas passou para moderado', 'Probabilidade 53% · terreno plano, drenagem lenta', 2, { floodPointSlug: 'mascarenhas', riskLevel: 'MEDIUM', modelValidationStatus: 'NOT_VALIDATED' }),
  al(2, 'RIVER_STAGE', 'CRITICAL', 'Rio Duas Unas atingiu a cota de inundação', 'Engenho Velho · 2,82 m (cota 2,80 m)', 80),
  al(3, 'RISK_LEVEL', 'WARNING', 'Jaboatão Centro passou para moderado', 'Probabilidade 53% · rio alto (duas unas)', 110, { riskLevel: 'MEDIUM', modelValidationStatus: 'NOT_VALIDATED' }),
  al(4, 'RISK_LEVEL', 'WARNING', 'Agamenon (Derby) saiu do risco alto', 'Agora moderado · 78%', 170, { riskLevel: 'MEDIUM', modelValidationStatus: 'NOT_VALIDATED' }),
  al(5, 'RAIN_RATE', 'INFO', 'Chuva forte em Torreão', '36,2 mm/h · pluviômetro 261160618A', 300),
  al(6, 'RAIN_RATE', 'INFO', 'Chuva forte em Pina', '31,0 mm/h · pluviômetro 261160617A', 320),
  al(7, 'TIDE_ABOVE', 'WARNING', 'Maré acima de 2,0 m', 'Preamar prevista 2,30 m', 340),
  al(8, 'SENSOR_STALE', 'INFO', 'San Martin sem resposta', 'há 420 min', 400, { acknowledgedAt: ago(350), acknowledgedBy: 'operador' }),
];
const REGRAS_F = [
  { id: 1, kind: 'RISK_LEVEL', floodPointSlug: null, stationId: null, threshold: null, thresholdSource: null, minRisk: 'MEDIUM', enabled: true, channels: ['BROWSER'], createdBy: 'sistema', createdAt: ago(5000) },
  { id: 2, kind: 'RAIN_RATE', floodPointSlug: null, stationId: null, threshold: 30, thresholdSource: 'IDF TR 2 anos', minRisk: null, enabled: true, channels: ['BROWSER'], createdBy: 'sistema', createdAt: ago(5000) },
  { id: 3, kind: 'TIDE_ABOVE', floodPointSlug: null, stationId: null, threshold: 2.0, thresholdSource: 'Tábua DHN', minRisk: null, enabled: true, channels: ['BROWSER'], createdBy: 'sistema', createdAt: ago(5000) },
];
for (const tema of ['dark', 'light'] as const) {
  test(`fidelidade alertas ${tema}`, async ({ page }) => {
    const fim = await capturar(page, '04-alertas', tema, { role: 'OPERADOR', routes: {
      'GET /api/alerts': () => ({ page: 0, size: 100, totalElements: ALERTAS_F.length, content: ALERTAS_F }),
      'GET /api/alert-rules': () => REGRAS_F,
    } }, '/alertas');
    await fim();
  });
}
