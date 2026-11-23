import { test, type Page } from '@playwright/test';

/**
 * Fotos das telas afetadas pela onda 16 (alerta único, ADR 0030), com os dados sintéticos do MSW.
 * `?alagamentoFx=` escolhe o estado do alerta (src/mocks/alagamento.ts). Saída em test-results/telas/onda16-*.png.
 * Uso: `VITE_USE_MSW=true VITE_MSW_ROLE=ADMIN npx vite --port 5182` e
 * `E2E_TELAS=1 E2E_PORT=5182 npx playwright test e2e/fidelidade/onda16.spec.ts --project=desktop`.
 */
const OUT = 'test-results/telas';

test.skip(() => !process.env.E2E_TELAS, 'só com E2E_TELAS=1');

async function analise(page: Page, fx: string, detalhes: boolean) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript((d) => {
    localStorage.setItem('mapi.theme', 'light');
    localStorage.setItem('mapi.accent', 'capibaribe');
    localStorage.setItem('mapi.detalhes', d ? '1' : '0');
  }, detalhes);
  await page.goto(`/map?alagamentoFx=${fx}`);
  await page.waitForTimeout(3500);
  await page.getByRole('button', { name: /Ponto crítico/ }).first().click();
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: /Análise completa/ }).first().click();
  await page.waitForTimeout(1200);
  return page.getByRole('dialog', { name: /^Análise completa/ });
}

for (const [fx, detalhes] of [['alerta_mare_3h', false], ['alerta_mare_3h', true], ['atencao_3h', true], ['sem_dado_mare_ausente', false]] as const) {
  test(`onda16: análise ${fx}${detalhes ? ' detalhes' : ''}`, async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop');
    const d = await analise(page, fx, detalhes);
    const nome = `${fx}${detalhes ? '-detalhes' : ''}`;
    await d.screenshot({ path: `${OUT}/onda16-porque-${nome}.png` });
    if (fx === 'sem_dado_mare_ausente') return;
    await page.getByRole('tab', { name: 'Balde' }).click();
    await page.waitForTimeout(600);
    await d.screenshot({ path: `${OUT}/onda16-balde-${nome}.png` });
  });
}
