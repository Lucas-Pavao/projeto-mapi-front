import { test, expect } from '@playwright/test';
import { installApi, lightTheme, semRolagemHorizontal, shot } from './support/api';

test.use({ serviceWorkers: 'block' });

test('/modelo/simulador: simula, mostra aviso, gráfico e erro 422', async ({ page }, testInfo) => {
  await lightTheme(page);
  const api = await installApi(page, {
    role: 'USER',
    routes: {
      'POST /api/model/simulate/bucket': ({ body }) => {
        const b = body as { slug: string; rainfallMmH: number[] };
        if (b.slug === 'sintetico-baixo') return { status: 422, json: {} };
        let h = 0;
        const hMm = b.rainfallMmH.map((r) => (h = Math.max(0, h + r * 2 - 5)));
        const cross = hMm.findIndex((v) => v >= 150);
        return { model: 'M1a', illustrative: true, hMm, hmaxMm: Math.max(...hMm), tCrossH: cross >= 0 ? cross : null, nOutsideCurve: 1, paramsUsed: { C: 0.86, iT_mm_h: 60.1, f: 1, hcrit_mm: 150, snap_m: 10, curve_scale: 1 } };
      },
    },
  });
  await page.goto('/modelo/simulador');
  await expect(page.getByRole('note')).toContainText('Simulação — não é previsão');
  await expect(page.getByText('Nenhuma simulação ainda.')).toBeVisible();
  await shot(page, testInfo, 'simulador-vazio');

  await page.getByLabel('Ponto', { exact: true }).selectOption('sintetico-alto');
  await page.getByLabel('Intensidade (mm/h)').fill('40');
  await page.getByLabel('Duração (h)').fill('4');
  await page.getByRole('button', { name: 'Simular' }).click();
  const res = page.getByRole('region', { name: 'Resultado da simulação' });
  await expect(res).toContainText('Resultado (simulação, não é previsão)');
  await expect(res.getByTestId('cross')).toContainText('Sim, na hora');
  await expect(res.getByTestId('chart-Lâmina simulada no ponto')).toBeVisible();
  expect(api.calls.find((c) => c.method === 'POST')?.body).toEqual({ slug: 'sintetico-alto', rainfallMmH: [40, 40, 40, 40], f: 1, curveScale: 1 });
  await semRolagemHorizontal(page);
  await shot(page, testInfo, 'simulador');

  await page.getByLabel('Ponto', { exact: true }).selectOption('sintetico-baixo');
  await page.getByRole('button', { name: 'Simular' }).click();
  await expect(page.getByRole('alert')).toContainText('não tem terreno carregado');
  await shot(page, testInfo, 'simulador-422');
});
