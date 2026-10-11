import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { TerrainControl } from './TerrainControl';


afterEach(cleanup);

function Harness({ initial = false }: { initial?: boolean }) {
  const [on, setOn] = useState(initial);
  return <TerrainControl enabled={on} onChange={setOn} />;
}

describe('TerrainControl', () => {
  it('é um interruptor com nome acessível, desligado por padrão e sem legenda', () => {
    render(<Harness />);
    const sw = screen.getByRole('switch', { name: /Terreno \(hipsometria\)/ });
    expect(sw).toHaveAttribute('aria-checked', 'false');
    expect(screen.queryByTestId('terrain-legend')).not.toBeInTheDocument();
  });
  it('ligar mostra a legenda; desligar esconde', () => {
    render(<Harness />);
    const sw = screen.getByRole('switch');
    fireEvent.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('terrain-legend')).toBeInTheDocument();
    fireEvent.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'false');
    expect(screen.queryByTestId('terrain-legend')).not.toBeInTheDocument();
  });
  it('legenda: unidade em metros, aviso de datum e escala de 0 a 20+ m', () => {
    render(<Harness initial />);
    expect(screen.getByText('Cota do terreno (m).')).toBeInTheDocument();
    expect(screen.getByText(/Datum não confirmado — cotas relativas/)).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', expect.stringContaining('metros'));
    expect(screen.getByText('20+')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });
  it('mostra carregando e erro sem derrubar o resto', () => {
    const { rerender } = render(<TerrainControl enabled onChange={() => {}} status="loading" />);
    expect(screen.getByText(/Carregando terreno/)).toBeInTheDocument();
    rerender(<TerrainControl enabled onChange={() => {}} status="error" />);
    expect(screen.getByRole('alert')).toHaveTextContent(/Não foi possível carregar o terreno/);
    expect(screen.queryByTestId('terrain-legend')).not.toBeInTheDocument();
  });
  it('ADR 0009: nenhuma referência a maré na camada', () => {
    const { container } = render(<Harness initial />);
    expect(container.textContent).not.toMatch(/mar[ée]|nível do mar|abaixo d/i);
  });
  describe('celular (< 768 px)', () => {
    const mq = (matches: boolean) => vi.stubGlobal('matchMedia', (q: string) => ({ matches, media: q, addEventListener() {}, removeEventListener() {} }));
    afterEach(() => vi.unstubAllGlobals());
    it('começa recolhido num botão; abre sob demanda e recolhe de novo', () => {
      mq(false);
      render(<Harness />);
      expect(screen.queryByRole('switch')).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /Terreno \(hipsometria\).*Abrir controle/ }));
      expect(screen.getByRole('switch')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /Recolher controle de terreno/ }));
      expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    });
    it('recolhido e com erro: abre sozinho para mostrar o alerta', () => {
      mq(false);
      render(<TerrainControl enabled onChange={() => {}} status="error" />);
      expect(screen.getByRole('alert')).toHaveTextContent(/Não foi possível carregar o terreno/);
    });
  });
});
