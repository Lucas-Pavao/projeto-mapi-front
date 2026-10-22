import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from './server';
import { alertsService } from '@/features/alerts/services/alerts.service';
import { sensorsService } from '@/features/sensors/services/sensors.service';
import { predictionsService } from '@/features/points/services/predictions.service';
import { publicRiskService } from '@/features/public-risk/services/public-risk.service';
import { modelService } from '@/features/model/services/model.service';
import { RISK_MEANING, formatProbability } from '@/components/risk/risk';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('handlers MSW (dados sintéticos)', () => {
  it('alertas vêm paginados e rotulados como sintéticos', async () => {
    const page = await alertsService.list();
    expect(page.totalElements).toBe(page.content.length);
    expect(page.content.every((a) => a.title.startsWith('Sintético'))).toBe(true);
  });
  it('filtra sensores por tipo', async () => {
    const r = await sensorsService.latest('RIVER_LEVEL');
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((s) => s.type === 'RIVER_LEVEL')).toBe(true);
  });
  it('UNKNOWN na série não tem probabilidade nem porcentagem', async () => {
    const s = await predictionsService.series('sintetico-1', 'a', 'b');
    const unknown = s.items.find((p) => p.riskLevel === 'UNKNOWN');
    expect(unknown?.probability).toBeNull();
    expect(unknown?.degradationReason).toBe('AI_UNAVAILABLE');
    expect(formatProbability(unknown?.riskLevel, unknown?.probability)).toBeNull();
    expect(s.items.every((p) => p.modelValidationStatus === 'NOT_VALIDATED')).toBe(true);
  });
  it('risco público devolve RISK_MEANING sem reescrever; fora da RMR dá 422', async () => {
    const r = await publicRiskService.nearby(-8.05, -34.9);
    expect(r.meaning).toBe(RISK_MEANING[r.nearestPoint!.riskLevel]);
    await expect(publicRiskService.nearby(0, 0)).rejects.toMatchObject({ response: { status: 422 } });
  });
  it('simulação é ilustrativa', async () => {
    const sim = await modelService.simulateBucket({ slug: 'sintetico-1', rainfallMmH: [5, 10, 20] });
    expect(sim.illustrative).toBe(true);
    expect(sim.hMm).toHaveLength(3);
  });
  it('parse na borda: payload fora do contrato é rejeitado', async () => {
    server.use(http.get('/api/sensors/latest', () => HttpResponse.json([{ sensorId: 'x', type: 'OUTRO' }])));
    await expect(sensorsService.latest()).rejects.toThrow();
  });
});
