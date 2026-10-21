import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RequireRole } from './RequireRole';

let role: string | undefined = 'USER';
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { username: 'u', role } }) }));
afterEach(cleanup);

const renderAt = (min: 'OPERADOR' | 'ADMIN') =>
  render(
    <MemoryRouter initialEntries={['/x']}>
      <Routes>
        <Route element={<RequireRole min={min} />}>
          <Route path="/x" element={<p>conteúdo</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe('RequireRole', () => {
  it('bloqueia perfil insuficiente', () => {
    role = 'OPERADOR';
    renderAt('ADMIN');
    expect(screen.getByRole('alert')).toHaveTextContent('Seu perfil não acessa esta tela');
    expect(screen.queryByText('conteúdo')).toBeNull();
  });
  it('libera perfil igual ou acima (herança)', () => {
    role = 'ADMIN';
    renderAt('OPERADOR');
    expect(screen.getByText('conteúdo')).toBeInTheDocument();
  });
});
