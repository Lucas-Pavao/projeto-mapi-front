import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('../utils/floodPointStatus', () => ({ loadFloodPointStatus: vi.fn() }));
import { loadFloodPointStatus } from '../utils/floodPointStatus';
import { useFloodPointStatus } from './useFloodPointStatus';

const load = vi.mocked(loadFloodPointStatus);
const point = { slug: 'p1', latitude: -8.05, longitude: -34.9 } as never;

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('useFloodPointStatus', () => {
  it('sem ponto selecionado não busca nada', () => {
    const o = { setStatus: vi.fn(), setIsFetching: vi.fn(), notify: vi.fn() };
    renderHook(() => useFloodPointStatus({ point: undefined, ...o }));
    expect(load).not.toHaveBeenCalled();
  });

  it('busca, entrega o status e liga/desliga o carregando', async () => {
    load.mockResolvedValue({ marker: 1 } as never);
    const o = { setStatus: vi.fn(), setIsFetching: vi.fn(), notify: vi.fn() };
    renderHook(() => useFloodPointStatus({ point, ...o }));
    await waitFor(() => expect(o.setStatus).toHaveBeenCalledWith({ marker: 1 }));
    expect(o.setIsFetching.mock.calls.map((c) => c[0])).toEqual([true, false]);
  });

  it('erro avisa o usuário e não entrega status', async () => {
    load.mockRejectedValue(new Error('x'));
    const o = { setStatus: vi.fn(), setIsFetching: vi.fn(), notify: vi.fn() };
    renderHook(() => useFloodPointStatus({ point, ...o }));
    await waitFor(() => expect(o.notify).toHaveBeenCalledWith('error', expect.stringContaining('status em tempo real')));
    expect(o.setStatus).not.toHaveBeenCalledWith(expect.objectContaining({ marker: 1 }));
  });

  it('ao desmontar limpa o status e ignora resposta atrasada', async () => {
    let resolve!: (v: unknown) => void;
    load.mockReturnValue(new Promise((r) => (resolve = r)) as never);
    const o = { setStatus: vi.fn(), setIsFetching: vi.fn(), notify: vi.fn() };
    const { unmount } = renderHook(() => useFloodPointStatus({ point, ...o }));
    unmount();
    expect(o.setStatus).toHaveBeenLastCalledWith(null);
    resolve({ late: true });
    await Promise.resolve();
    expect(o.setStatus).not.toHaveBeenCalledWith({ late: true });
  });
});
