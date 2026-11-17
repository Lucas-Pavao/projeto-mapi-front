import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { PointAlertPanel } from './PointAlertPanel';
import type { AlertaPonto } from '../schemas/alerta.schema';

const a = (over: Partial<AlertaPonto>): AlertaPonto => ({
  slug: 'IBURA', name: 'Ibura', rainAlert: 'NENHUM', pointFlood: 'NAO', shadow: true, rainTeMm: 0, hNowCm: 0,
  latestReadingAgeMinutes: 4, ...over,
});

afterEach(() => cleanup());

describe('PointAlertPanel', () => {
  it.each(['NENHUM', 'ATENCAO', 'ALERTA', 'SEM_DADO'] as const)('mostra o estado de chuva %s', (s) => {
    render(<PointAlertPanel alerta={a({ rainAlert: s, rainReasonText: 'nenhuma estação válida a até 5 km' })} pointName="Ibura" />);
    expect(screen.getByTestId(`alerta-rain-${s}`)).toBeInTheDocument();
  });
  it.each(['NAO', 'PROVAVEL', 'SEM_DADO'] as const)('mostra o nível do ponto %s sempre com a etiqueta do modelo físico', (f) => {
    render(<PointAlertPanel alerta={a({ pointFlood: f, floodInMinutes: 0, hNowCm: 20, floodReasonText: 'área de contribuição em revisão' })} pointName="Derby" />);
    expect(screen.getByTestId(`alerta-flood-${f}`)).toBeInTheDocument();
    expect(screen.getByTestId('alerta-modelo-fisico')).toHaveTextContent('Estimativa do modelo físico, ainda não validada contra alagamento observado');
  });
  it('SEM_DADO do ponto aparece separado e o alerta de chuva continua', () => {
    render(<PointAlertPanel alerta={a({ rainAlert: 'ATENCAO', pointFlood: 'SEM_DADO', floodReasonText: 'sem terreno do ponto' })} pointName="Jaboatão" />);
    expect(screen.getByTestId('alerta-rain-ATENCAO')).toBeInTheDocument();
    expect(screen.getByTestId('alerta-flood-SEM_DADO')).toHaveTextContent('sem terreno do ponto');
  });
  it('modo sombra marca "em teste"', () => {
    render(<PointAlertPanel alerta={a({ shadow: true })} pointName="Ibura" />);
    expect(screen.getByTestId('alerta-em-teste')).toHaveTextContent('Em teste');
  });
  it('erro de leitura vira sem dado, nunca sem alerta', () => {
    render(<PointAlertPanel alerta={null} pointName="Ibura" isError />);
    expect(screen.getByTestId('alerta-sem-dado')).toHaveTextContent('Sem dado suficiente agora');
  });
});
