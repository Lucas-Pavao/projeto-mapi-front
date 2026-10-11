import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { ApiStatusIndicator } from './ApiStatusIndicator';
import { ApiErrorBanner, EmptyDataNotice } from './ApiStatusBanner';

afterEach(cleanup);

describe('ApiStatusIndicator', () => {
  it('online mostra "Online" com a hora do último dado em Recife, sem "Sistemas Online" fixo', () => {
    render(<ApiStatusIndicator status="online" lastSuccessAt="2026-10-10T15:30:00Z" />);
    expect(screen.getByRole('status')).toHaveAttribute('data-status', 'online');
    expect(screen.getByText(/Online · dados das 12:30/)).toBeInTheDocument();
    expect(screen.queryByText(/Sistemas Online/)).toBeNull();
  });
  it('erro mostra "Sem conexão" e a hora do último dado válido', () => {
    render(<ApiStatusIndicator status="error" lastSuccessAt="2026-10-10T15:30:00Z" />);
    expect(screen.getByRole('status')).toHaveAttribute('data-status', 'error');
    expect(screen.getByText(/Sem conexão · último dado 12:30/)).toBeInTheDocument();
  });
  it('erro sem nenhum dado anterior', () => {
    render(<ApiStatusIndicator status="error" lastSuccessAt={null} />);
    expect(screen.getByText('Sem conexão com a API')).toBeInTheDocument();
  });
  it('carregando', () => {
    render(<ApiStatusIndicator status="loading" lastSuccessAt={null} />);
    expect(screen.getByText('Conectando…')).toBeInTheDocument();
  });
});

describe('ApiErrorBanner / EmptyDataNotice', () => {
  it('alerta com horário do último dado válido e ação de tentar de novo', () => {
    const onRetry = vi.fn();
    render(<ApiErrorBanner lastSuccessAt="2026-10-10T15:30:00Z" isRetrying={false} onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Último dado válido: 10/10/2026 12:30 (horário de Recife)');
    fireEvent.click(screen.getByRole('button', { name: /Tentar de novo/ }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
  it('desabilita o botão enquanto tenta', () => {
    render(<ApiErrorBanner lastSuccessAt={null} isRetrying onRetry={() => {}} />);
    expect(screen.getByRole('button', { name: /Tentando/ })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('Nenhum dado válido recebido nesta sessão');
  });
  it('estado vazio explícito diz que vazio não é ausência de risco', () => {
    render(<EmptyDataNotice />);
    expect(screen.getByRole('status')).toHaveTextContent(/Nenhum ponto crítico ou sensor/);
    expect(screen.getByRole('status')).toHaveTextContent(/não por ausência de risco/);
  });
});
