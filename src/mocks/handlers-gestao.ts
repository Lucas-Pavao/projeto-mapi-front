import { http, HttpResponse } from 'msw';
import type { TideTableResponseDTO } from '@/features/map/types';

const hhmm = (n: number) => `${String(Math.floor(n / 60) % 24).padStart(2, '0')}:${String(Math.round(n % 60)).padStart(2, '0')}`;

/** Tábua SINTÉTICA do mês atual (4 pontos por dia). Só desenha a tela; não é maré real. */
export function tideTableSintetica(now = new Date()): TideTableResponseDTO {
  const dias = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return {
    id: 1, year: now.getFullYear(), harborName: 'Sintético: porto', state: 'PE', timezone: 'America/Recife', card: 'pe02', dataCollectionInstitution: 'sintético', meanLevel: 1.3, geoLocations: [], currentTideHeight: 1.1,
    months: [{
      monthName: new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(now), month: now.getMonth() + 1,
      days: Array.from({ length: dias }, (_, i) => {
        const amp = 0.4 + 0.5 * Math.abs(Math.sin((i / 14.8) * Math.PI));
        const t0 = (i * 50) % 745;
        const hi = Number((1.3 + amp).toFixed(2));
        const lo = Number((1.1 - amp).toFixed(2));
        return { weekdayName: '', day: i + 1, hours: [{ hour: hhmm(t0), level: lo }, { hour: hhmm(t0 + 372), level: hi }, { hour: hhmm(t0 + 745), level: lo }, { hour: hhmm(t0 + 1117), level: hi }] };
      }),
    }],
  };
}

/** Handlers das telas de gestão (tábua de maré etc.). Registrados em handlers.ts com uma linha. */
export const gestaoHandlers = [
  http.get('/api/tide/:harbor', () => HttpResponse.json(tideTableSintetica())),
  // DADOS SINTÉTICOS: atraso do alerta por trecho (item 2.1), para fotografar a tela Dados.
  http.get('/api/alerta/latencia', () => {
    const seg = (segment: string, wetHour: boolean, n: number, medianS: number, p90S: number, maxS: number) => ({ segment, wetHour, n, medianS, p90S, maxS });
    return HttpResponse.json({
      from: '2026-11-10T00:00:00Z', to: '2026-11-17T00:00:00Z', budgetP90Minutes: 5, withinBudgetWet: true, withinBudgetDry: null, note: null,
      segments: [
        seg('estacao_coleta', true, 40, 95, 180, 240), seg('coleta_banco', true, 40, 2.1, 4.8, 9), seg('banco_ciclo', true, 40, 31, 58, 70),
        seg('ciclo_ia', true, 40, 3.2, 6.5, 11), seg('ia_estado', true, 40, 0.4, 0.9, 1.4), seg('estado_sse', true, 40, 0.2, 0.5, 0.8), seg('total', true, 40, 140, 250, 330),
        seg('total', false, 120, 160, 290, 410),
      ],
    });
  }),
  http.get('/api/alerta/latencia/relatorios', () => HttpResponse.json([])),
];
