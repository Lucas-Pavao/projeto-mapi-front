import { test, expect } from '@playwright/test';
import { installApi, lightTheme, semRolagemHorizontal, shot } from './support/api';

test.use({ serviceWorkers: 'block' });

test('/eventos: chuva em barras, maré e rio em linha, risco por ponto e alagamento marcado', async ({ page }, testInfo) => {
  await lightTheme(page);
  await installApi(page, { role: 'USER' });
  await page.goto('/eventos');
  await expect(page.locator('[data-series="SINTETICO-PLUV-01"] rect').first()).toBeVisible();
  await expect(page.locator('[data-series="tide"] path').first()).toBeVisible();
  await expect(page.locator('[data-series="SINTETICO-RIO-01"] path').first()).toBeVisible();
  const risco = page.locator('li[data-slug="sintetico-alto"]');
  await expect(risco.locator('li[data-risk="UNKNOWN"]')).not.toContainText('%');
  await expect(risco.getByText('Previsão experimental — modelo não validado')).toBeVisible();
  await expect(page.getByTestId('tide-datum-notice')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Eventos de alagamento' })).toContainText('gravidade observada: Média');
  await semRolagemHorizontal(page);
  await shot(page, testInfo, 'evento');
  await page.getByRole('button', { name: 'Últimas 72 h' }).click();
  await expect(page.getByRole('button', { name: 'Últimas 72 h' })).toHaveAttribute('aria-pressed', 'true');
});
