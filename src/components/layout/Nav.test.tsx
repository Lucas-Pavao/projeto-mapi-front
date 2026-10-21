import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Nav } from './Nav';
import { initTheme } from '@/lib/theme';

let role: string | undefined = 'ADMIN';
const logout = vi.fn(async () => {});
vi.mock('./useNavStatus', () => ({ useNavStatus: () => ({ counts: { alerts: 19, reports: 3 }, apiDown: false }) }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { username: 'op', role }, logout }) }));

afterEach(() => {
  role = 'ADMIN';
  cleanup();
  localStorage.clear();
});

const renderNav = (path = '/alertas') =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <Nav />
      </MemoryRouter>
    </QueryClientProvider>,
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
  it('ADMIN vê tudo e o menu do avatar leva a Usuários e tem Sair', () => {
    renderNav();
    expect(screen.getByRole('link', { name: /Dados/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Conta e perfis/ }));
    expect(screen.getByRole('link', { name: /Usuários e perfis/ })).toHaveAttribute('href', '/admin/usuarios');
    fireEvent.click(within(document.getElementById('menu-conta')!).getByRole('button', { name: 'Sair' }));
    expect(logout).toHaveBeenCalled();
  });
  it('selos do protótipo: alertas abertos e relatos pendentes, só para OPERADOR em diante', () => {
    role = 'OPERADOR';
    renderNav();
    expect(screen.getByRole('link', { name: /Alertas/ })).toHaveTextContent('19 abertos');
    expect(screen.getByRole('link', { name: /Relatos/ })).toHaveTextContent('3 pendentes');
  });
  it('a barra tem os itens do protótipo na ordem, sem Sensores', () => {
    renderNav('/map');
    const bar = screen.getByRole('navigation', { name: 'Principal' });
    const nomes = within(bar).getAllByRole('link').map((l) => l.textContent?.replace(/\d+ (abertos|pendentes)/, '').trim()).filter(Boolean);
    expect(nomes).toEqual(['Mapa', 'Alertas', 'Evento', 'Simulador', 'Modelo', 'Maré', 'Dados', 'Pontos', 'Relatos', 'Relatório']);
  });
});

describe('Nav no celular: menu', () => {
  it('botão de menu abre a folha com todos os itens do perfil, Esc fecha e devolve o foco', () => {
    role = 'OPERADOR';
    renderNav('/map');
    const btn = screen.getByRole('button', { name: 'Abrir menu' });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    expect(btn.className).toMatch(/size-11/);
    btn.focus();
    fireEvent.click(btn);
    const dialog = screen.getByRole('dialog', { name: 'Menu principal' });
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    for (const n of ['Mapa', 'Alertas', 'Relatos']) expect(within(dialog).getByRole('link', { name: n })).toBeInTheDocument();
    expect(within(dialog).queryByRole('link', { name: 'Dados' })).toBeNull();
    for (const l of within(dialog).getAllByRole('link')) expect(l.className).toMatch(/h-12/);
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute('aria-expanded', 'false');
  });
  it('foco preso: Tab no último item volta ao primeiro', () => {
    role = 'USER';
    renderNav('/map');
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
    const dialog = screen.getByRole('dialog');
    const focusables = dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
    const first = focusables[0];
    const last = Array.from(focusables).filter((e) => e.tabIndex !== -1).pop()!;
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(document.activeElement).toBe(first);
  });
});

describe('Nav: menu Mais (641-1439 px)', () => {
  it('itens não prioritários ficam no Mais; aria-expanded, Esc fecha e devolve o foco', () => {
    role = 'ADMIN';
    renderNav('/map');
    const mais = screen.getByRole('button', { name: /Mais/ });
    expect(mais).toHaveAttribute('aria-expanded', 'false');
    expect(mais.className).toMatch(/h-11/);
    fireEvent.click(mais);
    expect(mais).toHaveAttribute('aria-expanded', 'true');
    const menu = document.getElementById('menu-mais')!;
    for (const n of ['Sensores', 'Simulador', 'Modelo', 'Maré', 'Dados', 'Pontos', 'Relatório']) expect(within(menu).getByRole('link', { name: n })).toBeInTheDocument();
    for (const n of ['Mapa', 'Alertas', 'Evento', 'Relatos']) expect(within(menu).queryByRole('link', { name: n })).toBeNull();
    fireEvent.keyDown(within(menu).getAllByRole('link')[0], { key: 'Escape' });
    expect(document.getElementById('menu-mais')).toBeNull();
    expect(mais).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(mais);
  });
  it('respeita o perfil: USER não vê Dados nem Pontos no Mais', () => {
    role = 'USER';
    renderNav('/map');
    fireEvent.click(screen.getByRole('button', { name: /Mais/ }));
    const menu = document.getElementById('menu-mais')!;
    expect(within(menu).queryByRole('link', { name: 'Dados' })).toBeNull();
    expect(within(menu).getByRole('link', { name: 'Maré' })).toBeInTheDocument();
  });
});

describe('Nav no celular: Sair no menu', () => {
  it('a folha tem Sair (alvo h-12) e chama logout', () => {
    renderNav('/map');
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
    const sair = within(screen.getByRole('dialog')).getByRole('button', { name: 'Sair' });
    expect(sair.className).toMatch(/h-12/);
    fireEvent.click(sair);
    expect(logout).toHaveBeenCalled();
  });
});
