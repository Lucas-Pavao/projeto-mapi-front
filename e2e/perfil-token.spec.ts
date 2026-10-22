import { test, expect } from '@playwright/test';
import { installApi, lightTheme, shot } from './support/api';

test.use({ serviceWorkers: 'block' });

test('perfil rebaixado: TOKEN_REVOKED, refresh, /me novo e redireciona ao mapa com aviso', async ({ page }, testInfo) => {
  await lightTheme(page);
  let role = 'OPERADOR';
  let revogado = false;
  const api = await installApi(page, {
    role: null,
    routes: {
      'GET /api/auth/me': () => ({ id: 1, username: 'sintetico.operador', email: 'operador@example.org', name: 'Sintético Operador', role }),
      'GET /api/alerts': () => {
        if (!revogado && role === 'OPERADOR') { revogado = true; return { status: 401, json: { code: 'TOKEN_REVOKED' } }; }
        return { page: 0, size: 20, totalElements: 0, content: [] };
      },
      'POST /api/auth/refresh': () => { role = 'USER'; return { status: 200, json: {} }; },
    },
  });
  await page.goto('/alertas');
  // primeira carga: a lista pede 401 -> refresh -> /me (USER) -> RequireRole manda ao mapa
  await expect(page).toHaveURL(/\/map$/);
  await expect(page.getByText('Seu perfil mudou.')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Alertas' })).toHaveCount(0);
  expect(api.calls.filter((c) => c.path === '/api/auth/refresh' && c.method === 'POST')).toHaveLength(1);
  await page.waitForTimeout(600);
  await shot(page, testInfo, 'perfil-mudou-redirect');
});

test('refresh recusado (403): logout e tela de login com aviso de sessão expirada', async ({ page }, testInfo) => {
  await lightTheme(page);
  let sessao = true;
  await installApi(page, {
    role: null,
    routes: {
      'GET /api/auth/me': () => (sessao ? { id: 1, username: 'sintetico.operador', email: null, name: null, role: 'OPERADOR' } : { status: 403, json: {} }),
      'GET /api/alerts': () => ({ status: 401, json: { code: 'TOKEN_REVOKED' } }),
      'POST /api/auth/refresh': () => { sessao = false; return { status: 403, json: {} }; },
    },
  });
  await page.goto('/alertas');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText('Sua sessão expirou. Entre de novo para continuar.')).toBeVisible();
  await shot(page, testInfo, 'sessao-expirada');
});

test('403 comum em endpoint de dados não derruba a sessão', async ({ page }) => {
  await lightTheme(page);
  await installApi(page, { role: 'OPERADOR', routes: { 'GET /api/alerts': () => ({ status: 403, json: {} }) } });
  await page.goto('/alertas');
  await expect(page).toHaveURL(/\/alertas$/);
  await expect(page.getByText('Não foi possível carregar os alertas.')).toBeVisible({ timeout: 10_000 });
});
