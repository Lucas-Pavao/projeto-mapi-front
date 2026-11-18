import { test } from '@playwright/test';

/**
 * Fotografa os cards que abrem por clique no mapa (ponto, estação, local, análise completa) com os dados
 * sintéticos do MSW, para comparar com as pranchas de projeto-mapi-api/docs/imagesAndHtmls.
 * `?cardFx=` (estado do pluviômetro), `?locFx=` (estado do local) e `?alertaFx=` (estado do alerta) escolhem o estado.
 * Uso: `VITE_USE_MSW=true VITE_MSW_ROLE=ADMIN npx vite --port 5182` e
 * `E2E_TELAS=1 E2E_PORT=5182 npx playwright test e2e/fidelidade/cards.spec.ts`.
 */
const OUT = 'test-results/telas';

test.skip(() => !process.env.E2E_TELAS, 'só com E2E_TELAS=1');

async function abre(page: import('@playwright/test').Page, query = '') {
  await page.setViewportSize({ width: 1440, height: Number(process.env.E2E_H ?? 900) });
  await page.addInitScript(() => { localStorage.setItem('mapi.theme', 'light'); localStorage.setItem('mapi.accent', 'capibaribe'); });
  await page.goto(`/map${query}`);
  await page.waitForTimeout(3500);
}
const foto = (page: import('@playwright/test').Page, nome: string) => page.screenshot({ path: `${OUT}/cards-${nome}.png` });

test('cards: ponto e análise completa', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await abre(page);
  await page.getByRole('button', { name: /Ponto crítico/ }).first().click();
  await page.waitForTimeout(1500);
  await foto(page, 'ponto');
  await page.getByRole('button', { name: /Análise completa/ }).first().click();
  await page.waitForTimeout(1500);
  await page.getByRole('dialog', { name: /^Análise completa/ }).screenshot({ path: `${OUT}/cards-analise-completa.png` });
});

for (const fx of ['normal', 'divergent', 'peak', 'unchecked', 'gap', 'noResponse', 'failMonth', 'pedOnly']) {
  test(`cards: pluviômetro ${fx}`, async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop');
    await abre(page, `?cardFx=${fx}`);
    await page.getByRole('button', { name: /^(Sensor|Chuva medida)/ }).first().click();
    await page.waitForTimeout(1500);
    await page.getByRole('dialog', { name: /^Pluviômetro/ }).screenshot({ path: `${OUT}/cards-pluv-${fx}.png` });
  });
}

for (const fx of ['measured', 'gap', 'estimated', 'sea', 'outside']) {
  test(`cards: local ${fx}`, async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop');
    await abre(page, `?locFx=${fx}`);
    await page.mouse.click(700, 500);
    await page.waitForTimeout(1800);
    await page.getByRole('dialog', { name: /^Análise do local/ }).screenshot({ path: `${OUT}/cards-local-${fx}.png` });
  });
}

const ALERTA = ['seco', 'atencao', 'atencao-prov', 'alerta-prov', 'alerta-sem-terreno', 'revisao', 'ia-fora', 'velha', 'sem-estacao', 'fonte-parada'];
for (const fx of ALERTA) {
  test(`cards: alerta ${fx}`, async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop');
    await abre(page, `?alertaFx=${fx}`);
    await page.getByRole('button', { name: /Ponto crítico/ }).first().click();
    await page.waitForTimeout(1500);
    await page.getByRole('dialog', { name: /Resumo do ponto/ }).screenshot({ path: `${OUT}/cards-alerta-${fx}.png` });
  });
}
