import { test, expect } from '@playwright/test';
import { installApi, lightTheme, semRolagemHorizontal, shot } from './support/api';

test.use({ serviceWorkers: 'block' });

const PUBLICO = (risk: string, extra: Record<string, unknown> = {}) => ({
  nearestPoint: { slug: 'sintetico-alto', name: 'Sintético: ponto alto', distanceM: 300, riskLevel: risk, issuedAt: new Date().toISOString(), validUntil: null, degradationReason: risk === 'UNKNOWN' ? 'AI_UNAVAILABLE' : null },
  rainLastHourMm: 3.2, rainStationId: 'SINTETICO-PLUV-01', modelValidationStatus: 'NOT_VALIDATED',
  meaning: risk === 'UNKNOWN' ? 'O modelo não respondeu ou faltam dados. Isto não significa risco baixo: use sensores e observação em campo.' : 'Probabilidade intermediária. Vale acompanhar o ponto e conferir os sensores próximos.',
  ...extra,
});

test.beforeEach(async ({ context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: -8.057384, longitude: -34.877199 });
});

test('/minha-rua sem login: classe moderada com selo experimental e aviso fixo', async ({ page }, testInfo) => {
  await lightTheme(page);
  const api = await installApi(page, { role: null, routes: { 'GET /api/public/risk': () => PUBLICO('MEDIUM') } });
  await page.goto('/minha-rua');
  await expect(page.getByRole('note')).toContainText('não confirma nem descarta alagamento');
  await shot(page, testInfo, 'minha-rua-inicial');
  await page.getByRole('button', { name: 'Usar minha localização' }).click();
  const sec = page.getByRole('region', { name: 'Risco perto de você' });
  await expect(sec.locator('[data-risk="MEDIUM"]')).toContainText('Moderado');
  await expect(sec.getByText('Previsão experimental — modelo não validado')).toBeVisible();
  const chamada = api.calls.find((c) => c.path.startsWith('/api/public/risk'))!;
  expect(chamada.path).toContain('lat=-8.057');
  expect(chamada.path).toContain('lon=-34.877');
  await semRolagemHorizontal(page);
  await shot(page, testInfo, 'minha-rua');
});

test('/minha-rua: previsão indisponível e sem ponto perto', async ({ page }, testInfo) => {
  await lightTheme(page);
  let n = 0;
  await installApi(page, { role: null, routes: { 'GET /api/public/risk': () => (n++ === 0 ? PUBLICO('UNKNOWN') : PUBLICO('LOW', { nearestPoint: null })) } });
  await page.goto('/minha-rua');
  await page.getByRole('button', { name: 'Usar minha localização' }).click();
  await expect(page.getByTestId('unknown-reason')).toContainText('o modelo está fora do ar');
  await expect(page.locator('[data-risk="UNKNOWN"]')).not.toContainText('%');
  await shot(page, testInfo, 'minha-rua-indisponivel');
  await page.getByRole('button', { name: 'Atualizar minha localização' }).click();
  await expect(page.getByText('Não há ponto monitorado perto deste endereço.')).toBeVisible();
  await shot(page, testInfo, 'minha-rua-sem-ponto');
});

test('/minha-rua: 429 com espera', async ({ page }, testInfo) => {
  await lightTheme(page);
  await installApi(page, { role: null, routes: { 'GET /api/public/risk': () => ({ status: 429, json: {}, headers: { 'Retry-After': '20' } }) } });
  await page.goto('/minha-rua');
  await page.getByRole('button', { name: 'Usar minha localização' }).click();
  await expect(page.getByText(/Espere 20 segundos/)).toBeVisible();
  await shot(page, testInfo, 'minha-rua-429');
});
