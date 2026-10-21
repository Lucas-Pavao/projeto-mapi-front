import { test, expect } from '@playwright/test';
import { installApi, lightTheme, semRolagemHorizontal, shot } from './support/api';

test.use({ serviceWorkers: 'block' });

test('/admin/usuarios: lista, troca de perfil e convite com link', async ({ page }, testInfo) => {
  await lightTheme(page);
  const api = await installApi(page, {
    role: 'ADMIN',
    routes: {
      'PATCH /api/admin/users/:id': () => ({ id: 2, name: 'Sintético Operador', email: 'operador@example.org', role: 'ADMIN', active: true }),
      'POST /api/admin/invites': ({ body }) => ({ status: 201, json: { token: 'tok-sintetico', role: (body as { role: string }).role, expiresAt: new Date(Date.now() + 72 * 3_600_000).toISOString() } }),
    },
  });
  await page.goto('/admin/usuarios');
  await expect(page.locator('[data-user-id="3"]')).toContainText('Sem e-mail');
  await expect(page.locator('[data-user-id="3"]')).toContainText('Sem nome');
  await semRolagemHorizontal(page);
  await shot(page, testInfo, 'usuarios');

  await page.getByLabel(/Perfil de Sintético Operador/).selectOption('ADMIN');
  await expect.poll(() => api.calls.find((c) => c.method === 'PATCH')?.body).toEqual({ role: 'ADMIN' });

  await page.getByRole('button', { name: 'Convidar' }).click();
  await page.getByLabel('Perfil', { exact: true }).selectOption('OPERADOR');
  await shot(page, testInfo, 'usuarios-convite');
  await page.getByRole('button', { name: 'Gerar convite' }).click();
  const dlg = page.getByRole('dialog', { name: 'Convite criado' });
  await expect(dlg.getByLabel('Link de cadastro')).toHaveValue(/\/login\?convite=tok-sintetico$/);
  await shot(page, testInfo, 'usuarios-convite-criado');
});

test('/admin/usuarios: OPERADOR não acessa', async ({ page }) => {
  await lightTheme(page);
  await installApi(page, { role: 'OPERADOR' });
  await page.goto('/admin/usuarios');
  await expect(page.getByText('Seu perfil não acessa esta tela.')).toBeVisible();
});
