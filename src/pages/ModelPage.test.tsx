import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { screen, cleanup, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { evaluation } from '@/mocks/data';
import { renderPage } from '@/test/render';
import { ModelPage } from './ModelPage';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

describe('ModelPage', () => {
  it('mostra origem, hash, conclusão e AUC exatamente como no payload', async () => {
    renderPage(<ModelPage />);
    expect(await screen.findByText('sintetico/resultado-fake.json')).toBeInTheDocument();
    expect(screen.getByText('0'.repeat(64))).toBeInTheDocument();
    expect(screen.getByText('data de congelamento não registrada')).toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'AUC e intervalo de confiança' });
    expect(within(table).getByText('0,611')).toBeInTheDocument(); // auc_B2
    expect(within(table).getByText('[0,402; 0,803]')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Conclusão registrada no arquivo' })).getAllByText('inconclusivo')).toHaveLength(2);
    expect(screen.getByRole('region', { name: 'Amostra' })).toHaveTextContent('101'); // n_neg_bruto
    expect(screen.getByText('Previsão experimental — modelo não validado')).toBeInTheDocument();
  });

  it('nada inventado: números reais da avaliação F1 não aparecem quando o payload é outro', async () => {
    const { container } = renderPage(<ModelPage />);
    await screen.findByText('sintetico/resultado-fake.json');
    const text = container.textContent ?? '';
    for (const real of ['0,891', '0,777', '689', '0,8907']) expect(text).not.toContain(real);
  });

  it('só exibe campos presentes: payload mínimo não gera seções vazias nem zeros', async () => {
    server.use(http.get('/api/model/evaluation', () => HttpResponse.json({ ...evaluation, result: { n_neg: 5 } })));
    renderPage(<ModelPage />);
    await screen.findByRole('region', { name: 'Amostra' });
    expect(screen.queryByRole('region', { name: 'AUC com intervalo (IC)' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Conclusão registrada no arquivo' })).toBeNull();
    expect(screen.queryByText('n_pos_principal')).toBeNull();
  });

  it('formato desconhecido mostra o JSON como veio', async () => {
    server.use(http.get('/api/model/evaluation', () => HttpResponse.json({ ...evaluation, result: { auc_B2: 'texto' } })));
    renderPage(<ModelPage />);
    expect(await screen.findByText('Conteúdo (formato não reconhecido)', { selector: 'h2' })).toBeInTheDocument();
    expect(screen.getByText(/"auc_B2": "texto"/)).toBeInTheDocument();
  });

  it('hash do cabeçalho diferente do corpo alerta', async () => {
    server.use(http.get('/api/model/evaluation', () => HttpResponse.json(evaluation, { headers: { 'X-Content-SHA256': 'a'.repeat(64) } })));
    renderPage(<ModelPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('hash do cabeçalho');
  });

  it('503 (arquivo ausente ou hash divergente) tem estado próprio', async () => {
    server.use(http.get('/api/model/evaluation', () => HttpResponse.json({}, { status: 503 })));
    renderPage(<ModelPage />);
    expect(await screen.findByText('Avaliação indisponível.')).toBeInTheDocument();
  });

  it('resultado vazio e erro genérico', async () => {
    server.use(http.get('/api/model/evaluation', () => HttpResponse.json({ ...evaluation, result: {} })));
    const { unmount } = renderPage(<ModelPage />);
    expect(await screen.findByText('A avaliação veio vazia.')).toBeInTheDocument();
    unmount();
    server.use(http.get('/api/model/evaluation', () => HttpResponse.json({}, { status: 500 })));
    renderPage(<ModelPage />);
    expect(await screen.findByText('Não foi possível carregar a avaliação.', {}, { timeout: 3000 })).toBeInTheDocument();
  });
});
