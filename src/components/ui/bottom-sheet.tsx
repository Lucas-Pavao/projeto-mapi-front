import React, { useId } from 'react';
import { X } from 'lucide-react';
import { ModalDialog } from './modal-dialog';

interface BottomSheetProps {
  /** Texto visível que nomeia a folha (ex.: "Ponto crítico"). */
  title: string;
  /** Complemento só para leitores de tela (ex.: nome do ponto). */
  srTitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Folha inferior do celular: role=dialog com aria-labelledby, foco preso, Esc fecha, alça, botão
 * Fechar de 44 px, altura máxima de 70 vh com rolagem interna. Sem fundo escurecido: o mapa
 * continua visível acima dela (o MapView desloca o marcador para essa área).
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({ title, srTitle, onClose, children }) => {
  const titleId = useId();
  return (
    <ModalDialog
      label={title}
      labelledBy={titleId}
      onClose={onClose}
      className="fixed inset-x-0 bottom-0 z-[60] flex max-h-[70vh] flex-col overflow-hidden rounded-t-2xl border border-b-0 border-border bg-popover text-foreground shadow-elevation-overlay"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 pb-2 pl-4 pr-3 pt-1">
        <div aria-hidden="true" className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-border" />
        <h2 id={titleId} className="pt-4 text-overline text-muted-foreground">
          {title}
          {srTitle && <span className="sr-only">: {srTitle}</span>}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="mt-2 flex h-11 min-w-11 items-center justify-center gap-1 rounded-lg px-2 text-body-strong text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-5" aria-hidden="true" />
          Fechar
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
    </ModalDialog>
  );
};
