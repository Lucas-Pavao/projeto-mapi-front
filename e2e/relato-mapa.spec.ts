import { test, expect } from '@playwright/test';
import { installApi, lightTheme, shot } from './support/api';

test.use({ serviceWorkers: 'block' });

test.beforeEach(async ({ context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: -8.0521, longitude: -34.9012 });
});

test('relato pela posição do aparelho: folha, POST /api/reports e nada de /pontos/scenarios', async ({ page }, testInfo) => {
  await lightTheme(page);
  const api = await installApi(page, {
    role: 'USER',
    routes: { 'POST /api/reports': ({ body }) => ({ status: 201, json: { id: 55, status: 'PENDING', createdAt: new Date().toISOString(), ...(body as object) } }) },
  });
  await page.goto('/map');
  await expect(page.getByRole('img', { name: 'Risco Alto' })).toBeVisible({ timeout: 15_000 });
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

test('relato a partir do ponto crítico (painel analítico) e erro 403 no diálogo', async ({ page }, testInfo) => {
  await lightTheme(page);
  const api = await installApi(page, { role: 'USER', routes: { 'POST /api/reports': () => ({ status: 403, json: {} }) } });
  await page.goto('/map');
  await page.getByRole('img', { name: 'Risco Alto' }).click();
  await page.getByRole('button', { name: /Painel analítico completo/ }).click();
  await page.getByRole('button', { name: 'Reportar alagamento', exact: true }).click();
  const dlg = page.getByRole('dialog', { name: 'Reportar alagamento' });
  await expect(dlg).toContainText('Sintético: ponto alto');
  await dlg.getByRole('button', { name: 'Enviar relato' }).click();
  await expect(dlg.getByRole('alert')).toContainText('Sem permissão para enviar o relato');
  await shot(page, testInfo, 'relato-mapa-erro');
  const post = api.calls.find((c) => c.method === 'POST' && c.path === '/api/reports')!;
  expect((post.body as { latitude: number }).latitude).toBeCloseTo(-8.05, 4);
});
