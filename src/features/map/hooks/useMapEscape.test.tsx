import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { useMapEscape } from './useMapEscape';

type Props = Parameters<typeof useMapEscape>[0];
const base = (): Props => ({
  blocked: false,
  openTool: null,
  closeTool: vi.fn(),
  closePopups: vi.fn(),
});

describe('useMapEscape', () => {
  it('fecha na ordem: ferramenta, popups', () => {
    const a = base();
    const { rerender } = renderHook((p: Props) => useMapEscape(p), { initialProps: { ...a, openTool: 'layers' } as Props });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(a.closeTool).toHaveBeenCalledTimes(1);
    expect(a.closePopups).not.toHaveBeenCalled();

    rerender({ ...a, openTool: null });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(a.closePopups).toHaveBeenCalledTimes(1);
  });

  it('não age quando um modal está aberto nem com outra tecla', () => {
    const a = { ...base(), blocked: true };
    renderHook(() => useMapEscape(a));
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(a.closePopups).not.toHaveBeenCalled();
  });

  it('remove o ouvinte ao desmontar', () => {
    const a = base();
    const { unmount } = renderHook(() => useMapEscape(a));
    unmount();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(a.closePopups).not.toHaveBeenCalled();
  });
});
