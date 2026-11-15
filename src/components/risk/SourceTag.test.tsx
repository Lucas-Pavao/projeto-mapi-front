import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SourceTag } from './SourceTag';
import { sourceKindsOf } from './sourceKinds';
import { SyntheticWarning } from './SyntheticWarning';

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

describe('SyntheticWarning', () => {
  it('aparece para modelo sintético e some caso contrário', () => {
    const { rerender } = render(<SyntheticWarning prediction={{ trainingData: 'SYNTHETIC' }} />);
    expect(screen.getByTestId('synthetic-warning')).toHaveTextContent(/SINTÉTICO/);
    rerender(<SyntheticWarning prediction={{ trainingData: 'REAL' }} />);
    expect(screen.queryByTestId('synthetic-warning')).toBeNull();
  });
});
