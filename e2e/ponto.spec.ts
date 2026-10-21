import { test, expect, type Page, type TestInfo } from '@playwright/test';

// Sem service worker: a API vem de page.route (dados sintéticos).
test.use({ serviceWorkers: 'block' });

const base = { municipality: 'Recife', description: null, altitudeM: 3, distanceToChannelM: 100, basinName: null, sensorConfig: null, active: true, tideHeight: null, tideUnit: null };
const ALTO = { ...base, id: 1, slug: 'sintetico-alto', name: 'Sintético: ponto alto', latitude: -8.05, longitude: -34.9, floodPrediction: { riskLevel: 'HIGH', floodProbability: 0.78 } };
const INDISP = { ...base, id: 2, slug: 'sintetico-indisponivel', name: 'Sintético: ponto sem previsão', latitude: -8.05, longitude: -34.907, floodPrediction: { riskLevel: 'UNKNOWN', floodProbability: null, degradationReason: 'AI_UNAVAILABLE' } };

async function mocks(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('mapi.theme', 'light');
    localStorage.setItem('mapi.accent', 'capibaribe');
  });
  await page.route('**/api/auth/me', (r) => r.fulfill({ json: { username: 'operador.sintetico', role: 'ADMIN' } }));
  await page.route(/\/api\/pontos$/, (r) => r.fulfill({ json: [INDISP, ALTO] }));
  await page.route(/\/api\/pontos\/sintetico-/, (r) => r.fulfill({ json: r.request().url().includes('alto') ? ALTO : INDISP }));
  await page.route(/\/api\/sensors/, (r) => r.fulfill({ json: [] }));
  await page.route(/\/api\/environmental-data/, (r) => {
    const lat = Number(new URL(r.request().url()).searchParams.get('latitude'));
    r.fulfill({
      json: {
        requestedLatitude: lat, requestedLongitude: -34.9,
        preciseData: { timestamp: new Date().toISOString(), temperature: 28.1, humidity: 80, pressure: 1010, windSpeed: 10, precipitation: 0, waterLevel: null, flowRate: null, tideHeight: null, latestReadings: [] },
        nearestSensor: null, openMeteoData: { current: { precipitation: 0 } }, distanceToNearestSensorKm: null,
      },
    });
  });
  await page.route(/\/api\/flood-predictions/, (r) => {
    const lat = Number(new URL(r.request().url()).searchParams.get('latitude'));
    const alto = Math.abs(lat - ALTO.latitude) < 1e-9 && !r.request().url().includes('-34.907');
    r.fulfill({
      json: alto
        ? { riskLevel: 'HIGH', floodProbability: 0.78, modelValidationStatus: 'NOT_VALIDATED', issuedAt: new Date().toISOString(), horizonHours: 1 }
        : { riskLevel: 'UNKNOWN', floodProbability: null, degradationReason: 'AI_UNAVAILABLE', modelValidationStatus: 'NOT_VALIDATED' },
    });
  });
}

async function anexa(page: Page, testInfo: TestInfo, nome: string) {
  const shot = await page.screenshot({ path: testInfo.outputPath(`${nome}.png`) });
  await testInfo.attach(nome, { body: shot, contentType: 'image/png' });
}

async function abre(page: Page) {
  await mocks(page);
  await page.goto('/map');
  await expect(page.locator('.maplibregl-marker').getByRole('img', { name: 'Risco Alto' })).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(1200);
}

test('desktop: popup do ponto HIGH com RiskBadge e rótulo experimental', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await abre(page);
  await page.locator('.maplibregl-marker').getByRole('img', { name: 'Risco Alto' }).click();
  const popup = page.locator('.maplibregl-popup-content');
  await expect(popup).toBeVisible();
  await expect(popup.locator('[data-risk="HIGH"]')).toContainText('Alto');
  await expect(popup.locator('[data-risk="HIGH"]')).toContainText('78%');
  await expect(popup.getByText('Previsão experimental — modelo não validado')).toBeVisible();
  await expect(page.locator('div[role=dialog].fixed')).toHaveCount(0); // desktop mantém o popup do MapLibre
  await page.waitForTimeout(800);
  await anexa(page, testInfo, 'desktop-popup-alto');
});

test('celular: folha do ponto com ponto HIGH e com ponto UNKNOWN', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'celular');
  await abre(page);

  // HIGH
  const marcador = page.locator('.maplibregl-marker').getByRole('img', { name: 'Risco Alto' });
  await marcador.click();
  const folha = page.getByRole('dialog', { name: 'Sintético: ponto alto' });
  await expect(folha).toBeVisible();
  await expect(folha.locator('[data-risk="HIGH"]')).toContainText('78%');
  await expect(folha.getByText('Previsão experimental — modelo não validado')).toBeVisible();
  await page.waitForTimeout(1200); // deslocamento do mapa
  const sheet = folha.locator('section');
  const [m, f] = await Promise.all([marcador.boundingBox(), sheet.boundingBox()]);
  expect(m!.y + m!.height).toBeLessThanOrEqual(f!.y + 1); // marcador acima da folha
  expect(f!.height).toBeLessThanOrEqual(640 + 2);
  for (const nome of ['Voltar ao mapa', 'Ponto anterior', 'Próximo ponto', 'Reportar cenário no local']) {
    expect((await folha.getByRole('button', { name: nome }).boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  await anexa(page, testInfo, 'celular-folha-alto');

  await page.keyboard.press('Escape');
  await expect(folha).toBeHidden();

  // UNKNOWN
  await page.waitForTimeout(800);
  await page.locator('.maplibregl-marker').getByRole('img', { name: 'Risco Previsão indisponível' }).click();
  const folha2 = page.getByRole('dialog', { name: 'Sintético: ponto sem previsão' });
  await expect(folha2).toBeVisible();
  const selo = folha2.locator('[data-risk="UNKNOWN"]').first();
  await expect(selo).toHaveClass(/border-dashed/);
  await expect(selo).not.toContainText('%');
  await page.waitForTimeout(1200);
  await anexa(page, testInfo, 'celular-folha-indisponivel');
});

test('celular: o menu abre pelo logotipo da barra do mapa e tem Sair', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'celular');
  await abre(page);
  await expect(page.getByText('operador.sintetico')).toBeHidden();
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await expect(page.getByRole('dialog', { name: 'Menu principal' }).getByRole('button', { name: 'Sair' })).toBeVisible();
  await anexa(page, testInfo, 'celular-menu-sair');
});
