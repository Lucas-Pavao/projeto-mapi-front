import { test, expect } from '@playwright/test';
import { installApi, lightTheme, semRolagemHorizontal, shot } from './support/api';

test.use({ serviceWorkers: 'block' });

test('/pontos/:slug: risco atual UNKNOWN com motivo, histórico, terreno e aviso da maré', async ({ page }, testInfo) => {
  await lightTheme(page);
  await installApi(page, { role: 'USER' });
  await page.goto('/pontos/sintetico-alto');
  await expect(page.getByRole('heading', { name: 'Sintético: ponto alto' })).toBeVisible();
  const agora = page.getByRole('region', { name: 'Risco atual' });
  await expect(agora.locator('[data-risk="UNKNOWN"]')).toContainText('Previsão indisponível');
  await expect(agora.getByTestId('unknown-detail')).toContainText('o modelo demorou demais');
  await expect(agora.locator('[data-risk="UNKNOWN"]')).not.toContainText('%');
  const hist = page.getByRole('region', { name: 'Histórico de risco' });
  await expect(hist.locator('li[data-risk="HIGH"]').first()).toBeVisible();
  await expect(page.getByTestId('terrain-facts')).toContainText('cota da rua');
  await expect(page.getByTestId('tide-datum-notice')).toBeVisible();
  await semRolagemHorizontal(page);
  await shot(page, testInfo, 'ponto');
});

test('/pontos/:slug inexistente', async ({ page }, testInfo) => {
  await lightTheme(page);
  await installApi(page, { role: 'USER' });
  await page.goto('/pontos/nao-existe');
  await expect(page.getByRole('heading', { name: 'Ponto não encontrado' })).toBeVisible();
  await shot(page, testInfo, 'ponto-404');
});
