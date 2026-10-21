import { test, expect } from '@playwright/test';
import { installApi, lightTheme, semRolagemHorizontal, shot } from './support/api';

test.use({ serviceWorkers: 'block' });

test('/mare: maré em linha, hora atual marcada, extremos e aviso da ADR 0009', async ({ page }, testInfo) => {
  await lightTheme(page);
  await installApi(page, { role: 'USER' });
  await page.goto('/mare');
  await expect(page.getByTestId('tide-datum-notice')).toBeVisible();
  await expect(page.getByTestId('tide-now')).toContainText('m agora');
  await expect(page.locator('[data-series="tide"] path').first()).toBeVisible();
  await expect(page.locator('[data-extreme]').first()).toBeVisible();
  // passado contínuo, futuro tracejado, fundo da previsão e "agora"
  await expect(page.locator('[data-series="tide"] path[data-dashed="false"]').first()).toBeVisible();
  await expect(page.locator('[data-series="tide"] path[data-dashed="true"]').first()).toBeVisible();
  await expect(page.locator('[data-future-band]')).toHaveCount(1);
  await expect(page.getByTestId('future-legend')).toBeVisible();
  await semRolagemHorizontal(page);
  await shot(page, testInfo, 'mare');
  const api = await page.evaluate(() => performance.getEntriesByType('resource').map((r) => r.name).filter((n) => n.includes('/api/events/timeline')));
  const q = new URL(api[0]);
  const horasAFrente = (Date.parse(q.searchParams.get('to')!) - Date.now()) / 3_600_000;
  expect(horasAFrente).toBeGreaterThan(11);
  expect(horasAFrente).toBeLessThanOrEqual(72);
});

test('/mare: "Próximas 72 h" pede até agora + 72 h e mostra só previsão', async ({ page }, testInfo) => {
  await lightTheme(page);
  await installApi(page, { role: 'USER' });
  await page.goto('/mare');
  await page.getByRole('button', { name: 'Próximas 72 h' }).click();
  await expect(page.getByRole('button', { name: 'Próximas 72 h' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-series="tide"] path[data-dashed="true"]').first()).toBeVisible();
  await expect(page.locator('[data-series="tide"] path[data-dashed="false"]')).toHaveCount(0);
  await shot(page, testInfo, 'mare-proximas-72h');
});

test('/mare sem dados', async ({ page }, testInfo) => {
  await lightTheme(page);
  await installApi(page, { role: 'USER', routes: { 'GET /api/events/timeline': ({ url }) => ({ from: url.searchParams.get('from'), to: url.searchParams.get('to'), stepMinutes: 10, rain: [], tide: { harbor: 'pe02', points: [] }, river: [], risk: [] }) } });
  await page.goto('/mare');
  await expect(page.getByText('Sem dados de maré nesta janela.')).toBeVisible();
  await shot(page, testInfo, 'mare-vazio');
});
