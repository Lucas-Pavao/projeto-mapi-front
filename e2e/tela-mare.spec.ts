import { test, expect } from '@playwright/test';
import { installApi, lightTheme, semRolagemHorizontal, shot } from './support/api';

test.use({ serviceWorkers: 'block' });

const tabua = () => {
  const now = new Date();
  const dias = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return {
    year: now.getFullYear(), harborName: 'Sintético: porto', months: [{ monthName: 'mês', month: now.getMonth() + 1, days: Array.from({ length: dias }, (_, i) => ({ weekdayName: '', day: i + 1, hours: [{ hour: '02:00', level: 0.3 }, { hour: '08:10', level: 2.1 }, { hour: '14:20', level: 0.4 }, { hour: '20:30', level: 2.0 }] })) }],
  };
};

test('/mare: maré agora, calendário, curva do dia e aviso da ADR 0009', async ({ page }, testInfo) => {
  await lightTheme(page);
  await installApi(page, { role: 'USER', routes: { 'GET /api/tide/pe02': () => tabua() } });
  await page.goto('/mare');
  await expect(page.getByTestId('tide-datum-notice')).toBeVisible();
  await expect(page.getByTestId('tide-now')).toContainText('m');
  const cal = page.getByRole('region', { name: 'Calendário do mês' });
  await expect(cal.getByRole('button').first()).toContainText('2,10');
  await cal.getByRole('button').first().click();
  await expect(page.getByRole('region', { name: 'Curva do dia' })).toContainText('DIA 1 DE');
  await expect(page.getByRole('img', { name: 'Maré ao longo do dia selecionado' })).toBeVisible();
  await semRolagemHorizontal(page);
  await shot(page, testInfo, 'mare');
});

test('/mare sem dados no mês', async ({ page }, testInfo) => {
  await lightTheme(page);
  await installApi(page, { role: 'USER', routes: { 'GET /api/tide/pe02': () => ({ year: 2026, harborName: 'x', months: [] }) } });
  await page.goto('/mare');
  await expect(page.getByText('Sem dados de maré neste mês.')).toBeVisible();
  await shot(page, testInfo, 'mare-vazio');
});
