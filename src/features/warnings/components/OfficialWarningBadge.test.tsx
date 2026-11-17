import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { OfficialWarningBadge } from './OfficialWarningBadge';
import type { OfficialWarning } from '../schemas/officialWarning.schema';

afterEach(cleanup);

const warning: OfficialWarning = {
  warningId: 28712,
  sequenceId: 1,
  externalId: 56423,
  capCode: 'urn:oid:2.49.0.0.76.0.2026.28712.1',
  source: 'INMET_AVISOS',
  firstSeenAt: '2026-11-16T12:10:00Z',
  lastSeenAt: '2026-11-16T12:20:00Z',
  validFrom: '2026-11-16T12:05:00Z',
  validTo: '2026-11-17T02:59:00Z',
  severity: 'Perigo',
  severityId: 7,
  colorHex: '#F96602',
  description: 'Tempestade',
  risks: ['Chuva entre 30 e 60 mm/h ou 50 e 100 mm/dia.'],
  instructions: [],
  geocodes: ['2611606'],
  municipalities: 'Recife - PE (2611606)',
  altered: false,
  closed: false,
};

describe('OfficialWarningBadge', () => {
  it('não renderiza nada quando não há avisos vigentes', () => {
    const { container } = render(<OfficialWarningBadge warnings={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('mostra severidade, período, descrição, link oficial e distingue da previsão do MAPi', () => {
    render(<OfficialWarningBadge warnings={[warning]} />);
    const card = screen.getByTestId('inmet-official-warning');
    expect(card).toHaveTextContent('Aviso oficial do INMET vigente');
    expect(card).toHaveTextContent('Perigo');
    expect(card).toHaveTextContent('Tempestade');
    expect(card).toHaveTextContent('Chuva entre 30 e 60 mm/h');
    expect(card).toHaveTextContent('não é previsão do MAPi');
    expect(card).toHaveTextContent('Vigência:');
    const link = screen.getByRole('link', { name: /INMET/i });
    expect(link).toHaveAttribute('href', 'https://avisos.inmet.gov.br/56423');
  });
});
