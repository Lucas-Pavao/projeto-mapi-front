import type { Page } from '@playwright/test';
import { ago, installApi, timeline, type ApiOptions } from './api';

/** Dados de fixture da comparação visual com o protótipo (sintéticos; nada aqui é medição). */
const base = { municipality: 'Recife', description: 'Maré bloqueando a saída da galeria', altitudeM: 3, distanceToChannelM: 100, basinName: null, sensorConfig: null, active: true, tideHeight: null, tideUnit: null };
const pred = (level: string, p: number | null, extra: Record<string, unknown> = {}) => ({
  riskLevel: level, floodProbability: p, modelValidationStatus: 'NOT_VALIDATED', issuedAt: ago(10), validUntil: new Date(Date.now() + 50 * 60_000).toISOString(), horizonHours: 3,
  contributors: [{ featureId: 'rain3h', label: 'Chuva acumulada em 3 horas', contribution: 0.58 }, { featureId: 'tide', label: 'Nível da maré', contribution: 0.3 }, { featureId: 'rain6h', label: 'Chuva acumulada em 6 horas', contribution: 0.12 }],
  ...extra,
});
const live = { source: 'sintetico', timestamp: ago(3), sensorIds: [], latestReadings: [], precipitation: 1.5, temperature: 28, humidity: 80, pressure: 1010, windSpeed: 10, waterLevel: null, flowRate: null, tideHeight: null, waveHeight: null, waveDirection: null, wavePeriod: null, tideHeightTabuaMare: 0.22, solarRadiation: null, unitPrecipitation: 'mm/h', unitTemperature: null, unitWaterLevel: null, unitTide: 'm', unitWave: null, unitWindSpeed: null, unitPressure: null, unitSolarRadiation: null, unitFlowRate: null, message: null, historicalAggregates: { rain3h: 31.7, rain6h: 40, rain12h: 50, rain24h: 60, maxRiverLevel24h: null, avgTemperature24h: null } };
export const PONTOS_FID = [
  { ...base, id: 1, slug: 'mascarenhas', name: 'Mascarenhas', latitude: -8.0905, longitude: -34.9, floodPrediction: pred('LOW', 0.15) },
  { ...base, id: 2, slug: 'agamenon-derby', name: 'Av. Agamenon Magalhães (Derby)', latitude: -8.0522, longitude: -34.8975, floodPrediction: pred('LOW', 0.1) },
  { ...base, id: 3, slug: 'av-recife-ibura', name: 'Av. Recife (Ibura)', latitude: -8.1075, longitude: -34.9285, floodPrediction: pred('LOW', 0.07) },
  { ...base, id: 4, slug: 'jaboatao-centro', name: 'Jaboatão Centro', municipality: 'Jaboatão', latitude: -8.1127, longitude: -34.9877, floodPrediction: pred('LOW', 0.03) },
  { ...base, id: 5, slug: 'cin-ufpe', name: 'CIn - UFPE', latitude: -8.0555, longitude: -34.9515, floodPrediction: pred('LOW', 0.02) },
];
const sensor = (id: number, name: string, lat: number, lng: number, value: number | null, ageMin: number, extra: Record<string, unknown> = {}) => ({
  id, sensorId: `SINT-${id}`, value, unit: 'mm/h', batteryStatus: null, timestamp: ago(ageMin), stationName: name, latitude: lat, longitude: lng, municipality: 'Recife', type: 'Pluviômetro', source: 'CEMADEN',
  fogValueReference: null, code: null, temperature: null, humidity: null, pressure: null, windSpeed: null, windDirection: null, solarRadiation: null, accumulatedPrecipitation: null, soilHumidity: null, waterLevel: null, flowRate: null, basinName: null, ...extra,
});
export const SENSORES_FID = [
  sensor(1, 'Várzea', -8.0476, -34.9503, 0.4, 3),
  sensor(2, 'Boa Vista', -8.0577, -34.8858, 2.8, 4),
  sensor(3, 'Areias', -8.0905, -34.9213, 0.4, 5),
  sensor(4, 'Ibura', -8.1123, -34.9102, 0.4, 6),
  sensor(5, 'Boa Viagem', -8.1243, -34.9, 0.6, 2),
  sensor(6, 'Imbiribeira', -8.1058, -34.9145, null, 400),
  sensor(7, 'Afogados', -8.0757, -34.9115, 1.1, 8),
  sensor(8, 'Rio Duas Unas', -8.0801, -34.9305, 1.8, 7, { unit: 'm', type: 'Fluviométrica', source: 'APAC', riverName: 'Duas Unas', riverPreAlertLevel: 1.7, riverAlertLevel: 2.4, riverFloodLevel: 3.1, waterLevel: 1.8 }),
];

/** Estilo de mapa local (sem rede): fundo na cor do protótipo, para a comparação não depender de tiles. */
export async function mapaOffline(page: Page) {
  await page.route(/basemaps\.cartocdn\.com\/.*style\.json/, (r) => {
    const dark = /dark/.test(r.request().url());
    return r.fulfill({ json: { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': dark ? '#0d1a20' : '#eef2ee' } }] } });
  });
  await page.route(/^https:\/\/[^/]*(cartocdn|openfreemap|maptiler)[^/]*\//, (r) => (r.request().url().includes('style.json') ? r.fallback() : r.abort()));
}

export async function prepara(page: Page, theme: 'dark' | 'light', opts: ApiOptions = {}) {
  await page.addInitScript((t) => {
    localStorage.setItem('mapi.theme', t);
    localStorage.setItem('mapi.accent', 'capibaribe');
  }, theme);
  await mapaOffline(page);
  const now = Date.now();
  return installApi(page, {
    role: 'ADMIN',
    ...opts,
    routes: {
      'GET /api/pontos': () => PONTOS_FID,
      'GET /api/pontos/:slug': ({ url }) => (() => { const p = PONTOS_FID.find((x) => url.pathname.endsWith(`/${x.slug}`)); return p ? { ...p, liveData: live, nearbySensorIds: [] } : { status: 404, json: {} }; })(),
      'GET /api/sensors/latest': () => SENSORES_FID,
      'GET /api/pontos/risk-summary': () => ({ LOW: 5, MEDIUM: 0, HIGH: 0, UNKNOWN: 0, computedAt: ago(1) }),
      'GET /api/alerts': () => ({ page: 0, size: 100, totalElements: 19, content: [] }),
      'GET /api/reports': () => ({ page: 0, size: 1, totalElements: 3, content: [] }),
      'GET /api/events/timeline': ({ url }) => {
        const from = Date.parse(url.searchParams.get('from') ?? '') || now - 12 * 3_600_000;
        const to = Date.parse(url.searchParams.get('to') ?? '') || now;
        const t = timeline(from, to);
        const risk = PONTOS_FID.map((p) => ({
          slug: p.slug,
          items: Array.from({ length: 24 }, (_, i) => ({
            slug: p.slug, riskLevel: 'LOW', probability: Math.max(0, (p.floodPrediction.floodProbability ?? 0) * (0.4 + 0.6 * Math.sin((i / 24) * Math.PI) ** 2)),
            issuedAt: new Date(from + (i * (to - from)) / 24).toISOString(), validUntil: null, horizonHours: 3, modelVersion: 's', degradationReason: null, modelValidationStatus: 'NOT_VALIDATED',
          })),
        }));
        return { ...t, rain: t.rain.map((st) => ({ ...st, points: st.points.filter((q) => Date.parse(q.t) <= now) })), risk };
      },
      ...opts.routes,
    },
  });
}
