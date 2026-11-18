import { test } from '@playwright/test';

/** Fotografa o relato em etapas do celular (passo 1) para comparar com "Celular · reportar alagamento.png". Só com E2E_TELAS=1 e o projeto `celular`. */
test.skip(() => !process.env.E2E_TELAS, 'só com E2E_TELAS=1');
test.use({ geolocation: { latitude: -8.057, longitude: -34.877, accuracy: 12 }, permissions: ['geolocation'], launchOptions: { args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] } });

test('telas: relato celular', async ({ page }, info) => {
  test.skip(info.project.name !== 'celular', 'só celular');
  await page.addInitScript(() => { localStorage.setItem('mapi.theme', 'light'); localStorage.setItem('mapi.accent', 'capibaribe'); });
  await page.goto('/map');
  await page.getByRole('button', { name: /Reportar alagamento/ }).first().click();
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'test-results/telas/celular-relato-1.png' });
});
