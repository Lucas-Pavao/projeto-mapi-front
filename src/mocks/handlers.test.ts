import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from './server';
import { alertsService } from '@/features/alerts/services/alerts.service';
import { sensorsService } from '@/features/sensors/services/sensors.service';
import { publicRiskService } from '@/features/public-risk/services/public-risk.service';
import { modelService } from '@/features/model/services/model.service';
import { alertaService } from '@/features/alerta/services/alerta.service';
import { alertaPontoSchema } from '@/features/alerta/schemas/alerta.schema';
import { ALERTA_FIXTURES } from './alerta';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('handlers MSW (dados sintéticos)', () => {
  it('alertas vêm paginados e rotulados como sintéticos', async () => {
    const page = await alertsService.list();
    expect(page.totalElements).toBe(page.content.length);
    expect(page.content.every((a) => a.title.startsWith('Sintético'))).toBe(true);
  });
  it('alerta por ponto: o mock serve um estado da prancha Nível 2 e todas as fixtures passam no schema', async () => {
    const pts = await alertaService.pontos();
    expect(pts.length).toBeGreaterThan(0);
    expect(pts.every((a) => a.shadow)).toBe(true);
    expect(Object.keys(ALERTA_FIXTURES)).toHaveLength(10);
    for (const f of Object.values(ALERTA_FIXTURES)) expect(alertaPontoSchema.safeParse({ slug: 'x', ...f }).success).toBe(true);
  });
  it('filtra sensores por tipo', async () => {
    const r = await sensorsService.latest('RIVER_LEVEL');
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((s) => s.type === 'RIVER_LEVEL')).toBe(true);
  });
  it('Minha rua em modo sombra: nível SEM_DADO "em teste", sem probabilidade; fora da RMR dá 422', async () => {
    const r = await publicRiskService.nearby(-8.05, -34.9);
    expect(r.inTest).toBe(true);
    expect(r.nearestPoint?.level).toBe('SEM_DADO');
    expect(JSON.stringify(r)).not.toMatch(/robability|riskLevel/);
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
