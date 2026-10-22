import { test, expect } from '@playwright/test';
import { installApi, lightTheme, semRolagemHorizontal, shot } from './support/api';

test.use({ serviceWorkers: 'block' });

test('/eventos: chuva em barras, maré e rio em linha, risco por ponto e alagamento marcado', async ({ page }, testInfo) => {
  await lightTheme(page);
  await installApi(page, { role: 'USER' });
  await page.goto('/eventos');
  await expect(page.getByRole('img', { name: 'Chuva média ao longo do evento' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Maré ao longo do evento' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Nível do rio ao longo do evento' })).toBeVisible();
  const faixa = page.getByRole('group', { name: 'Risco de Sintético: ponto alto' });
  await expect(faixa.locator('button[data-risk="UNKNOWN"]').first()).not.toHaveAttribute('aria-label', /%/);
  await expect(page.getByText('Previsão experimental — modelo não validado')).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Resumo do evento' })).toContainText('alagamentos confirmados');
  await faixa.locator('button').nth(5).click();
  await expect(page.getByRole('complementary', { name: 'Resumo do evento' })).not.toContainText('(agora)');
  await semRolagemHorizontal(page);
  await shot(page, testInfo, 'evento');
  await page.getByRole('button', { name: 'Últimas 72 h' }).click();
  await expect(page.getByRole('button', { name: 'Últimas 72 h' })).toHaveAttribute('aria-pressed', 'true');
});
