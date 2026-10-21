import React from 'react';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import api from '@/lib/api';
import { AuthProvider, useAuth } from './useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { RequireRole } from '@/components/layout/RequireRole';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

const me = (role: string) => ({ id: 7, username: 'ana', email: 'ana@exemplo.org', name: 'Ana', role });

const Alertas: React.FC = () => (
  <div>
    <p>tela de alertas</p>
    <button type="button" onClick={() => void api.get('/api/alerts').catch(() => {})}>carregar</button>
  </div>
);
const Private: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, sessionExpired } = useAuth();
  if (isLoading) return <p>carregando sessão</p>;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace state={sessionExpired ? { expired: true } : undefined} />;
};
const Login: React.FC = () => <p>tela de login</p>;

const app = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Private><AppLayout /></Private>}>
            <Route path="/map" element={<p>tela do mapa</p>} />
            <Route element={<RequireRole min="OPERADOR" />}>
              <Route path="/alertas" element={<Alertas />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );

describe('sessão e perfil (TOKEN_REVOKED)', () => {
  it('perfil rebaixado: 401 TOKEN_REVOKED, refresh ok, /me novo e redireciona ao mapa com aviso', async () => {
    let role = 'OPERADOR';
    let alerts = 0;
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json(me(role))),
      http.get('/api/alerts', () => { alerts++; return HttpResponse.json({ code: 'TOKEN_REVOKED' }, { status: 401 }); }),
      http.post('/api/auth/refresh', () => { role = 'USER'; return new HttpResponse(null, { status: 200 }); }),
    );
    app('/alertas');
    expect(await screen.findByText('tela de alertas')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'carregar' }));
    expect(await screen.findByText('tela do mapa')).toBeInTheDocument();
    expect(await screen.findByText('Seu perfil mudou.')).toBeInTheDocument();
    expect(screen.queryByText('tela de alertas')).toBeNull();
    expect(alerts).toBeGreaterThanOrEqual(1);
  });

  it('perfil promovido: a tela atual continua e a Nav passa a mostrar os itens novos, sem aviso de redirecionamento', async () => {
    let role = 'USER';
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json(me(role))),
      http.get('/api/alerts', () => HttpResponse.json({ code: 'TOKEN_REVOKED' }, { status: 401 })),
      http.post('/api/auth/refresh', () => { role = 'ADMIN'; return new HttpResponse(null, { status: 200 }); }),
    );
    const Map: React.FC = () => (<div><p>tela do mapa</p><button type="button" onClick={() => void api.get('/api/alerts').catch(() => {})}>carregar</button></div>);
    render(
      <MemoryRouter initialEntries={['/map']}>
        <AuthProvider>
          <Routes><Route element={<Private><AppLayout /></Private>}><Route path="/map" element={<Map />} /></Route><Route path="/login" element={<Login />} /></Routes>
        </AuthProvider>
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'carregar' }));
    await waitFor(() => expect(screen.getAllByRole('link', { name: /Usuários e perfis/ }).length).toBeGreaterThan(0));
    expect(screen.getByText('tela do mapa')).toBeInTheDocument();
    expect(screen.queryByText('Seu perfil mudou.')).toBeNull();
  });

  it('refresh que falha faz logout e vai ao login', async () => {
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json(me('OPERADOR'))),
      http.get('/api/alerts', () => HttpResponse.json({ code: 'TOKEN_REVOKED' }, { status: 401 })),
      http.post('/api/auth/refresh', () => new HttpResponse(null, { status: 403 })),
    );
    app('/alertas');
    fireEvent.click(await screen.findByRole('button', { name: 'carregar' }));
    expect(await screen.findByText('tela de login')).toBeInTheDocument();
  });

  it('403 no /me depois de renovar (sessão perdida) também faz logout', async () => {
    let first = true;
    server.use(
      http.get('/api/auth/me', () => { if (first) { first = false; return HttpResponse.json(me('OPERADOR')); } return new HttpResponse(null, { status: 403 }); }),
      http.get('/api/alerts', () => HttpResponse.json({ code: 'TOKEN_REVOKED' }, { status: 401 })),
      http.post('/api/auth/refresh', () => new HttpResponse(null, { status: 200 })),
    );
    app('/alertas');
    fireEvent.click(await screen.findByRole('button', { name: 'carregar' }));
    expect(await screen.findByText('tela de login')).toBeInTheDocument();
  });

  it('visitante sem sessão: /me 403 só leva ao login, sem marcar sessão expirada', async () => {
    server.use(http.get('/api/auth/me', () => new HttpResponse(null, { status: 403 })));
    app('/map');
    expect(await screen.findByText('tela de login')).toBeInTheDocument();
  });
});
