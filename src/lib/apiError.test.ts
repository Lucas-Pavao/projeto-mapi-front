import { describe, it, expect } from 'vitest';
import { AxiosError } from 'axios';
import { actionErrorMessage, httpStatus } from './apiError';

const err = (status: number) => new AxiosError('x', undefined, undefined, undefined, { status, data: {}, statusText: '', headers: {}, config: {} as never });

describe('actionErrorMessage', () => {
  it('lê o status do axios', () => {
    expect(httpStatus(err(409))).toBe(409);
    expect(httpStatus(new Error('x'))).toBeNull();
  });
  it('mensagem por status', () => {
    expect(actionErrorMessage(err(403), 'reconhecer o alerta')).toMatch(/Sem permissão.*sessão/);
    expect(actionErrorMessage(err(409), 'salvar')).toMatch(/Conflito/);
    expect(actionErrorMessage(err(422), 'simular')).toMatch(/inválidos/);
    expect(actionErrorMessage(err(429), 'consultar')).toMatch(/Muitas tentativas/);
    expect(actionErrorMessage(err(503), 'simular')).toMatch(/indisponível/);
  });
  it('sem resposta vira erro de conexão', () => {
    expect(actionErrorMessage(new Error('Network'), 'salvar')).toMatch(/Sem conexão/);
  });
});
