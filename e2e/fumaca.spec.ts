import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/** Falha em violações serious ou critical (WCAG 2.x A/AA). */
async function semViolacoesGraves(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const graves = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(graves.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
}

for (const theme of ['dark', 'light'] as const) {
 for (const accent of ['capibaribe', 'atlantico', 'areia'] as const) {
  test.describe(`tema ${theme}, destaque ${accent}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(([t, a]) => {
        localStorage.setItem('mapi.theme', t);
        localStorage.setItem('mapi.accent', a);
      }, [theme, accent]);
    });

    test('/login abre e passa no axe', async ({ page }) => {
      await page.goto('/login');
      await expect(page.getByRole('heading', { name: 'Entrar na plataforma' })).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page.locator('html')).toHaveAttribute('data-accent', accent);
      await semViolacoesGraves(page);
    });

    test('/minha-rua abre, consulta com dados sintéticos e passa no axe', async ({ page, context }) => {
      await context.grantPermissions(['geolocation']);
      await context.setGeolocation({ latitude: -8.05, longitude: -34.9 });
      await page.goto('/minha-rua');
      await expect(page.getByRole('heading', { name: 'Minha rua' })).toBeVisible();
      await semViolacoesGraves(page);

      await page.getByRole('button', { name: 'Usar minha localização' }).click();
      await expect(page.getByText('Sintético: ponto de teste')).toBeVisible();
      // Risco sempre com ícone + rótulo, e rótulo experimental enquanto o modelo não é validado.
      await expect(page.getByText('Previsão experimental — modelo não validado')).toBeVisible();
      // O botão sai do estado "buscando" com transição de opacidade; o axe mede o contraste só depois dela.
      await expect(page.getByRole('button', { name: 'Atualizar minha localização' })).toBeEnabled();
      await page.waitForTimeout(400);
      await semViolacoesGraves(page);
    });
  });
 }
}
