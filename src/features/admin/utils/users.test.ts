import { describe, it, expect } from 'vitest';
import { initials, inviteLink, inviteMessage, lastAccessText } from './users';

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

describe('initials e lastAccessText', () => {
  it('iniciais do nome ou do e-mail', () => {
    expect(initials('Plantão Defesa Civil 1', null)).toBe('PD');
    expect(initials(null, 'ana.souza@example.org')).toBe('AS');
    expect(initials(null, null)).toBe('?');
    const now = Date.parse('2026-10-21T12:00:00Z');
    expect(lastAccessText('2026-10-21T12:00:00Z', now)).toBe('agora');
    expect(lastAccessText('2026-10-21T09:00:00Z', now)).toBe('há 3 h');
    expect(lastAccessText('2026-10-19T12:00:00Z', now)).toBe('há 2 dias');
    expect(lastAccessText(null, now)).toBe('nunca');
  });
});
