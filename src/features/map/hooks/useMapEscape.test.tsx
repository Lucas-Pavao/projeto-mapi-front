import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { useMapEscape } from './useMapEscape';

type Props = Parameters<typeof useMapEscape>[0];
const base = (): Props => ({
  blocked: false,
  showMobileList: false,
  closeMobileList: vi.fn(),
  openTool: null,
  closeTool: vi.fn(),
  closePopups: vi.fn(),
});

describe('useMapEscape', () => {
  it('fecha na ordem: lista, ferramenta, popups', () => {
    const a = base();
    const first: Props = { ...a, showMobileList: true, openTool: 'layers' };
    const { rerender } = renderHook((p: Props) => useMapEscape(p), { initialProps: first });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(a.closeMobileList).toHaveBeenCalledTimes(1);
    expect(a.closeTool).not.toHaveBeenCalled();

    rerender({ ...a, showMobileList: false, openTool: 'layers' });
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
