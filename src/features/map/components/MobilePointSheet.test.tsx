import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { ALAGAMENTO_FIXTURES } from '@/mocks/alagamento';
import { renderPage } from '@/test/render';
import { POINT_CARD_FIXTURES as P } from '@/mocks/cards';
import { MobilePointSheet } from './MobilePointSheet';

let role = 'USER';
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { username: 'sintetico', role } }) }));

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => { server.resetHandlers(); cleanup(); role = 'USER'; });
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
  it('ADMIN: o bloco do alerta por regressão em largura cheia; sem selo de risco, probabilidade ou contribuições do v3', async () => {
    role = 'ADMIN';
    server.use(http.get('/api/alagamento/pontos', () => HttpResponse.json([{ ...ALAGAMENTO_FIXTURES.atencao_3h, slug: P.high.slug }])));
    renderPage(<MobilePointSheet point={P.high} status={null} isFetchingStatus={false} index={0} total={5} onPrev={noop} onNext={noop} onBack={noop} onReport={noop} />);
    await waitFor(() => expect(screen.getByTestId('regressao-bloco')).toHaveAttribute('data-level', 'ATENCAO'));
    expect(screen.getByTestId('flood-chip')).toHaveTextContent('Atenção em 3 h');
    expect(screen.queryByText(/O QUE MAIS PESOU/)).toBeNull();
    expect(document.body.textContent).not.toMatch(/%|logreg|risco baixo|seguro/i);
  });
  it('visitante: "Alerta experimental" e os números medidos', () => {
    renderPage(<MobilePointSheet point={P.high} status={null} isFetchingStatus={false} index={0} total={5} onPrev={noop} onNext={noop} onBack={noop} onReport={noop} />);
    expect(screen.getByTestId('flood-chip')).toHaveTextContent('Alerta experimental');
    expect(screen.getByText('Chuva 3 h')).toBeInTheDocument();
  });
});
