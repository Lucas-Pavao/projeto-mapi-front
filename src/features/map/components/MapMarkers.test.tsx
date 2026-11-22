import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

// Marcadores do MapLibre dependem do contexto do mapa (WebGL): aqui viram botões simples.
vi.mock('@/components/ui/map', () => ({
  MapMarker: ({ children, label, onClick }: { children: React.ReactNode; label: string; onClick?: (e: { stopPropagation: () => void }) => void }) => (
    <button type="button" aria-label={label} onClick={() => onClick?.({ stopPropagation: () => {} })}>{children}</button>
  ),
  MarkerContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { FloodPointMarkers } from './FloodPointMarkers';
import { MapLayerPanel } from './MapLayerPanel';
import { MapUserIsland } from './MapUserIsland';
import { RiskLegendControl } from './RiskLegendControl';
import type { FloodPointResponseDTO } from '../types';
import { alagamentoPontoSchema, type AlagamentoPonto } from '@/features/alagamento/schemas/alagamento.schema';
import { ALAGAMENTO_FIXTURES } from '@/mocks/alagamento';

afterEach(cleanup);

const pt = (id: number, slug: string): FloodPointResponseDTO =>
  ({ id, slug, name: `Ponto ${slug}`, latitude: -8, longitude: -34 }) as FloodPointResponseDTO;
const fl = (slug: string, level: AlagamentoPonto['level'], hNowCm: number | null = 0): [string, AlagamentoPonto] =>
  [slug, alagamentoPontoSchema.parse({ ...ALAGAMENTO_FIXTURES.sem_alerta_seco, slug, level, hNowCm, worstHorizonHours: level === 'SEM_DADO' ? null : 1, reason: level === 'SEM_DADO' ? 'SEM_TERRENO' : null })];

describe('FloodPointMarkers', () => {
  it('anel pelo nível do alerta por regressão: vermelho ALERTA, laranja ATENCAO, cinza tracejado SEM_DADO, nenhum sem alerta', () => {
    const by = new Map([fl('a', 'ATENCAO'), fl('b', 'ALERTA'), fl('d', 'SEM_DADO'), fl('e', 'SEM_ALERTA')]);
    const { container } = render(
      <FloodPointMarkers points={['a', 'b', 'd', 'e', 'f'].map((s, i) => pt(i + 1, s))} selectedFloodPointId={undefined} alagamentoBySlug={by} onSelect={() => {}} />,
    );
    const ring = (s: string) => screen.getByRole('button', { name: new RegExp(`Ponto ${s}:`) }).querySelector('[data-alerta-ring]');
    expect(ring('a')).toHaveAttribute('data-alerta-ring', 'ATENCAO');
    expect(ring('a')?.className).toContain('border-warning');
    expect(ring('b')?.className).toContain('border-destructive');
    expect(ring('d')).toHaveAttribute('data-alerta-ring', 'SEM_DADO');
    expect(ring('d')?.className).toContain('border-dashed');
    expect(ring('d')?.className).not.toContain('animate-ping');
    expect(ring('e')).toBeNull(); // sem alerta
    expect(ring('f')).toHaveAttribute('data-alerta-ring', 'SEM_DADO'); // ADMIN, ponto sem linha: sem dado, nunca "sem alerta"
    // cor não é o único sinal: ícone de forma distinta por nível (octógono, triângulo, escudo, interrogação)
    const badge = (s: string) => screen.getByRole('button', { name: new RegExp(`Ponto ${s}:`) }).querySelector('[data-flood-badge]');
    expect(['a', 'b', 'd', 'e', 'f'].map((s) => badge(s)?.getAttribute('data-flood-badge'))).toEqual(['ATENCAO', 'ALERTA', 'SEM_DADO', 'SEM_ALERTA', 'SEM_DADO']);
    expect(container.querySelectorAll('.animate-ping')).toHaveLength(1); // só o alerta pulsa
    expect(screen.getByRole('button', { name: /Ponto crítico Ponto b: alerta em 1 h/ })).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/%|Risco/);
  });

  it('visitante (sem o mapa do alerta): nenhum anel nem rótulo', () => {
    const { container } = render(<FloodPointMarkers points={[pt(1, 'a')]} selectedFloodPointId={undefined} onSelect={() => {}} />);
    expect(container.querySelector('[data-alerta-ring]')).toBeNull();
    expect(screen.getByRole('button', { name: /alerta experimental/ })).toBeInTheDocument();
  });

  it('clique seleciona o ponto', () => {
    const onSelect = vi.fn();
    render(<FloodPointMarkers points={[pt(1, 'a')]} selectedFloodPointId={undefined} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: /Ponto crítico/ }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ slug: 'a' }));
  });
});

describe('MapLayerPanel', () => {
  it('abre, marca as camadas ativas e alterna', () => {
    const onToggle = vi.fn();
    render(<MapLayerPanel activeLayers={['Chuva']} onToggle={onToggle} open onOpenChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Chuva' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Vento' })).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'Vento' }));
    expect(onToggle).toHaveBeenCalledWith('Vento');
  });
});

describe('RiskLegendControl (Legenda do alerta)', () => {
  it('fica recolhida no botão "Legenda" e abre com os quatro níveis; a regra fica no ⓘ', () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<RiskLegendControl open={false} onOpenChange={onOpenChange} />);
    expect(screen.queryByRole('region', { name: 'Legenda' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Legenda' }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    rerender(<RiskLegendControl open onOpenChange={onOpenChange} />);
    const panel = screen.getByRole('region', { name: 'Legenda' });
    expect(panel.querySelectorAll('[data-legend]')).toHaveLength(4);
    expect(screen.getByTestId('info-tip')).toHaveAttribute('aria-label', expect.stringMatching(/^Alerta se a lâmina provável/));
    expect(panel.textContent).not.toMatch(/%/);
  });
});

describe('MapUserIsland', () => {
  it('mostra o usuário e dispara o logout', () => {
    const onLogout = vi.fn();
    render(<MapUserIsland username="ana" onLogout={onLogout} />);
    expect(screen.getByText('ana')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sair da conta' }));
    expect(onLogout).toHaveBeenCalled();
  });
  it('sem nome mostra Convidado', () => {
    render(<MapUserIsland username={undefined} onLogout={() => {}} />);
    expect(screen.getByText('Convidado')).toBeInTheDocument();
  });
});
