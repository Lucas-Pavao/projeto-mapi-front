import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { POINT_CARD_FIXTURES as P, pointRain } from '@/mocks/cards';
import { ALAGAMENTO_FIXTURES, type AlagamentoFixtureId } from '@/mocks/alagamento';
import { alagamentoPontoSchema } from '@/features/alagamento/schemas/alagamento.schema';
import { DetailModeProvider } from '@/lib/detailMode';
import { AnalysisPanel } from './AnalysisPanel';
import { ANALYSIS_INFO, parseTab, type AnalysisTab } from '../utils/analysis';

afterEach(cleanup);

const fx = (id: AlagamentoFixtureId) => alagamentoPontoSchema.parse(ALAGAMENTO_FIXTURES[id]);

const Harness = ({ id, initial = 'why', onStation, isAdmin = true, detail = false }: { id?: AlagamentoFixtureId; initial?: AnalysisTab; onStation?: (s: string) => void; isAdmin?: boolean; detail?: boolean }) => {
  const [tab, setTab] = useState<AnalysisTab>(initial);
  return (
    <DetailModeProvider initial={detail}>
      <MemoryRouter>
        <AnalysisPanel point={P.high} rain={pointRain()} isAdmin={isAdmin} alagamento={id ? fx(id) : undefined} tab={tab} onTab={setTab} onClose={() => {}} onOpenStation={onStation} />
      </MemoryRouter>
    </DetailModeProvider>
  );
};

/** Sem palavra de risco nem probabilidade de alagamento; a redução da saída pela maré e a chance de entupida (fatores do
 * ADR 0030, com fonte) podem trazer %. */
const noRiskWords = () => {
  const body = document.body.cloneNode(true) as HTMLElement;
  body.querySelectorAll('[data-testid^="fator-"]').forEach((n) => n.remove());
  expect(body.textContent).not.toMatch(/risco baixo|seguro|logreg|%/i);
  expect(document.body.textContent).not.toMatch(/risco baixo|seguro|logreg/i);
};

describe('AnalysisPanel: Por quê · Balde · Origem', () => {
  it('abas na ordem; "inputs" antigo cai em Por quê', () => {
    render(<Harness id="atencao_3h" />);
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Por quê', 'Balde', 'Origem']);
    expect(parseTab('inputs')).toBe('why');
    expect(parseTab('balde')).toBe('balde');
  });

  it('Por quê: nível por prazo com validade, SHAP local em texto físico e contrafactual; títulos com ⓘ', () => {
    render(<Harness id="atencao_3h" />);
    expect(screen.getByTestId('horizonte-3')).toHaveTextContent(/7–19 cm · até/);
    expect(screen.getAllByTestId('analysis-shap')).toHaveLength(3);
    for (const s of screen.getAllByTestId('analysis-shap')) expect(s.textContent).toMatch(/mm/);
    expect(screen.getByTestId('analysis-cf')).toHaveTextContent(/15 cm/);
    expect(screen.getAllByTestId('info-tip').map((t) => t.getAttribute('aria-label'))).toEqual(expect.arrayContaining([ANALYSIS_INFO.level, ANALYSIS_INFO.shap, ANALYSIS_INFO.cf]));
    expect(screen.queryByText(ANALYSIS_INFO.level)).toBeNull(); // enxuto: a regra fica no ⓘ
    noRiskWords();
  });

  it('Por quê e Balde: maré e limpeza do alerta único (ADR 0030), com o papel de cada fator no nível', () => {
    render(<Harness id="alerta_mare_3h" />);
    const mare = screen.getByTestId('fator-mare');
    expect(mare).toHaveAttribute('data-status', 'OK');
    expect(within(mare).getByTestId('fator-papel')).toHaveTextContent('muda o nível');
    expect(mare).toHaveTextContent(/reduz a saída da galeria em 100% entre 15h00 e 18h00/);
    const limpeza = screen.getByTestId('fator-limpeza');
    expect(within(limpeza).getByTestId('fator-papel')).toHaveTextContent('só informa');
    expect(limpeza).toHaveTextContent(/não muda o nível/);
    expect(screen.queryByTestId('fator-mare-detalhe')).toBeNull();
    noRiskWords();
    fireEvent.click(screen.getByRole('tab', { name: 'Balde' }));
    expect(screen.getByTestId('balde-vazoes')).toHaveAttribute('aria-label', expect.stringMatching(/reduzida pela maré em \d+ passos/));
    expect(screen.getByTestId('fator-mare')).toBeInTheDocument();
    cleanup();
    render(<Harness id="alerta_mare_3h" detail />);
    expect(screen.getByTestId('fator-mare-detalhe')).toHaveTextContent(/soleira 1,46 m \(NR\).*viés do MDT \(-0,37 m\) o nível seria sem alerta/);
    expect(screen.getByTestId('fator-limpeza-detalhe')).toHaveTextContent(/chance de entupida 6\d%/);
  });

  it('maré ausente com o refluxo no nível: sem dado com o motivo escrito, nunca sem alerta', () => {
    render(<Harness id="sem_dado_mare_ausente" />);
    expect(screen.getByTestId('analysis-empty')).toHaveTextContent(/Sem dado: sem maré prevista para algum passo/);
  });

  it('Balde: gráfico de vazões e de lâmina com 15 cm e sensibilidade; legenda só em Detalhes', () => {
    render(<Harness id="alerta_1h" initial="balde" />);
    expect(screen.getByTestId('balde-vazoes')).toHaveAttribute('aria-label', expect.stringMatching(/capacidade da galeria/));
    expect(screen.getByTestId('balde-lamina')).toHaveAttribute('aria-label', expect.stringMatching(/a partir de 15 cm/));
    expect(screen.getByTestId('analysis-sens')).toHaveTextContent(/lâmina máxima entre/);
    expect(screen.queryByTestId('balde-legenda')).toBeNull();
    cleanup();
    render(<Harness id="alerta_1h" initial="balde" detail />);
    expect(screen.getByTestId('balde-legenda')).toBeInTheDocument();
  });

  it('Origem: rota, modelos, commit, validade, fontes, ausências, status e estações clicáveis; Limites só em Detalhes', () => {
    const onStation = vi.fn();
    render(<Harness id="atencao_3h" initial="prov" onStation={onStation} />);
    const dl = screen.getByTestId('provenance');
    for (const k of ['Rota', 'Modelos', 'Commit', 'Emissão', 'Validade', 'Estado inicial', 'Fontes', 'Ausências', 'Status']) expect(within(dl).getByText(k)).toBeInTheDocument();
    expect(dl).toHaveTextContent('rain rain_v1');
    expect(dl).toHaveTextContent('CEMADEN_PED');
    expect(screen.getByText('DADOS DA REDE OBSERVACIONAL DO CEMADEN/MCTIC')).toBeInTheDocument();
    expect(screen.queryByTestId('analysis-limits')).toBeNull();
    const used = screen.getAllByRole('button').find((b) => b.getAttribute('data-role') === 'USED')!;
    fireEvent.click(used);
    expect(onStation).toHaveBeenCalled();
    cleanup();
    render(<Harness id="atencao_3h" initial="prov" detail />);
    expect(screen.getByTestId('analysis-limits')).toHaveTextContent(/nenhum alerta/);
  });

  it.each(['sem_dado_chuva_ausente', 'sem_dado_previsao_fora', 'sem_dado_sem_terreno', 'sem_dado_terreno_em_revisao'] as const)(
    'SEM_DADO (%s): estado próprio em cada aba, sem gráfico, com o motivo; nunca "Sem alerta"', (id) => {
      for (const t of ['why', 'balde'] as const) {
        render(<Harness id={id} initial={t} />);
        expect(screen.getByTestId('analysis-empty')).toHaveTextContent(fx(id).reasonText!);
        expect(screen.queryByTestId('balde-vazoes')).toBeNull();
        expect(document.body.textContent).not.toMatch(/Sem alerta/);
        cleanup();
      }
    });

  it('visitante: "Alerta experimental" e estações; sem nível nem gráfico', () => {
    render(<Harness isAdmin={false} initial="balde" />);
    expect(screen.getByTestId('flood-chip')).toHaveTextContent('Alerta experimental');
    expect(screen.getByTestId('analysis-empty')).toHaveTextContent(/só o administrador vê/);
    cleanup();
    render(<Harness isAdmin={false} initial="prov" />);
    expect(screen.queryByTestId('provenance')).toBeNull();
    expect(screen.getByText(/Estações até 5 km/)).toBeInTheDocument();
  });
});
