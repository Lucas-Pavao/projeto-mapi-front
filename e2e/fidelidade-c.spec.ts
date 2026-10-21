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

/** Tábua sintética do mês atual: 4 pontos por dia (2 preamares, 2 baixa-mares), amplitude variando com o dia. */
const tabuaMes = () => {
  const now = new Date();
  const dias = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const f = (n: number) => `${String(Math.floor(n / 60) % 24).padStart(2, '0')}:${String(Math.round(n % 60)).padStart(2, '0')}`;
  return {
    id: 1, year: now.getFullYear(), harborName: 'Recife', state: 'PE', timezone: 'America/Recife', card: 'pe02', dataCollectionInstitution: 'DHN', meanLevel: 1.3, geoLocations: [], currentTideHeight: 1.1,
    months: [{ monthName: new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(now), month: now.getMonth() + 1, days: Array.from({ length: dias }, (_, i) => {
      const amp = 0.4 + 0.5 * Math.abs(Math.sin((i / 14.8) * Math.PI));
      const t0 = (i * 50) % 745;
      const hi = 1.3 + amp;
      const lo = 1.3 - amp - 0.2;
      return { weekdayName: '', day: i + 1, hours: [{ hour: f(t0), level: Number(lo.toFixed(2)) }, { hour: f(t0 + 372), level: Number(hi.toFixed(2)) }, { hour: f(t0 + 745), level: Number(lo.toFixed(2)) }, { hour: f(t0 + 1117), level: Number(hi.toFixed(2)) }] };
    }) }],
  };
};

const TELAS: Tela[] = [
  { id: '08-mare', path: '/mare', api: { routes: { 'GET /api/tide/pe02': () => tabuaMes() } } },
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
