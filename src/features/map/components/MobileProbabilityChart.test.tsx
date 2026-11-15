import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { screen, cleanup } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderPage } from '@/test/render';
import { MobileProbabilityChart } from './MobileProbabilityChart';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => { server.resetHandlers(); cleanup(); });
afterAll(() => server.close());

describe('MobileProbabilityChart', () => {
  it('descreve os limiares do metadata e a escala em raiz, sem 50 % nem 80 %', async () => {
    renderPage(<MobileProbabilityChart slug="sintetico-1" />);
    const svg = await screen.findByTestId('mobile-chart');
    await screen.findByLabelText(/Limiares: moderado a partir de 1,6%, alto a partir de 24,4%/);
    expect(svg.getAttribute('aria-label')).toMatch(/raiz quadrada/);
    expect(svg.getAttribute('aria-label')).not.toMatch(/50%|80%/);
    expect(svg.querySelectorAll('rect')).toHaveLength(2);
  });

  it('resposta sem from/to: estado vazio, nada desenhado', async () => {
    server.use(http.get('/api/pontos/:slug/predictions', ({ params }) => HttpResponse.json({ slug: params.slug, from: '', to: '', items: [] })));
    renderPage(<MobileProbabilityChart slug="sintetico-1" />);
    expect(await screen.findByTestId('mobile-chart-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('mobile-chart')).toBeNull();
  });
});
