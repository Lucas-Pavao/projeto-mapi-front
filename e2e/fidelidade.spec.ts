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
