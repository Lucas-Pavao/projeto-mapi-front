import React, { useId } from 'react';
import { X } from 'lucide-react';
import { ModalDialog } from '@/components/ui/modal-dialog';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  description?: string;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
}

/** Diálogo de formulário: fundo escuro, cartão com título, foco preso e Esc (via ModalDialog). */
export const DialogPanel: React.FC<Props> = ({ title, description, onClose, className, children }) => {
  const titleId = useId();
  return (
    <ModalDialog label={title} labelledBy={titleId} onClose={onClose} className="mapi-enter-backdrop fixed inset-0 z-[90] flex items-end justify-center bg-black/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4">
      <div className={cn('mapi-enter-modal flex max-h-[92vh] w-full origin-center flex-col gap-4 overflow-y-auto rounded-t-2xl border border-border bg-card p-5 shadow-[var(--elevation-overlay),var(--surface-highlight)] sm:max-w-lg sm:rounded-2xl', className)}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id={titleId} className="text-title text-foreground">{title}</h2>
            {description && <p className="mt-1 text-caption text-muted-foreground">{description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="mapi-press -m-2 flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </ModalDialog>
  );
};
