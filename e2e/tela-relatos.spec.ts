import { test, expect } from '@playwright/test';
import { installApi, lightTheme, RELATOS, semRolagemHorizontal, shot } from './support/api';

test.use({ serviceWorkers: 'block' });

test('/relatos: fila, confirmar com ponto e gravidade, descartar com motivo', async ({ page }, testInfo) => {
  await lightTheme(page);
  const api = await installApi(page, {
    role: 'OPERADOR',
    routes: {
      'PATCH /api/reports/:id': ({ body }) => ({ ...RELATOS[0], status: (body as { status: string }).status }),
    },
  });
  await page.goto('/relatos');
  const li = page.locator('li[data-report-id="1"]');
  await expect(li).toContainText('Até o joelho');
  await expect(li).toContainText('a 250 m');
  await semRolagemHorizontal(page);
  await shot(page, testInfo, 'relatos');

  await li.getByRole('button', { name: 'Confirmar relato 1' }).click();
  const dlg = page.getByRole('dialog', { name: 'Confirmar relato #1' });
  await expect(dlg.getByLabel('Ponto crítico')).toHaveValue('sintetico-alto');
  await dlg.getByLabel('Gravidade observada').selectOption('HIGH');
  await shot(page, testInfo, 'relatos-confirmar');
  await dlg.getByRole('button', { name: 'Confirmar relato' }).click();
  await expect.poll(() => api.calls.find((c) => c.method === 'PATCH')?.body).toEqual({ status: 'CONFIRMED', floodPointSlug: 'sintetico-alto', severity: 'HIGH' });
  await expect(page.getByText(/Relato confirmado/)).toBeVisible();

  await li.getByRole('button', { name: 'Descartar relato 1' }).click();
  const d2 = page.getByRole('dialog', { name: 'Descartar relato #1' });
  await d2.getByRole('button', { name: 'Descartar relato' }).click();
  await expect(d2.getByText(/Diga por que/)).toBeVisible();
  await shot(page, testInfo, 'relatos-descartar');
});

test('/relatos: USER não acessa', async ({ page }) => {
  await lightTheme(page);
  await installApi(page, { role: 'USER' });
  await page.goto('/relatos');
  await expect(page.getByText('Seu perfil não acessa esta tela.')).toBeVisible();
});
