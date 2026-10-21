import { test, expect } from '@playwright/test';
import { ALERTAS, installApi, lightTheme, semRolagemHorizontal, shot, sse, ago } from './support/api';

test.use({ serviceWorkers: 'block' });

test('/alertas: reconhecer, alerta ao vivo e regras', async ({ page }, testInfo) => {
  await lightTheme(page);
  const aberto = ALERTAS.filter((a) => !a.acknowledgedAt);
  const api = await installApi(page, {
    role: 'OPERADOR',
    stream: sse('alert', { id: 77, kind: 'RAIN_RATE', severity: 'WARNING', title: 'Sintético: chuva forte ao vivo', triggeredAt: ago(0), floodPointSlug: null }),
    routes: {
      'GET /api/alerts': ({ url }) => ({ page: 0, size: 20, totalElements: aberto.length, content: url.searchParams.get('status') === 'ACKNOWLEDGED' ? [ALERTAS[2]] : aberto }),
      'POST /api/alerts/:id/ack': () => ({ ...ALERTAS[0], acknowledgedAt: ago(0), acknowledgedBy: 'sintetico.operador' }),
    },
  });
  await page.goto('/alertas');
  const alto = page.locator('li[data-alert-id="1"]');
  await expect(alto).toContainText('Sintético: risco alto no ponto de teste');
  await expect(alto.locator('[data-risk="HIGH"]')).toContainText('Alto');
  await expect(alto.getByText('Previsão experimental — modelo não validado')).toBeVisible();
  const unk = page.locator('li[data-alert-id="2"]');
  await expect(unk.locator('[data-risk="UNKNOWN"]')).not.toContainText('%');
  // alerta chegou pelo stream, sem recarregar
  await expect(page.locator('li[data-alert-id="77"]')).toContainText('chuva forte ao vivo');
  await expect(page.locator('[data-live-status]').first()).toBeVisible();
  await semRolagemHorizontal(page);
  await shot(page, testInfo, 'alertas');

  await alto.getByRole('button', { name: /Reconhecer/ }).click();
  await expect.poll(() => api.calls.some((c) => c.method === 'POST' && c.path === '/api/alerts/1/ack')).toBe(true);

  await expect(page.getByRole('radiogroup', { name: 'Nível mínimo' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: /WhatsApp/ })).toBeDisabled();
  await shot(page, testInfo, 'alertas-regras');
  await page.getByRole('button', { name: 'Todas as regras' }).click();
  await expect(page.getByText('Chuva em 1 h')).toBeVisible();
  await page.getByRole('button', { name: 'Nova regra' }).click();
  await expect(page.getByRole('dialog', { name: 'Nova regra de alerta' })).toBeVisible();
  await shot(page, testInfo, 'alertas-regra-nova');
});

test('USER não acessa /alertas', async ({ page }) => {
  await lightTheme(page);
  await installApi(page, { role: 'USER' });
  await page.goto('/alertas');
  await expect(page.getByText('Seu perfil não acessa esta tela.')).toBeVisible();
});
