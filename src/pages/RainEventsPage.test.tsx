import { describe, it, expect, afterEach } from 'vitest';
import { screen, cleanup, within, fireEvent, waitFor } from '@testing-library/react';
import { renderPage } from '@/test/render';
import { RainEventsPage } from './RainEventsPage';

afterEach(cleanup);

describe('RainEventsPage (JSON estático dos 5 anos)', () => {
  it('Cemaden PED: período, maior pico 62,0, 4 eventos acima de 60,1 mm/h e SHA-256 na nota de fonte', async () => {
    renderPage(<RainEventsPage />);
    const kpis = await screen.findByRole('region', { name: 'Resumo da fonte', hidden: false }, { timeout: 8000 });
    expect(kpis).toHaveTextContent('62,0');
    expect(kpis).toHaveTextContent('eventos de chuva forte');
    expect(screen.getByTestId('rain-period')).toHaveTextContent('out/2021 → out/2026');
    const lista = screen.getByRole('region', { name: 'Eventos acima da capacidade' });
    expect(lista).toHaveTextContent('capacidade de projeto 60,1 mm/h');
    expect(lista.querySelectorAll('[data-event]')).toHaveLength(4);
    expect(screen.getByTestId('rain-sources')).toHaveTextContent(/SHA-256 [0-9a-f]{64}/);
    expect(screen.getByTestId('rain-sources')).toHaveTextContent('DADOS DA REDE OBSERVACIONAL DO CEMADEN/MCTIC');
  });

  it('ANA e reanálise: picos 41,0 e 21,1, nenhum acima da capacidade; seleção mostra o detalhe', async () => {
    renderPage(<RainEventsPage />);
    await screen.findByRole('region', { name: 'Resumo da fonte' }, { timeout: 8000 });
    const first = screen.getByRole('region', { name: 'Eventos acima da capacidade' }).querySelector('[data-event]') as HTMLElement;
    fireEvent.click(first);
    expect(screen.getByTestId('event-detail')).toHaveTextContent('pico de 62,0 mm/h');
    fireEvent.click(screen.getByRole('radio', { name: 'ANA' }));
    expect(screen.getByRole('region', { name: 'Resumo da fonte' })).toHaveTextContent('41,0');
    expect(screen.getByText('Nenhum evento completo passou da capacidade na janela.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'Reanálise (Open-Meteo)' }));
    expect(screen.getByRole('region', { name: 'Resumo da fonte' })).toHaveTextContent('21,1');
  });

  it('sensibilidade: contagem por fonte cresce quando a fração da capacidade cai', async () => {
    renderPage(<RainEventsPage />);
    const sec = await screen.findByRole('region', { name: 'Sensibilidade à capacidade' }, { timeout: 8000 });
    expect(sec.querySelector('[data-sweep="CEMADEN_PED"]')).toHaveTextContent('4');
    expect(sec.querySelector('[data-sweep="ANA"]')).toHaveTextContent('0');
    fireEvent.change(within(sec).getByRole('slider'), { target: { value: '4' } }); // 25 % = 15 mm/h
    await waitFor(() => expect(sec.querySelector('[data-sweep="OPEN_METEO_ARCHIVE"]')?.textContent).not.toMatch(/ 0$/));
    expect(screen.getByTestId('frac-text')).toHaveTextContent('15,0 mm/h');
  });
});
