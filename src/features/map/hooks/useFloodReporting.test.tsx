import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../services/flood.service', () => ({ floodService: { reportFlood: vi.fn(), reportScenario: vi.fn() } }));
vi.mock('../services/export.service', () => ({ exportService: { getUnifiedIADataCsv: vi.fn() } }));
import { floodService } from '../services/flood.service';
import { exportService } from '../services/export.service';
import { useFloodReporting } from './useFloodReporting';

const point = { slug: 'p1' } as never;

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => vi.unstubAllGlobals());

describe('useFloodReporting', () => {
  it('registra evento com o usuário logado e fecha o modal', async () => {
    vi.mocked(floodService.reportFlood).mockResolvedValue({} as never);
    const notify = vi.fn();
    const { result } = renderHook(() => useFloodReporting({ selectedFloodPoint: point, username: 'ana', notify }));
    act(() => {
      result.current.setShowReportModal(true);
      result.current.setReportSeverity('HIGH');
      result.current.setReportDescription('água na calçada');
    });
    await act(() => result.current.handleReportFlood());
    expect(floodService.reportFlood).toHaveBeenCalledWith(expect.objectContaining({ floodPointSlug: 'p1', severity: 'HIGH', description: 'água na calçada', confirmedBy: 'ana' }));
    expect(notify).toHaveBeenCalledWith('success', expect.any(String));
    expect(result.current.showReportModal).toBe(false);
    expect(result.current.reportDescription).toBe('');
  });

  it('sem ponto selecionado não envia', async () => {
    const { result } = renderHook(() => useFloodReporting({ selectedFloodPoint: undefined, username: 'ana', notify: vi.fn() }));
    await act(() => result.current.handleReportFlood());
    expect(floodService.reportFlood).not.toHaveBeenCalled();
  });

  it('falha ao registrar avisa e mantém o modal', async () => {
    vi.mocked(floodService.reportFlood).mockRejectedValue(new Error('x'));
    const notify = vi.fn();
    const { result } = renderHook(() => useFloodReporting({ selectedFloodPoint: point, username: undefined, notify }));
    act(() => result.current.setShowReportModal(true));
    await act(() => result.current.handleReportFlood());
    expect(notify).toHaveBeenCalledWith('error', 'Erro ao registrar evento.');
    expect(result.current.showReportModal).toBe(true);
    expect(result.current.isSubmittingReport).toBe(false);
  });

  it('cenário: abre para a coordenada, envia e fecha', async () => {
    vi.mocked(floodService.reportScenario).mockResolvedValue({} as never);
    const notify = vi.fn();
    const { result } = renderHook(() => useFloodReporting({ selectedFloodPoint: undefined, username: 'a', notify }));
    act(() => result.current.askScenarioAt({ lat: -8, lng: -34.9 }));
    expect(result.current.showScenarioModal).toBe(true);
    await act(() => result.current.handleConfirmScenario(true));
    expect(floodService.reportScenario).toHaveBeenCalledWith({ latitude: -8, longitude: -34.9, isFlooded: true });
    expect(result.current.showScenarioModal).toBe(false);
    expect(result.current.scenarioCoords).toBeNull();
  });

  it('geolocalização negada vira aviso com a orientação de permissão', () => {
    const notify = vi.fn();
    const err = { code: 1, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, message: 'denied' };
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: (_ok: unknown, fail: (e: unknown) => void) => fail(err) } });
    const { result } = renderHook(() => useFloodReporting({ selectedFloodPoint: undefined, username: 'a', notify }));
    act(() => result.current.handleGetGeolocation());
    expect(notify).toHaveBeenCalledWith('error', expect.stringContaining('Permissão negada'));
    expect(result.current.isGettingLocation).toBe(false);
  });

  it('exportar CSV com falha avisa', async () => {
    vi.mocked(exportService.getUnifiedIADataCsv).mockRejectedValue(new Error('x'));
    const notify = vi.fn();
    const { result } = renderHook(() => useFloodReporting({ selectedFloodPoint: point, username: 'a', notify }));
    await act(() => result.current.handleExportCsv(point));
    expect(notify).toHaveBeenCalledWith('error', 'Erro ao exportar dados para CSV.');
  });
});
