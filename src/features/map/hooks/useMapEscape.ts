import { useEffect } from 'react';

interface Options {
  /** Modais/cartões que tratam o próprio Esc: com qualquer um aberto, este hook não age. */
  blocked: boolean;
  showMobileList: boolean;
  closeMobileList: () => void;
  openTool: string | null;
  closeTool: () => void;
  closePopups: () => void;
}

/**
 * Esc fecha, em ordem: lista (celular) > painel de ferramentas > popups/painel de local.
 * Modais e popups tratam o próprio Esc; os modais interrompem a propagação.
 */
export function useMapEscape({ blocked, showMobileList, closeMobileList, openTool, closeTool, closePopups }: Options) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || blocked) return;
      if (showMobileList) closeMobileList();
      else if (openTool) closeTool();
      else closePopups();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [blocked, showMobileList, closeMobileList, openTool, closeTool, closePopups]);
}
