import { describe, it, expect, vi } from 'vitest';
import { validateFloodPoint } from './floodPointResponse.schema';

describe('validateFloodPoint', () => {
  it('não loga erro quando o payload bate com o contrato esperado', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const validPoint = {
      id: 1,
      id_ponto: 'CIN_UFPE',
      nome: 'CIn UFPE',
      latitude: -8.05,
      longitude: -34.9,
      active: true,
    };

    const result = validateFloodPoint(validPoint);

    expect(errorSpy).not.toHaveBeenCalled();
    expect(result).toBe(validPoint);
    errorSpy.mockRestore();
  });

  it('loga um erro detalhado (mas não lança exceção) quando falta um campo essencial', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const brokenPoint = {
      id: 1,
      id_ponto: 'CIN_UFPE',
      // "nome" ausente de propósito
      latitude: -8.05,
      longitude: -34.9,
      active: true,
    };

    expect(() => validateFloodPoint(brokenPoint)).not.toThrow();
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });
});
