import { useCallback, useEffect, useRef, useState } from 'react';

export type NoticeKind = 'success' | 'error' | 'info';
export interface Notice {
  id: number;
  kind: NoticeKind;
  message: string;
}

/**
 * Notificações não bloqueantes (substituem `alert()`). Erros ficam até serem dispensados;
 * sucesso e informação somem sozinhos após `autoDismissMs`.
 */
export function useNotices(autoDismissMs = 6000) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const nextId = useRef(1);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    setNotices((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notify = useCallback(
    (kind: NoticeKind, message: string) => {
      const id = nextId.current++;
      setNotices((prev) => [...prev.slice(-3), { id, kind, message }]);
      if (kind !== 'error') timers.current.set(id, setTimeout(() => dismiss(id), autoDismissMs));
      return id;
    },
    [autoDismissMs, dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((t) => clearTimeout(t));
  }, []);

  return { notices, notify, dismiss };
}
