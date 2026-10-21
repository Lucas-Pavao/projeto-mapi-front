export type Theme = 'dark' | 'light';
export type Accent = 'capibaribe' | 'atlantico' | 'areia';

export const THEMES: readonly Theme[] = ['dark', 'light'];
export const ACCENTS: readonly Accent[] = ['capibaribe', 'atlantico', 'areia'];
export const ACCENT_LABEL: Record<Accent, string> = { capibaribe: 'Capibaribe', atlantico: 'Atlântico', areia: 'Areia' };

const THEME_KEY = 'mapi.theme';
const ACCENT_KEY = 'mapi.accent';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Navegação privada ou armazenamento bloqueado: a escolha vale só nesta sessão.
  }
}

export function readTheme(): Theme {
  const v = read(THEME_KEY);
  return v === 'light' ? 'light' : 'dark';
}

export function readAccent(): Accent {
  const v = read(ACCENT_KEY);
  return (ACCENTS as readonly string[]).includes(v ?? '') ? (v as Accent) : 'capibaribe';
}

/** Aplica na raiz: data-theme, classe .dark (componentes shadcn) e data-accent. */
export function applyTheme(theme: Theme, accent: Accent, root: HTMLElement = document.documentElement): void {
  root.setAttribute('data-theme', theme);
  root.setAttribute('data-accent', accent);
  root.classList.toggle('dark', theme === 'dark');
}

type Listener = () => void;
const listeners = new Set<Listener>();
let state: { theme: Theme; accent: Accent } = { theme: 'dark', accent: 'capibaribe' };

/** Lê a preferência salva e aplica. Chamar uma vez, antes do primeiro render. */
export function initTheme(): void {
  state = { theme: readTheme(), accent: readAccent() };
  applyTheme(state.theme, state.accent);
}

export function subscribeTheme(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function getThemeState(): { theme: Theme; accent: Accent } {
  return state;
}

export function setTheme(theme: Theme): void {
  state = { ...state, theme };
  write(THEME_KEY, theme);
  applyTheme(state.theme, state.accent);
  listeners.forEach((l) => l());
}

export function setAccent(accent: Accent): void {
  state = { ...state, accent };
  write(ACCENT_KEY, accent);
  applyTheme(state.theme, state.accent);
  listeners.forEach((l) => l());
}
