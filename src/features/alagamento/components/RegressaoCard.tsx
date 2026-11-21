import React from 'react';
import { ExternalLink, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InfoTip } from '@/components/InfoTip';
import type { AlagamentoPonto } from '../schemas/alagamento.schema';
import { EDGE_CLASS, INFO, floodChipOf } from '../utils/alagamentoText';
import { AlertaRegressao, FloodChip } from './AlertaRegressao';

interface Props {
  ponto: AlagamentoPonto;
  /** Bairro e cidade, uma linha (vem do cadastro do ponto). */
  place?: string | null;
  onAnalysis?: () => void;
  pageHref?: string;
  onClose?: () => void;
}

/** Card do ponto crítico pelo alerta por regressão (componente `CardPonto` da prancha "Nível 6"). Borda de cima na cor do nível. */
export const RegressaoCard: React.FC<Props> = ({ ponto, place, onAnalysis, pageHref, onClose }) => {
  const chip = floodChipOf(ponto);
  return (
    <article data-testid="regressao-card" data-level={ponto.level}
      className={cn('w-full max-w-sm space-y-4 rounded-xl border border-t-4 border-border bg-card p-4 text-card-foreground shadow-lg', EDGE_CLASS[chip.tone])}>
      <header className="flex items-start gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <FloodChip ponto={ponto} />
          {ponto.experimental && (
            <span data-testid="selo-experimental" className="inline-flex min-h-6 items-center gap-1.5 rounded-md border border-warning/70 px-2 text-xs font-bold text-warning">
              Experimental<InfoTip text={INFO.experimental} side="bottom" align="end" />
            </span>
          )}
        </div>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Fechar" className="ml-auto rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </header>
      <div>
        <h2 className="text-xl font-bold leading-tight">{ponto.name ?? ponto.slug}</h2>
        {place && <p className="truncate text-sm text-muted-foreground">{place}</p>}
      </div>
      <AlertaRegressao ponto={ponto} showChip={false} />
      <div className="flex gap-3">
        <button type="button" onClick={onAnalysis}
          className="h-12 flex-1 rounded-lg bg-primary font-bold text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          Análise completa
        </button>
        {pageHref && (
          <a href={pageHref} aria-label="Abrir a página do ponto"
            className="inline-flex size-12 items-center justify-center rounded-lg border border-border hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring">
            <ExternalLink className="size-5" aria-hidden="true" />
          </a>
        )}
      </div>
    </article>
  );
};
