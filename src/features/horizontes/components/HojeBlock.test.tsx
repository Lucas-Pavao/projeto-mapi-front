import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { DetailModeProvider } from '@/lib/detailMode';
import { DayRiskLine, HojeBlock, InmetLine, NextHourLine } from './HojeBlock';
import { horizonsSchema, officialForecastSchema } from '../schemas/horizontes.schema';
import { forecastFixture, forecastSemDadoFixture, horizonsFixture } from '@/mocks/horizontes';
import { currentAndNext, recifeDateHour } from '../utils/turnos';
import { nextHourSummary } from './PanelHoje';

afterEach(cleanup);

const h = (opts: Parameters<typeof horizonsFixture>[1] = {}) => horizonsSchema.parse(horizonsFixture('MASCARENHAS_IMBIRIBEIRA', opts));

const block = (data: ReturnType<typeof h>, detail = false) => render(
  <DetailModeProvider initial={detail}>
    <HojeBlock
      official={<InmetLine forecast={data.official.forecast} warnings={data.official.warnings} nowMs={Date.now()} />}
      dayRisk={<DayRiskLine dayRisk={data.dayRisk} />}
      nextHour={<NextHourLine next={data.nextHour} />}
    />
  </DetailModeProvider>,
);

describe('Bloco "Hoje" (INMET, dia de risco, próxima hora)', () => {
  it('as três camadas juntas, nessa ordem, sem combinar', () => {
    block(h({ aviso: true }), true);
    const ids = [...screen.getByTestId('hoje').querySelectorAll('[data-testid^="hoje-"]')].map((e) => e.getAttribute('data-testid'));
    expect(ids.indexOf('hoje-inmet')).toBeLessThan(ids.indexOf('hoje-dia-de-risco-ausente'));
    expect(ids.indexOf('hoje-dia-de-risco-ausente')).toBeLessThan(ids.indexOf('hoje-mapi'));
    expect(screen.getByTestId('hoje-inmet')).toHaveTextContent('previsão oficial do INMET');
    expect(screen.getByTestId('hoje-inmet')).toHaveTextContent(/visto às \d{2}h\d{2}/);
    expect(screen.getByTestId('hoje-mapi-nivel')).toHaveTextContent('Atenção em 3 h');
  });

  it('aviso presente: cor e texto do INMET, nunca as cores de risco do MAPi', () => {
    block(h({ aviso: true }));
    const aviso = screen.getByTestId('hoje-inmet-aviso');
    expect(aviso).toHaveTextContent('Aviso: Perigo Potencial · Chuvas intensas');
    expect(screen.getByTestId('hoje-inmet').innerHTML).not.toMatch(/destructive|risk-high|text-warning/);
  });

  it('aviso ausente: a linha do INMET mostra só a previsão', () => {
    block(h());
    expect(screen.queryByTestId('hoje-inmet-aviso')).toBeNull();
    expect(screen.getByTestId('hoje-inmet')).toHaveTextContent(/Manhã|Tarde|Noite|Amanhã/);
  });

  it('previsão sem dado: diz o motivo, nunca "tempo bom" inventado', () => {
    block(h({ semPrevisao: true }));
    expect(screen.getByTestId('hoje-inmet-sem-dado')).toHaveTextContent('Previsão: sem dado');
    expect(screen.getByTestId('hoje-inmet-sem-dado')).toHaveTextContent('não quer dizer tempo bom');
  });

  it('dia de risco ausente por "não validado": some no modo enxuto e aparece com o motivo em Detalhes', () => {
    block(h());
    expect(screen.queryByTestId('hoje-dia-de-risco-ausente')).toBeNull();
    expect(document.body.textContent).not.toMatch(/Dia de risco/);
    cleanup();
    block(h(), true);
    expect(screen.getByTestId('hoje-dia-de-risco-ausente')).toHaveTextContent('Dia de risco: não validado');
  });

  it('próxima hora em teste não mostra nível; sem dado nunca vira "sem alerta"', () => {
    block(h({ inTest: true }));
    expect(screen.getByTestId('hoje-mapi-em-teste')).toBeInTheDocument();
    expect(screen.queryByTestId('hoje-mapi-nivel')).toBeNull();
    cleanup();
    block(h({ level: 'SEM_DADO' }));
    expect(screen.getByTestId('hoje-mapi-nivel')).toHaveAttribute('data-level', 'SEM_DADO');
    expect(document.body.textContent).not.toMatch(/Sem alerta|seguro|risco baixo/i);
  });

  it('axe sem violação nos dois modos', async () => {
    for (const detail of [false, true]) {
      const { container } = block(h({ aviso: true }), detail);
      const r = await axe.run(container, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } });
      expect(r.violations.map((v) => v.id)).toEqual([]);
      cleanup();
    }
  });
});

describe('turnos do INMET', () => {
  const f = officialForecastSchema.parse(forecastFixture());
  const at = (h: number) => {
    // instante de hoje em Recife na hora h (UTC-3)
    const { date } = recifeDateHour(Date.now());
    return Date.parse(`${date}T${String(h).padStart(2, '0')}:30:00-03:00`);
  };
  it('manhã → tarde; tarde → noite; noite → amanhã de manhã', () => {
    expect(currentAndNext(f, at(9)).current?.period).toBe('MANHA');
    expect(currentAndNext(f, at(9)).next?.period).toBe('TARDE');
    expect(currentAndNext(f, at(15)).current?.period).toBe('TARDE');
    const n = currentAndNext(f, at(20));
    expect(n.current?.period).toBe('NOITE');
    expect(n.next?.period).toBe('MANHA');
    expect(n.next?.today).toBe(false);
  });
  it('sem dias, sem turno (nunca inventa)', () => {
    expect(currentAndNext(officialForecastSchema.parse(forecastSemDadoFixture()), Date.now())).toEqual({ current: null, next: null });
  });
});

describe('resumo da próxima hora no painel', () => {
  it('conta alerta, atenção e sem dado; sem leitura não é "nenhum ponto em alerta"', () => {
    expect(nextHourSummary({ ALERTA: 2, ATENCAO: 1, SEM_ALERTA: 1, SEM_DADO: 1 })).toBe('2 em alerta · 1 em atenção · 1 sem dado');
    expect(nextHourSummary({ ALERTA: 0, ATENCAO: 0, SEM_ALERTA: 5, SEM_DADO: 0 })).toBe('nenhum ponto em alerta');
    expect(nextHourSummary(null)).toBe('sem leitura do alerta');
  });
});
