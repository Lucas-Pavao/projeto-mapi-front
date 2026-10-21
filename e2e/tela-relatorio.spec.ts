import { test, expect } from '@playwright/test';
import { installApi, semRolagemHorizontal, shot } from './support/api';

test.use({ serviceWorkers: 'block' });

for (const tema of ['light', 'dark'] as const) {
  test(`/relatorio no tema ${tema}: folha clara, sem navegação ao imprimir`, async ({ page }, testInfo) => {
    await page.addInitScript((t) => {
      localStorage.setItem('mapi.theme', t);
      localStorage.setItem('mapi.accent', 'capibaribe');
    }, tema);
    await installApi(page, { role: 'OPERADOR' });
    await page.goto('/relatorio');
    const folha = page.getByRole('article', { name: 'Relatório de situação' });
    await expect(folha).toContainText('Previsão experimental — modelo não validado');
    await expect(page.getByRole('region', { name: 'Pontos críticos' }).locator('tr[data-slug="sintetico-alto"]')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Alertas abertos' })).toContainText('Sintético');
    // a folha é clara mesmo com o app escuro
    const fundo = await folha.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(fundo).toBe('rgb(255, 255, 255)');
    await semRolagemHorizontal(page);
    await shot(page, testInfo, `relatorio-${tema}`);

    // Impressão: sem navegação, sem botão e conteúdo em fluxo (altura da página > uma janela).
    await page.emulateMedia({ media: 'print' });
    await expect(page.getByRole('navigation', { name: 'Principal' })).toBeHidden();
    await expect(page.getByRole('button', { name: /Imprimir/ })).toBeHidden();
    const body = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, c: document.querySelector('#conteudo')!.scrollHeight, ch: document.querySelector('#conteudo')!.clientHeight }));
    expect(body.c).toBeLessThanOrEqual(body.ch + 1); // #conteudo não rola: cresce com o conteúdo
    if (testInfo.project.name === 'desktop') {
      const pdf = await page.pdf({ format: 'A4', printBackground: true, path: `test-results/telas/relatorio-${tema}.pdf` });
      expect(pdf.byteLength).toBeGreaterThan(5_000);
      await testInfo.attach(`relatorio-${tema}.pdf`, { body: pdf, contentType: 'application/pdf' });
    }
    await page.screenshot({ path: `test-results/telas/relatorio-impressao-${tema}-${testInfo.project.name}.png`, fullPage: true });
  });
}
