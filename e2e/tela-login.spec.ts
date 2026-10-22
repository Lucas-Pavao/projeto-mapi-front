import { test, expect } from '@playwright/test';
import { installApi, lightTheme, shot } from './support/api';

test.use({ serviceWorkers: 'block' });

test('/login: erro de credencial, depois entra e vai ao mapa', async ({ page }, testInfo) => {
  await lightTheme(page);
  let tentativas = 0;
  const api = await installApi(page, {
    role: null,
    routes: { 'POST /api/auth/login': () => (tentativas++ === 0 ? { status: 403, json: { message: 'Bad credentials' } } : { status: 200, json: {} }) },
  });
  await page.goto('/login');
  await shot(page, testInfo, 'login');
  await page.getByLabel('Usuário').fill('ana');
  await page.getByLabel('Senha').fill('errada');
  await page.getByRole('button', { name: 'ENTRAR' }).click();
  await expect(page.getByRole('alert')).toContainText('Usuário ou senha incorretos');
  await shot(page, testInfo, 'login-erro');
  await page.unroute('**/api/auth/me');
  await page.route('**/api/auth/me', (r) => r.fulfill({ json: { username: 'ana', role: 'USER' } }));
  await page.getByRole('button', { name: 'ENTRAR' }).click();
  await expect(page).toHaveURL(/\/map$/);
  expect(api.calls.filter((c) => c.path === '/api/auth/login')).toHaveLength(2);
});

test('/login?convite=: abre o cadastro, manda o token e limpa a URL', async ({ page }, testInfo) => {
  await lightTheme(page);
  const api = await installApi(page, { role: null, routes: { 'POST /api/auth/register': () => ({ status: 201, json: {} }), 'POST /api/auth/login': () => ({ status: 200, json: {} }) } });
  await page.goto('/login?convite=tok-sintetico');
  await expect(page.getByText(/Você chegou por um convite/)).toBeVisible();
  await expect(page).toHaveURL(/\/login$/); // token fora da URL e do histórico
  await shot(page, testInfo, 'login-convite');
  await page.getByLabel('Usuário').fill('bia');
  await page.getByLabel('Senha').fill('senha-boa-123');
  await page.getByLabel('E-mail (opcional)').fill('bia@exemplo.org');
  await page.route('**/api/auth/me', (r) => r.fulfill({ json: { username: 'bia', role: 'OPERADOR' } }));
  await page.getByRole('button', { name: 'CRIAR CONTA' }).click();
  await expect.poll(() => api.calls.find((c) => c.path === '/api/auth/register')?.body).toEqual({ username: 'bia', password: 'senha-boa-123', email: 'bia@exemplo.org', inviteToken: 'tok-sintetico' });
});
