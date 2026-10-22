import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initTheme, setTheme, setAccent, readTheme, readAccent } from './theme';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-accent');
  document.documentElement.classList.remove('dark');
});

describe('tema', () => {
  it('padrão é dark/capibaribe', () => {
    initTheme();
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(document.documentElement).toHaveAttribute('data-accent', 'capibaribe');
    expect(document.documentElement).toHaveClass('dark');
  });
  it('persiste e aplica tema e destaque', () => {
    initTheme();
    setTheme('light');
    setAccent('areia');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(document.documentElement).not.toHaveClass('dark');
    expect(readTheme()).toBe('light');
    expect(readAccent()).toBe('areia');
  });
  it('valor inválido salvo cai no padrão', () => {
    localStorage.setItem('mapi.accent', 'neon');
    expect(readAccent()).toBe('capibaribe');
  });
  it('localStorage que lança não quebra', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    expect(() => {
      initTheme();
      setTheme('light');
    }).not.toThrow();
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    spy.mockRestore();
    get.mockRestore();
  });
});
