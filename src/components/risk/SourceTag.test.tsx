import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
afterEach(cleanup);
import { SourceTag } from './SourceTag';
import { sourceKindsOf, type SourceKind } from './sourceKinds';

describe('SourceTag', () => {
  it('mostra o texto da fonte', () => {
    render(<SourceTag kind="PED_ONLY" />);
    expect(screen.getByText('só PED')).toBeInTheDocument();
  });
  it('deriva as tags de sources', () => {
    expect(sourceKindsOf(['CEMADEN_PED'])).toEqual(['PED_ONLY']);
    expect(sourceKindsOf(['CEMADEN', 'CEMADEN_PED'])).toEqual(['LIVE', 'PED']);
    expect(sourceKindsOf(['CEMADEN'])).toEqual(['LIVE']);
  });
});

describe('SourceTag: 12 variantes', () => {
  const V: [SourceKind, string, boolean][] = [
    ['MEASURED', 'medida · Cemaden', false], ['LIVE', 'ao vivo', false], ['PED', 'PED', false], ['PED_ONLY', 'só PED', true],
    ['ESTIMATED', 'estimada · Open-Meteo', true], ['NO_DATA', 'sem dado', true], ['FORECAST', 'prevista · estimativa', true],
    ['TIDE_HARMONIC', 'maré · reserva harmônica', false], ['OFFICIAL_INMET', 'oficial · INMET', false],
    ['PHYSICAL_MODEL', 'modelo físico · não validado', false], ['TESTING', 'Em teste: não é alerta oficial', false],
  ];
  it.each(V)('%s: texto visível e tracejado=%s', (kind, text, dashed) => {
    render(<SourceTag kind={kind} />);
    const el = screen.getByText(text);
    expect(el).toBeVisible();
    expect(el).toHaveAttribute('data-source', kind);
    expect(el.classList.contains('border-dashed')).toBe(dashed);
  });
});
