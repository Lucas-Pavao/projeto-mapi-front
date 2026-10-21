import axios, { type InternalAxiosRequestConfig } from 'axios';
import { isTokenRevoked, refreshSession, sessionEvents } from './session';

// Sem baseURL absoluta: front e API são "same-origin" (nginx/vite proxeiam /api pro backend
// real — ver nginx.conf e vite.config.ts), então caminhos relativos como '/api/pontos' já
// resolvem certo sozinhos.
const api = axios.create({
  // Necessário pro navegador enviar/receber o cookie httpOnly de sessão em cada requisição.
  withCredentials: true,
});

// Telas que funcionam sem sessão: um 401 nelas não deve redirecionar.
const PUBLIC_PATHS = ['/login', '/minha-rua'];

type Retriable = InternalAxiosRequestConfig & { _retried?: boolean };

const isSessionCheck = (url: string | undefined) => !!url && (url.endsWith('/api/auth/me') || url.endsWith('/api/auth/refresh'));

/**
 * Respostas de erro (o cookie httpOnly não é legível pelo JS, então a sessão só se descobre pela API):
 * - 401 TOKEN_REVOKED (perfil mudou ou usuário desativado): tenta renovar a sessão uma vez e repete a
 *   requisição. Se a renovação falhar, o app faz logout (evento `expired`).
 * - 403 em /api/auth/me ou /api/auth/refresh = sessão expirada (a API usa 403, não 401, para anônimo).
 * - 403 nos demais endpoints = falta de permissão: não derruba a sessão.
 * - Outro 401 em tela privada: sessão inválida, vai para /login.
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as Retriable | undefined;
    if (isTokenRevoked(error) && config && !config._retried && !isSessionCheck(config.url)) {
      config._retried = true;
      try {
        await refreshSession();
      } catch {
        return Promise.reject(error); // refreshSession já emitiu `expired`
      }
      return api(config);
    }
    if (error.response?.status === 403 && isSessionCheck(config?.url)) {
      sessionEvents.emit('expired');
    } else if (error.response?.status === 401 && !isTokenRevoked(error) && !PUBLIC_PATHS.includes(window.location.pathname)) {
      console.warn('Sessão expirada ou inválida. Encerrando sessão local...');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
