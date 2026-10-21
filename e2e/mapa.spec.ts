import { test, expect } from '@playwright/test';

// Sem service worker: aqui a API vem de page.route, não do MSW.
test.use({ serviceWorkers: 'block' });

/** /map no tema claro: tiles claros, marcadores em tokens e screenshot anexado ao relatório. */
test('mapa no tema claro', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    localStorage.setItem('mapi.theme', 'light');
    localStorage.setItem('mapi.accent', 'capibaribe');
  });
  // API de dados do mapa sintética (os endpoints existentes não têm handler MSW).
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: { username: 'operador.sintetico', role: 'ADMIN' } }));
  await page.route(/\/api\/pontos$/, (route) =>
    route.fulfill({
      json: [
        { id: 1, slug: 'sintetico-1', name: 'Sintético: ponto de teste', municipality: 'Recife', description: null, latitude: -8.05, longitude: -34.9, altitudeM: 3, distanceToChannelM: 100, basinName: null, sensorConfig: null, active: true, tideHeight: null, tideUnit: null, floodPrediction: { riskLevel: 'HIGH', floodProbability: 0.8 } },
      ],
    }),
  );
  await page.route(/\/api\/sensors/, (route) => route.fulfill({ json: [] }));
  await page.goto('/map');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.getByRole('navigation', { name: 'Principal' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Risco Alto' })).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(1500); // tiles
  const shot = await page.screenshot({ path: testInfo.outputPath('mapa-claro.png') });
  await testInfo.attach('mapa-claro', { body: shot, contentType: 'image/png' });
});
