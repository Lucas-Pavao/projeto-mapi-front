import { delay, http, HttpResponse } from 'msw';
import type { BucketSimulation } from '@/features/model/schemas/model.schema';
import type { FloodReport } from '@/features/reports/schemas/report.schema';
import type { SensorFreshness, SensorType } from '@/features/sensors/schemas/sensor.schema';
import * as d from './data';

const page = <T,>(content: T[]) => ({ page: 0, size: 20, totalElements: content.length, content });

const sse = (event: string, data: unknown, id: number) => `id: ${id}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

/**
 * Stream SSE sintético: risk-summary na abertura e heartbeat a cada `heartbeatMs`. `maxBeats`
 * limita os heartbeats (testes); sem limite o fluxo fica aberto até o cliente fechar.
 */
export function liveStreamHandler(opts: { heartbeatMs?: number; maxBeats?: number; extra?: Array<{ event: string; data: unknown }>; extraDelayMs?: number } = {}) {
  const { heartbeatMs = 25_000, maxBeats = Infinity, extra = [], extraDelayMs = 0 } = opts;
  return http.get('/api/stream', () => {
    const enc = new TextEncoder();
    let timer: ReturnType<typeof setInterval> | undefined;
    const stream = new ReadableStream<Uint8Array>({
      start(ctrl) {
        let id = 1;
        ctrl.enqueue(enc.encode(sse('risk-summary', d.riskSummary(), id++)));
        // `extra`: eventos de teste; com extraDelayMs saem depois da abertura (tela já carregada).
        const sendExtra = () => {
          for (const e of extra) ctrl.enqueue(enc.encode(sse(e.event, e.data, id++)));
        };
        if (extraDelayMs > 0) setTimeout(() => { try { sendExtra(); } catch { /* stream já fechado */ } }, extraDelayMs);
        else sendExtra();
        ctrl.enqueue(enc.encode(sse('heartbeat', { at: new Date().toISOString() }, id++)));
        let beats = 1;
        timer = setInterval(() => {
          if (beats >= maxBeats) {
            clearInterval(timer);
            ctrl.close();
            return;
          }
          beats++;
          ctrl.enqueue(enc.encode(sse('heartbeat', { at: new Date().toISOString() }, id++)));
        }, heartbeatMs);
      },
      cancel() {
        clearInterval(timer);
      },
    });
    return new HttpResponse(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
  });
}

/** Handlers só dos endpoints novos do redesign (redesign-telas.yaml). Os existentes ficam com a API real. */
export const handlers = [
  liveStreamHandler(),
  http.get('/api/pontos', () => HttpResponse.json(d.points)),
  http.get('/api/auth/me', () => HttpResponse.json({ username: 'sintetico.admin', role: 'ADMIN' })),
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

  http.get<{ slug: string }>('/api/pontos/:slug/terrain', ({ params }) => HttpResponse.json(d.terrain(params.slug))),
  http.get('/api/sensors/latest', ({ request }) => {
    const type = new URL(request.url).searchParams.get('type') as SensorType | null;
    const items: SensorFreshness[] = type ? d.sensors.filter((s) => s.type === type) : d.sensors;
    return HttpResponse.json(items);
  }),

  http.get('/api/alerts', ({ request }) => {
    const status = new URL(request.url).searchParams.get('status') ?? 'OPEN';
    const all = [...d.alerts, d.acknowledgedAlert];
    return HttpResponse.json(page(all.filter((a) => (status === 'ALL' ? true : status === 'OPEN' ? !a.acknowledgedAt : !!a.acknowledgedAt))));
  }),
  http.get('/api/alert-rules', () => HttpResponse.json(d.alertRules)),
  http.post('/api/alert-rules', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...body, id: 99, createdBy: 'sintetico.operador', createdAt: new Date().toISOString(), updatedAt: null }, { status: 201 });
  }),
  http.put<{ id: string }>('/api/alert-rules/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...body, id: Number(params.id), createdBy: 'sintetico.operador', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }),
  http.delete('/api/alert-rules/:id', () => new HttpResponse(null, { status: 204 })),
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

  http.get('/api/reports', ({ request }) => {
    const status = new URL(request.url).searchParams.get('status');
    return HttpResponse.json(page(status ? d.reports.filter((r) => r.status === status) : d.reports));
  }),
  http.patch<{ id: string }>('/api/reports/:id', async ({ params, request }) => {
    const body = (await request.json()) as { status: 'CONFIRMED' | 'DISCARDED'; reason?: string };
    const found = d.reports.find((r) => r.id === Number(params.id));
    if (!found) return new HttpResponse(null, { status: 404 });
    if (found.status !== 'PENDING') return new HttpResponse(null, { status: 409 });
    return HttpResponse.json({ ...found, status: body.status, reviewedAt: new Date().toISOString(), reviewedBy: 'sintetico@example.org', discardReason: body.reason ?? null, floodEventId: body.status === 'CONFIRMED' ? 8 : null });
  }),
  http.post<never, Pick<FloodReport, 'latitude' | 'longitude' | 'observedAt' | 'waterDepth'>>('/api/reports', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...body, id: 99, status: 'PENDING', createdAt: new Date().toISOString() }, { status: 201 });
  }),

  http.get('/api/admin/ingestion/sources', () => HttpResponse.json(d.ingestionSources)),
  http.get('/api/admin/ingestion/runs', ({ request }) => {
    const u = new URL(request.url);
    const src = u.searchParams.get('source');
    const st = u.searchParams.get('status');
    return HttpResponse.json(page(d.ingestionRuns.filter((r) => (!src || r.source === src) && (!st || r.status === st))));
  }),
  http.get('/api/admin/ingestion/check-integrity', () => HttpResponse.json(d.integrity)),
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
  http.post('/api/pontos', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ id: 99, active: true, altitudeM: null, distanceToChannelM: null, basinName: null, sensorConfig: null, tideHeight: null, tideUnit: null, municipality: null, description: null, ...body }, { status: 201 });
  }),
  http.patch<{ slug: string }>('/api/pontos/:slug', async ({ params, request }) => {
    const p = d.points.find((x) => x.slug === params.slug);
    if (!p) return HttpResponse.json({ message: 'não encontrado' }, { status: 404 });
    return HttpResponse.json({ ...p, ...((await request.json()) as object) });
  }),
  http.get<{ slug: string }>('/api/pontos/:slug', ({ params }) => {
    const p = d.points.find((x) => x.slug === params.slug);
    return p ? HttpResponse.json(p) : HttpResponse.json({ message: 'não encontrado' }, { status: 404 });
  }),
];
