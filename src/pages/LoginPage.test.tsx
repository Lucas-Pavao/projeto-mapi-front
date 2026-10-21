import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderPage } from '@/test/render';

const state = { authed: false, loading: false, login: vi.fn() };
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ isAuthenticated: state.authed, isLoading: state.loading, login: state.login, user: null }) }));
import { LoginPage } from './LoginPage';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
  Object.assign(state, { authed: false, loading: false });
  state.login.mockReset();
});
afterAll(() => server.close());

const open = (route = '/login') => renderPage(<LoginPage />, { route, path: '/login' });
const fill = (user = 'ana', pass = 'segredo123') => {
  fireEvent.change(screen.getByLabelText('Usuário'), { target: { value: user } });
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: pass } });
};

describe('LoginPage', () => {
  it('entra: POST /api/auth/login e avisa o contexto', async () => {
    let body: unknown = null;
    server.use(http.post('/api/auth/login', async ({ request }) => { body = await request.json(); return new HttpResponse(null, { status: 200 }); }));
    open();
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'ENTRAR' }));
    await waitFor(() => expect(state.login).toHaveBeenCalledWith({ username: 'ana' }));
    expect(body).toEqual({ username: 'ana', password: 'segredo123' });
  });

  it('credenciais erradas (403, como toda a API) viram mensagem clara', async () => {
    server.use(http.post('/api/auth/login', () => HttpResponse.json({ message: 'Bad credentials' }, { status: 403 })));
    open();
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'ENTRAR' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Usuário ou senha incorretos');
    expect(state.login).not.toHaveBeenCalled();
  });

  it('429 do limitador de login e queda de rede', async () => {
    server.use(http.post('/api/auth/login', () => HttpResponse.json({}, { status: 429 })));
    open();
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'ENTRAR' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Muitas tentativas');
    server.use(http.post('/api/auth/login', () => HttpResponse.error()));
    fireEvent.click(screen.getByRole('button', { name: 'ENTRAR' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Sem conexão'));
  });

  it('convite na URL abre o cadastro, manda inviteToken e tira o token da URL', async () => {
    let body: unknown = null;
    server.use(
      http.post('/api/auth/register', async ({ request }) => { body = await request.json(); return new HttpResponse(null, { status: 201 }); }),
      http.post('/api/auth/login', () => new HttpResponse(null, { status: 200 })),
    );
    open('/login?convite=tok-123');
    expect(await screen.findByText(/Você chegou por um convite/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'CRIAR CONTA' })).toBeInTheDocument();
    fill('bia', 'outrasenha1');
    fireEvent.change(screen.getByLabelText('E-mail (opcional)'), { target: { value: 'bia@exemplo.org' } });
    fireEvent.click(screen.getByRole('button', { name: 'CRIAR CONTA' }));
    await waitFor(() => expect(body).toEqual({ username: 'bia', password: 'outrasenha1', email: 'bia@exemplo.org', inviteToken: 'tok-123' }));
    await waitFor(() => expect(state.login).toHaveBeenCalledWith({ username: 'bia' }));
  });

  it('convite inválido (422) tem mensagem própria', async () => {
    server.use(http.post('/api/auth/register', () => HttpResponse.json({}, { status: 422 })));
    open('/login?convite=velho');
    fill();
    fireEvent.click(await screen.findByRole('button', { name: 'CRIAR CONTA' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Convite inválido, vencido ou já usado');
  });

  it('cadastro sem convite não manda inviteToken nem e-mail vazio', async () => {
    let body: unknown = null;
    server.use(http.post('/api/auth/register', async ({ request }) => { body = await request.json(); return new HttpResponse(null, { status: 201 }); }), http.post('/api/auth/login', () => new HttpResponse(null, { status: 200 })));
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Criar uma nova conta' }));
    expect(screen.queryByText(/Você chegou por um convite/)).toBeNull();
    fill('caio', 'senha-boa-1');
    fireEvent.click(screen.getByRole('button', { name: 'CRIAR CONTA' }));
    await waitFor(() => expect(body).toEqual({ username: 'caio', password: 'senha-boa-1' }));
  });

  it('já autenticado vai para o mapa', () => {
    state.authed = true;
    const { container } = open();
    expect(container.querySelector('form')).toBeNull();
  });
});
