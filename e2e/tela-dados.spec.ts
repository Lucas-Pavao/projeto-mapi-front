import { test, expect } from '@playwright/test';
import { installApi, lightTheme, semRolagemHorizontal, shot } from './support/api';

test.use({ serviceWorkers: 'block' });

test('/admin/dados: fontes, execuções e integridade', async ({ page }, testInfo) => {
  await lightTheme(page);
  await installApi(page, { role: 'ADMIN' });
  await page.goto('/admin/dados');
  await expect(page.locator('[data-source="OPEN_METEO"]')).toContainText('Com falha');
  await expect(page.locator('[data-source="APAC"]')).toContainText('Atrasada');
  await expect(page.locator('[data-source="TABUA_MARE"]')).toContainText('Parada');
  await expect(page.locator('tr[data-run-id]')).toHaveCount(2);
  await page.getByRole('button', { name: 'Verificar agora' }).click();
  await expect(page.getByRole('cell', { name: 'sintetico-alto' })).toBeVisible();
  await semRolagemHorizontal(page);
  await shot(page, testInfo, 'dados');
});

test('/admin/dados: OPERADOR não acessa', async ({ page }) => {
  await lightTheme(page);
  await installApi(page, { role: 'OPERADOR' });
  await page.goto('/admin/dados');
  await expect(page.getByText('Seu perfil não acessa esta tela.')).toBeVisible();
});
