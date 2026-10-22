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

afterEach(cleanup);

const pt = (id: number, slug: string, risk: 'LOW' | 'HIGH' | 'UNKNOWN'): FloodPointResponseDTO =>
  ({ id, slug, name: `Ponto ${slug}`, latitude: -8, longitude: -34, floodPrediction: { riskLevel: risk, floodProbability: risk === 'UNKNOWN' ? null : 0.5 } }) as FloodPointResponseDTO;

describe('FloodPointMarkers', () => {
  it('mostra o risco com ícone e rótulo e pulsa só o ponto com alerta ativo', () => {
    const { container } = render(
      <FloodPointMarkers points={[pt(1, 'a', 'HIGH'), pt(2, 'b', 'HIGH')]} selectedFloodPointId={undefined} selectedRisk={undefined} alertSlugs={new Set(['b'])} onSelect={() => {}} />,
    );
    expect(screen.getAllByRole('img', { name: 'Risco Alto' })).toHaveLength(2);
    expect(screen.getByRole('button', { name: /Ponto crítico Ponto b: risco Alto, com alerta ativo/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ponto crítico Ponto a: risco Alto\. Pressione/ })).toBeInTheDocument();
    expect(container.querySelectorAll('.animate-ping')).toHaveLength(1);
  });

  it('o risco do status em tempo real do ponto selecionado vence o da lista', () => {
    render(
      <FloodPointMarkers points={[pt(1, 'a', 'LOW'), pt(2, 'b', 'LOW')]} selectedFloodPointId={2} selectedRisk="HIGH" onSelect={() => {}} />,
    );
    expect(screen.getByRole('img', { name: 'Risco Alto' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Risco Baixo' })).toBeInTheDocument();
  });

  it('clique seleciona o ponto', () => {
    const onSelect = vi.fn();
    render(<FloodPointMarkers points={[pt(1, 'a', 'LOW')]} selectedFloodPointId={undefined} selectedRisk={undefined} onSelect={onSelect} />);
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

describe('RiskLegendControl', () => {
  it('fica recolhida no botão e abre com os quatro níveis', () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<RiskLegendControl open={false} onOpenChange={onOpenChange} />);
    expect(screen.queryByRole('region', { name: 'Níveis de risco' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Níveis de risco' }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    rerender(<RiskLegendControl open onOpenChange={onOpenChange} />);
    const panel = screen.getByRole('region', { name: 'Níveis de risco' });
    expect(panel.querySelectorAll('[data-risk]')).toHaveLength(4);
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
