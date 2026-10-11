import { describe, it, expect } from 'vitest';
import { deriveApiStatus, lastValidText } from './apiStatus';

describe('deriveApiStatus', () => {
  it('erro tem prioridade, depois carregando, depois online', () => {
    expect(deriveApiStatus({ isLoading: true, hasError: true })).toBe('error');
    expect(deriveApiStatus({ isLoading: true, hasError: false })).toBe('loading');
    expect(deriveApiStatus({ isLoading: false, hasError: false })).toBe('online');
    expect(deriveApiStatus({ isLoading: false, hasError: true })).toBe('error');
  });
});

describe('lastValidText', () => {
  it('formata o último dado válido em America/Recife (UTC-3)', () => {
    expect(lastValidText('2026-10-10T15:30:00Z')).toBe('Último dado válido: 10/10/2026 12:30 (horário de Recife)');
  });
  it('virada de dia: 02:10Z do dia 11 ainda é dia 10 em Recife', () => {
    expect(lastValidText('2026-10-11T02:10:00Z')).toContain('10/10/2026 23:10');
  });
  it('sem dado ou inválido não mostra "Invalid Date"', () => {
    for (const v of [null, undefined, '', 'lixo']) {
      expect(lastValidText(v)).toBe('Nenhum dado válido recebido nesta sessão');
    }
  });
});
