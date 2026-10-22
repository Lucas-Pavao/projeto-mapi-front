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
  const det = page.getByRole('region', { name: 'Relato selecionado' });
  await expect(det).toContainText('a 250 m');
  await semRolagemHorizontal(page);
  await shot(page, testInfo, 'relatos');

  await det.getByRole('radio', { name: 'Alta' }).click();
  await shot(page, testInfo, 'relatos-confirmar');
  await det.getByRole('button', { name: 'Confirmar relato 1' }).click();
  await expect.poll(() => api.calls.find((c) => c.method === 'PATCH')?.body).toEqual({ status: 'CONFIRMED', floodPointSlug: 'sintetico-alto', severity: 'HIGH' });
  await expect(page.getByText(/Relato confirmado/)).toBeVisible();

  await det.getByRole('button', { name: 'Descartar relato 1' }).click();
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
