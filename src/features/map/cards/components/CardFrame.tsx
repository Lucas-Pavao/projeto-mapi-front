import React from 'react';
import { useCardFocus } from '../hooks/useCardFocus';

/**
 * Moldura de um card do mapa: leva o foco ao abrir, devolve ao fechar e fecha no clique fora.
 * Esc é tratado pelo gerenciador (fecha o card de cima), não aqui.
 */
export const CardFrame: React.FC<{ onClose: () => void; className?: string; children: React.ReactNode; outside?: boolean }> = ({ onClose, className, children, outside = true }) => {
  const ref = useCardFocus<HTMLDivElement>(outside ? onClose : undefined);
  return <div ref={ref} tabIndex={-1} data-card-root className={`outline-none ${className ?? ''}`}>{children}</div>;
};
