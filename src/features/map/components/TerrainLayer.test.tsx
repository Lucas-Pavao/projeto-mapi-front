import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { TerrainLayer } from './TerrainLayer';
import { TERRAIN_LAYER_ID, TERRAIN_SOURCE_ID, TERRAIN_OPACITY, terrainSourceUrl, terrainLegendStops, terrainColorAt } from '../utils/terrain';

const addProtocol = vi.fn();
vi.mock('maplibre-gl', () => ({ default: { addProtocol: (...a: unknown[]) => addProtocol(...a) } }));

const sources = new Set<string>();
const layers = new Set<string>();
const fakeMap = {
  getSource: vi.fn((id: string) => (sources.has(id) ? {} : undefined)),
  getLayer: vi.fn((id: string) => (layers.has(id) ? {} : undefined)),
  addSource: vi.fn((...a: [string, unknown?]) => sources.add(a[0])),
  addLayer: vi.fn((...a: [{ id: string }, string?]) => layers.add(a[0].id)),
  removeSource: vi.fn((id: string) => sources.delete(id)),
  removeLayer: vi.fn((id: string) => layers.delete(id)),
  setLayoutProperty: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  isSourceLoaded: vi.fn(() => true),
  getStyle: vi.fn(() => ({ layers: [{ id: 'labels', type: 'symbol' }] })),
};
vi.mock('@/components/ui/map', () => ({ useMap: () => ({ map: fakeMap, isLoaded: true }) }));

beforeEach(() => {
  sources.clear();
  layers.clear();
  vi.clearAllMocks();
});
afterEach(cleanup);

describe('TerrainLayer', () => {
  it('desligada: não cria fonte nem baixa nada', () => {
    render(<TerrainLayer enabled={false} />);
    expect(fakeMap.addSource).not.toHaveBeenCalled();
  });
  it('liga: cria fonte pmtiles:// e camada raster abaixo dos rótulos; alternar não recria', () => {
    const { rerender } = render(<TerrainLayer enabled />);
    expect(fakeMap.addSource).toHaveBeenCalledTimes(1);
    expect(fakeMap.addSource.mock.calls[0][1]).toMatchObject({ type: 'raster', tileSize: 256 });
    expect(fakeMap.addLayer).toHaveBeenCalledTimes(1);
    expect(fakeMap.addLayer.mock.calls[0][1]).toBe('labels');
    expect(fakeMap.addLayer.mock.calls[0][0]).toMatchObject({ type: 'raster', paint: { 'raster-opacity': TERRAIN_OPACITY } });
    expect(fakeMap.addSource.mock.calls[0][1]).toMatchObject({ url: expect.stringMatching(/^pmtiles:\/\//) });
    expect(addProtocol).toHaveBeenCalledWith('pmtiles', expect.any(Function));
    rerender(<TerrainLayer enabled={false} />);
    rerender(<TerrainLayer enabled />);
    expect(fakeMap.addSource).toHaveBeenCalledTimes(1);
    expect(fakeMap.addLayer).toHaveBeenCalledTimes(1);
    expect(fakeMap.setLayoutProperty).toHaveBeenLastCalledWith(TERRAIN_LAYER_ID, 'visibility', 'visible');
    expect(fakeMap.setLayoutProperty).toHaveBeenCalledWith(TERRAIN_LAYER_ID, 'visibility', 'none');
  });
  it('cleanup remove camada e fonte ao desmontar', () => {
    const { unmount } = render(<TerrainLayer enabled />);
    unmount();
    expect(fakeMap.removeLayer).toHaveBeenCalledWith(TERRAIN_LAYER_ID);
    expect(fakeMap.removeSource).toHaveBeenCalledWith(TERRAIN_SOURCE_ID);
  });
});

describe('TerrainLayer status', () => {
  it('loading ao ligar, ready no idle, error em falha da fonte, off ao desligar; remove listeners', () => {
    const cb = vi.fn();
    const handlers: Record<string, (e: { sourceId?: string }) => void> = {};
    fakeMap.on.mockImplementation((ev: string, h: (e: { sourceId?: string }) => void) => {
      handlers[ev] = h;
    });
    const { rerender, unmount } = render(<TerrainLayer enabled onStatusChange={cb} />);
    expect(cb).toHaveBeenLastCalledWith('loading');
    handlers.idle({});
    expect(cb).toHaveBeenLastCalledWith('ready');
    handlers.error({ sourceId: TERRAIN_SOURCE_ID });
    expect(cb).toHaveBeenLastCalledWith('error');
    handlers.error({ sourceId: 'outra' });
    expect(cb).toHaveBeenLastCalledWith('error');
    rerender(<TerrainLayer enabled={false} onStatusChange={cb} />);
    expect(cb).toHaveBeenLastCalledWith('off');
    unmount();
    expect(fakeMap.off).toHaveBeenCalledWith('idle', handlers.idle);
  });
});

describe('terrain utils', () => {
  it('URL usa o protocolo pmtiles:// sobre o mesmo origin', () => {
    expect(terrainSourceUrl('http://x')).toBe('pmtiles://http://x/terrain/terrain_hypsometry.pmtiles');
  });
  it('legenda tem uma cor por parada da paleta e a cota mais alta é mais escura que a mais baixa', () => {
    const s = terrainLegendStops();
    expect(s.map((x) => x.valueM)).toEqual([0, 2, 4, 6, 9, 13, 20]);
    const lum = (c: string) => c.match(/\d+/g)!.map(Number).reduce((a, b) => a + b, 0);
    expect(lum(s[s.length - 1].color)).toBeLessThan(lum(s[0].color));
  });
  it('paleta: satura nas pontas e interpola entre paradas (como o gdaldem)', () => {
    expect(terrainColorAt(-5)).toEqual([246, 208, 77]);
    expect(terrainColorAt(50)).toEqual([46, 42, 122]);
    expect(terrainColorAt(1)).toEqual([248, 184, 70]);
  });
});
