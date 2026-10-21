import { test, expect } from '@playwright/test';
import { installApi, lightTheme, PONTO_ALTO, semRolagemHorizontal, shot } from './support/api';

test.use({ serviceWorkers: 'block' });

test('/admin/pontos: lista, editar com sugestão de estação e PATCH parcial', async ({ page }, testInfo) => {
  await lightTheme(page);
  const api = await installApi(page, {
    role: 'ADMIN',
    routes: { 'PATCH /api/pontos/:slug': ({ body }) => ({ ...PONTO_ALTO, ...(body as object) }) },
  });
  await page.goto('/admin/pontos');
  await expect(page.locator('li[data-slug="sintetico-alto"] [data-risk="HIGH"]')).toContainText('Alto');
  await expect(page.locator('li[data-slug="sintetico-alto"]').getByText('Previsão experimental — modelo não validado')).toBeVisible();
  await semRolagemHorizontal(page);
  await shot(page, testInfo, 'pontos-admin');

  await page.getByRole('button', { name: 'Editar Sintético: ponto alto' }).click();
  const dlg = page.getByRole('dialog');
  await dlg.getByRole('button', { name: /Sugerir estações/ }).click();
  await dlg.getByRole('checkbox', { name: /Sintético: pluviômetro 1/ }).check();
  await dlg.getByLabel('Limiar de alerta de chuva (mm)').fill('50');
  await shot(page, testInfo, 'pontos-admin-editar');
  await dlg.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect.poll(() => api.calls.find((c) => c.method === 'PATCH')?.body).toEqual({ alertThresholdMm: 50, pluviometerStationIds: ['SINTETICO-PLUV-01'] });
  await expect(page.getByText('Ponto atualizado.')).toBeVisible();
});

test('/admin/pontos: USER não acessa', async ({ page }) => {
  await lightTheme(page);
  await installApi(page, { role: 'USER' });
  await page.goto('/admin/pontos');
  await expect(page.getByText('Seu perfil não acessa esta tela.')).toBeVisible();
});
