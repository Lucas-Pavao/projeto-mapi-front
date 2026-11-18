import { http, HttpResponse } from 'msw';
import { SYNTHETIC_SLUG } from './data';

/**
 * DADOS SINTÉTICOS de GET /api/alerta/pontos: os 10 estados com resposta da prancha "Nível 2" (Cenarios2Alerta).
 * Carregando e falha de leitura não têm corpo; os testes os reproduzem com `server.use`.
 * No navegador, `?alertaFx=<id>` escolhe o estado servido para todos os pontos (padrão: atencao-prov).
 */
const base = { rainModelVersion: 'rain_v1', bucketVersion: 'balde-M1a-10min', trYears: 5, capacityTeMm: 20.9, rainAlert: 'NENHUM', pointFlood: 'NAO', shadow: true, rainTeMm: 0.4, hNowCm: 2, hProjQ50MaxCm: 3, hProjQ80MaxCm: 6, probForte1h: 0.02, probOn: 0.2, latestReadingAgeMinutes: 4 } as const;

export const ALERTA_FIXTURES: Record<string, Record<string, unknown>> = {
  seco: { ...base },
  atencao: { ...base, rainAlert: 'ATENCAO', probForte1h: 0.5, rainTeMm: 4 },
  'atencao-prov': { ...base, rainAlert: 'ATENCAO', pointFlood: 'PROVAVEL', floodInMinutes: 30, hProjQ50MaxCm: 18, hProjQ80MaxCm: 25 },
  'alerta-prov': { ...base, rainAlert: 'ALERTA', pointFlood: 'PROVAVEL', floodInMinutes: 0, hNowCm: 19, rainTeMm: 24.6, probForte1h: 0.78 },
  'alerta-sem-terreno': { ...base, rainAlert: 'ALERTA', pointFlood: 'SEM_DADO', floodReason: 'SEM_TERRENO', floodReasonText: 'ponto fora do levantamento PE3D, sem terreno para o balde', hNowCm: null },
  revisao: { ...base, pointFlood: 'SEM_DADO', floodReason: 'TERRENO_EM_REVISAO', floodReasonText: 'área de contribuição em revisão (62 m²)', hNowCm: null },
  'ia-fora': { ...base, rainAlert: 'ALERTA', rainTeMm: 22.1, pointFlood: 'SEM_DADO', floodReasonText: 'o balde roda na IA, que não respondeu', hNowCm: null },
  velha: { ...base, rainAlert: 'SEM_DADO', rainReasonText: 'a leitura mais nova tem 38 min (limite de 15 min)', rainTeMm: null, probForte1h: null, pointFlood: 'SEM_DADO', floodReasonText: 'faltam 6 h contínuas de chuva de 10 min', hNowCm: null, latestReadingAgeMinutes: 38 },
  'sem-estacao': { ...base, rainAlert: 'SEM_DADO', rainReasonText: 'nenhuma estação válida a até 5 km', rainTeMm: null, pointFlood: 'SEM_DADO', floodReasonText: 'ponto fora do levantamento PE3D, sem terreno para o balde', probForte1h: null, hNowCm: null, latestReadingAgeMinutes: null },
  'fonte-parada': { ...base, rainAlert: 'SEM_DADO', rainReasonText: 'a coleta da APAC/Cemaden está parada há 47 min', rainTeMm: null, probForte1h: null, pointFlood: 'SEM_DADO', floodReasonText: 'faltam 6 h contínuas de chuva de 10 min', hNowCm: null, latestReadingAgeMinutes: 47 },
};

const pick = (): Record<string, unknown> => {
  const id = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('alertaFx') : null;
  return ALERTA_FIXTURES[id ?? ''] ?? ALERTA_FIXTURES['atencao-prov'];
};

export const alertaHandlers = [
  http.get('/api/alerta/pontos', () => HttpResponse.json(
    [SYNTHETIC_SLUG, 'sintetico-2'].map((slug) => ({ slug, ...pick() })),
  )),
];
