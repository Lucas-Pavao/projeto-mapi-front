import { describe, expect, it } from 'vitest';
import type { AlertaPonto } from '../schemas/alerta.schema';
import { floodBand, floodMessage, rainMessage, rainTitle } from './alertaText';

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
