import { test, type Page } from '@playwright/test';
import { installApi, type ApiOptions } from './support/api';

/**
 * Capturas 1440×900 (escuro e claro) para comparar com design-ref/shots. Só desktop; dados sintéticos
 * via page.route. Saída em test-results/fidelidade/.
 */
test.use({ serviceWorkers: 'block', viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });

interface Tela { id: string; path: string; api?: ApiOptions; antes?: (page: Page) => Promise<void> }

const SIM = (body: unknown) => {
  const b = body as { rainfallMmH: number[]; f: number };
  let h = 0;
  const hMm = b.rainfallMmH.map((r) => (h = Math.max(0, h + r * 4 - 60)));
  const cross = hMm.findIndex((v) => v >= 150);
  return { model: 'M1a', illustrative: true, hMm, hmaxMm: Math.max(...hMm), tCrossH: cross >= 0 ? cross : null, nOutsideCurve: 0, paramsUsed: { C: 0.86, iT_mm_h: 60.1, f: b.f, hcrit_mm: 150, snap_m: 10, curve_scale: 1 } };
};

const TELAS: Tela[] = [
  {
    id: '06-simulador', path: '/modelo/simulador',
    api: { routes: { 'POST /api/model/simulate/bucket': ({ body }) => SIM(body) } },
    antes: async (page) => {
      await page.getByLabel('Ponto', { exact: true }).selectOption('sintetico-alto');
      await page.getByRole('button', { name: 'Simular' }).click();
      await page.getByRole('region', { name: 'Resultado da simulação' }).waitFor();
    },
  },
];

const so = process.env.TELA;
for (const t of TELAS.filter((x) => !so || x.id.includes(so))) {
  for (const tema of ['dark', 'light'] as const) {
    test(`${t.id} ${tema}`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop', 'só desktop');
      await page.addInitScript((th) => { localStorage.setItem('mapi.theme', th); localStorage.setItem('mapi.accent', 'capibaribe'); }, tema);
      await installApi(page, t.api ?? {});
      await page.goto(t.path);
      await page.waitForLoadState('networkidle');
      await t.antes?.(page);
      await page.waitForTimeout(300);
      await page.screenshot({ path: `test-results/fidelidade/${t.id}-${tema}.png` });
    });
  }
}
