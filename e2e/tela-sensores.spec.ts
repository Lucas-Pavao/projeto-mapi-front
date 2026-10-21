import { test, expect } from '@playwright/test';
import { installApi, lightTheme, semRolagemHorizontal, shot } from './support/api';

test.use({ serviceWorkers: 'block' });

test('/sensores: leitura, sem resposta destacada e filtro por tipo', async ({ page }, testInfo) => {
  await lightTheme(page);
  await installApi(page, { role: 'USER' });
  await page.goto('/sensores');
  await expect(page.getByRole('heading', { name: 'Sensores' })).toBeVisible();
  const velho = page.getByText('Sintético: pluviômetro 2').locator('xpath=ancestor::li');
  await expect(velho).toContainText('sem resposta');
  await expect(velho).toContainText('—');
  await expect(page.getByText('2 de 3 respondendo')).toBeVisible();
  await semRolagemHorizontal(page);
  await shot(page, testInfo, 'sensores');
  await page.getByRole('radio', { name: 'Rio' }).click();
  const lista = page.getByRole('complementary', { name: 'Sensores' });
  await expect(lista.getByText('Sintético: pluviômetro 1')).toBeHidden();
  await expect(lista.getByText('Sintético: rio 1')).toBeVisible();
});

test('/sensores com erro da API', async ({ page }, testInfo) => {
  await lightTheme(page);
  await installApi(page, { role: 'USER', routes: { 'GET /api/sensors/latest': () => ({ status: 500, json: {} }) } });
  await page.goto('/sensores');
  await expect(page.getByText('Não foi possível carregar sensores.')).toBeVisible({ timeout: 10_000 });
  await shot(page, testInfo, 'sensores-erro');
});
