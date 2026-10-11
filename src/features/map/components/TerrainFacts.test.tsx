import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { TerrainFactsView } from './TerrainFacts';
import { InfoHint } from './InfoHint';
import { TIDE_NOTE } from '../utils/provenance';
import { validateTerrain } from '../schemas/terrain.schema';

afterEach(cleanup);

const ok = (extra: Record<string, unknown> = {}) =>
  validateTerrain({ floodPointSlug: 'p', status: 'OK', streetElevationM: 1.392, contributingAreaM2: 573046, ...extra });

describe('TerrainFactsView', () => {
  it('mostra cota com unidade e área com faixa do snap', () => {
    const data = ok({ diagnostics: { contributingAreaBySnapM2: { '0m': 52, '5m': 572882, '10m': 573046, '20m': 583696 } } });
    render(<TerrainFactsView state={{ status: 'ready', data }} />);
    expect(screen.getByText(/1,39/)).toBeInTheDocument();
    expect(screen.getByText(/m \(datum do MDT\)/)).toBeInTheDocument();
    expect(screen.getByText(/m²/, { selector: 'small' })).toBeInTheDocument();
    expect(screen.getByTestId('area-range').textContent).toMatch(/572\.882 a 583\.696 m²/);
    expect(screen.queryByTestId('area-sensitive')).toBeNull();
  });
  it('sem faixa na API: aviso de sensibilidade ao ponto de referência', () => {
    render(<TerrainFactsView state={{ status: 'ready', data: ok() }} />);
    expect(screen.getByTestId('area-sensitive')).toHaveTextContent('Valor sensível ao ponto de referência');
  });
  it('NO_DATA não mostra zero', () => {
    const data = validateTerrain({ floodPointSlug: 'p', status: 'NO_DATA', streetElevationM: null, contributingAreaM2: null });
    render(<TerrainFactsView state={{ status: 'ready', data }} />);
    expect(screen.getByText(/Sem dado de terreno/)).toBeInTheDocument();
    expect(screen.queryByText(/m²/)).toBeNull();
  });
  it('erro e carregamento têm estado próprio', () => {
    render(<TerrainFactsView state={{ status: 'error' }} />);
    expect(screen.getByText(/Terreno indisponível/)).toBeInTheDocument();
    cleanup();
    render(<TerrainFactsView state={{ status: 'loading' }} />);
    expect(screen.getByText(/Carregando terreno/)).toBeInTheDocument();
  });
  it('não compara com maré', () => {
    render(<TerrainFactsView state={{ status: 'ready', data: ok() }} />);
    expect(screen.getByText(/não comparar com a maré/i)).toBeInTheDocument();
  });
});

describe('InfoHint da maré', () => {
  it('tooltip acessível com o texto da nota', () => {
    render(<InfoHint label="Sobre a referência da maré" text={TIDE_NOTE} />);
    const btn = screen.getByRole('button', { name: 'Sobre a referência da maré' });
    const tip = screen.getByRole('tooltip');
    expect(btn.getAttribute('aria-describedby')).toBe(tip.id);
    expect(tip).toHaveTextContent(/não é comparável à cota do terreno/i);
  });
});
