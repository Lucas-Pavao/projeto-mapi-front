import { useEffect, useState } from 'react';

/** Valor com atraso: só muda depois de `ms` sem novas mudanças (evita uma consulta por tecla digitada). */
export function useDebounced<T>(value: T, ms = 400): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}
