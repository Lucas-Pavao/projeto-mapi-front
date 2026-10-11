import { describe, it, expect, vi } from 'vitest';
import { makeOperable } from './a11y';

describe('makeOperable (marcador operável por teclado)', () => {
  it('vira botão focável com nome acessível e desfaz ao limpar', () => {
    const el = document.createElement('div');
    const off = makeOperable(el, 'Ponto crítico X: risco Alto');
    expect(el.getAttribute('role')).toBe('button');
    expect(el.tabIndex).toBe(0);
    expect(el.getAttribute('aria-label')).toBe('Ponto crítico X: risco Alto');
    off();
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.hasAttribute('tabindex')).toBe(false);
  });
  it('Enter e Espaço disparam click; outras teclas não', () => {
    const el = document.createElement('div');
    const onClick = vi.fn();
    el.addEventListener('click', onClick);
    makeOperable(el);
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
    el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', cancelable: true }));
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', cancelable: true }));
    expect(onClick).toHaveBeenCalledTimes(2);
  });
});
