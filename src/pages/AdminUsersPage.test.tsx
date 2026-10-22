import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { screen, cleanup, within, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderPage } from '@/test/render';
let meId: number | undefined = 1;
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { username: 'sintetico.admin', role: 'ADMIN', id: meId } }) }));
import { AdminUsersPage } from './AdminUsersPage';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
  vi.unstubAllGlobals();
  meId = 1;
});
afterAll(() => server.close());

describe('AdminUsersPage', () => {
  it('lista usuários; conta antiga sem e-mail nem nome é mostrada sem quebrar', async () => {
    renderPage(<AdminUsersPage />);
    const adm = (await screen.findByText('Sintético Admin')).closest('li')!;
    expect(within(adm).getByLabelText(/Perfil de Sintético Admin/)).toHaveValue('ADMIN');
    const velho = document.querySelector('[data-user-id="4"]') as HTMLElement;
    expect(velho).toHaveTextContent('Sem nome');
    expect(velho).toHaveTextContent('Sem e-mail');
    expect(velho).toHaveTextContent('nunca');
    expect(document.querySelector('[data-user-id="3"]')).toHaveAttribute('data-active', 'false');
  });

  it('trocar perfil manda PATCH {role}', async () => {
    let sent: { id: string; body: unknown } | null = null;
    server.use(http.patch<{ id: string }>('/api/admin/users/:id', async ({ params, request }) => { sent = { id: params.id, body: await request.json() }; return HttpResponse.json({ id: 2, role: 'ADMIN', active: true }); }));
    renderPage(<AdminUsersPage />);
    fireEvent.change(await screen.findByLabelText(/Perfil de Sintético Operador/), { target: { value: 'ADMIN' } });
    await waitFor(() => expect(sent).toEqual({ id: '2', body: { role: 'ADMIN' } }));
    expect(await screen.findByText(/Perfil alterado\. A mudança vale na próxima ação desse usuário\./)).toBeInTheDocument();
  });

  it('a própria conta (me.id) não tem perfil nem ativação editáveis; as outras têm', async () => {
    renderPage(<AdminUsersPage />);
    const eu = (await screen.findByText('Sintético Admin')).closest('li')!;
    expect(eu).toHaveAttribute('data-self', 'true');
    expect(within(eu).getByLabelText(/Perfil de Sintético Admin/)).toBeDisabled();
    expect(within(eu).getByRole('switch')).toBeDisabled();
    expect(within(eu).getByText(/você não pode mudar o próprio perfil/)).toBeInTheDocument();
    const outro = screen.getByText('Sintético Operador').closest('li')!;
    expect(within(outro).getByLabelText(/Perfil de Sintético Operador/)).toBeEnabled();
    expect(within(outro).getByRole('switch')).toBeEnabled();
  });

  it('desativar outro usuário avisa que vale na próxima ação dele', async () => {
    renderPage(<AdminUsersPage />);
    fireEvent.click(await screen.findByRole('switch', { name: 'Sintético Operador: conta ativa' }));
    expect(await screen.findByText(/Usuário desativado\. A mudança vale na próxima ação desse usuário\./)).toBeInTheDocument();
  });

  it('desativar manda {active:false}; 409 explica as regras', async () => {
    meId = 99; // outra pessoa: o admin da lista fica editável para exercitar o 409 do servidor
    let body: unknown = null;
    server.use(http.patch('/api/admin/users/:id', async ({ request }) => { body = await request.json(); return HttpResponse.json({}, { status: 409 }); }));
    renderPage(<AdminUsersPage />);
    fireEvent.click(await screen.findByRole('switch', { name: 'Sintético Admin: conta ativa' }));
    await waitFor(() => expect(body).toEqual({ active: false }));
    expect(await screen.findByText(/não pode mudar o próprio perfil.*ao menos um administrador ativo/)).toBeInTheDocument();
  });

  it('editar: só o que mudou; apagar o e-mail manda string vazia; e-mail inválido bloqueia', async () => {
    let body: unknown = null;
    server.use(http.patch('/api/admin/users/:id', async ({ request }) => { body = await request.json(); return HttpResponse.json({ id: 2, role: 'USER', active: true }); }));
    renderPage(<AdminUsersPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Editar Sintético Operador' }));
    const dlg = await screen.findByRole('dialog', { name: 'Editar usuário' });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Salvar' }));
    expect(await within(dlg).findByText('Nada mudou.')).toBeInTheDocument();
    fireEvent.change(within(dlg).getByLabelText('E-mail'), { target: { value: 'sem-arroba' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Salvar' }));
    expect(await within(dlg).findByText('E-mail inválido.')).toBeInTheDocument();
    expect(body).toBeNull();
    fireEvent.change(within(dlg).getByLabelText('E-mail'), { target: { value: '' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(body).toEqual({ email: '' }));
    expect(await screen.findByText('Usuário atualizado.')).toBeInTheDocument();
  });

  it('convite: gera, mostra o link com o token, validade e copia', async () => {
    let body: unknown = null;
    server.use(http.post('/api/admin/invites', async ({ request }) => { body = await request.json(); return HttpResponse.json({ token: 'tok123', role: 'OPERADOR', expiresAt: '2026-10-24T19:00:00Z' }, { status: 201 }); }));
    const writeText = vi.fn(async () => {});
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    renderPage(<AdminUsersPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Convidar' }));
    const dlg = await screen.findByRole('dialog', { name: 'Convidar pessoa' });
    fireEvent.change(within(dlg).getByLabelText('Perfil'), { target: { value: 'OPERADOR' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Gerar convite' }));
    const done = await screen.findByRole('dialog', { name: 'Convite criado' });
    expect(body).toEqual({ role: 'OPERADOR', email: null });
    const link = (within(done).getByLabelText('Link de cadastro') as HTMLInputElement).value;
    expect(link).toBe(`${window.location.origin}/login?convite=tok123`);
    expect(done).toHaveTextContent('24/10/2026 16:00'); // validade em America/Recife
    fireEvent.click(within(done).getByRole('button', { name: /Copiar link/ }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(link));
    expect(await within(done).findByText('Link copiado.')).toBeInTheDocument();
  });

  it('falha ao copiar orienta a copiar à mão; erro ao gerar mostra mensagem', async () => {
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText: vi.fn(async () => { throw new Error('negado'); }) } });
    renderPage(<AdminUsersPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Convidar' }));
    let dlg = await screen.findByRole('dialog');
    fireEvent.click(within(dlg).getByRole('button', { name: 'Gerar convite' }));
    dlg = await screen.findByRole('dialog', { name: 'Convite criado' });
    fireEvent.click(within(dlg).getByRole('button', { name: /Copiar link/ }));
    expect(await within(dlg).findByText(/selecione o link acima/)).toBeInTheDocument();
    fireEvent.click(within(dlg).getAllByRole('button', { name: 'Fechar' }).at(-1)!);
    server.use(http.post('/api/admin/invites', () => HttpResponse.json({}, { status: 403 })));
    fireEvent.click(screen.getByRole('button', { name: 'Convidar' }));
    dlg = await screen.findByRole('dialog');
    fireEvent.click(within(dlg).getByRole('button', { name: 'Gerar convite' }));
    expect(await within(dlg).findByText(/Sem permissão para gerar o convite/)).toBeInTheDocument();
  });

  it('vazio e erro', async () => {
    server.use(http.get('/api/admin/users', () => HttpResponse.json({ page: 0, size: 20, totalElements: 0, content: [] })));
    const { unmount } = renderPage(<AdminUsersPage />);
    expect(await screen.findByText('Nenhum usuário.')).toBeInTheDocument();
    unmount();
    server.use(http.get('/api/admin/users', () => HttpResponse.json({}, { status: 500 })));
    renderPage(<AdminUsersPage />);
    expect(await screen.findByText('Não foi possível carregar os usuários.', {}, { timeout: 3000 })).toBeInTheDocument();
  });
});
