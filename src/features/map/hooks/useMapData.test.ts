import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

vi.mock('../services/sensor.service', () => ({ sensorService: { getLatestSensors: vi.fn() } }));
vi.mock('../services/flood.service', () => ({ floodService: { getAllFloodPoints: vi.fn() } }));

import { sensorService } from '../services/sensor.service';
import { floodService } from '../services/flood.service';
import { useMapData } from './useMapData';

const sensors = vi.mocked(sensorService.getLatestSensors);
const points = vi.mocked(floodService.getAllFloodPoints);

describe('useMapData: estado real das requisições', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it('sucesso: sem erro e com horário do último dado válido', async () => {
    sensors.mockResolvedValue([]);
    points.mockResolvedValue([]);
    const { result } = renderHook(() => useMapData(1_000_000));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasError).toBe(false);
    expect(result.current.lastSuccessAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('falha depois de sucesso: sinaliza erro e preserva o último horário válido', async () => {
    sensors.mockResolvedValueOnce([]);
    points.mockResolvedValueOnce([]);
    const { result } = renderHook(() => useMapData(1_000_000));
    await waitFor(() => expect(result.current.lastSuccessAt).not.toBeNull());
    const before = result.current.lastSuccessAt;
    sensors.mockRejectedValueOnce(new Error('Network Error'));
    points.mockResolvedValueOnce([]);
    await act(async () => {
      await result.current.refetch();
    });
    expect(result.current.hasError).toBe(true);
    expect(result.current.lastSuccessAt).toBe(before);
    // retry com sucesso limpa o erro
    sensors.mockResolvedValueOnce([]);
    points.mockResolvedValueOnce([]);
    await act(async () => {
      await result.current.refetch();
    });
    expect(result.current.hasError).toBe(false);
  });

  it('API fora desde o início: erro e nenhum horário válido', async () => {
    sensors.mockRejectedValue(new Error('Network Error'));
    points.mockRejectedValue(new Error('Network Error'));
    const { result } = renderHook(() => useMapData(1_000_000));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasError).toBe(true);
    expect(result.current.lastSuccessAt).toBeNull();
  });
});
