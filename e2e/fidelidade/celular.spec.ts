import { test, expect } from '@playwright/test';
import { prepara } from '../support/fidelidade';

test.use({ serviceWorkers: 'block', viewport: { width: 390, height: 844 } });
const OUT = 'test-results/fidelidade';

// Geolocalização determinística, instalada só quando o relato começa (senão o mapa voa para a posição do aparelho).
const stubGps = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const pos = { coords: { latitude: -8.0757, longitude: -34.9115, accuracy: 12, altitude: null, altitudeAccuracy: null, heading: null, speed: null }, timestamp: Date.now() };
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition: (ok: (p: unknown) => void) => setTimeout(() => ok(pos), 700), watchPosition: () => 1, clearWatch: () => {} },
    });
  });

for (const theme of ['dark', 'light'] as const) {
  test(`fidelidade: celular mapa, ponto e relato ${theme} (390x844)`, async ({ page }, info) => {
    test.skip(info.project.name !== 'celular');
    await prepara(page, theme);
    await page.goto('/map');
    await expect(page.getByRole('img', { name: 'Risco Baixo' }).first()).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/16-celular-mapa-${theme}.png` });

    // 17: ponto crítico
    await page.getByRole('region', { name: 'Pontos de risco' }).getByRole('button', { name: /Mascarenhas/ }).click();
    const dlg = page.getByRole('dialog', { name: 'Mascarenhas' });
    await expect(dlg).toBeVisible();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/17-celular-ponto-${theme}.png` });

    // 18: relato (a partir do ponto, com GPS)
    await stubGps(page);
    await dlg.getByRole('button', { name: 'Reportar cenário no local' }).click();
    const rel = page.getByRole('dialog', { name: 'Reportar alagamento' });
    await expect(rel.getByRole('button', { name: 'Continuar' })).toBeEnabled({ timeout: 5000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/18-celular-relato-${theme}.png` });
  });
}
