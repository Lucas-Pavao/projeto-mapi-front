import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

const ThrowingComponent = () => {
  throw new Error('Falha de teste proposital');
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // React loga o erro no console mesmo quando capturado pelo boundary; silenciar aqui
    // evita ruído na saída do teste sem esconder uma falha real de asserção.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renderiza os filhos normalmente quando não há erro', () => {
    render(
      <ErrorBoundary>
        <div>conteúdo normal</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('conteúdo normal')).toBeInTheDocument();
  });

  it('mostra a UI de fallback em vez de tela branca quando um filho lança erro', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText(/ocorreu um erro inesperado/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /recarregar página/i })).toBeInTheDocument();
  });

  it('inclui o rótulo customizado na mensagem de fallback', () => {
    render(
      <ErrorBoundary label="o mapa">
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText(/ocorreu um erro inesperado em o mapa/i)).toBeInTheDocument();
  });
});
