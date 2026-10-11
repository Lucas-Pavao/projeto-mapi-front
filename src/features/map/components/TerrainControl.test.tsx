import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { TerrainControl } from './TerrainControl';

afterEach(cleanup);

function Harness({ initial = false }: { initial?: boolean }) {
  const [on, setOn] = useState(initial);
  return <TerrainControl enabled={on} onChange={setOn} />;
}

const abrir = () => fireEvent.click(screen.getByRole('button', { name: /^Terreno \(hipsometria\), (ligado|desligado)$/ }));

describe('TerrainControl', () => {
  it('é um botão da barra que começa fechado e diz se a camada está ligada', () => {
    render(<Harness />);
    const botao = screen.getByRole('button', { name: 'Terreno (hipsometria), desligado' });
    expect(botao).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });
  it('o painel tem o interruptor, desligado por padrão e sem legenda', () => {
    render(<Harness />);
    abrir();
    const sw = screen.getByRole('switch', { name: /Terreno \(hipsometria\)/ });
    expect(sw).toHaveAttribute('aria-checked', 'false');
    expect(screen.queryByTestId('terrain-legend')).not.toBeInTheDocument();
  });
  it('ligar mostra a legenda; desligar esconde', () => {
    render(<Harness />);
    abrir();
    const sw = screen.getByRole('switch');
    fireEvent.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('terrain-legend')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Terreno (hipsometria), ligado' })).toBeInTheDocument();
    fireEvent.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'false');
    expect(screen.queryByTestId('terrain-legend')).not.toBeInTheDocument();
  });
  it('legenda: unidade em metros, aviso de datum e escala de 0 a 20+ m', () => {
    render(<Harness initial />);
    abrir();
    expect(screen.getByText('Cota do terreno (m).')).toBeInTheDocument();
    expect(screen.getByText(/Datum não confirmado — cotas relativas/)).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', expect.stringContaining('metros'));
    expect(screen.getByText('20+')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });
  it('mostra carregando e erro sem derrubar o resto; com erro o painel abre sozinho', () => {
    const { rerender } = render(<TerrainControl enabled onChange={() => {}} status="loading" open onOpenChange={() => {}} />);
    expect(screen.getByText(/Carregando terreno/)).toBeInTheDocument();
    rerender(<TerrainControl enabled onChange={() => {}} status="error" open={false} onOpenChange={() => {}} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/Não foi possível carregar o terreno/);
    expect(screen.queryByTestId('terrain-legend')).not.toBeInTheDocument();
  });
  it('ADR 0009: nenhuma referência a maré na camada', () => {
    const { container } = render(<Harness initial />);
    abrir();
    expect(container.textContent).not.toMatch(/mar[ée]|nível do mar|abaixo d/i);
  });
});
