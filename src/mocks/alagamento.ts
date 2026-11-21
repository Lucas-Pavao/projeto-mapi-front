import { http, HttpResponse } from 'msw';
import { SYNTHETIC_SLUG } from './data';
import semAlertaSeco from './alagamento/sem_alerta_seco.json';
import chuvaForteSemEncher from './alagamento/chuva_forte_sem_encher.json';
import atencao3h from './alagamento/atencao_3h.json';
import alerta1h from './alagamento/alerta_1h.json';
import alertaAgora from './alagamento/alerta_agora.json';
import atencao6h from './alagamento/atencao_6h.json';
import semDadoChuva from './alagamento/sem_dado_chuva_ausente.json';
import semDadoPrevisao from './alagamento/sem_dado_previsao_fora.json';
import semDadoTerreno from './alagamento/sem_dado_sem_terreno.json';
import semDadoRevisao from './alagamento/sem_dado_terreno_em_revisao.json';

/**
 * DADOS SINTÉTICOS de GET /api/alagamento/pontos: os 10 estados da prancha "Nível 6". Gerados pelo código real da IA com
 * entradas controladas (projeto-mapi-ai/scripts/gerar_estados_alagamento.py e estados_para_front.py); não são previsões.
 * No navegador, `?alagamentoFx=<id>` escolhe o estado servido para todos os pontos (padrão: atencao_3h).
 */
export const ALAGAMENTO_FIXTURES = {
  sem_alerta_seco: semAlertaSeco,
  chuva_forte_sem_encher: chuvaForteSemEncher,
  atencao_3h: atencao3h,
  alerta_1h: alerta1h,
  alerta_agora: alertaAgora,
  atencao_6h: atencao6h,
  sem_dado_chuva_ausente: semDadoChuva,
  sem_dado_previsao_fora: semDadoPrevisao,
  sem_dado_sem_terreno: semDadoTerreno,
  sem_dado_terreno_em_revisao: semDadoRevisao,
} as const;

export type AlagamentoFixtureId = keyof typeof ALAGAMENTO_FIXTURES;

const pick = () => {
  const id = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('alagamentoFx') : null;
  return ALAGAMENTO_FIXTURES[(id ?? '') as AlagamentoFixtureId] ?? ALAGAMENTO_FIXTURES.atencao_3h;
};

/** DADOS SINTÉTICOS de GET /api/alagamento/status. */
export const ALAGAMENTO_STATUS = {
  aiReachable: true, rainModelVersion: 'rain_v1', bucketVersion: 'balde-M1a-10min', floodVersion: 'flood_reg_v1',
  codeVersion: '0000000000000000000000000000000000000000', codeDirty: 'false', lastCycleAt: '2026-11-20T17:00:00Z',
  byLevel: { SEM_ALERTA: 3, SEM_DADO: 2 }, semDadoByReason: { SEM_TERRENO: 1, TERRENO_EM_REVISAO: 1 }, shadow: true,
};

/** DADOS SINTÉTICOS de GET /api/alagamento/historico: ciclos de 10 min com sem alerta, alerta (17,7 cm) e sem dado. */
export const historicoOf = (horas: number, now = Date.now()) => {
  const to = Math.floor(now / 600_000) * 600_000;
  const from = to - horas * 3_600_000;
  const items = [];
  for (let t = from + 600_000; t <= to; t += 600_000) {
    const k = (t - from) / (to - from);
    const level = k < 0.55 ? 'SEM_ALERTA' : k < 0.7 ? 'ALERTA' : k < 0.8 ? 'SEM_ALERTA' : 'SEM_DADO';
    items.push({ at: new Date(t).toISOString(), level, worstHorizonHours: level === 'SEM_DADO' ? null : 1,
      hNowCm: level === 'ALERTA' ? 17.7 : level === 'SEM_DADO' ? null : 0, reason: level === 'SEM_DADO' ? 'CHUVA_AUSENTE' : null });
  }
  return { from: new Date(from).toISOString(), to: new Date(to).toISOString(), points: [{ slug: SYNTHETIC_SLUG, name: 'Sintético: ponto de teste', items }] };
};

export const alagamentoHandlers = [
  http.get('/api/alagamento/historico', ({ request }) => HttpResponse.json(historicoOf(Number(new URL(request.url).searchParams.get('horas') ?? 24)))),
  http.get('/api/alagamento/status', () => HttpResponse.json(ALAGAMENTO_STATUS)),
  http.get('/api/alagamento/pontos', () => HttpResponse.json(
    [SYNTHETIC_SLUG, 'sintetico-2'].map((slug, i) => ({ ...pick(), slug, floodPointId: i + 1 })),
  )),
];
