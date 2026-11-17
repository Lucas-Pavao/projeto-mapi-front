import { describe, expect, it } from 'vitest';
import type { AlertaPonto } from '../schemas/alerta.schema';
import { alertChipOf, floodBand, floodMessage, markerRingOf, rainMessage, rainTitle } from './alertaText';

const base: AlertaPonto = {
  slug: 'IBURA', name: 'Ibura', rainAlert: 'NENHUM', pointFlood: 'NAO', shadow: true, rainTeMm: 0.4, hNowCm: 0,
  hProjQ50MaxCm: 3, hProjQ80MaxCm: 7,
};

describe('mensagens do alerta', () => {
  it('ATENCAO usa o texto combinado e não promete alagamento', () => {
    const m = rainMessage({ ...base, rainAlert: 'ATENCAO', rainTeMm: 3.2 }, 'Ibura');
    expect(m).toBe('Chuva forte provável nos próximos 20 a 60 min em Ibura. Chuva agora: 3,2 mm em 10 min.');
    expect(m).not.toMatch(/alag/i);
  });
  it('ALERTA fala da galeria', () => {
    expect(rainMessage({ ...base, rainAlert: 'ALERTA' }, 'Ibura')).toBe('Chuva acima do que a galeria escoa em Ibura.');
  });
  it('SEM_DADO mostra o motivo e nunca diz risco baixo', () => {
    const a = { ...base, rainAlert: 'SEM_DADO' as const, rainReasonText: 'leitura mais nova acima do limite de frescor' };
    expect(rainTitle(a)).toBe('Sem dado suficiente agora');
    expect(rainMessage(a, 'Ibura')).toContain('leitura mais nova');
    expect(rainMessage(a, 'Ibura')).not.toMatch(/baixo/i);
  });
  it('PROVAVEL agora e em até n min', () => {
    expect(floodMessage({ ...base, pointFlood: 'PROVAVEL', floodInMinutes: 0, hNowCm: 18 }, 'Ibura'))
      .toBe('Alagamento provável em Ibura: lâmina estimada de 18 cm agora.');
    expect(floodMessage({ ...base, pointFlood: 'PROVAVEL', floodInMinutes: 30, hProjQ50MaxCm: 16 }, 'Ibura'))
      .toBe('Alagamento provável em Ibura: lâmina estimada de 16 cm em até 30 min.');
  });
  it('point_flood SEM_DADO mostra o motivo do terreno', () => {
    expect(floodMessage({ ...base, pointFlood: 'SEM_DADO', floodReasonText: 'sem terreno do ponto' }, 'Jaboatão'))
      .toContain('sem terreno do ponto');
  });
  it('faixa com q50 e q80, não número único', () => {
    expect(floodBand(base)).toBe('Projeção em 60 min: 3 cm (chuva prevista mediana) a 7 cm (quantil de 80%).');
  });
});

describe('alertChipOf e markerRingOf', () => {
  const ap = (over: Partial<AlertaPonto>): AlertaPonto => ({ slug: 's', rainAlert: 'NENHUM', pointFlood: 'NAO', shadow: true, ...over });
  it.each([
    [{ rainAlert: 'NENHUM' }, 'Sem alerta de chuva', false],
    [{ rainAlert: 'ATENCAO' }, 'Atenção · chuva forte provável', false],
    [{ rainAlert: 'ALERTA' }, 'Alerta · chuva acima da galeria', false],
    [{ pointFlood: 'PROVAVEL' }, 'Alagamento provável', false],
    [{ rainAlert: 'ATENCAO', pointFlood: 'PROVAVEL' }, 'Alagamento provável', false],
    [{ rainAlert: 'ALERTA', pointFlood: 'PROVAVEL' }, 'Alerta + alagamento provável', false],
    [{ rainAlert: 'SEM_DADO' }, 'Alerta sem dado', true],
  ] as const)('ADMIN %j', (over, label, dashed) => {
    const c = alertChipOf(ap(over), true);
    expect(c.label).toBe(label);
    expect(c.dashed).toBe(dashed);
  });
  it('sem leitura (carregando, erro, não calculado) é "Alerta sem dado", nunca "sem alerta"', () => {
    expect(alertChipOf(null, true).label).toBe('Alerta sem dado');
    expect(alertChipOf(undefined, true).dashed).toBe(true);
  });
  it('não-ADMIN vê "Alerta em teste" tracejado, mesmo com alerta', () => {
    const c = alertChipOf(ap({ rainAlert: 'ALERTA' }), false);
    expect(c.label).toBe('Alerta em teste');
    expect(c.dashed).toBe(true);
  });
  it('anel do marcador: laranja, vermelho, cinza ou nenhum', () => {
    expect(markerRingOf(ap({ rainAlert: 'ATENCAO' }))).toBe('ATENCAO');
    expect(markerRingOf(ap({ rainAlert: 'ALERTA' }))).toBe('ALERTA');
    expect(markerRingOf(ap({ pointFlood: 'PROVAVEL' }))).toBe('ALERTA');
    expect(markerRingOf(ap({ rainAlert: 'SEM_DADO' }))).toBe('SEM_DADO');
    expect(markerRingOf(ap({}))).toBeNull();
    expect(markerRingOf(undefined)).toBeNull();
  });
});
