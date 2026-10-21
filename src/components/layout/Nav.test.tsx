import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Nav } from './Nav';
import { initTheme } from '@/lib/theme';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { username: 'op', role: 'ADMIN' } }) }));

afterEach(() => {
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
    fireEvent.click(screen.getByRole('button', { name: /Trocar cor de destaque \(agora: Capibaribe\)/ }));
    expect(document.documentElement).toHaveAttribute('data-accent', 'atlantico');
  });
  it('alvos de toque >= 44 px no celular (h-11)', () => {
    renderNav();
    for (const el of [...screen.getAllByRole('link'), ...screen.getAllByRole('button')]) {
      expect(el.className).toMatch(/\b(h-11|size-11)\b/);
    }
  });
});
