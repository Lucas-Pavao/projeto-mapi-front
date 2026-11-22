import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axe from 'axe-core';
import { DetailModeProvider } from '@/lib/detailMode';
import { ALAGAMENTO_FIXTURES, type AlagamentoFixtureId } from '@/mocks/alagamento';
import { LOCATION_FIXTURES, STATION_CARD_FIXTURES, POINT_CARD_FIXTURES, pointRain } from '@/mocks/cards';
import { alagamentoPontoSchema } from '@/features/alagamento/schemas/alagamento.schema';
import { RegressaoCard } from '@/features/alagamento/components/RegressaoCard';
import { AnalysisPanel } from '@/features/map/cards/components/AnalysisPanel';
import { StationCard } from '@/features/map/cards/components/StationCard';
import { LocationCard } from '@/features/map/cards/components/LocationCard';

afterEach(cleanup);

const fx = (id: AlagamentoFixtureId) => alagamentoPontoSchema.parse(ALAGAMENTO_FIXTURES[id]);

/** axe no jsdom: contraste depende de CSS real (fica para o Playwright); o resto das regras vale. */
async function violations(el: HTMLElement) {
  const r = await axe.run(el, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } });
  return r.violations.map((v) => `${v.id}: ${v.nodes.length}`);
}

const CASES: Array<{ name: string; ui: React.ReactElement; leanHidden: string[] }> = [
  { name: 'card do ponto (atenção em 3 h)', ui: <RegressaoCard ponto={fx('atencao_3h')} pageTo="/pontos/x" onAnalysis={() => {}} />, leanHidden: ['regressao-detalhes'] },
  { name: 'card do ponto (sem dado)', ui: <RegressaoCard ponto={fx('sem_dado_sem_terreno')} />, leanHidden: ['regressao-detalhes'] },
  { name: 'painel de análise (Balde)', ui: <AnalysisPanel point={POINT_CARD_FIXTURES.high} rain={pointRain()} isAdmin alagamento={fx('alerta_1h')} tab="balde" onTab={() => {}} />, leanHidden: ['balde-legenda'] },
  { name: 'painel de análise (Origem)', ui: <AnalysisPanel point={POINT_CARD_FIXTURES.high} rain={pointRain()} isAdmin alagamento={fx('alerta_1h')} tab="prov" onTab={() => {}} />, leanHidden: ['analysis-limits'] },
  { name: 'card do pluviômetro (divergente)', ui: <StationCard card={STATION_CARD_FIXTURES.divergent} />, leanHidden: ['note', 'live', 'ped', 'bars-legend'] },
  { name: 'análise de local (chuva medida)', ui: <LocationCard analysis={LOCATION_FIXTURES.measured} />, leanHidden: ['candidates-title', 'location-attribution'] },
];

describe('5.11 item 11: modo enxuto e modo Detalhes, com axe sem violação', () => {
  it.each(CASES)('$name', async ({ ui, leanHidden }) => {
    for (const detail of [false, true]) {
      const { container } = render(<DetailModeProvider initial={detail}><MemoryRouter>{ui}</MemoryRouter></DetailModeProvider>);
      for (const id of leanHidden) {
        if (detail) expect(screen.getAllByTestId(id).length, `${id} em Detalhes`).toBeGreaterThan(0);
        else expect(screen.queryByTestId(id), `${id} no modo enxuto`).toBeNull();
      }
      // toda explicação escondida fica acessível no aria-label do ⓘ
      for (const tip of screen.queryAllByTestId('info-tip')) expect(tip.getAttribute('aria-label')?.length ?? 0).toBeGreaterThan(10);
      expect(await violations(container), detail ? 'Detalhes' : 'enxuto').toEqual([]);
      cleanup();
    }
  });
});
