import { describe, it, expect } from 'vitest';
import { AxiosError } from 'axios';
import { authErrorMessage } from './authErrors';

const http = (status: number, data: unknown = {}) => new AxiosError('x', undefined, undefined, undefined, { status, data, statusText: '', headers: {}, config: {} as never });
const net = () => new AxiosError('Network Error');

describe('authErrorMessage', () => {
  it('login: 401/403/400 viram credenciais incorretas, sem vazar a mensagem do servidor', () => {
    for (const s of [400, 401, 403]) expect(authErrorMessage(http(s, { message: 'Bad credentials: usuário x' }), 'login')).toBe('Usuário ou senha incorretos, ou conta desativada.');
  });
  it('429 e sem resposta', () => {
    expect(authErrorMessage(http(429), 'login')).toMatch(/Muitas tentativas/);
    expect(authErrorMessage(net(), 'register')).toMatch(/Sem conexão/);
  });
  it('cadastro: 409 e convite inválido', () => {
    expect(authErrorMessage(http(409), 'register')).toMatch(/já está em uso/);
    expect(authErrorMessage(http(422), 'register', true)).toMatch(/Convite inválido/);
    expect(authErrorMessage(http(422, { message: 'Senha fraca' }), 'register', false)).toBe('Senha fraca');
  });
  it('erro desconhecido usa o texto padrão do modo', () => {
    expect(authErrorMessage('x', 'login')).toBe('Falha ao entrar. Tente de novo.');
    expect(authErrorMessage(undefined, 'register')).toMatch(/criar a conta/);
  });
});
