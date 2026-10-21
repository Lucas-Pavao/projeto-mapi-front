import axios from 'axios';

/**
 * Eventos de sessão. `refreshed`: o token foi renovado (o perfil pode ter mudado; refazer /api/auth/me).
 * `expired`: não há mais sessão (refresh falhou, ou 403 em /api/auth/me ou /api/auth/refresh).
 */
export type SessionEvent = 'refreshed' | 'expired';
type Listener = (e: SessionEvent) => void;

const listeners = new Set<Listener>();

export const sessionEvents = {
  on(l: Listener): () => void {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  emit(e: SessionEvent): void {
    listeners.forEach((l) => l(e));
  },
};

let inflight: Promise<void> | null = null;

/**
 * Renova a sessão com o refresh token do cookie httpOnly. Uma chamada por vez (as demais esperam a mesma).
 * Sucesso: emite `refreshed`. Qualquer falha: emite `expired` e rejeita (o app faz logout).
 * Usa o axios puro, sem os interceptores de `api`, para não entrar em laço.
 */
export function refreshSession(): Promise<void> {
  if (inflight) return inflight;
  inflight = axios
    .post('/api/auth/refresh', null, { withCredentials: true })
    .then(() => {
      sessionEvents.emit('refreshed');
    })
    .catch((e: unknown) => {
      sessionEvents.emit('expired');
      throw e;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** O 401 de token revogado: perfil mudou ou usuário desativado (contrato: {"code":"TOKEN_REVOKED"}). */
export function isTokenRevoked(error: unknown): boolean {
  if (!axios.isAxiosError(error) || error.response?.status !== 401) return false;
  return (error.response.data as { code?: unknown } | undefined)?.code === 'TOKEN_REVOKED';
}
