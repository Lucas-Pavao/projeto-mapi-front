import { test, expect, type Page, type TestInfo } from '@playwright/test';

// Sem service worker: aqui a API vem de page.route, não do MSW.
test.use({ serviceWorkers: 'block' });

/** /map no tema claro: tiles claros, marcadores em tokens e screenshot anexado ao relatório. */
async function prepara(page: Page) {
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
}

const PONTO = { id: 1, slug: 'sintetico-1', name: 'Sintético: ponto de teste', municipality: 'Recife', description: null, latitude: -8.05, longitude: -34.9, altitudeM: 3, distanceToChannelM: 100, basinName: null, sensorConfig: null, active: true, tideHeight: null, tideUnit: null, floodPrediction: { riskLevel: 'HIGH', floodProbability: 0.8 } };

async function anexa(page: Page, testInfo: TestInfo, nome: string) {
  const shot = await page.screenshot({ path: testInfo.outputPath(`${nome}.png`) });
  await testInfo.attach(nome, { body: shot, contentType: 'image/png' });
}

async function abreMapa(page: Page) {
  await page.route(/\/api\/pontos\/sintetico-1/, (route) => route.fulfill({ json: { ...PONTO, floodPrediction: PONTO.floodPrediction } }));
  await page.goto('/map');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.getByRole('navigation', { name: 'Principal' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Risco Alto' })).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(1500); // tiles
}

test('mapa no tema claro', async ({ page }, testInfo) => {
  await prepara(page);
  await abreMapa(page);
  await anexa(page, testInfo, 'mapa-claro');
});

for (const [w, h] of [[1280, 800], [1440, 900]] as const) {
  test(`Nav sem corte nem rolagem horizontal em ${w}x${h}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop');
    await page.setViewportSize({ width: w, height: h });
    await prepara(page);
    await abreMapa(page);
    const nav = page.getByRole('navigation', { name: 'Principal' });
    const sobra = await nav.evaluate((n) => n.scrollWidth - n.clientWidth);
    expect(sobra).toBeLessThanOrEqual(0);
    const cortados = await nav.locator('a:visible, button:visible').evaluateAll((els) =>
      els.filter((e) => { const r = e.getBoundingClientRect(); return r.right > window.innerWidth || r.left < 0; }).length,
    );
    expect(cortados).toBe(0);
    const mais = nav.getByRole('button', { name: /Mais/ });
    await expect(mais).toBeVisible();
    await mais.click();
    await expect(mais).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('link', { name: 'Pontos' })).toBeVisible();
    await anexa(page, testInfo, `mapa-${w}x${h}-mais-aberto`);
    await page.keyboard.press('Escape');
    await expect(mais).toBeFocused();
    await anexa(page, testInfo, `mapa-${w}x${h}`);
  });
}

test('acima de 1440 px tudo inline, sem Mais', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.setViewportSize({ width: 1920, height: 1080 });
  await prepara(page);
  await abreMapa(page);
  const nav = page.getByRole('navigation', { name: 'Principal' });
  await expect(nav.getByRole('button', { name: /Mais/ })).toBeHidden();
  await expect(nav.getByRole('link', { name: 'Pontos' })).toBeVisible();
});

test('popup do ponto não cobre o marcador', async ({ page }, testInfo) => {
  await prepara(page);
  await abreMapa(page);
  const marcador = page.getByRole('img', { name: 'Risco Alto' });
  await marcador.click();
  const popup = page.locator('.maplibregl-popup-content');
  await expect(popup).toBeVisible();
  await page.waitForTimeout(1200); // autoPan
  const [m, p] = await Promise.all([marcador.boundingBox(), popup.boundingBox()]);
  const cobre = m && p && m.x < p.x + p.width && m.x + m.width > p.x && m.y < p.y + p.height && m.y + m.height > p.y;
  expect(cobre).toBeFalsy();
  await anexa(page, testInfo, `popup-${testInfo.project.name}`);
});
