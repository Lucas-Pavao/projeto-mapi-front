import { useSyncExternalStore } from 'react';
import { getThemeState, subscribeTheme } from './theme';

/** Lê um token CSS (ex.: "--primary") do :root. Vazio fora do navegador ou se o token não existe. */
export function readToken(name: string, root: HTMLElement | null = typeof document === 'undefined' ? null : document.documentElement): string {
  if (!root) return '';
  return getComputedStyle(root).getPropertyValue(name).trim();
}

/**
 * Cor de um token para uso onde `var()` não vale (paint do MapLibre). Recalcula quando o tema ou o
 * destaque mudam. `fallback` cobre ambientes sem CSS (testes).
 */
export function useTokenColor(name: string, fallback: string): string {
  // O snapshot é a identidade do estado de tema (muda a cada troca); o valor vem do CSS já aplicado.
  const state = useSyncExternalStore(subscribeTheme, getThemeState, getThemeState);
  void state;
  return readToken(name) || fallback;
}
