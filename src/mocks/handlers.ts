import { delay, http, HttpResponse } from 'msw';
import type { BucketSimulation, FloodReport, PageMeta, SensorFreshness, SensorType } from '@/types/api';
import * as d from './data';

const page = <T,>(content: T[]): PageMeta<T> => ({ page: 0, size: 20, totalElements: content.length, content });

/** Handlers só dos endpoints novos do redesign (redesign-telas.yaml). Os existentes ficam com a API real. */
export const handlers = [
  http.get('/api/pontos/risk-summary', () => HttpResponse.json(d.riskSummary())),

  http.get('/api/pontos/station-suggestions', () =>
    HttpResponse.json([
      { stationId: 'SINTETICO-PLUV-01', name: 'Sintético: pluviômetro', type: 'PRECIPITATION', source: 'CEMADEN', distanceM: 900, lastReadingAt: new Date().toISOString() },
    ]),
  ),

  http.get<{ slug: string }>('/api/pontos/:slug/predictions', ({ params, request }) => {
    const url = new URL(request.url);
    return HttpResponse.json({
      slug: params.slug,
      from: url.searchParams.get('from') ?? '',
      to: url.searchParams.get('to') ?? '',
      items: d.predictions(params.slug),
    });
  }),

  http.get('/api/sensors/latest', ({ request }) => {
    const type = new URL(request.url).searchParams.get('type') as SensorType | null;
    const items: SensorFreshness[] = type ? d.sensors.filter((s) => s.type === type) : d.sensors;
    return HttpResponse.json(items);
  }),

  http.get('/api/alerts', () => HttpResponse.json(page(d.alerts))),
  http.post<{ id: string }>('/api/alerts/:id/ack', ({ params }) => {
    const found = d.alerts.find((a) => a.id === Number(params.id));
    if (!found) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ ...found, acknowledgedAt: new Date().toISOString(), acknowledgedBy: 'sintetico@example.org' });
  }),

  http.get('/api/events/timeline', ({ request }) => {
    const u = new URL(request.url);
    return HttpResponse.json(d.timeline(u.searchParams.get('from') ?? '', u.searchParams.get('to') ?? ''));
  }),

  http.get('/api/model/evaluation', () => HttpResponse.json(d.evaluation, { headers: { 'X-Content-SHA256': d.evaluation.sha256 } })),

  http.post<never, { rainfallMmH: number[]; f?: number; curveScale?: number }>('/api/model/simulate/bucket', async ({ request }) => {
    const body = await request.json();
    let h = 0;
    const hMm = body.rainfallMmH.map((r) => (h = Math.max(0, h + r * 0.5 - 1)));
    const sim: BucketSimulation = {
      model: 'M1a', illustrative: true, hMm, hmaxMm: Math.max(...hMm), tCrossH: null, nOutsideCurve: 0,
      paramsUsed: { C: 0.5, iT_mm_h: 2, f: body.f ?? 1, hcrit_mm: 50, snap_m: 100, curve_scale: body.curveScale ?? 1 },
    };
    return HttpResponse.json(sim);
  }),

  http.get('/api/reports', () => HttpResponse.json(page(d.reports.filter((r) => r.status === 'PENDING')))),
  http.post<never, Pick<FloodReport, 'latitude' | 'longitude' | 'observedAt' | 'waterDepth'>>('/api/reports', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...body, id: 99, status: 'PENDING', createdAt: new Date().toISOString() }, { status: 201 });
  }),

  http.get('/api/admin/ingestion/sources', () => HttpResponse.json(d.ingestionSources)),
  http.get('/api/admin/ingestion/runs', () => HttpResponse.json(page([]))),
  http.get('/api/admin/users', () => HttpResponse.json(page(d.users))),
  http.post('/api/admin/invites', () =>
    HttpResponse.json({ token: 'sintetico-token', role: 'USER', expiresAt: new Date(Date.now() + 72 * 3_600_000).toISOString() }, { status: 201 }),
  ),

  http.get('/api/public/risk', async ({ request }) => {
    const u = new URL(request.url);
    const lat = Number(u.searchParams.get('lat'));
    const lon = Number(u.searchParams.get('lon'));
    await delay(150);
    if (!(lat >= -8.4 && lat <= -7.8 && lon >= -35.2 && lon <= -34.8)) {
      return HttpResponse.json({ message: 'Coordenada fora da RMR' }, { status: 422 });
    }
    return HttpResponse.json(d.publicRisk());
  }),
];
