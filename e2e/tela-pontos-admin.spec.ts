import { test, expect } from '@playwright/test';
import { installApi, lightTheme, PONTO_ALTO, semRolagemHorizontal, shot } from './support/api';

test.use({ serviceWorkers: 'block' });

test('/admin/pontos: lista, mapa, sugestão de estação e PATCH parcial', async ({ page }, testInfo) => {
  await lightTheme(page);
  const api = await installApi(page, {
    role: 'ADMIN',
    routes: { 'PATCH /api/pontos/:slug': ({ body }) => ({ ...PONTO_ALTO, ...(body as object) }) },
  });
  await page.goto('/admin/pontos');
  await expect(page.locator('li[data-slug="sintetico-alto"]')).toBeVisible();
  await page.getByRole('button', { name: 'Editar Sintético: ponto alto' }).click();
  const form = page.getByRole('form', { name: 'Editar ponto' });
  await expect(form.getByText('Editar · Sintético: ponto alto')).toBeVisible();
  await form.getByRole('checkbox', { name: /Sintético: pluviômetro 1/ }).check();
  await form.getByLabel(/Limiar de alerta de chuva/).fill('50');
  await semRolagemHorizontal(page);
  await shot(page, testInfo, 'pontos-admin');
  await form.getByRole('button', { name: 'Salvar ponto' }).click();
  await expect.poll(() => api.calls.find((c) => c.method === 'PATCH')?.body).toEqual({ alertThresholdMm: 50, pluviometerStationIds: ['SINTETICO-PLUV-01'] });
  await expect(page.getByText('Ponto salvo. Entra no próximo ciclo de previsão.')).toBeVisible();
});

test('/admin/pontos: USER não acessa', async ({ page }) => {
  await lightTheme(page);
  await installApi(page, { role: 'USER' });
  await page.goto('/admin/pontos');
  await expect(page.getByText('Seu perfil não acessa esta tela.')).toBeVisible();
});
