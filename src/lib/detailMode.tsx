import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * Chave global "Detalhes" (seção 5.11). Desligada (padrão): telas enxutas, explicação só no ⓘ. Ligada: aparecem, em
 * todas as telas, os blocos técnicos (fontes por número, versões, notas de método, listas, legendas longas, decomposição).
 * Fica salva no navegador; sem armazenamento (aba anônima, bloqueio), volta ao padrão sem quebrar.
 */
const KEY = 'mapi.detalhes';

interface DetailModeValue {
  detail: boolean;
  setDetail: (v: boolean) => void;
}

const Ctx = createContext<DetailModeValue>({ detail: false, setDetail: () => {} });

const read = (): boolean => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};

export const DetailModeProvider: React.FC<{ children: React.ReactNode; initial?: boolean }> = ({ children, initial }) => {
  const [detail, setState] = useState<boolean>(() => initial ?? read());
  const setDetail = useCallback((v: boolean) => {
    setState(v);
    try {
      localStorage.setItem(KEY, v ? '1' : '0');
    } catch {
      /* sem armazenamento: vale só nesta visita */
    }
  }, []);
  const value = useMemo(() => ({ detail, setDetail }), [detail, setDetail]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useDetailMode = () => useContext(Ctx);

/** Mostra o conteúdo só no modo Detalhes. Nada de duplicar componentes: o bloco técnico fica dentro deste wrapper. */
export const OnlyInDetail: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { detail } = useDetailMode();
  return detail ? <>{children}</> : null;
};

/** Mostra o conteúdo só no modo enxuto (ex.: uma linha curta que, em Detalhes, vira o parágrafo inteiro). */
export const OnlyInLean: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { detail } = useDetailMode();
  return detail ? null : <>{children}</>;
};

/** Switch "Detalhes" da barra de cima. */
export const DetailSwitch: React.FC<{ className?: string }> = ({ className }) => {
  const { detail, setDetail } = useDetailMode();
  return (
    <label className={`flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg px-2 text-[13px] font-semibold text-muted-foreground transition-colors duration-150 hover:text-foreground ${className ?? ''}`}>
      <span>Detalhes</span>
      <button
        type="button"
        role="switch"
        aria-checked={detail}
        aria-label="Detalhes: mostrar fontes, versões e notas de método em todas as telas"
        onClick={() => setDetail(!detail)}
        className={`relative h-5 w-9 cursor-pointer rounded-full border transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${detail ? 'border-primary bg-primary' : 'border-input bg-muted'}`}
      >
        <span aria-hidden="true" className={`absolute top-0.5 size-3.5 rounded-full bg-background transition-transform duration-150 ease-[var(--ease-out)] ${detail ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </label>
  );
};
