import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { BottomSheet } from './bottom-sheet';

afterEach(cleanup);

describe('BottomSheet', () => {
  it('dialog nomeado por aria-labelledby, com Fechar de 44 px e rolagem limitada a 70 vh', () => {
    const onClose = vi.fn();
    render(
      <BottomSheet title="Ponto crítico" srTitle="Canal do Arruda" onClose={onClose}>
        <button type="button">Ação</button>
      </BottomSheet>,
    );
    const dialog = screen.getByRole('dialog', { name: /Ponto crítico: Canal do Arruda/ });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog.getAttribute('aria-labelledby')).toBeTruthy();
    expect(dialog.className).toMatch(/max-h-\[70vh\]/);
    const fechar = screen.getByRole('button', { name: 'Fechar' });
    expect(fechar.className).toMatch(/h-11/);
    fireEvent.click(fechar);
    expect(onClose).toHaveBeenCalled();
  });
  it('Esc fecha e Tab cicla dentro da folha', () => {
    const onClose = vi.fn();
    render(
      <BottomSheet title="Sensor" onClose={onClose}>
        <button type="button">Última</button>
      </BottomSheet>,
    );
    const dialog = screen.getByRole('dialog');
    const ultima = screen.getByRole('button', { name: 'Última' });
    ultima.focus();
    fireEvent.keyDown(ultima, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Fechar' }));
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
