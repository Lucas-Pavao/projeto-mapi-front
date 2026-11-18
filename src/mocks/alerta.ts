import { http, HttpResponse } from 'msw';
import { SYNTHETIC_SLUG } from './data';

/**
 * DADOS SINTÉTICOS de GET /api/alerta/pontos: os 10 estados com resposta da prancha "Nível 2" (Cenarios2Alerta).
 * Carregando e falha de leitura não têm corpo; os testes os reproduzem com `server.use`.
 * No navegador, `?alertaFx=<id>` escolhe o estado servido para todos os pontos (padrão: atencao-prov).
 */
const base = { rainAlert: 'NENHUM', pointFlood: 'NAO', shadow: true, rainTeMm: 0.4, hNowCm: 2, hProjQ50MaxCm: 3, hProjQ80MaxCm: 6, probForte1h: 0.02, probOn: 0.2, latestReadingAgeMinutes: 4 } as const;

export const ALERTA_FIXTURES: Record<string, Record<string, unknown>> = {
  seco: { ...base },
  atencao: { ...base, rainAlert: 'ATENCAO', probForte1h: 0.5, rainTeMm: 4 },
  'atencao-prov': { ...base, rainAlert: 'ATENCAO', pointFlood: 'PROVAVEL', floodInMinutes: 30, hProjQ50MaxCm: 18, hProjQ80MaxCm: 25 },
  'alerta-prov': { ...base, rainAlert: 'ALERTA', pointFlood: 'PROVAVEL', floodInMinutes: 0, hNowCm: 21 },
  'alerta-sem-terreno': { ...base, rainAlert: 'ALERTA', pointFlood: 'SEM_DADO', floodReason: 'SEM_TERRENO', floodReasonText: 'sem terreno do ponto', hNowCm: null },
  revisao: { ...base, pointFlood: 'SEM_DADO', floodReason: 'TERRENO_EM_REVISAO', floodReasonText: 'área de contribuição em revisão', hNowCm: null },
  'ia-fora': { ...base, rainAlert: 'SEM_DADO', rainReasonText: 'modelo de chuva fora do ar', probForte1h: null },
  velha: { ...base, rainAlert: 'ATENCAO', latestReadingAgeMinutes: 47 },
  'sem-estacao': { ...base, rainAlert: 'SEM_DADO', rainReasonText: 'nenhuma estação válida a até 5 km', pointFlood: 'SEM_DADO', floodReasonText: 'sem leitura', probForte1h: null, hNowCm: null },
  'fonte-parada': { ...base, rainAlert: 'SEM_DADO', rainReasonText: 'fonte parada há 3 h', probForte1h: null },
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
