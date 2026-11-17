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
import type { AlertaPonto } from '@/features/alerta/schemas/alerta.schema';

afterEach(cleanup);

const pt = (id: number, slug: string, risk: 'LOW' | 'HIGH' | 'UNKNOWN'): FloodPointResponseDTO =>
  ({ id, slug, name: `Ponto ${slug}`, latitude: -8, longitude: -34, floodPrediction: { riskLevel: risk, floodProbability: risk === 'UNKNOWN' ? null : 0.5 } }) as FloodPointResponseDTO;

describe('FloodPointMarkers', () => {
  it('anel pelo estado do alerta: laranja ATENCAO, vermelho ALERTA e alagamento provável, cinza tracejado SEM_DADO, nenhum sem alerta', () => {
    const al = (slug: string, over: Partial<AlertaPonto>): [string, AlertaPonto] => [slug, { slug, rainAlert: 'NENHUM', pointFlood: 'NAO', shadow: true, ...over }];
    const alertaBySlug = new Map([
      al('a', { rainAlert: 'ATENCAO' }), al('b', { rainAlert: 'ALERTA' }), al('c', { pointFlood: 'PROVAVEL' }), al('d', { rainAlert: 'SEM_DADO' }), al('e', {}),
    ]);
    const { container } = render(
      <FloodPointMarkers points={['a', 'b', 'c', 'd', 'e', 'f'].map((s, i) => pt(i + 1, s, 'HIGH'))} selectedFloodPointId={undefined} selectedRisk={undefined} alertaBySlug={alertaBySlug} onSelect={() => {}} />,
    );
    expect(screen.getAllByRole('img', { name: 'Risco Alto' })).toHaveLength(6);
    const ring = (s: string) => screen.getByRole('button', { name: new RegExp(`Ponto ${s}:`) }).querySelector('[data-alerta-ring]');
    expect(ring('a')).toHaveAttribute('data-alerta-ring', 'ATENCAO');
    expect(ring('a')?.className).toContain('border-warning');
    expect(ring('b')?.className).toContain('border-destructive');
    expect(ring('c')).toHaveAttribute('data-alerta-ring', 'ALERTA');
    expect(ring('d')).toHaveAttribute('data-alerta-ring', 'SEM_DADO');
    expect(ring('d')?.className).toContain('border-dashed');
    expect(ring('d')?.className).not.toContain('animate-ping');
    expect(ring('e')).toBeNull(); // sem alerta
    expect(ring('f')).toBeNull(); // sem leitura do alerta (não-ADMIN)
    expect(container.querySelectorAll('.animate-ping')).toHaveLength(3);
    expect(screen.getByRole('button', { name: /Ponto crítico Ponto b: risco Alto, com alerta ativo/ })).toBeInTheDocument();
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
    expect(screen.queryByTestId('legend-band')).toBeNull(); // sem limiares, sem faixa inventada
  });

  it('com limiares do metadata mostra a faixa de cada classe (sem 50 % nem 80 %)', () => {
    render(<RiskLegendControl open onOpenChange={vi.fn()} thresholds={{ medium: 0.0159, high: 0.2441, source: 'metadata' }} />);
    const bands = screen.getAllByTestId('legend-band').map((b) => b.textContent);
    expect(bands).toEqual(['abaixo de 1,6%', 'de 1,6% até abaixo de 24,4%', '24,4% ou mais']);
    expect(screen.getByTestId('legend-source')).toHaveTextContent('metadata');
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
