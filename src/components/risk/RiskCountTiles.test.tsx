import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { RiskCountTiles } from './RiskCountTiles';

afterEach(cleanup);
const summary = { LOW: 5, MEDIUM: 2, HIGH: 1, UNKNOWN: 3, computedAt: '2026-10-21T18:00:00Z' };

describe('RiskCountTiles', () => {
  it('mostra os quatro níveis na ordem do protótipo, com rótulo e número', () => {
    const { container } = render(<RiskCountTiles summary={summary} />);
    const tiles = [...container.querySelectorAll('[data-risk-count]')];
    expect(tiles.map((t) => t.getAttribute('data-risk-count'))).toEqual(['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN']);
    expect(tiles.map((t) => t.textContent)).toEqual(['1Alto', '2Moderado', '5Baixo', '3Indisp.Previsão indisponível']);
    expect(screen.getByRole('region', { name: 'Pontos por nível de risco' })).toBeInTheDocument();
  });
  it('sem dado: carregando ou falha, nunca zero', () => {
    const { container, rerender } = render(<RiskCountTiles summary={undefined} />);
    expect(container.textContent).not.toMatch(/0/);
    rerender(<RiskCountTiles summary={undefined} failed />);
    expect(container.textContent).toContain('—');
  });
});
