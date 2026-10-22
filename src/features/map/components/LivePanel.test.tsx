import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LivePanel } from './LivePanel';
import type { FloodPointResponseDTO, SensorResponseDTO } from '../types';

afterEach(cleanup);

const pt = (id: number, name: string, level: string, p: number | null) =>
  ({ id, slug: `p${id}`, name, municipality: 'Recife', latitude: 0, longitude: 0, floodPrediction: { riskLevel: level, floodProbability: p, horizonHours: 3, modelValidationStatus: 'NOT_VALIDATED' } }) as unknown as FloodPointResponseDTO;
const overview = { isError: false, from: 0, to: 1, now: 0, rain: [], tide: [], rainNow: null, tideNow: { v: 0.22, rising: false }, probabilities: new Map() } as never;
const sensor = { id: 1, sensorId: 'S1', stationName: 'Várzea', value: 0.4, unit: 'mm/h', source: 'CEMADEN', type: 'Pluviômetro', timestamp: new Date().toISOString() } as unknown as SensorResponseDTO;

const renderPanel = (over: Partial<React.ComponentProps<typeof LivePanel>> = {}) =>
  render(
    <MemoryRouter>
      <LivePanel points={[pt(1, 'Baixo A', 'LOW', 0.1), pt(2, 'Alto B', 'HIGH', 0.8), pt(3, 'Sem C', 'UNKNOWN', null)]} sensors={[sensor]} summary={{ LOW: 1, MEDIUM: 0, HIGH: 1, UNKNOWN: 1, computedAt: '2026-10-21T18:00:00Z' }}
        summaryFailed={false} liveStatus="open" lastSuccessAt={null} overview={overview} onFloodPointClick={vi.fn()} onSensorClick={vi.fn()} canSeeDataHealth={false} {...over} />
    </MemoryRouter>,
  );

describe('LivePanel', () => {
  it('abas com contagem, lista por risco (alto primeiro) e UNKNOWN sem porcentagem', () => {
    renderPanel();
    expect(screen.getByRole('tab', { name: 'Pontos críticos · 3' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Sensores · 2' })).toBeInTheDocument(); // sensor + maré
    const rows = within(screen.getByRole('tabpanel')).getAllByRole('button');
    expect(rows[0].textContent).toContain('Alto B');
    expect(rows[1].textContent).toContain('Sem C');
    expect(rows[2].textContent).toContain('Baixo A');
    expect(rows[0].textContent).toContain('80%');
    expect(rows[1].textContent).not.toMatch(/%/);
    expect(screen.getByTestId('experimental-label')).toBeInTheDocument();
  });
  it('aba Sensores lista a maré e o sensor; link Saúde dos dados só para ADMIN', () => {
    renderPanel();
    expect(screen.queryByRole('link', { name: 'Saúde dos dados' })).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: /Sensores/ }));
    expect(screen.getByText('Maré · Recife')).toBeInTheDocument();
    expect(screen.getByText('Várzea')).toBeInTheDocument();
    cleanup();
    renderPanel({ canSeeDataHealth: true });
    expect(screen.getByRole('link', { name: 'Saúde dos dados' })).toHaveAttribute('href', '/admin/dados');
  });
  it('todos UNKNOWN: aviso "Previsão indisponível" e nada de "experimental"', () => {
    renderPanel({ points: [pt(1, 'Sem C', 'UNKNOWN', null)] });
    expect(screen.getByText('Previsão indisponível.')).toBeInTheDocument();
    expect(screen.queryByTestId('experimental-label')).toBeNull();
  });
});
