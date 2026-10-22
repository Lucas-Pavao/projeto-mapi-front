import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { QueryState } from './query-state';

afterEach(cleanup);
const base = { data: undefined, isPending: false, isError: false, refetch: vi.fn() };

describe('QueryState', () => {
  it('carregando: status anunciável', () => {
    render(<QueryState query={{ ...base, isPending: true }} what="alertas">{() => null}</QueryState>);
    expect(screen.getByRole('status')).toHaveTextContent('Carregando alertas');
  });
  it('erro: alert com nova tentativa', () => {
    const refetch = vi.fn();
    render(<QueryState query={{ ...base, isError: true, refetch }} what="alertas">{() => null}</QueryState>);
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar alertas');
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(refetch).toHaveBeenCalled();
  });
  it('vazio: mostra título e dica', () => {
    render(<QueryState query={{ ...base, data: [] as number[] }} what="alertas" emptyTitle="Nada." emptyHint="Volte depois.">{() => null}</QueryState>);
    expect(screen.getByText('Nada.')).toBeInTheDocument();
    expect(screen.getByText('Volte depois.')).toBeInTheDocument();
  });
  it('com dados: renderiza o conteúdo', () => {
    render(<QueryState query={{ ...base, data: [1, 2] }} what="x">{(d) => <p>{d.length} itens</p>}</QueryState>);
    expect(screen.getByText('2 itens')).toBeInTheDocument();
  });
});
