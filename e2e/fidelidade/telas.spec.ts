import { test } from '@playwright/test';

/**
 * Fotografa todas as rotas com os dados sintéticos do MSW, para comparar com as pranchas de
 * projeto-mapi-api/docs/imagesAndHtmls. Exige o Vite com VITE_USE_MSW=true e VITE_MSW_ROLE=ADMIN
 * (ex.: `VITE_USE_MSW=true VITE_MSW_ROLE=ADMIN npx vite --port 5174` e `E2E_PORT=5174 npx playwright test telas`).
 */
const OUT = 'test-results/telas';
const ROTAS: Array<[string, string]> = [
  ['mapa', '/map'], ['ponto', '/pontos/sintetico-1'], ['sensores', '/sensores'], ['eventos', '/eventos'], ['chuva', '/chuva'],
  ['modelo', '/modelo'], ['simulador', '/modelo/simulador'], ['mare', '/mare'], ['relatorio', '/relatorio'], ['alertas', '/alertas'],
  ['relatos', '/relatos'], ['dados', '/admin/dados'], ['pontos', '/admin/pontos'], ['usuarios', '/admin/usuarios'], ['minha-rua', '/minha-rua'],
];

test.skip(() => !process.env.E2E_TELAS, 'só com E2E_TELAS=1');

for (const [nome, rota] of ROTAS) {
  test(`telas: ${nome}`, async ({ page }, info) => {
    const mobile = info.project.name === 'celular';
    if (!mobile) await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => { localStorage.setItem('mapi.theme', 'light'); localStorage.setItem('mapi.accent', 'capibaribe'); });
    await page.goto(rota);
    await page.waitForTimeout(3500);
    await page.screenshot({ path: `${OUT}/${info.project.name}-${nome}.png` });
  });
}
