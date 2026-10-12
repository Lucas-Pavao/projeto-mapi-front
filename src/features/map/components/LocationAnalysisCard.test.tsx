import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { LocationAnalysisCard } from './LocationAnalysisCard';
import type { PreciseDataResponse } from '../types';

afterEach(cleanup);

const info = (over: Partial<PreciseDataResponse['preciseData']> = {}, extra: Partial<PreciseDataResponse> = {}) => ({
  requestedLatitude: -8.07, requestedLongitude: -34.88, nearestSensor: null, distanceToNearestSensorKm: null,
  openMeteoData: {} as PreciseDataResponse['openMeteoData'],
  localElevation: { meters: 2.8, source: 'PE3D_MDT_5M', resolutionM: 5, note: 'n' },
  preciseData: {
    source: 'MIXED', timestamp: '2026-10-12T08:45:00', precipitation: 1.2, temperature: 28.5, humidity: 58, pressure: 1016,
    windSpeed: 13.7, solarRadiation: 762, waterLevel: 0, flowRate: 0, tideHeight: 0.39, tideHeightTabuaMare: 0.39,
    waveHeight: null, waveDirection: null, wavePeriod: null, unitPrecipitation: 'mm', unitTemperature: '°C', unitWaterLevel: 'm',
    unitTide: 'm', unitWave: 'm', unitWindSpeed: 'km/h', unitPressure: 'hPa', unitSolarRadiation: 'W/m²', unitFlowRate: 'm³/s', message: null,
    historicalAggregates: { rain3h: 0.4, rain6h: 1, rain12h: 2, rain24h: 3.9, maxRiverLevel24h: null, avgTemperature24h: null, rainSource: 'OPEN_METEO_FORECAST' },
    latestReadings: [{ sensorId: 'APAC-PLUVIO-X', latitude: 0, longitude: 0, value: 1.2, unit: 'mm', type: 'PRECIPITATION', timestamp: '', distanceKm: 2.2 }],
    ...over,
  },
  ...extra,
}) as PreciseDataResponse;

const props = { coords: { lat: -8.0723, lng: -34.8804 }, loading: false, harborName: 'PORTO DO RECIFE (ESTADO DE PERNAMBUCO)', onClose: () => {}, onSensorSelect: () => {}, onReport: () => {} };

describe('LocationAnalysisCard', () => {
  it('organiza em blocos na ordem chuva → água lá fora → terreno → tempo → sensores', () => {
    render(<LocationAnalysisCard {...props} info={info()} />);
    const titulos = screen.getAllByRole('heading', { level: 4 }).map((h) => h.textContent);
    expect(titulos).toEqual(['Chuva', 'Água lá fora', 'Terreno', 'Tempo agora', 'Sensores no raio de 3 km']);
    expect(screen.getByText('Porto do Recife')).toBeInTheDocument();
    expect(screen.getByText(/MDT do PE3D/)).toBeInTheDocument();
    expect(screen.getByText(/dados das 08:45/)).toBeInTheDocument();
  });
  it('não mostra rio quando não há régua de rio no raio (evita o 0,00 m enganoso)', () => {
    render(<LocationAnalysisCard {...props} info={info()} />);
    expect(screen.queryByText(/Rio \(régua/)).not.toBeInTheDocument();
  });
  it('fora da área do MDT marca a altitude como aproximada', () => {
    render(<LocationAnalysisCard {...props} info={info({}, { localElevation: { meters: 44, source: 'OPEN_METEO_90M', resolutionM: 90, note: null } })} />);
    expect(screen.getByText('≈ 44')).toBeInTheDocument();
    expect(screen.getByText(/aproximada/)).toBeInTheDocument();
  });
  it('sensor da lista e botão de reportar chamam os callbacks', () => {
    const onSensorSelect = vi.fn(); const onReport = vi.fn();
    render(<LocationAnalysisCard {...props} info={info()} onSensorSelect={onSensorSelect} onReport={onReport} />);
    fireEvent.click(screen.getByTitle('APAC-PLUVIO-X'));
    fireEvent.click(screen.getByRole('button', { name: /Reportar alagamento aqui/ }));
    expect(onSensorSelect).toHaveBeenCalledOnce();
    expect(onReport).toHaveBeenCalledOnce();
  });
});
