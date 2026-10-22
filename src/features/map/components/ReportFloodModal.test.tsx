import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { ReportFloodModal } from './ReportFloodModal';

afterEach(cleanup);
const target = { lat: -8.05, lng: -34.9, label: 'Sintético: ponto alto' };
const setup = (over: Partial<React.ComponentProps<typeof ReportFloodModal>> = {}) => {
  const onSubmit = vi.fn();
  const onClose = vi.fn();
  render(<ReportFloodModal target={target} submitting={false} onSubmit={onSubmit} onClose={onClose} {...over} />);
  return { onSubmit, onClose };
};

describe('ReportFloodModal', () => {
  it('diz que vai para a fila do operador e mostra o local', () => {
    setup();
    const dlg = screen.getByRole('dialog', { name: 'Reportar alagamento' });
    expect(dlg).toHaveTextContent('fila de um operador');
    expect(dlg).toHaveTextContent('Sintético: ponto alto');
    expect(dlg).toHaveTextContent('-8.05000, -34.90000');
  });

  it('envia profundidade e descrição aparada; vazio vira null', () => {
    const { onSubmit } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar relato' }));
    expect(onSubmit).toHaveBeenLastCalledWith({ waterDepth: null, description: null });
    fireEvent.change(screen.getByLabelText('Altura da água'), { target: { value: 'WAIST' } });
    fireEvent.change(screen.getByLabelText('O que você viu (opcional)'), { target: { value: '  rua cheia  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar relato' }));
    expect(onSubmit).toHaveBeenLastCalledWith({ waterDepth: 'WAIST', description: 'rua cheia' });
  });

  it('descrição acima de 1000 caracteres é recusada', () => {
    const { onSubmit } = setup();
    fireEvent.change(screen.getByLabelText('O que você viu (opcional)'), { target: { value: 'x'.repeat(1050) } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar relato' }));
    expect(screen.getByRole('alert')).toHaveTextContent('1000 caracteres');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('enviando: botões travados e Esc não fecha; erro aparece no diálogo', () => {
    const { onClose } = setup({ submitting: true, error: 'Sem permissão para enviar o relato.' });
    expect(screen.getByRole('button', { name: 'Enviando…' })).toBeDisabled();
    expect(within(screen.getByRole('dialog')).getByRole('alert')).toHaveTextContent('Sem permissão');
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('Cancelar e Esc fecham quando livre', () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
