import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { AlertaRegressao } from './AlertaRegressao';
import { RegressaoCard } from './RegressaoCard';
import { alagamentoPontoSchema, type AlagamentoPonto } from '../schemas/alagamento.schema';
import { ALAGAMENTO_FIXTURES, type AlagamentoFixtureId } from '@/mocks/alagamento';
import { INFO } from '../utils/alagamentoText';

afterEach(cleanup);

const fx = (id: AlagamentoFixtureId): AlagamentoPonto => alagamentoPontoSchema.parse(ALAGAMENTO_FIXTURES[id]);

/** Os 10 estados da prancha "Nível 6", com o selo e as faixas de lâmina esperadas. Dados ilustrativos. */
const ESTADOS: Array<{ id: AlagamentoFixtureId; chip: string; level: string; faixa1h?: string }> = [
  { id: 'sem_alerta_seco', chip: 'Sem alerta em 6 h', level: 'SEM_ALERTA', faixa1h: '0–0 cm' },
  { id: 'chuva_forte_sem_encher', chip: 'Sem alerta em 6 h', level: 'SEM_ALERTA', faixa1h: '0–0 cm' },
  { id: 'atencao_3h', chip: 'Atenção em 3 h', level: 'ATENCAO', faixa1h: '4–10 cm' },
  { id: 'alerta_1h', chip: 'Alerta em 1 h', level: 'ALERTA', faixa1h: '18–33 cm' },
  { id: 'alerta_agora', chip: 'Alerta em 1 h', level: 'ALERTA', faixa1h: '24–38 cm' },
  { id: 'atencao_6h', chip: 'Atenção em 6 h', level: 'ATENCAO', faixa1h: '0–0 cm' },
  { id: 'sem_dado_chuva_ausente', chip: 'Sem dado · chuva ausente', level: 'SEM_DADO' },
  { id: 'sem_dado_previsao_fora', chip: 'Sem dado · previsão fora', level: 'SEM_DADO' },
  { id: 'sem_dado_sem_terreno', chip: 'Sem dado · sem terreno', level: 'SEM_DADO' },
  { id: 'sem_dado_terreno_em_revisao', chip: 'Sem dado · terreno em revisão', level: 'SEM_DADO' },
];

describe('AlertaRegressao: 10 estados', () => {
  it.each(ESTADOS)('$id', (e) => {
    const p = fx(e.id);
    render(<AlertaRegressao ponto={p} />);
    const chip = screen.getByTestId('flood-chip');
    expect(chip).toHaveAttribute('data-level', e.level);
    expect(chip).toHaveTextContent(e.chip);
    const body = document.body.textContent ?? '';
    expect(body).not.toMatch(/risco baixo|seguro/i);
    if (e.level === 'SEM_DADO') {
      expect(body).not.toMatch(/Sem alerta/);
      expect(screen.getByText('sem previsão neste ciclo')).toBeInTheDocument();
      expect(screen.queryByTestId('horizonte-1')).toBeNull();
    } else {
      expect(within(screen.getByTestId('horizonte-1')).getByText(e.faixa1h!)).toBeInTheDocument();
      expect(screen.getByTestId('horizonte-3')).toBeInTheDocument();
      expect(screen.getByTestId('horizonte-6')).toBeInTheDocument();
    }
  });

  it('nenhum SEM_DADO vira "Sem alerta", nem no ⓘ', () => {
    for (const e of ESTADOS.filter((x) => x.level === 'SEM_DADO')) {
      const { unmount } = render(<AlertaRegressao ponto={fx(e.id)} />);
      const tip = within(screen.getByTestId('flood-chip')).getByTestId('info-tip');
      expect(tip.getAttribute('aria-label')).toMatch(/^Sem dado não é sem alerta/);
      expect(screen.getByTestId('flood-chip').textContent).not.toMatch(/Sem alerta/);
      unmount();
    }
  });

  it('lâmina agora e chuva agora com fonte; chuva ausente aparece como "sem dado"', () => {
    render(<AlertaRegressao ponto={fx('alerta_agora')} />);
    expect(screen.getByTestId('lamina-agora')).toHaveTextContent('21,3 cm');
    expect(screen.getByTestId('chuva-agora')).toHaveTextContent('180,0 mm/h');
    expect(screen.getByTestId('chuva-agora')).toHaveTextContent('Imbiribeira · 1,1 km');
    cleanup();
    render(<AlertaRegressao ponto={fx('sem_dado_chuva_ausente')} />);
    expect(within(screen.getByTestId('chuva-agora')).getByText('sem dado')).toHaveClass('text-warning');
  });

  it('modo enxuto: a explicação não aparece no corpo, só no aria-label do ⓘ; o balão abre no foco e fecha com Esc', () => {
    render(<AlertaRegressao ponto={fx('atencao_3h')} />);
    expect(screen.queryByText(INFO.forecast)).toBeNull();
    const tip = within(screen.getByTestId('previsao-lamina')).getByTestId('info-tip');
    expect(tip).toHaveAttribute('aria-label', INFO.forecast);
    fireEvent.focus(tip);
    expect(screen.getByRole('tooltip')).toHaveTextContent(INFO.forecast);
    fireEvent.keyDown(tip, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});

describe('RegressaoCard', () => {
  it('selo Experimental com ⓘ, nome, borda pelo nível e botões', () => {
    render(<RegressaoCard ponto={fx('atencao_3h')} place="Imbiribeira, Recife" pageHref="/pontos/MASCARENHAS_IMBIRIBEIRA" onAnalysis={() => {}} />);
    const card = screen.getByTestId('regressao-card');
    expect(card).toHaveClass('border-t-warning');
    expect(within(screen.getByTestId('selo-experimental')).getByTestId('info-tip').getAttribute('aria-label')).toMatch(/^Experimental/);
    expect(screen.getByRole('heading', { name: 'Av. Mascarenhas de Morais' })).toBeInTheDocument();
    expect(screen.getByText('Imbiribeira, Recife')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Análise completa' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Abrir a página do ponto' })).toHaveAttribute('href', '/pontos/MASCARENHAS_IMBIRIBEIRA');
  });

  it('SEM_DADO tem borda cinza tracejada', () => {
    render(<RegressaoCard ponto={fx('sem_dado_sem_terreno')} />);
    expect(screen.getByTestId('regressao-card')).toHaveClass('border-dashed');
  });
});
