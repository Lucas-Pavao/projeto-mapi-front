import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { PointAlertPanel } from './PointAlertPanel';
import { alertaPontoSchema, type AlertaPonto } from '../schemas/alerta.schema';

afterEach(cleanup);

const base = { slug: 'IBURA', name: 'Ibura', rainAlert: 'NENHUM', pointFlood: 'NAO', shadow: true, rainTeMm: 0.4, hNowCm: 2, hProjQ50MaxCm: 3, hProjQ80MaxCm: 6, probForte1h: 0.02, probOn: 0.2, latestReadingAgeMinutes: 4 };
const fx = (over: Record<string, unknown>): AlertaPonto => alertaPontoSchema.parse({ ...base, ...over });

/** Os 12 estados do painel (Cenarios2Alerta), em fixtures no formato do schema. Dados ilustrativos. */
const ESTADOS: Array<{ id: string; a?: AlertaPonto | null; loading?: boolean; error?: boolean; rain?: string; flood?: string; texto: RegExp }> = [
  { id: 'seco', a: fx({}), rain: 'NENHUM', flood: 'NAO', texto: /Sem alerta de chuva/ },
  { id: 'atencao', a: fx({ rainAlert: 'ATENCAO', probForte1h: 0.5, rainTeMm: 4 }), rain: 'ATENCAO', flood: 'NAO', texto: /Chuva forte provável/ },
  { id: 'atencao-prov', a: fx({ rainAlert: 'ATENCAO', pointFlood: 'PROVAVEL', floodInMinutes: 30, hProjQ50MaxCm: 18, hProjQ80MaxCm: 25 }), rain: 'ATENCAO', flood: 'PROVAVEL', texto: /em até 30 min/ },
  { id: 'alerta-prov', a: fx({ rainAlert: 'ALERTA', pointFlood: 'PROVAVEL', floodInMinutes: 0, hNowCm: 21 }), rain: 'ALERTA', flood: 'PROVAVEL', texto: /21 cm agora/ },
  { id: 'alerta-sem-terreno', a: fx({ rainAlert: 'ALERTA', pointFlood: 'SEM_DADO', floodReasonText: 'sem terreno do ponto', hNowCm: null }), rain: 'ALERTA', flood: 'SEM_DADO', texto: /sem terreno do ponto/ },
  { id: 'revisao', a: fx({ pointFlood: 'SEM_DADO', floodReasonText: 'área de contribuição em revisão', hNowCm: null }), rain: 'NENHUM', flood: 'SEM_DADO', texto: /área de contribuição em revisão/ },
  { id: 'ia-fora', a: fx({ rainAlert: 'SEM_DADO', rainReasonText: 'modelo de chuva fora do ar', probForte1h: null }), rain: 'SEM_DADO', flood: 'NAO', texto: /modelo de chuva fora do ar/ },
  { id: 'velha', a: fx({ rainAlert: 'ATENCAO', latestReadingAgeMinutes: 47 }), rain: 'ATENCAO', flood: 'NAO', texto: /leitura de 47 min atrás/ },
  { id: 'sem-estacao', a: fx({ rainAlert: 'SEM_DADO', rainReasonText: 'nenhuma estação válida a até 5 km', pointFlood: 'SEM_DADO', floodReasonText: 'sem leitura', probForte1h: null, hNowCm: null }), rain: 'SEM_DADO', flood: 'SEM_DADO', texto: /nenhuma estação válida/ },
  { id: 'fonte-parada', a: fx({ rainAlert: 'SEM_DADO', rainReasonText: 'fonte parada há 3 h', probForte1h: null }), rain: 'SEM_DADO', flood: 'NAO', texto: /fonte parada há 3 h/ },
  { id: 'loading', loading: true, texto: /Lendo o alerta/ },
  { id: 'erro', a: null, error: true, texto: /Não foi possível ler o alerta/ },
];

describe('PointAlertPanel: 12 estados', () => {
  it.each(ESTADOS)('$id', (e) => {
    render(<PointAlertPanel alerta={e.a} pointName="Ibura" isLoading={e.loading} isError={e.error} />);
    if (e.loading) expect(screen.getByTestId('alerta-loading')).toHaveTextContent(e.texto);
    else if (e.error) expect(screen.getByTestId('alerta-sem-dado')).toHaveTextContent(e.texto);
    else {
      expect(screen.getByTestId(`alerta-rain-${e.rain}`)).toBeInTheDocument();
      expect(screen.getByTestId(`alerta-flood-${e.flood}`)).toBeInTheDocument();
      expect(screen.getByTestId('alerta-panel')).toHaveTextContent(e.texto);
      expect(screen.getByTestId('alerta-modelo-fisico')).toBeInTheDocument();
    }
    // SEM_DADO nunca vira "sem alerta" nem "não alaga"
    if (e.rain === 'SEM_DADO') expect(screen.getByTestId('alerta-rain-SEM_DADO')).not.toHaveTextContent(/^Sem alerta de chuva/);
  });
});

describe('PointAlertPanel: barra de probabilidade e régua do balde', () => {
  it('a marca vem de probOn da resposta, nunca de constante', () => {
    render(<PointAlertPanel alerta={fx({ probForte1h: 0.3, probOn: 0.2 })} pointName="Ibura" />);
    expect(screen.getByTestId('alerta-prob')).toHaveTextContent('P(FORTE em 1 h) 30,0%');
    expect(screen.getByTestId('alerta-prob')).toHaveTextContent('liga ≥ 20,0%');
    expect(screen.getByTestId('alerta-prob')).not.toHaveTextContent('10,6%');
    expect(screen.getByTestId('alerta-prob-on').getAttribute('style')).toContain('left: 33.3');
  });
  it('sem probOn não há marca nem "liga"; sem probForte1h não há barra', () => {
    const { rerender } = render(<PointAlertPanel alerta={fx({ probForte1h: 0.3, probOn: null })} pointName="Ibura" />);
    expect(screen.queryByTestId('alerta-prob-on')).toBeNull();
    expect(screen.getByTestId('alerta-prob')).not.toHaveTextContent('liga');
    rerender(<PointAlertPanel alerta={fx({ probForte1h: null })} pointName="Ibura" />);
    expect(screen.queryByTestId('alerta-prob')).toBeNull();
  });
  it('régua com aria-label quando há lâmina e o ponto não é SEM_DADO', () => {
    render(<PointAlertPanel alerta={fx({ hNowCm: 8, hProjQ50MaxCm: 12, hProjQ80MaxCm: 19 })} pointName="Ibura" />);
    expect(screen.getByRole('img', { name: /Lâmina agora 8 cm, projeção em 60 min de 12 a 19 cm; alagamento a partir de 15 cm/ })).toBeInTheDocument();
  });
  it('sem régua se pointFlood é SEM_DADO ou hNowCm é nulo', () => {
    const { rerender } = render(<PointAlertPanel alerta={fx({ pointFlood: 'SEM_DADO', hNowCm: 5 })} pointName="Ibura" />);
    expect(screen.queryByTestId('alerta-balde')).toBeNull();
    rerender(<PointAlertPanel alerta={fx({ hNowCm: null })} pointName="Ibura" />);
    expect(screen.queryByTestId('alerta-balde')).toBeNull();
  });
});
