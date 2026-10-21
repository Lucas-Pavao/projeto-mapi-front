import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AxiosError } from 'axios';

vi.mock('@/features/reports/services/reports.service', () => ({ reportsService: { create: vi.fn() } }));
vi.mock('../services/export.service', () => ({ exportService: { getUnifiedIADataCsv: vi.fn() } }));
vi.mock('../services/flood.service', () => ({ floodService: {} }));
import { reportsService } from '@/features/reports/services/reports.service';
import { exportService } from '../services/export.service';
import { useFloodReporting } from './useFloodReporting';

const create = vi.mocked(reportsService.create);
const point = { slug: 'p1', name: 'Ponto 1', latitude: -8.05, longitude: -34.9 } as never;

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => vi.unstubAllGlobals());

describe('useFloodReporting (POST /api/reports)', () => {
  it('ponto crítico: abre o relato no ponto e envia coordenadas, profundidade e descrição; fecha e avisa', async () => {
    create.mockResolvedValue({} as never);
    const notify = vi.fn();
    const { result } = renderHook(() => useFloodReporting({ notify }));
    act(() => result.current.openReportForPoint(point));
    expect(result.current.reportTarget).toEqual({ lat: -8.05, lng: -34.9, label: 'Ponto 1' });
    await act(() => result.current.submitReport({ waterDepth: 'KNEE', description: 'água na calçada' }));
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ latitude: -8.05, longitude: -34.9, waterDepth: 'KNEE', description: 'água na calçada' }));
    expect(Date.parse(create.mock.calls[0][0].observedAt)).toBeGreaterThan(Date.now() - 5000);
    expect(notify).toHaveBeenCalledWith('success', 'Relato enviado. Um operador vai conferir.');
    expect(result.current.reportTarget).toBeNull();
  });

  it('local tocado no mapa usa as coordenadas do toque', async () => {
    create.mockResolvedValue({} as never);
    const { result } = renderHook(() => useFloodReporting({ notify: vi.fn() }));
    act(() => result.current.openReportAt({ lat: -8.1, lng: -34.95 }));
    await act(() => result.current.submitReport({ waterDepth: null, description: null }));
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ latitude: -8.1, longitude: -34.95, waterDepth: null, description: null }));
  });

  it('sem alvo aberto não envia', async () => {
    const { result } = renderHook(() => useFloodReporting({ notify: vi.fn() }));
    await act(() => result.current.submitReport({ waterDepth: null, description: null }));
    expect(create).not.toHaveBeenCalled();
  });

  it('erro mantém o formulário aberto com mensagem (403 explica permissão/sessão)', async () => {
    create.mockRejectedValue(new AxiosError('x', undefined, undefined, undefined, { status: 403, data: {}, statusText: '', headers: {}, config: {} as never }));
    const notify = vi.fn();
    const { result } = renderHook(() => useFloodReporting({ notify }));
    act(() => result.current.openReportForPoint(point));
    await act(() => result.current.submitReport({ waterDepth: null, description: null }));
    expect(result.current.reportTarget).not.toBeNull();
    expect(result.current.reportError).toMatch(/Sem permissão para enviar o relato/);
    expect(notify).not.toHaveBeenCalled();
    expect(result.current.isSubmittingReport).toBe(false);
  });

  it('geolocalização do aparelho abre o relato na posição', () => {
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: (ok: (p: { coords: { latitude: number; longitude: number } }) => void) => ok({ coords: { latitude: -8.06, longitude: -34.88 } }) } });
    const { result } = renderHook(() => useFloodReporting({ notify: vi.fn() }));
    act(() => result.current.handleGetGeolocation());
    expect(result.current.reportTarget).toEqual({ lat: -8.06, lng: -34.88, label: 'Sua posição' });
    expect(result.current.isGettingLocation).toBe(false);
  });

  it('geolocalização negada vira aviso e não abre o relato', () => {
    const notify = vi.fn();
    const err = { code: 1, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, message: 'denied' };
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: (_ok: unknown, fail: (e: unknown) => void) => fail(err) } });
    const { result } = renderHook(() => useFloodReporting({ notify }));
    act(() => result.current.handleGetGeolocation());
    expect(notify).toHaveBeenCalledWith('error', expect.stringContaining('Permissão negada'));
    expect(result.current.reportTarget).toBeNull();
  });

  it('exportar CSV com falha avisa', async () => {
    vi.mocked(exportService.getUnifiedIADataCsv).mockRejectedValue(new Error('x'));
    const notify = vi.fn();
    const { result } = renderHook(() => useFloodReporting({ notify }));
    await act(() => result.current.handleExportCsv(point));
    expect(notify).toHaveBeenCalledWith('error', 'Erro ao exportar dados para CSV.');
  });

  it('a UI não chama mais /api/pontos/scenarios nem /api/eventos-alagamento', async () => {
    const { floodService } = await import('../services/flood.service');
    expect(floodService).not.toHaveProperty('reportScenario');
    expect(floodService).not.toHaveProperty('reportFlood');
  });
});
