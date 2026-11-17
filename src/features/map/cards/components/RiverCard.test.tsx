import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RiverCard } from './RiverCard';
import { riverState, riverTrendCmH, trendText, type RiverLevels } from '../utils/river';

afterEach(cleanup);
const levels: RiverLevels = { pre: 1.8, alert: 2.3, flood: 2.8 };
const show = (levelM: number | null, trendCmH: number | null = 4, l = levels) => render(<MemoryRouter><RiverCard name="Engenho Velho" riverName="Duas Unas" stationId="260790119H" levelM={levelM} trendCmH={trendCmH} levels={l} /></MemoryRouter>);

describe('RiverCard', () => {
  it('normal: nível, tendência, cotas da APAC e "fora do modelo"', () => {
    show(1.2);
    expect(screen.getByTestId('river-state')).toHaveTextContent('Normal');
    expect(screen.getByTestId('river-level')).toHaveTextContent('1,20 m');
    expect(screen.getByTestId('river-trend')).toHaveTextContent('subindo 4 cm/h');
    expect(screen.getByTestId('river-cotas')).toHaveTextContent('pré 1,80alerta 2,30inundação 2,80 m');
    expect(screen.getByText(/Fica fora do logreg_v3 e do alerta por ponto: é mostrado para a operação\./)).toBeInTheDocument();
  });
  it('estados usam >= nas cotas', () => {
    expect(riverState(1.8, levels)).toBe('PRE_ALERT');
    expect(riverState(2.3, levels)).toBe('ALERT');
    expect(riverState(2.8, levels)).toBe('FLOOD');
    expect(riverState(1.79, levels)).toBe('NORMAL');
  });
  it('sem leitura: traço, sem marcador e sem tendência', () => {
    show(null, null);
    expect(screen.getByTestId('river-state')).toHaveTextContent('Sem leitura');
    expect(screen.getByTestId('river-level')).toHaveTextContent('—');
    expect(screen.queryByTestId('river-marker')).toBeNull();
  });
  it('sem cotas informadas: só o nível, nada de cotas inventadas', () => {
    show(2, 0, { pre: null, alert: null, flood: null });
    expect(screen.queryByTestId('river-cotas')).toBeNull();
    expect(screen.getByText(/não informou as cotas/)).toBeInTheDocument();
    expect(screen.getByTestId('river-trend')).toHaveTextContent('estável');
  });
  it.each([[1.0, 'NORMAL', 'Normal'], [1.9, 'PRE_ALERT', 'Pré-alerta'], [2.4, 'ALERT', 'Alerta'], [3, 'FLOOD', 'Inundação']] as const)('estado %s: %s no card', (lvl, st, text) => {
    show(lvl);
    expect(screen.getByRole('dialog')).toHaveAttribute('data-state', st);
    expect(screen.getByTestId('river-state')).toHaveTextContent(text);
  });
  it('tendência em cm/h a partir da série', () => {
    const H = 3_600_000;
    expect(riverTrendCmH([{ t: 0, v: 1 }, { t: H, v: 1.06 }], H)).toBeCloseTo(6);
    expect(riverTrendCmH([{ t: 0, v: 1 }, { t: 600_000, v: 1.5 }], 600_000)).toBeNull(); // janela curta demais
    expect(trendText(-3.2)).toBe('descendo 3 cm/h');
  });
});
