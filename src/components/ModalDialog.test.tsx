import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { ModalDialog } from './ui/modal-dialog';

afterEach(cleanup);

function setup(onClose = vi.fn()) {
  render(
    <>
      <button>abre</button>
      <ModalDialog label="Teste" onClose={onClose}>
        <button>primeiro</button>
        <button>ultimo</button>
      </ModalDialog>
    </>,
  );
  return onClose;
}

describe('ModalDialog', () => {
  it('expõe role=dialog, aria-modal e nome acessível', () => {
    setup();
    const d = screen.getByRole('dialog', { name: 'Teste' });
    expect(d).toHaveAttribute('aria-modal', 'true');
  });
  it('foca o primeiro controle ao abrir', () => {
    setup();
    expect(screen.getByText('primeiro')).toHaveFocus();
  });
  it('Esc chama onClose', () => {
    const onClose = setup();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it('Tab no último volta ao primeiro e Shift+Tab no primeiro vai ao último (foco preso)', () => {
    setup();
    const dialog = screen.getByRole('dialog');
    screen.getByText('ultimo').focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(screen.getByText('primeiro')).toHaveFocus();
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(screen.getByText('ultimo')).toHaveFocus();
  });
  it('devolve o foco a quem abriu ao desmontar', () => {
    const { rerender } = render(<button>gatilho</button>);
    screen.getByText('gatilho').focus();
    rerender(
      <>
        <button>gatilho</button>
        <ModalDialog label="X" onClose={() => {}}>
          <button>dentro</button>
        </ModalDialog>
      </>,
    );
    expect(screen.getByText('dentro')).toHaveFocus();
    rerender(<button>gatilho</button>);
    expect(screen.getByText('gatilho')).toHaveFocus();
  });
});
