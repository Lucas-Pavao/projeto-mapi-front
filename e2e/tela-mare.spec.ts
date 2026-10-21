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
  await semRolagemHorizontal(page);
  await shot(page, testInfo, 'mare');
});

test('/mare sem dados', async ({ page }, testInfo) => {
  await lightTheme(page);
  await installApi(page, { role: 'USER', routes: { 'GET /api/events/timeline': ({ url }) => ({ from: url.searchParams.get('from'), to: url.searchParams.get('to'), stepMinutes: 10, rain: [], tide: { harbor: 'pe02', points: [] }, river: [], risk: [] }) } });
  await page.goto('/mare');
  await expect(page.getByText('Sem dados de maré nesta janela.')).toBeVisible();
  await shot(page, testInfo, 'mare-vazio');
});
