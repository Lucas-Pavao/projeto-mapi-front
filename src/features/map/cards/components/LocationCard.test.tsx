import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { LOCATION_FIXTURES as L } from '@/mocks/cards';
import { LocationCard } from './LocationCard';
import { DetailModeProvider } from '@/lib/detailMode';

/** Os testes de conteúdo rodam no modo Detalhes (todos os blocos); os do modo enxuto ficam no fim. */
const D: React.FC<{ children: React.ReactNode; detail?: boolean }> = ({ children, detail = true }) => <DetailModeProvider initial={detail}>{children}</DetailModeProvider>;
import { circleCoordinates, coordParam, lineStyleOf, parseCoordParam } from '../utils/locationView';

afterEach(cleanup);
const show = (k: keyof typeof L, h: { onOpenPoint?: (s: string) => void; onOpenStation?: (s: string) => void; onReport?: () => void } = {}, detail = true) => render(<D detail={detail}><LocationCard analysis={L[k]} onClose={() => {}} {...h} /></D>);

describe('LocationCard: os 5 estados', () => {
  it('1 chuva medida: etiqueta Cemaden, valores, candidatas com papel e ponto mais próximo', () => {
    const onStation = vi.fn(); const onPoint = vi.fn();
    show('measured', { onOpenStation: onStation, onOpenPoint: onPoint });
    expect(screen.getByRole('dialog')).toHaveAttribute('data-state', 'MEASURED');
    expect(screen.getByTestId('rain-source-tag')).toHaveTextContent('medida · Cemaden');
    expect(screen.getAllByTestId('rain-tile')[0]).toHaveTextContent('3,2mm/h');
    expect(screen.getAllByTestId('rain-tile')[2]).toHaveTextContent('incompleto'); // 24 h com hora faltando: nunca 0
    expect(screen.getAllByTestId('rain-tile')[2].querySelector('.text-warning')).not.toBeNull();
    expect(document.querySelector('[data-role="USED"]')).toHaveTextContent('3,2 mm/h'); // candidata da hora em mm/h
    expect(screen.getByTestId('candidates-title')).toHaveTextContent('3 (2 VÁLIDOS)');
    expect(screen.queryByTestId('location-banner')).toBeNull();
    expect(document.querySelector('[data-role="EXCLUDED"]')).toHaveTextContent('reprovada no mês (zero travado)');
    fireEvent.click(document.querySelector('[data-role="USED"]') as HTMLElement);
    expect(onStation).toHaveBeenCalledWith('SINT-A');
    expect(screen.getByTestId('nearest-point')).toHaveTextContent('1,8 km');
    expect(screen.getByTestId('nearest-point').textContent).not.toMatch(/%|risco/i);
    fireEvent.click(screen.getByTestId('nearest-point'));
    expect(onPoint).toHaveBeenCalledWith('AV_RECIFE_IBURA');
  });
  it('2 lacuna: "sem dado", sem trocar por estimativa e ponto próximo sem porcentagem, com ⓘ', () => {
    show('gap');
    expect(screen.getByTestId('rain-source-tag')).toHaveTextContent('sem dado · Cemaden');
    expect(screen.getAllByTestId('rain-tile').every((t) => /sem dado/.test(t.textContent ?? ''))).toBe(true);
    expect(screen.getByTestId('location-banner')).toHaveTextContent('não é trocada por estimativa');
    expect(screen.queryByText(/estimada/)).toBeNull();
    expect(screen.getByTestId('nearest-point').textContent).not.toMatch(/\d%/);
    expect(screen.getAllByTestId('info-tip').some((t) => /só existe nos 5 pontos/.test(t.getAttribute('aria-label') ?? ''))).toBe(true);
  });
  it('3 estimada: etiqueta "estimada · Open-Meteo" só neste modo, borda tracejada e sem candidatas', () => {
    show('estimated');
    expect(screen.getByTestId('rain-source-tag')).toHaveTextContent('estimada · Open-Meteo');
    expect(screen.getByTestId('location-banner')).toHaveTextContent('Nenhum pluviômetro válido até 5 km');
    expect(screen.getAllByTestId('rain-tile')[0]).toHaveClass('border-dashed');
    expect(screen.queryByText(/PLUVIÔMETROS ATÉ 5 KM/)).toBeNull();
  });
  it('4 mar: sem chuva nem terreno, só maré, tempo e ponto mais próximo', () => {
    show('sea');
    expect(screen.getByRole('dialog')).toHaveAttribute('data-state', 'SEA');
    expect(screen.queryByRole('region', { name: 'Chuva' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Terreno' })).toBeNull();
    expect(screen.getByTestId('tide-tile')).toHaveTextContent('1,81');
    expect(screen.getByTestId('weather')).toBeInTheDocument();
    expect(screen.getByTestId('location-banner')).toHaveTextContent('Ponto no mar');
  });
  it('5 fora da área: aviso, sem terreno e sem botão de relato', () => {
    show('outside', { onReport: () => {} });
    expect(screen.getByTestId('location-banner')).toHaveTextContent('Fora da área monitorada');
    expect(screen.queryByRole('region', { name: 'Terreno' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Reportar alagamento aqui' })).toBeDisabled(); // aparece, desabilitado (protótipo)
    cleanup();
    show('measured', { onReport: () => {} });
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Reportar alagamento aqui' })).toBeInTheDocument();
  });
  it('rio fica fora do alerta e a citação do Cemaden aparece', () => {
    show('measured');
    expect(screen.getByTestId('river-tile')).toHaveTextContent('fora do alerta');
    expect(screen.getByRole('dialog')).toHaveTextContent('DADOS DA REDE OBSERVACIONAL DO CEMADEN/MCTIC');
  });
});

describe('LocationCard: candidatas por modo e contagem', () => {
  it('estimada: pluviômetros do raio sem valor medido, só papel e motivo', () => {
    const a = { ...L.estimated, rain: { ...L.estimated.rain, candidates: [
      { stationId: 'X1', name: 'Sintético: X1', distanceM: 3000, valueMmH: 9.9, monthStatus: 'FAIL' as const, reasons: ['STUCK_ZERO'], role: 'EXCLUDED' as const, lat: -8, lon: -35 },
      { stationId: 'X2', name: 'Sintético: X2', distanceM: 4000, valueMmH: 7.7, monthStatus: 'OFFLINE' as const, reasons: [], role: 'EXCLUDED' as const, lat: -8, lon: -35 }] } };
    render(<D><LocationCard analysis={a} /></D>);
    expect(screen.getByTestId('candidates-title')).toHaveTextContent('PLUVIÔMETROS NO RAIO (NENHUM VÁLIDO)');
    const rows = document.querySelectorAll('[data-role]');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('reprovada no mês (zero travado)');
    expect(rows[0]).toHaveTextContent('fora');
    expect(screen.getByRole('dialog').textContent).not.toMatch(/9,9|7,7/); // valor medido não aparece junto da estimativa
  });
  it('sem nValid não mostra contagem de válidos', () => {
    const a = { ...L.measured, rain: { ...L.measured.rain, nValid: null } };
    render(<D><LocationCard analysis={a} /></D>);
    expect(screen.getByTestId('candidates-title').textContent).not.toMatch(/VÁLIDOS/);
    expect(screen.getByTestId('candidates-title').textContent).not.toMatch(/\b0\b/);
  });
});

describe('geometria e URL do local', () => {
  it('círculo de 5 km fecha e tem o raio certo', () => {
    const c = circleCoordinates(-8.1, -34.95, 5000);
    expect(c[0]).toEqual(c[c.length - 1]);
    expect(Math.abs(c[18][1] - -8.1)).toBeCloseTo(5000 / 111_320, 4); // 90 graus: só latitude
  });
  it('estilo da linha: cheia usada, tracejada menor, vermelha reprovada', () => {
    expect(lineStyleOf({ role: 'USED' }).dash).toBeUndefined();
    expect(lineStyleOf({ role: 'LOWER' }).dash).toBeDefined();
    expect(lineStyleOf({ role: 'NO_VALUE' }).dash).toBeDefined();
    expect(lineStyleOf({ role: 'EXCLUDED' }).color).toBe('#d4373c');
  });
  it('?local=lat,lon vai e volta; lixo é rejeitado', () => {
    expect(coordParam(-8.10391, -34.95094)).toBe('-8.1039,-34.9509');
    expect(parseCoordParam('-8.1039,-34.9509')).toEqual({ lat: -8.1039, lon: -34.9509 });
    expect(parseCoordParam('abc')).toBeNull();
    expect(parseCoordParam('99,0')).toBeNull();
    expect(parseCoordParam(null)).toBeNull();
  });
});

describe('LocationCard: maré de reserva', () => {
  it('HARMONIC mostra a etiqueta; OFFICIAL e ausente não', () => {
    const tideOf = (tideSource: 'HARMONIC' | 'OFFICIAL' | null) => ({ ...L.measured, tide: { ...L.measured.tide, levelM: 1.2, tideSource } });
    const { rerender } = render(<D><LocationCard analysis={tideOf('HARMONIC')} onClose={() => {}} /></D>);
    expect(screen.getByTestId('tide-source-tag')).toHaveTextContent('maré · reserva harmônica');
    rerender(<D><LocationCard analysis={tideOf('OFFICIAL')} onClose={() => {}} /></D>);
    expect(screen.queryByTestId('tide-source-tag')).toBeNull();
    rerender(<D><LocationCard analysis={tideOf(null)} onClose={() => {}} /></D>);
    expect(screen.queryByTestId('tide-source-tag')).toBeNull();
  });
});

describe('LocationCard: modo enxuto (5.11 item 8)', () => {
  it('chuva com etiqueta e ⓘ da regra; sem lista de pluviômetros, sem PE3D e sem atribuição', () => {
    show('measured', {}, false);
    expect(screen.getByTestId('rain-source-tag')).toBeInTheDocument();
    expect(screen.queryByTestId('candidates-title')).toBeNull();
    expect(screen.queryByTestId('location-attribution')).toBeNull();
    expect(screen.getByTestId('terrain')).not.toHaveTextContent('PE3D');
    expect(screen.getByTestId('nearest-point')).toBeInTheDocument();
    expect(screen.getAllByTestId('info-tip').length).toBeGreaterThanOrEqual(3);
  });
  it('no modo Detalhes aparecem os pluviômetros até 5 km, o PE3D e a atribuição', () => {
    show('measured');
    expect(screen.getByTestId('candidates-title')).toBeInTheDocument();
    expect(screen.getByTestId('location-attribution')).toBeInTheDocument();
    expect(screen.getByTestId('terrain')).toHaveTextContent('PE3D');
  });
});
