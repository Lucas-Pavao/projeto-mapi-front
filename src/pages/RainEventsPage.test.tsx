import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { screen, cleanup, within, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderPage } from '@/test/render';
import { RainEventsPage } from './RainEventsPage';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => { server.resetHandlers(); cleanup(); });
afterAll(() => server.close());

describe('RainEventsPage', () => {
  it('abre na Cemaden PED com resumo, picos acima da capacidade e a citação', async () => {
    renderPage(<RainEventsPage />);
    const kpis = await screen.findByRole('region', { name: 'Resumo da fonte' });
    expect(kpis).toHaveTextContent('20');
    expect(kpis).toHaveTextContent('acima da capacidade');
    const lista = await screen.findByRole('region', { name: 'Eventos acima da capacidade' });
    expect(await within(lista).findByText('71,2')).toBeInTheDocument();
    expect(lista).toHaveTextContent('capacidade de projeto 60,1 mm/h');
    expect(lista.querySelectorAll('[data-event]')).toHaveLength(2); // truncado e abaixo da capacidade ficam de fora
    expect(screen.getByRole('radio', { name: 'Cemaden PED' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('DADOS DA REDE OBSERVACIONAL DO CEMADEN/MCTIC')).toBeInTheDocument();
  });

  it('seleciona um evento e mostra o detalhe; troca de fonte pede a fonte certa', async () => {
    const pedidas: string[] = [];
    server.events.on('request:start', ({ request }) => { const u = new URL(request.url); if (u.pathname.endsWith('/resumo')) pedidas.push(u.searchParams.get('source') ?? ''); });
    renderPage(<RainEventsPage />);
    const lista = await screen.findByRole('region', { name: 'Eventos acima da capacidade' });
    fireEvent.click(await within(lista).findByText('71,2'));
    expect(screen.getByTestId('event-detail')).toHaveTextContent('pico de 71,2 mm/h');
    fireEvent.click(screen.getByRole('radio', { name: 'Reanálise (Open-Meteo)' }));
    await waitFor(() => expect(pedidas).toContain('OPEN_METEO_ARCHIVE'));
    expect(await screen.findByText('Nenhum evento completo passou da capacidade na janela.')).toBeInTheDocument();
    server.events.removeAllListeners();
  });

  it('sensibilidade: contagem por fonte muda com a fração da capacidade', async () => {
    renderPage(<RainEventsPage />);
    const sec = await screen.findByRole('region', { name: 'Sensibilidade à capacidade' });
    await waitFor(() => expect(sec.querySelector('[data-sweep="ANA"]')).toHaveTextContent('2'));
    expect(sec.querySelector('[data-sweep="OPEN_METEO_ARCHIVE"]')).toHaveTextContent('0'); // 34 < 60,1
    fireEvent.change(within(sec).getByRole('slider'), { target: { value: '2' } }); // 50 % = 30,05 mm/h
    await waitFor(() => expect(sec.querySelector('[data-sweep="ANA"]')).toHaveTextContent('3'));
    expect(sec.querySelector('[data-sweep="OPEN_METEO_ARCHIVE"]')).toHaveTextContent('1');
    expect(screen.getByTestId('frac-text')).toHaveTextContent('30,1 mm/h');
  });

  it('erro mostra nova tentativa; sem capacidade no manifesto, não compara', async () => {
    server.use(http.get('/api/analise/eventos-chuva/resumo', () => HttpResponse.json({}, { status: 500 })));
    renderPage(<RainEventsPage />);
    expect(await screen.findByText('Não foi possível carregar o resumo dos eventos.', {}, { timeout: 3000 })).toBeInTheDocument();
  });
});
