import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InfoTip } from '@/components/InfoTip';
import { OnlyInDetail } from '@/lib/detailMode';
import type { AlagamentoPonto } from '../schemas/alagamento.schema';
import { EDGE_CLASS, INFO, floodChipOf } from '../utils/alagamentoText';
import { AlertaRegressao, FloodChip } from './AlertaRegressao';
import { RegressaoDetalhes } from './RegressaoDetalhes';

/** Selo pequeno "Experimental" com ⓘ (um só por card). */
export const ExperimentalTag: React.FC<{ className?: string }> = ({ className }) => (
  <span data-testid="selo-experimental" className={cn('inline-flex h-6 items-center gap-1 rounded-md border border-warning px-2 text-[11px] font-bold text-warning', className)}>
    Experimental<InfoTip text={INFO.experimental} side="bottom" align="end" />
  </span>
);

interface Props {
  ponto: AlagamentoPonto;
  /** Nome do ponto (do cadastro); sem ele, o nome que veio do alerta. */
  name?: string | null;
  /** Bairro e cidade, uma linha. */
  place?: string | null;
  onAnalysis?: () => void;
  /** Rota da página do ponto (atalho). */
  pageTo?: string;
  onClose?: () => void;
  /** Bloco extra antes dos botões (ex.: "Hoje", com o INMET e a próxima hora). */
  extra?: React.ReactNode;
  className?: string;
}

/**
 * Card do ponto crítico pelo alerta por regressão (componentes `CardPonto` e `AlertaRegressao` da prancha "Nível 6").
 * Enxuto: selo, nome, lâmina e chuva agora, previsão de lâmina e botões. O bloco técnico só aparece em Detalhes.
 */
export const RegressaoCard: React.FC<Props> = ({ ponto, name, place, onAnalysis, pageTo, onClose, extra, className }) => {
  const chip = floodChipOf(ponto);
  return (
    <article data-testid="regressao-card" data-level={ponto.level} aria-label={`Alerta de alagamento: ${name ?? ponto.name ?? ponto.slug}`}
      className={cn('mapi-enter-modal flex w-full max-w-sm flex-col gap-3 rounded-[14px] border border-t-4 border-border bg-card p-3.5 text-card-foreground shadow-[var(--elevation-overlay),var(--surface-highlight)]', EDGE_CLASS[chip.tone], className)}>
      <header className="flex items-center gap-1.5">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <FloodChip ponto={ponto} />
          {ponto.experimental && <ExperimentalTag />}
        </div>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Fechar resumo do ponto" className="mapi-press ml-auto flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </header>
      <div>
        <h2 className="m-0 text-base leading-[22px] font-extrabold">{name ?? ponto.name ?? ponto.slug}</h2>
        {place && <p className="m-0 truncate text-xs leading-4 text-muted-foreground">{place}</p>}
      </div>
      <AlertaRegressao ponto={ponto} showChip={false} />
      <OnlyInDetail><RegressaoDetalhes ponto={ponto} /></OnlyInDetail>
      {extra}
      <div className="flex gap-2">
        <button type="button" onClick={onAnalysis}
          className="mapi-press h-10 flex-1 rounded-[10px] bg-primary text-[13px] font-bold text-primary-foreground shadow-elevation-raised hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          Análise completa
        </button>
        {pageTo && (
          <Link to={pageTo} aria-label="Abrir a página do ponto"
            className="mapi-press inline-flex size-10 items-center justify-center rounded-[10px] border border-border hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring">
            <ExternalLink className="size-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </article>
  );
};
