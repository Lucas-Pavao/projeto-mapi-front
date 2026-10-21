import type { Page } from '@playwright/test';
import { installApi, ago, ahead, type ApiOptions } from './api';

/** Captura 1440×900 nos dois temas em test-results/fidelidade/ (comparação com o protótipo). */
export async function capturar(page: Page, nome: string, tema: 'dark' | 'light', opts: ApiOptions = {}, caminho = '/') {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript((t) => {
    localStorage.setItem('mapi.theme', t);
    localStorage.setItem('mapi.accent', 'capibaribe');
  }, tema);
  await installApi(page, { role: 'ADMIN', ...opts });
  await page.goto(caminho);
  return async () => {
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `test-results/fidelidade/${nome}-${tema}.png` });
  };
}
export { ago, ahead };
