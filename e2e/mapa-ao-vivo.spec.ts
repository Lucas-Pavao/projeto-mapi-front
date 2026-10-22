import { test, expect } from '@playwright/test';
import { installApi, lightTheme, shot, sse, ago, PONTO_ALTO, PONTO_BAIXO } from './support/api';

// Sem service worker: a API vem de page.route.
test.use({ serviceWorkers: 'block' });

const pulsos = (page: import('@playwright/test').Page, nome: string) =>
  page.getByRole('button', { name: new RegExp(`Ponto crítico ${nome}`) }).locator('.animate-ping');

test('mapa ao vivo: contagem por risco, previsão do stream e pulso só com alerta ativo', async ({ page }, testInfo) => {
  await lightTheme(page);
  await installApi(page, {
    role: 'OPERADOR',
    stream:
      sse('risk-summary', { LOW: 0, MEDIUM: 1, HIGH: 1, UNKNOWN: 1, computedAt: new Date().toISOString() }) +
      sse('prediction', { slug: PONTO_BAIXO.slug, riskLevel: 'MEDIUM', probability: 0.5, issuedAt: new Date(Date.now() + 1000).toISOString(), modelValidationStatus: 'NOT_VALIDATED' }),
    routes: {
      // Só o ponto "alto" tem alerta aberto; o "baixo" não pulsa mesmo virando Moderado pelo stream.
      'GET /api/alerts': () => ({ page: 0, size: 100, totalElements: 1, content: [{ id: 1, kind: 'RISK_LEVEL', severity: 'CRITICAL', floodPointSlug: PONTO_ALTO.slug, title: 'Sintético: alto', riskLevel: 'HIGH', modelValidationStatus: 'NOT_VALIDATED', triggeredAt: ago(5) }] }),
    },
  });
  await page.goto('/map');
  await expect(page.locator('.maplibregl-marker').getByRole('img', { name: 'Risco Alto' })).toBeVisible({ timeout: 15_000 });

  // Contagem do stream (ícone + rótulo + número).
  const resumo = page.getByRole('region', { name: 'Pontos por nível de risco' });
  await expect(resumo.locator('[data-risk-count="MEDIUM"]')).toContainText('Moderado');
  await expect(resumo.locator('[data-risk-count="MEDIUM"]')).toContainText('1');
  await expect(resumo.locator('[data-risk-count="UNKNOWN"]')).toContainText('Previsão indisponível');

  // prediction do stream trocou o marcador do ponto baixo para Moderado.
  await expect(page.locator('.maplibregl-marker').getByRole('img', { name: 'Risco Moderado' })).toBeVisible();
  await expect(page.locator('.maplibregl-marker').getByRole('img', { name: 'Risco Baixo' })).toHaveCount(0);

  // Pulso: só o ponto com alerta ativo.
  await expect(page.getByRole('button', { name: /Ponto crítico Sintético: ponto alto.*com alerta ativo/ })).toBeVisible();
  await expect(pulsos(page, 'Sintético: ponto alto')).toHaveCount(1);
  await expect(pulsos(page, 'Sintético: ponto baixo')).toHaveCount(0);
  await page.waitForTimeout(1200);
  await shot(page, testInfo, 'mapa-ao-vivo');
});

test('USER: mapa sem alertas e sem pulso, ainda com a contagem', async ({ page }) => {
  await lightTheme(page);
  const api = await installApi(page, { role: 'USER' });
  await page.goto('/map');
  await expect(page.locator('.maplibregl-marker').getByRole('img', { name: 'Risco Alto' })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('region', { name: 'Pontos por nível de risco' })).toBeVisible();
  expect(api.calls.some((c) => c.path.startsWith('/api/alerts'))).toBe(false);
  await expect(page.locator('.maplibregl-marker .animate-ping')).toHaveCount(0);
});
