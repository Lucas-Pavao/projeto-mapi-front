import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

vi.mock('@/components/ui/map', () => ({
  MapMarker: ({ children, label }: { children: React.ReactNode; label: string }) => (
    <button type="button" aria-label={label}>{children}</button>
  ),
  MarkerContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { MeasuredRainMarkers } from './MeasuredRainMarkers';
import { MeasuredRainDetail } from './MeasuredRainDetail';
import { MeasuredRainLegend } from './MeasuredRainLegend';
import type { StationAccumulation } from '../schemas/measuredRain.schema';

afterEach(cleanup);

const st = (id: string, acc3: number | null, status: 'OK' | 'NO_DATA' = 'OK'): StationAccumulation => ({
  canonicalId: id, stationCode: id, name: `Estação ${id}`, municipality: 'RECIFE', lat: -8, lon: -34.9,
  aliases: [`CEMADEN:${id}`, `CEMADEN_PED:${id}`], status, lastReadingUtc: '2026-11-15T17:20:00Z',
  acc1hMm: acc3, acc3hMm: acc3, acc6hMm: acc3, acc12hMm: acc3, acc24hMm: acc3, acc48hMm: acc3, acc72hMm: acc3, acc96hMm: acc3, acc120hMm: acc3,
});

describe('MeasuredRainMarkers', () => {
  it('chuva, zero e sem dado têm rótulo e estado próprios', () => {
    const { container } = render(<MeasuredRainMarkers stations={[st('a', 12.4), st('b', 0), st('c', null, 'NO_DATA')]} selectedId={null} onSelect={() => {}} />);
    expect(screen.getByRole('button', { name: /Estação a: 12,4 mm/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Estação b: 0,0 mm/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Estação c: sem dado/ })).toBeInTheDocument();
    const kinds = [...container.querySelectorAll('[data-kind]')].map((n) => n.getAttribute('data-kind'));
    expect(kinds).toEqual(['value', 'zero', 'no-data']);
  });
});

describe('MeasuredRainDetail', () => {
  it('mostra a hora em Recife com a referência, os apelidos e a citação', () => {
    render(<MeasuredRainDetail station={st('a', 3)} computedAtUtc="2026-11-15T17:27:00Z" stale={false} onClose={() => {}} />);
    expect(screen.getByText(/14:20 \(horário de Recife, UTC−3\)/)).toBeInTheDocument();
    expect(screen.getByText(/CEMADEN:a, CEMADEN_PED:a/)).toBeInTheDocument();
    expect(screen.getByText('DADOS DA REDE OBSERVACIONAL DO CEMADEN/MCTIC')).toBeInTheDocument();
  });

  it('estação sem dado diz que não é zero', () => {
    render(<MeasuredRainDetail station={st('c', null, 'NO_DATA')} computedAtUtc={null} stale={false} onClose={() => {}} />);
    expect(screen.getByRole('status')).toHaveTextContent('não significa que não choveu');
  });
});

describe('MeasuredRainLegend', () => {
  it('distingue medido e reanálise por escrito e traz a citação', () => {
    render(<MeasuredRainLegend data={undefined} isLoading={false} isError={false} />);
    expect(screen.getByText('Medida')).toBeInTheDocument();
    expect(screen.getByText('Reanálise')).toBeInTheDocument();
    expect(screen.getByText(/não é zero/)).toBeInTheDocument();
    expect(screen.getByText('DADOS DA REDE OBSERVACIONAL DO CEMADEN/MCTIC')).toBeInTheDocument();
  });
});
