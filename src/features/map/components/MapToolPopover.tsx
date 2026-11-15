import React, { useLayoutEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapToolPopoverProps {
  /** id do painel (aria-controls). */
  id: string;
  /** Nome acessível do botão (também vira o título do painel). */
  label: string;
  /** Texto extra só para leitores de tela (ex.: "ligado"). */
  stateLabel?: string;
  icon: React.ReactNode;
  /** Controlado pelo mapa (um painel aberto por vez). Sem estas props, o componente controla o próprio estado. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Destaca o botão (camada ligada). */
  active?: boolean;
  /** Ponto verde no canto do botão. */
  badge?: boolean;
  children: React.ReactNode;
  panelClassName?: string;
  /** Classes do contêiner (botão + painel). */
  className?: string;
  /** Espaço livre a manter abaixo do painel (px), p. ex. a folha de pontos do celular. Padrão: 16. */
  bottomReserve?: number;
}

/**
 * Botão de ícone da barra direita do mapa + painel que abre à esquerda dele. Mesmo visual do botão de camadas,
 * para camadas, terreno e legenda ficarem organizados do mesmo jeito.
 */
export const MapToolPopover: React.FC<MapToolPopoverProps> = ({
  id, label, stateLabel, icon, open, onOpenChange, active = false, badge = false, children, panelClassName, className, bottomReserve = 16,
}) => {
  const [ownOpen, setOwnOpen] = useState(false);
  const isOpen = open ?? ownOpen;
  const setOpen = (v: boolean) => (onOpenChange ? onOpenChange(v) : setOwnOpen(v));
  // O painel abre alinhado ao topo do botão: a altura vai até `bottomReserve` px do fim da tela, para não sair dela em telas baixas.
  const anchorRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<number>();
  useLayoutEffect(() => {
    if (!isOpen || !anchorRef.current) return;
    const fit = () => setMaxHeight(Math.max(160, window.innerHeight - anchorRef.current!.getBoundingClientRect().top - bottomReserve));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [isOpen, bottomReserve]);

  return (
    <div ref={anchorRef} className={cn('pointer-events-auto relative shrink-0', className)}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={id}
        aria-label={stateLabel ? `${label}, ${stateLabel}` : label}
        title={label}
        onClick={() => setOpen(!isOpen)}
        className={cn(
          'relative flex h-12 w-12 items-center justify-center rounded-2xl border bg-popover shadow-elevation-overlay transition-all hover:bg-secondary',
          isOpen || active ? 'border-primary/40 bg-secondary text-primary' : 'border-border text-muted-foreground',
        )}
      >
        {icon}
        {badge && <span aria-hidden="true" className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-success" />}
      </button>

      {isOpen && (
        <section
          id={id}
          aria-label={label}
          style={maxHeight ? { maxHeight: `min(60vh, ${maxHeight}px)` } : undefined}
          className={cn(
            'custom-scrollbar absolute right-14 top-0 z-30 flex max-h-[60vh] w-72 flex-col overflow-y-auto overscroll-contain rounded-2xl border border-border bg-popover shadow-elevation-overlay animate-in slide-in-from-right-2 duration-200',
            panelClassName,
          )}
        >
          <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border bg-popover px-3 py-2">
            <h2 className="m-0 flex items-center gap-2 text-2xs font-bold text-foreground">
              <span aria-hidden="true" className="[&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
              {label}
            </h2>
            <button
              type="button"
              aria-label={`Fechar ${label.toLowerCase()}`}
              onClick={() => setOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </header>
          {children}
        </section>
      )}
    </div>
  );
};
