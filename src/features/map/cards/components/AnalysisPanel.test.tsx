import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { POINT_CARD_FIXTURES as P, pointRain, pointSeries } from '@/mocks/cards';
import { AnalysisPanel } from './AnalysisPanel';
import { parseTab, type AnalysisTab } from '../utils/analysis';
import type { FloodPointResponseDTO } from '../../types';

afterEach(cleanup);
const now = Date.now();

const Harness = ({ point, initial = 'why', onStation }: { point: FloodPointResponseDTO; initial?: AnalysisTab; onStation?: (id: string) => void }) => {
  const [tab, setTab] = useState<AnalysisTab>(initial);
  return <MemoryRouter><AnalysisPanel point={point} series={pointSeries()} rain={pointRain()} now={now} tab={tab} onTab={setTab} onClose={() => {}} onOpenStation={onStation} /></MemoryRouter>;
};

describe('AnalysisPanel: 3 abas', () => {
  it('Por quê: aviso sintético, motivo com limiar, gráfico de 24 h e contribuições em p.p.', () => {
    render(<Harness point={P.high} />);
    expect(screen.getByRole('tab', { name: 'Por quê' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('synthetic-warning')).toBeInTheDocument();
    expect(screen.getByTestId('analysis-reason')).toHaveTextContent('Alto: probabilidade 31,0% ≥ limiar alto 24,4%');
    expect(screen.getByTestId('point-chart')).toHaveTextContent('alto ≥ 24,4%');
    expect(screen.getByTestId('analysis-contributor')).toHaveTextContent('Chuva acumulada em 3 horas 12,4 mm+21 p.p.');
  });
  it('Entradas: tiles com "—" quando falta leitura (nunca 0) e candidatas clicáveis abrem a estação', () => {
    const onStation = vi.fn();
    render(<Harness point={P.high} onStation={onStation} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Entradas' }));
    const tiles = screen.getAllByTestId('input-tile');
    expect(tiles.find((t) => t.textContent?.includes('Chuva 3 h'))).toHaveTextContent('12,4 mm');
    expect(tiles.find((t) => t.textContent?.includes('Chuva 6 h'))).toHaveTextContent('—sem leitura');
    fireEvent.click(document.querySelector('[data-role="LOWER"]') as HTMLElement);
    expect(onStation).toHaveBeenCalledWith('SINT-B');
    expect(document.querySelector('[data-role="EXCLUDED"]')).toHaveTextContent('reprovada no mês (zero travado)');
    expect(document.querySelector('[data-role="USED"]')).toHaveTextContent('3,2 mm/h'); // valor da hora, em mm/h
  });
  it('Entradas: feature imputada aparece declarada', () => {
    const pt = { ...P.high, floodPrediction: { ...P.high.floodPrediction, imputedFeatures: [{ featureId: 'tide_level', label: 'Nível da maré' }] } } as FloodPointResponseDTO;
    render(<Harness point={pt} initial="inputs" />);
    const tide = screen.getAllByTestId('input-tile').find((t) => t.textContent?.includes('Maré')) as HTMLElement;
    expect(tide).toHaveAttribute('data-imputed', 'true');
    expect(tide).toHaveTextContent('imputado');
  });
  it('Origem: campos da previsão, limites e rótulo sintético', () => {
    render(<Harness point={P.high} initial="prov" />);
    const prov = screen.getByTestId('provenance');
    expect(prov).toHaveTextContent('modelVersionxgb_v2');
    expect(prov).toHaveTextContent('moderado ≥ 1,6% · alto ≥ 24,4% (metadata)');
    expect(prov).toHaveTextContent('chuva medida (pluviômetro do Cemaden)');
    expect(screen.getByText(/Treino com rótulo sintético/)).toBeInTheDocument();
  });
  it('sem previsão: sem contribuições nem porcentagem, motivo explícito', () => {
    render(<Harness point={P.insufficient} />);
    expect(screen.getByText(/Sem previsão agora, então não há contribuições/)).toBeInTheDocument();
    expect(screen.getByTestId('analysis-reason')).toHaveTextContent('Sem dado suficiente');
    expect(within(screen.getByRole('dialog')).queryByTestId('synthetic-warning')).toBeNull();
    expect(document.querySelector('[data-risk="UNKNOWN"]')?.textContent).toBe('Previsão indisponível');
    fireEvent.click(screen.getByRole('tab', { name: 'Origem' }));
    expect(screen.getByTestId('provenance')).toHaveTextContent('contributorssem previsão agora');
    expect(screen.getByTestId('provenance').textContent).not.toMatch(/0 fator/);
  });
  it('parseTab: valor inválido da URL cai em "Por quê"', () => {
    expect(parseTab('inputs')).toBe('inputs');
    expect(parseTab('xyz')).toBe('why');
    expect(parseTab(null)).toBe('why');
  });
});
