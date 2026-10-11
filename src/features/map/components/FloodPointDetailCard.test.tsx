import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { FloodPointDetailCard } from './FloodPointDetailCard';
import type { FloodPointResponseDTO } from '../types';

vi.mock('../services/terrain.service', () => ({
  terrainService: { getTerrain: vi.fn(() => new Promise(() => {})) },
}));

afterEach(cleanup);

const point = { id: 1, slug: 'p', name: 'Ponto', latitude: 0, longitude: 0, active: true, tideHeight: 1.2 } as unknown as FloodPointResponseDTO;
const renderCard = (status: Record<string, unknown>) =>
  render(
    <FloodPointDetailCard point={point} status={status as never} isFetchingStatus={false} onClose={() => {}} onReportFlood={() => {}} onExportCsv={() => {}} onFocusMap={() => {}} />,
  );

describe('FloodPointDetailCard rastreabilidade', () => {
  it('chuva só do Open-Meteo: "na última hora", nunca 24 h', () => {
    renderCard({ preciseData: { source: 'X' }, openMeteoData: { current: { precipitation: 0.6 } } });
    expect(screen.getByText('Chuva na última hora')).toBeInTheDocument();
    expect(screen.getByTestId('rain-source')).toHaveTextContent('Open-Meteo');
    expect(screen.queryByText(/Acumulado Chuva \(24h\)/)).toBeNull();
  });
  it('maré com unidade NR da DHN e tooltip', () => {
    renderCard({ preciseData: { source: 'X' } });
    expect(screen.getAllByText('m (NR da DHN)').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('tooltip')[0]).toHaveTextContent(/não é comparável à cota do terreno/i);
  });
  it('bloco de terreno presente', () => {
    renderCard({ preciseData: { source: 'X' } });
    expect(screen.getByTestId('terrain-facts')).toBeInTheDocument();
  });
});
