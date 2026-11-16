import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { screen, cleanup, fireEvent } from '@testing-library/react';
import { server } from '@/mocks/server';
import { renderPage } from '@/test/render';
import { POINT_CARD_FIXTURES as P } from '@/mocks/cards';
import { MobilePointSheet } from './MobilePointSheet';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => { server.resetHandlers(); cleanup(); });
afterAll(() => server.close());

const noop = () => {};

describe('MobilePointSheet', () => {
  it('"Análise completa" chama o callback e convive com o relato', () => {
    const onOpenAnalysis = vi.fn();
    renderPage(<MobilePointSheet point={P.high} status={null} isFetchingStatus={false} index={0} total={5} onPrev={noop} onNext={noop} onBack={noop} onReport={noop} onOpenAnalysis={onOpenAnalysis} />);
    fireEvent.click(screen.getByRole('button', { name: 'Análise completa' }));
    expect(onOpenAnalysis).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Reportar cenário no local' })).toBeInTheDocument();
  });
  it('sem o callback o botão não aparece', () => {
    renderPage(<MobilePointSheet point={P.high} status={null} isFetchingStatus={false} index={0} total={5} onPrev={noop} onNext={noop} onBack={noop} onReport={noop} />);
    expect(screen.queryByRole('button', { name: 'Análise completa' })).toBeNull();
  });
});
