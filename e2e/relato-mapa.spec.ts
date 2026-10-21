import { test, expect } from '@playwright/test';
import { installApi, lightTheme, shot } from './support/api';

test.use({ serviceWorkers: 'block' });

// Geolocalização determinística: a emulação do Chromium responde devagar (ou não responde) a pedidos
// simultâneos do mapa e do botão. O stub responde na hora, com a posição do teste.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const pos = { coords: { latitude: -8.0521, longitude: -34.9012, accuracy: 10, altitude: null, altitudeAccuracy: null, heading: null, speed: null }, timestamp: Date.now() };
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (ok: (p: unknown) => void) => setTimeout(() => ok(pos), 0),
        watchPosition: (ok: (p: unknown) => void) => { setTimeout(() => ok(pos), 0); return 1; },
        clearWatch: () => {},
      },
    });
  });
});

test('relato pela posição do aparelho (desktop): diálogo, POST /api/reports e nada de /pontos/scenarios', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await lightTheme(page);
  const api = await installApi(page, {
    role: 'USER',
    routes: { 'POST /api/reports': ({ body }) => ({ status: 201, json: { id: 55, status: 'PENDING', createdAt: new Date().toISOString(), ...(body as object) } }) },
  });
  await page.goto('/map');
  await expect(page.locator('.maplibregl-marker').getByRole('img', { name: 'Risco Alto' })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Reportar alagamento no local onde estou' }).click();
  const dlg = page.getByRole('dialog', { name: 'Reportar alagamento' });
  await expect(dlg).toContainText('Sua posição');
  await expect(dlg).toContainText('fila de um operador');
  await dlg.getByLabel('Altura da água').selectOption('KNEE');
  await dlg.getByLabel('O que você viu (opcional)').fill('Sintético: rua alagada até o joelho');
  await shot(page, testInfo, 'relato-mapa');
  await dlg.getByRole('button', { name: 'Enviar relato' }).click();
  await expect(page.getByText('Relato enviado. Um operador vai conferir.')).toBeVisible();
  const post = api.calls.find((c) => c.method === 'POST' && c.path === '/api/reports')!;
  expect(post.body).toMatchObject({ waterDepth: 'KNEE', description: 'Sintético: rua alagada até o joelho' });
  expect((post.body as { latitude: number }).latitude).toBeCloseTo(-8.0521, 4);
  expect((post.body as { longitude: number }).longitude).toBeCloseTo(-34.9012, 4);
  expect(Date.parse((post.body as { observedAt: string }).observedAt)).toBeGreaterThan(Date.now() - 60_000);
  expect(api.calls.some((c) => c.path.includes('/pontos/scenarios') || c.path.includes('/eventos-alagamento'))).toBe(false);
});

test('relato em etapas (celular): onde, alagado e até onde, descrição, POST /api/reports', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'celular');
  await lightTheme(page);
  const api = await installApi(page, {
    role: 'USER',
    routes: { 'POST /api/reports': ({ body }) => ({ status: 201, json: { id: 55, status: 'PENDING', createdAt: new Date().toISOString(), ...(body as object) } }) },
  });
  await page.goto('/map');
  await expect(page.locator('.maplibregl-marker').getByRole('img', { name: 'Risco Alto' })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Reportar alagamento', exact: true }).click();
  const dlg = page.getByRole('dialog', { name: 'Reportar alagamento' });
  await expect(dlg.getByText('Onde está alagado?')).toBeVisible();
  const continuar = dlg.getByRole('button', { name: 'Continuar' });
  await expect(continuar).toBeEnabled();
  expect((await continuar.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await continuar.click();
  // Escolha obrigatória antes de seguir.
  await dlg.getByRole('button', { name: 'Continuar' }).click();
  await expect(dlg.getByRole('alert')).toContainText('Escolha uma opção');
  await dlg.getByRole('radio', { name: 'Sim, está alagada' }).click();
  await dlg.getByRole('button', { name: 'Até o joelho' }).click();
  await shot(page, testInfo, 'relato-mapa-celular');
  await dlg.getByRole('button', { name: 'Continuar' }).click();
  await dlg.getByLabel(/Descrição/).fill('Sintético: rua alagada até o joelho');
  await dlg.getByRole('button', { name: 'Enviar relato' }).click();
  await expect(dlg.getByText('Relato enviado')).toBeVisible();
  const post = api.calls.find((c) => c.method === 'POST' && c.path === '/api/reports')!;
  expect(post.body).toMatchObject({ waterDepth: 'KNEE', description: 'Sintético: rua alagada até o joelho' });
  expect((post.body as { latitude: number }).latitude).toBeCloseTo(-8.0521, 4);
  expect(api.calls.some((c) => c.path.includes('/pontos/scenarios'))).toBe(false);
});

test('relato a partir do ponto crítico (celular) e erro 403 na etapa final', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'celular');
  await lightTheme(page);
  await installApi(page, { role: 'USER', routes: { 'POST /api/reports': () => ({ status: 403, json: {} }) } });
  await page.goto('/map');
  await page.locator('.maplibregl-marker').getByRole('img', { name: 'Risco Alto' }).click();
  await page.getByRole('dialog', { name: 'Sintético: ponto alto' }).getByRole('button', { name: 'Reportar cenário no local' }).click();
  const dlg = page.getByRole('dialog', { name: 'Reportar alagamento' });
  await expect(dlg.getByRole('button', { name: 'Continuar' })).toBeEnabled();
  await dlg.getByRole('button', { name: 'Continuar' }).click();
  await dlg.getByRole('radio', { name: 'Não, está seca' }).click();
  await dlg.getByRole('button', { name: 'Continuar' }).click();
  await dlg.getByRole('button', { name: 'Enviar relato' }).click();
  await expect(dlg.getByRole('alert')).toContainText('Sem permissão para enviar o relato');
  await shot(page, testInfo, 'relato-mapa-erro');
});
