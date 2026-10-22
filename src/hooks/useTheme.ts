import { useCallback, useSyncExternalStore } from 'react';
import { ACCENTS, getThemeState, setAccent, setTheme, subscribeTheme } from '@/lib/theme';

export function useTheme() {
  const { theme, accent } = useSyncExternalStore(subscribeTheme, getThemeState, getThemeState);
  const toggleTheme = useCallback(() => setTheme(getThemeState().theme === 'dark' ? 'light' : 'dark'), []);
  const cycleAccent = useCallback(() => {
    const i = ACCENTS.indexOf(getThemeState().accent);
    setAccent(ACCENTS[(i + 1) % ACCENTS.length]);
  }, []);
  return { theme, accent, toggleTheme, cycleAccent };
}
