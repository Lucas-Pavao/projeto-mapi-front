import { test, expect } from '@playwright/test';
import { prepara } from '../support/fidelidade';

test.use({ serviceWorkers: 'block' });
const OUT = 'test-results/fidelidade';

for (const theme of ['dark', 'light'] as const) {
  test(`fidelidade: mapa ao vivo ${theme} (1440x900)`, async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop');
    await page.setViewportSize({ width: 1440, height: 900 });
    await prepara(page, theme);
    await page.goto('/map');
    await expect(page.getByRole('img', { name: 'Risco Baixo' }).first()).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: /Ponto crítico Av\. Agamenon/ }).click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/01-mapa-${theme}.png` });
  });
}

for (const theme of ['dark', 'light'] as const) {
  test(`fidelidade: mapa ao vivo, aba Sensores, sem seleção ${theme} (1440x900)`, async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop');
    await page.setViewportSize({ width: 1440, height: 900 });
    await prepara(page, theme);
    await page.goto('/map');
    await expect(page.getByRole('img', { name: 'Risco Baixo' }).first()).toBeVisible({ timeout: 15_000 });
    await page.getByRole('tab', { name: /Sensores/ }).click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/01b-mapa-sensores-${theme}.png` });
  });
}
