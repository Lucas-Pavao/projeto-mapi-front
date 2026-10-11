import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, renderHook, act } from '@testing-library/react';
import { NoticeRegion } from './ui/notice-region';
import { useNotices } from '@/hooks/useNotices';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('NoticeRegion', () => {
  it('região aria-live; sucesso é status, erro é alert; dispensável por botão nomeado', () => {
    const onDismiss = vi.fn();
    const { container } = render(
      <NoticeRegion
        notices={[
          { id: 1, kind: 'success', message: 'Salvo' },
          { id: 2, kind: 'error', message: 'Falhou' },
        ]}
        onDismiss={onDismiss}
      />,
    );
    expect(container.firstElementChild).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByRole('status')).toHaveTextContent('Salvo');
    expect(screen.getByRole('alert')).toHaveTextContent('Falhou');
    fireEvent.click(screen.getAllByRole('button', { name: 'Dispensar notificação' })[1]);
    expect(onDismiss).toHaveBeenCalledWith(2);
  });
});

describe('useNotices', () => {
  it('sucesso some sozinho; erro permanece até ser dispensado', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useNotices(1000));
    let errId = 0;
    act(() => {
      result.current.notify('success', 'ok');
      errId = result.current.notify('error', 'ruim');
    });
    expect(result.current.notices).toHaveLength(2);
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(result.current.notices.map((n) => n.kind)).toEqual(['error']);
    act(() => result.current.dismiss(errId));
    expect(result.current.notices).toHaveLength(0);
  });
});
