import { describe, it, expect } from 'vitest';
import { inviteLink, inviteMessage } from './users';

describe('convite', () => {
  it('monta o link com o token escapado e sem barra dupla', () => {
    expect(inviteLink('https://mapi.exemplo/', 'a b/c')).toBe('https://mapi.exemplo/login?convite=a%20b%2Fc');
  });
  it('a mensagem leva perfil, validade e link', () => {
    const m = inviteMessage('https://x/login?convite=t', 'OPERADOR', '24/10/2026 16:00');
    expect(m).toContain('Operador');
    expect(m).toContain('24/10/2026 16:00');
    expect(m).toContain('https://x/login?convite=t');
  });
});
