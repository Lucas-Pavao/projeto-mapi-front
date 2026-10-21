import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Nav } from './Nav';
import { initTheme } from '@/lib/theme';

let role: string | undefined = 'ADMIN';
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { username: 'op', role } }) }));

afterEach(() => {
  role = 'ADMIN';
  cleanup();
  localStorage.clear();
});

const renderNav = (path = '/alertas') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Nav />
    </MemoryRouter>,
  );

describe('Nav', () => {
  it('marca a página atual e não menciona "simulação" como status', () => {
    const { container } = renderNav('/alertas');
    expect(screen.getByRole('link', { name: /Alertas/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /Mapa$/ })).not.toHaveAttribute('aria-current');
    expect(container.textContent).not.toMatch(/simulação/i);
  });
  it('alterna tema e destaque', () => {
    initTheme();
    renderNav();
    fireEvent.click(screen.getByRole('button', { name: 'Mudar para o tema claro' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    fireEvent.click(screen.getByRole('button', { name: /Capibaribe: trocar cor de destaque/ }));
    expect(document.documentElement).toHaveAttribute('data-accent', 'atlantico');
  });
  it('alvos de toque >= 44 px no celular (h-11)', () => {
    renderNav();
    for (const el of [...screen.getAllByRole('link'), ...screen.getAllByRole('button')]) {
      expect(el.className).toMatch(/\b(h-11|size-11)\b/);
    }
  });
  it('ADR 0010: USER não vê Alertas, Relatos nem telas de admin', () => {
    role = 'USER';
    renderNav();
    for (const n of ['Alertas', 'Relatos', 'Dados', 'Pontos']) expect(screen.queryByRole('link', { name: new RegExp(n) })).toBeNull();
    expect(screen.getByRole('link', { name: /Mapa/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Usuários e perfis/ })).toBeNull();
  });
  it('OPERADOR vê Alertas e Relatos, mas não admin', () => {
    role = 'OPERADOR';
    renderNav();
    expect(screen.getByRole('link', { name: /Alertas/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Relatos/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Dados/ })).toBeNull();
  });
  it('perfil ausente ou desconhecido é tratado como USER', () => {
    role = 'ROLE_X';
    renderNav();
    expect(screen.queryByRole('link', { name: /Alertas/ })).toBeNull();
  });
  it('ADMIN vê tudo e o avatar leva a Usuários', () => {
    renderNav();
    expect(screen.getByRole('link', { name: /Dados/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Usuários e perfis/ })).toHaveAttribute('href', '/admin/usuarios');
  });
});
