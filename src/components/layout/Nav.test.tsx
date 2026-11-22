import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Nav } from './Nav';
import { initTheme } from '@/lib/theme';
import { DetailModeProvider } from '@/lib/detailMode';

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
      <DetailModeProvider>
        <MemoryRouter initialEntries={[path]}>
          <Nav />
        </MemoryRouter>
      </DetailModeProvider>
    </QueryClientProvider>,
  );


/** Abre o grupo da barra e devolve o menu. */
const openGroup = (name: string) => {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${name}`) }));
  return screen.getByRole('menu', { name });
};

describe('Nav', () => {
  it('marca o grupo da tela atual e a página dentro dele; não menciona "simulação" como status', () => {
    const { container } = renderNav('/alertas');
    const op = screen.getByRole('button', { name: /^Operação/ });
    expect(op).toHaveAttribute('data-current', 'true');
    expect(screen.getByRole('button', { name: /^Análise/ })).not.toHaveAttribute('data-current');
    expect(within(openGroup('Operação')).getByRole('menuitem', { name: /Alertas/ })).toHaveAttribute('aria-current', 'page');
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
  it('OPERADOR vê Alertas e Relatos, mas não o grupo Gestão', () => {
    role = 'OPERADOR';
    renderNav();
    const op = openGroup('Operação');
    expect(within(op).getByRole('menuitem', { name: /Alertas/ })).toBeInTheDocument();
    expect(within(op).getByRole('menuitem', { name: /Relatos/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Gestão/ })).toBeNull();
  });
  it('perfil ausente ou desconhecido é tratado como USER', () => {
    role = 'ROLE_X';
    renderNav();
    expect(screen.queryByRole('link', { name: /Alertas/ })).toBeNull();
  });
  it('ADMIN vê tudo e o menu do avatar leva a Usuários e tem Sair', () => {
    renderNav();
    const g = openGroup('Gestão');
    for (const n of ['Dados', 'Pontos', 'Usuários']) expect(within(g).getByRole('menuitem', { name: n })).toBeInTheDocument();
    fireEvent.keyDown(g, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: /Conta e perfis/ }));
    expect(screen.getByRole('link', { name: /Usuários e perfis/ })).toHaveAttribute('href', '/admin/usuarios');
    fireEvent.click(within(document.getElementById('menu-conta')!).getByRole('button', { name: 'Sair' }));
    expect(logout).toHaveBeenCalled();
  });
  it('o contador de alertas vai no grupo Operação; dentro do menu, alertas abertos e relatos pendentes', () => {
    role = 'OPERADOR';
    renderNav();
    expect(screen.getByRole('button', { name: /^Operação/ })).toHaveTextContent('19 alertas abertos');
    const op = openGroup('Operação');
    expect(within(op).getByRole('menuitem', { name: /Alertas/ })).toHaveTextContent('19 abertos');
    expect(within(op).getByRole('menuitem', { name: /Relatos/ })).toHaveTextContent('3 pendentes');
  });
  it('a barra tem 4 grupos na ordem: Mapa · Análise · Operação · Gestão; cada grupo com os itens da seção 5.11', () => {
    renderNav('/map');
    const bar = screen.getByRole('navigation', { name: 'Principal' });
    expect(within(bar).getAllByRole('link').map((l) => l.textContent?.trim()).filter((t) => t === 'Mapa')).toEqual(['Mapa']);
    const grupos = within(bar).getAllByRole('button').filter((b) => b.getAttribute('aria-haspopup') === 'menu').map((b) => b.textContent?.replace(/\d+ alertas abertos/, '').trim());
    expect(grupos).toEqual(['Análise', 'Operação', 'Gestão']);
    const nomes = (g: string) => within(openGroup(g)).getAllByRole('menuitem').map((l) => l.textContent?.replace(/\d+ (abertos|pendentes)/, '').trim());
    expect(nomes('Análise')).toEqual(['Evento', 'Chuva', 'Maré', 'Modelo', 'Simulador', 'Sensores']);
    expect(nomes('Operação')).toEqual(['Alertas', 'Relatos', 'Relatório']);
    expect(nomes('Gestão')).toEqual(['Dados', 'Pontos', 'Usuários']);
  });
  it('chave Detalhes: desligada por padrão, liga e fica salva', () => {
    renderNav('/map');
    const sw = screen.getByRole('switch', { name: /Detalhes/ });
    expect(sw).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'true');
    expect(localStorage.getItem('mapi.detalhes')).toBe('1');
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

describe('Nav: menus dos grupos com teclado', () => {
  it('seta para baixo abre e foca o 1º item; setas andam; Esc fecha e devolve o foco', () => {
    role = 'ADMIN';
    renderNav('/map');
    const btn = screen.getByRole('button', { name: /^Análise/ });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    expect(btn.className).toMatch(/h-11/);
    fireEvent.keyDown(btn, { key: 'ArrowDown' });
    const menu = screen.getByRole('menu', { name: 'Análise' });
    const itens = within(menu).getAllByRole('menuitem');
    expect(document.activeElement).toBe(itens[0]);
    fireEvent.keyDown(itens[0], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(itens[1]);
    fireEvent.keyDown(itens[1], { key: 'ArrowUp' });
    expect(document.activeElement).toBe(itens[0]);
    fireEvent.keyDown(itens[0], { key: 'End' });
    expect(document.activeElement).toBe(itens[itens.length - 1]);
    fireEvent.keyDown(itens[0], { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(btn);
  });
  it('respeita o perfil: USER não vê Gestão; em Operação, só Relatório', () => {
    role = 'USER';
    renderNav('/map');
    expect(screen.queryByRole('button', { name: /^Gestão/ })).toBeNull();
    expect(within(openGroup('Análise')).getByRole('menuitem', { name: 'Maré' })).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
    expect(within(openGroup('Operação')).getAllByRole('menuitem').map((i) => i.textContent)).toEqual(['Relatório']);
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
