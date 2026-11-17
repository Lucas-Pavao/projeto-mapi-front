import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { SourceCard } from './SourceCard';
import type { SourceView } from '../utils/ingestion';
import type { IngestionStatus } from '../schemas/admin.schema';

afterEach(cleanup);
const NOW = Date.parse('2026-11-17T12:00:00Z');
const mk = (status: IngestionStatus, extra: Partial<SourceView> = {}): SourceView => ({
  source: 'CEMADEN', name: 'APAC · Cemaden', what: 'Chuva', runSource: 'CEMADEN', status, expectedEveryMinutes: 10, lastSuccessAt: '2026-11-17T11:55:00Z', ...extra,
});
const show = (s: SourceView) => render(<ul><SourceCard source={s} now={NOW} onShowRuns={vi.fn()} /></ul>);

describe('SourceCard', () => {
  it('em dia', () => { show(mk('OK')); expect(screen.getByText('Em dia')).toBeInTheDocument(); expect(screen.queryByTestId('stale-alert-note')).toBeNull(); });
  it('atrasada', () => { show(mk('DELAYED')); expect(screen.getByText('Atrasada')).toBeInTheDocument(); });
  it('parada (SOURCE_STALE): nota do alerta SEM_DADO', () => {
    show(mk('STALE', { freshness: { state: 'NO_DATA', lastAcceptedAt: null, ageMinutes: null, maxAgeMinutes: 60 } }));
    expect(screen.getByText('Parada (sem leitura aceita)')).toBeInTheDocument();
    expect(screen.getByTestId('stale-alert-note')).toHaveTextContent('O alerta por ponto fica SEM_DADO (FONTE_PARADA), nunca "sem alerta".');
  });
  it('com falha mostra o último erro', () => { show(mk('FAILING', { lastError: 'timeout' })); expect(screen.getByText('Com falha')).toBeInTheDocument(); expect(screen.getByText(/Último erro: timeout/)).toBeInTheDocument(); });
  it('em quarentena', () => { show(mk('QUARANTINED')); expect(screen.getByText('Em quarentena')).toBeInTheDocument(); });
  it('sob demanda (sem ciclo agendado)', () => { show(mk('IDLE', { expectedEveryMinutes: null, lastSuccessAt: null })); expect(screen.getByText('Sob demanda')).toBeInTheDocument(); });
});
