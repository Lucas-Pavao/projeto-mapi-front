import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { TimeChart } from './TimeChart';
import { HOUR_MS } from './chartMath';

afterEach(cleanup);

const to = Date.parse('2026-10-21T15:00:00Z');
const from = to - 6 * HOUR_MS;

describe('TimeChart', () => {
  it('chuva horária: uma barra por hora, terminando no fim da hora (t da API)', () => {
    const points = [1, 2, 3].map((i) => ({ t: to - (3 - i) * HOUR_MS, v: i }));
    const { container } = render(<TimeChart title="Chuva" unit="mm/h" from={from} to={to} zero series={[{ id: 'r', label: 'Pluv', kind: 'bars', points, colorClass: 'text-chart-1' }]} />);
    const bars = Array.from(container.querySelectorAll('rect[data-bar-end]'));
    expect(bars.map((b) => Number(b.getAttribute('data-bar-end')))).toEqual(points.map((p) => p.t));
    // a última barra termina exatamente na borda direita do gráfico
    const last = bars[bars.length - 1];
    const x = Number(last.getAttribute('x')) - 0.5 + Number(last.getAttribute('width')) + 1;
    const inner = Number(container.querySelector('svg')!.getAttribute('width')) - 40 - 12;
    expect(Math.round(x)).toBe(inner);
  });

  it('linha com valor nulo vira dois trechos', () => {
    const points = [{ t: from, v: 1 }, { t: from + HOUR_MS, v: 2 }, { t: from + 2 * HOUR_MS, v: null }, { t: from + 3 * HOUR_MS, v: 2 }, { t: from + 4 * HOUR_MS, v: 3 }];
    const { container } = render(<TimeChart title="Maré" unit="m" from={from} to={to} series={[{ id: 'm', label: 'pe02', kind: 'line', points, colorClass: 'text-chart-2' }]} />);
    expect(container.querySelectorAll('[data-series="m"] path')).toHaveLength(2);
  });

  it('tem resumo textual com mínimo e máximo e unidade', () => {
    const points = [{ t: from, v: 0.5 }, { t: to, v: 2.5 }];
    render(<TimeChart title="Rio" unit="m" from={from} to={to} series={[{ id: 'r', label: 'Estação 1', kind: 'line', points, colorClass: 'text-chart-1' }]} />);
    expect(screen.getByRole('img', { name: /Estação 1: mínimo 0,5 m, máximo 2,5 m/ })).toBeInTheDocument();
  });

  it('sem dados mostra o texto de vazio, sem svg', () => {
    const { container } = render(<TimeChart title="Rio" unit="m" from={from} to={to} series={[{ id: 'r', label: 'E', kind: 'line', points: [{ t: from, v: null }], colorClass: 'text-chart-1' }]} emptyText="Sem leituras." />);
    expect(screen.getByText('Sem leituras.')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeNull();
  });

  it('futureFrom: parte depois de agora é tracejada, ligada ao último ponto passado', () => {
    const points = [0, 1, 2, 3, 4, 5].map((i) => ({ t: from + i * HOUR_MS, v: i }));
    const { container } = render(<TimeChart title="Maré" unit="m" from={from} to={to} futureFrom={from + 2 * HOUR_MS} series={[{ id: 'm', label: 'pe02', kind: 'line', points, colorClass: 'text-chart-2' }]} />);
    const solid = container.querySelector('path[data-dashed="false"]')!.getAttribute('d')!;
    const dashed = container.querySelector('path[data-dashed="true"]')!.getAttribute('d')!;
    expect(solid.split('L')).toHaveLength(3); // pontos 0, 1, 2
    expect(dashed.split('L')).toHaveLength(4); // 2 (emenda), 3, 4, 5
    expect(dashed.split('L')[0].replace('M', '')).toBe(solid.split('L')[2]); // sem lacuna entre os trechos
    expect(container.querySelector('[data-future-band]')).not.toBeNull();
  });
});
