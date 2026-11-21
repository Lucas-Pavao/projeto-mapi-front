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

export const alagamentoHandlers = [
  http.get('/api/alagamento/pontos', () => HttpResponse.json(
    [SYNTHETIC_SLUG, 'sintetico-2'].map((slug, i) => ({ ...pick(), slug, floodPointId: i + 1 })),
  )),
];
