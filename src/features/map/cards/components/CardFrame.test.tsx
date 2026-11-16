import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { CardFrame } from './CardFrame';

afterEach(cleanup);

const Harness = ({ onClose }: { onClose?: () => void }) => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" data-card-trigger onClick={() => setOpen(true)}>chip</button>
      <p>fora</p>
      {open && <CardFrame onClose={() => { onClose?.(); setOpen(false); }}><button type="button">dentro</button></CardFrame>}
    </div>
  );
};

describe('CardFrame', () => {
  it('foco vai ao card ao abrir e volta ao chip ao fechar', () => {
    render(<Harness />);
    const chip = screen.getByRole('button', { name: 'chip' });
    chip.focus();
    fireEvent.click(chip);
    expect(document.activeElement).toHaveAttribute('data-card-root');
    fireEvent.pointerDown(screen.getByText('fora'));
    expect(screen.queryByRole('button', { name: 'dentro' })).toBeNull();
    expect(document.activeElement).toBe(chip);
  });
  it('clique dentro ou no gatilho não fecha; clique fora fecha', () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'chip' }));
    fireEvent.pointerDown(screen.getByRole('button', { name: 'dentro' }));
    fireEvent.pointerDown(screen.getByRole('button', { name: 'chip' }));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.pointerDown(screen.getByText('fora'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
