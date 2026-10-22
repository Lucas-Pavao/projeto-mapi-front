import { test, expect } from '@playwright/test';
import { installApi, lightTheme, semRolagemHorizontal, shot } from './support/api';

test.use({ serviceWorkers: 'block' });

test('/modelo: números da avaliação, intervalo de confiança e rótulo experimental', async ({ page }, testInfo) => {
  await lightTheme(page);
  await installApi(page, { role: 'USER' });
  await page.goto('/modelo');
  await expect(page.getByText('sintetico/resultado-fake.json')).toBeVisible();
  await expect(page.getByText('H1 inconclusivo · H2 inconclusivo')).toBeVisible();
  await expect(page.getByRole('region', { name: 'AUC com intervalo (IC)' })).toBeVisible();
  await expect(page.getByText('Previsão experimental — modelo não validado')).toBeVisible();
  await semRolagemHorizontal(page);
  await shot(page, testInfo, 'modelo');
});

test('/modelo: 503 mostra indisponível', async ({ page }, testInfo) => {
  await lightTheme(page);
  await installApi(page, { role: 'USER', routes: { 'GET /api/model/evaluation': () => ({ status: 503, json: {} }) } });
  await page.goto('/modelo');
  await expect(page.getByText('Avaliação indisponível.')).toBeVisible();
  await shot(page, testInfo, 'modelo-503');
});
