import { setupWorker } from 'msw/browser';
import { http, HttpResponse } from 'msw';
import { handlers } from './handlers';

/**
 * Sessão sintética só no navegador de desenvolvimento: com VITE_MSW_ROLE=ADMIN|OPERADOR|USER o MSW responde
 * /api/auth/me com esse perfil, para abrir as telas sem a API real (comparação visual com as pranchas).
 * Sem a variável, nada muda: o login segue para a API.
 */
const role = import.meta.env.VITE_MSW_ROLE as string | undefined;
const session = role
  ? [http.get('/api/auth/me', () => HttpResponse.json({ id: 1, username: 'sintetico', email: 'sintetico@example.org', name: 'Sintético', role }))]
  : [];

export const worker = setupWorker(...session, ...handlers);
