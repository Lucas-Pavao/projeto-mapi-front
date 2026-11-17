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
    expect(rows[0].textContent).toContain('80,0%');
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

  it('lista unificada: a estação aparece uma vez, com janela e fonte; ausente não vira zero; o feed declara a fonte', () => {
    const feed = { id: 9, sensorId: 'APAC-CEM-1', code: '261160618A', stationName: '[CEMADEN] Torreão', source: 'APAC/Cemaden',
      type: 'PRECIPITATION', value: 0, unit: 'mm', timestamp: new Date().toISOString() } as unknown as SensorResponseDTO;
    const apac = { id: 10, sensorId: 'APAC-X', code: 'X1', stationName: '[APAC] Charneca', source: 'APAC/Cemaden',
      type: 'PRECIPITATION', value: 0.2, unit: 'mm', timestamp: new Date().toISOString() } as unknown as SensorResponseDTO;
    const st = (id: string, name: string, acc3: number | null) => ({ canonicalId: id, stationCode: id, name, municipality: 'Recife', lat: -8, lon: -34.9,
      aliases: [`CEMADEN:${id}`, `CEMADEN_PED:${id}`], status: acc3 == null ? 'NO_DATA' as const : 'OK' as const,
      lastReadingUtc: new Date(Date.now() - 12 * 60_000).toISOString(), acc1hMm: null, acc3hMm: acc3, acc6hMm: null, acc12hMm: null,
      acc24hMm: null, acc48hMm: null, acc72hMm: null, acc96hMm: null, acc120hMm: null });
    const onStation = vi.fn();
    renderPanel({ sensors: [feed, apac], stations: [st('261160618A', 'Torreão', 1.4), st('261160621A', 'Areias', null)], onStationClick: onStation });
    fireEvent.click(screen.getByRole('tab', { name: /Sensores/ }));
    const rows = screen.getAllByTestId('unified-station');
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.textContent?.includes('Torreão'))).toHaveTextContent('Chuva em 3 h · Cemaden PED · leitura há 12 min');
    expect(rows.find((r) => r.textContent?.includes('Areias'))).toHaveTextContent('sem dado');
    expect(rows.find((r) => r.textContent?.includes('Areias'))).toHaveTextContent('não é zero');
    expect(screen.queryByText('[CEMADEN] Torreão')).toBeNull();            // o mesmo pluviômetro não aparece duas vezes
    expect(screen.getByText('[APAC] Charneca').closest('button')).toHaveTextContent('última leitura · feed da APAC');
    fireEvent.click(rows.find((r) => r.textContent?.includes('Torreão')) as HTMLElement);
    expect(onStation).toHaveBeenCalledWith('261160618A');
  });

  it('mostra o selo oficial do INMET quando há aviso vigente e omite quando vazio', () => {
    renderPanel({ officialWarnings: [] });
    expect(screen.queryByTestId('inmet-official-warning')).toBeNull();
    cleanup();
    renderPanel({
      officialWarnings: [{
        warningId: 28712,
        sequenceId: 1,
        externalId: 56423,
        capCode: null,
        source: 'INMET_AVISOS',
        firstSeenAt: '2026-11-16T12:10:00Z',
        lastSeenAt: '2026-11-16T12:20:00Z',
        validFrom: '2026-11-16T12:05:00Z',
        validTo: '2026-11-17T02:59:00Z',
        severity: 'Perigo',
        severityId: 7,
        colorHex: '#F96602',
        description: 'Tempestade',
        risks: ['Chuva entre 30 e 60 mm/h'],
        instructions: [],
        geocodes: ['2611606'],
        municipalities: 'Recife - PE',
        altered: false,
        closed: false,
      }],
    });
    expect(screen.getByTestId('inmet-official-warning')).toHaveTextContent('Aviso oficial do INMET vigente');
  });
});
