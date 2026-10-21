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

const AVAL = {
  sha256: 'f'.repeat(64), source: 'sintetico/resultado-etapa2.json', frozenAt: null,
  result: {
    n_pos_principal: 14, n_pos_extra: 4, n_neg_bruto: 700, n_neg: 689, episodios_principal: 13, episodios_18: 17,
    auc_B2: [0.777, [0.641, 0.89]], auc_B3: [0.891, [0.747, 0.97]],
    m1: { central: { auc: 0.891, auc_ic: [0.747, 0.97], d_h1: 0.113, d_h1_ic: [-0.01, 0.252], cat_h1: 'inconclusivo', d_h2: 0, d_h2_ic: [0, 0], cat_h2: 'nao_testada' }, f0_6: { auc: 0.88, auc_ic: [0.73, 0.96], d_h1: 0.1, d_h1_ic: [-0.02, 0.24], cat_h1: 'inconclusivo', d_h2: 0, d_h2_ic: [0, 0], cat_h2: 'nao_testada' } },
    class_h1: ['inconclusiva', []], class_h2: ['não testada', []],
    degenerado: { alerta_M1a_em_N: 0, S_zero_em_todos_positivos: true, S_max_N: 0 },
    auc_todos: { 'B3-24h · 30 mm em 24 h': { auc: 0.891, ic: [0.735, 0.976], exclui_05: true, auc18: 0.872, ic18: [0.73, 0.974] } },
    binarias: { 'M1a/B3': { k14: 0, ic14: [0, 0.23], k18: 0, ic18: [0, 0.18], k4: 0, kn: 0, icn: [0, 0.005] }, 'B3-24h': { k14: 4, ic14: [0.1, 0.5], k18: 5, ic18: [0.1, 0.5], k4: 4, kn: 4, icn: [0, 0.01] } },
  },
};

const TELAS: Tela[] = [
  { id: '07-modelo', path: '/modelo', api: { routes: { 'GET /api/model/evaluation': () => AVAL } } },
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
