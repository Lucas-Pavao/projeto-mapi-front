import { useEffect } from 'react';

interface Options {
  /** Modais/cartões que tratam o próprio Esc: com qualquer um aberto, este hook não age. */
  blocked: boolean;
  openTool: string | null;
  closeTool: () => void;
  closePopups: () => void;
}

/**
 * Esc fecha, em ordem: painel de ferramentas > popups/painel de local.
 * Modais e popups tratam o próprio Esc; os modais interrompem a propagação.
 */
export function useMapEscape({ blocked, openTool, closeTool, closePopups }: Options) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || blocked) return;
      if (openTool) closeTool();
      else closePopups();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [blocked, openTool, closeTool, closePopups]);
}
