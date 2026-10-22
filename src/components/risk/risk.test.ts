import { describe, it, expect } from 'vitest';
import { RISK_LEVELS } from '@/features/map/schemas/floodPointResponse.schema';
import { getRiskVisual, formatProbability, degradationText } from './risk';
import { formatRecife } from '@/features/map/utils/datetime';

describe('getRiskVisual', () => {
  it('cobre todos os níveis do enum, com rótulo e cor próprios', () => {
    const visuals = RISK_LEVELS.map((l) => getRiskVisual(l));
    expect(new Set(visuals.map((v) => v.hex)).size).toBe(RISK_LEVELS.length);
    expect(new Set(visuals.map((v) => v.label)).size).toBe(RISK_LEVELS.length);
  });

  it('UNKNOWN é neutro: cor distinta das de risco e sem porcentagem', () => {
    const unknown = getRiskVisual('UNKNOWN');
    for (const l of ['LOW', 'MEDIUM', 'HIGH'] as const) {
      expect(getRiskVisual(l).hex).not.toBe(unknown.hex);
      expect(getRiskVisual(l).showsProbability).toBe(true);
    }
    expect(unknown.showsProbability).toBe(false);
    expect(unknown.label).toBe('Previsão indisponível');
  });

  it('ausente ou valor inesperado em runtime cai no estado neutro', () => {
    expect(getRiskVisual(undefined)).toEqual(getRiskVisual('UNKNOWN'));
    expect(getRiskVisual('CRITICAL' as never)).toEqual(getRiskVisual('UNKNOWN'));
  });
});

describe('formatProbability', () => {
  it('formata risco conhecido', () => expect(formatProbability('MEDIUM', 0.42)).toBe('42%'));
  it('UNKNOWN nunca mostra porcentagem, mesmo com 0.0 do backend antigo', () => {
    expect(formatProbability('UNKNOWN', 0.0)).toBeNull();
    expect(formatProbability('UNKNOWN', 0.7)).toBeNull();
  });
  it('probabilidade null não renderiza', () => expect(formatProbability('LOW', null)).toBeNull());
});

describe('degradationText', () => {
  it('texto fixo por motivo e fallback', () => {
    expect(degradationText('AI_TIMEOUT')).toMatch(/demorou/);
    expect(degradationText(null)).toBe('motivo não informado');
    expect(degradationText(undefined)).toBe('motivo não informado');
  });
});

describe('formatRecife', () => {
  it('converte UTC para America/Recife (UTC-3)', () => {
    expect(formatRecife('2026-10-10T15:30:00Z')).toBe('10/10/2026 12:30');
  });
  it('ausente ou inválido → null', () => {
    expect(formatRecife(null)).toBeNull();
    expect(formatRecife('xx')).toBeNull();
  });
});
