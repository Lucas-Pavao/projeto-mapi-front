import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { screen, cleanup, within, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { evaluation } from '@/mocks/data';
import { renderPage } from '@/test/render';
import { ModelPage } from './ModelPage';

const auth = vi.hoisted(() => ({ role: 'USER' }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { username: 'sintetico', role: auth.role } }) }));

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

const openF1 = () => {
  const r = renderPage(<ModelPage />);
  fireEvent.click(screen.getByRole('tab', { name: 'Avaliação F1' }));
  return r;
};

describe('ModelPage', () => {
  it('mostra origem, hash, conclusão e AUC exatamente como no payload', async () => {
    openF1();
    expect(await screen.findByText('sintetico/resultado-fake.json')).toBeInTheDocument();
    expect(screen.getByText('0'.repeat(64))).toBeInTheDocument();
    expect(screen.getByText('data de congelamento não registrada')).toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'AUC e intervalo de confiança' });
    expect(within(table).getByText('0,611')).toBeInTheDocument(); // auc_B2
    expect(within(table).getByText('[0,402; 0,803]')).toBeInTheDocument();
    expect(screen.getByText('H1 inconclusivo · H2 inconclusivo')).toBeInTheDocument(); // class_h1 e class_h2 do arquivo
    expect(screen.getByRole('region', { name: 'Amostra e origem' })).toHaveTextContent('101'); // n_neg_bruto
    expect(screen.getByText('Previsão experimental — modelo não validado')).toBeInTheDocument();
  });

  it('nada inventado: números reais da avaliação F1 não aparecem quando o payload é outro', async () => {
    const { container } = openF1();
    await screen.findByText('sintetico/resultado-fake.json');
    const text = container.textContent ?? '';
    for (const real of ['0,891', '0,777', '689', '0,8907']) expect(text).not.toContain(real);
  });

  it('só exibe campos presentes: payload mínimo não gera seções vazias nem zeros', async () => {
    server.use(http.get('/api/model/evaluation', () => HttpResponse.json({ ...evaluation, result: { n_neg: 5 } })));
    openF1();
    await screen.findByRole('region', { name: 'Amostra e origem' });
    expect(screen.queryByRole('region', { name: 'AUC com intervalo (IC)' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Hipótese H1' })).toBeNull();
    expect(screen.queryByRole('radiogroup')).toBeNull();
    expect(screen.queryByText('n_pos_principal')).toBeNull();
  });

  it('alterna para a análise secundária e escolhe a linha do AUC', async () => {
    server.use(http.get('/api/model/evaluation', () => HttpResponse.json({ ...evaluation, result: { ...evaluation.result, auc_todos: { 'B3/B3': { auc: 0.722, ic: [0.511, 0.912], auc18: 0.7, ic18: [0.5, 0.9] } } } })));
    openF1();
    expect(await screen.findByRole('radio', { name: '11 positivos (principal)' })).toBeChecked();
    fireEvent.click(screen.getByRole('radio', { name: '14 positivos (secundária)' }));
    expect(screen.getByText(/AUC E IC 95% \(14 × 99 DIAS\)/)).toBeInTheDocument();
    expect(screen.getByText('B3/B3:', { exact: false })).toBeInTheDocument();
    expect(screen.getAllByText('0,700').length).toBeGreaterThan(0);
  });

  it('formato desconhecido mostra o JSON como veio', async () => {
    server.use(http.get('/api/model/evaluation', () => HttpResponse.json({ ...evaluation, result: { auc_B2: 'texto' } })));
    openF1();
    expect(await screen.findByText('CONTEÚDO (FORMATO NÃO RECONHECIDO)', { selector: 'h2' })).toBeInTheDocument();
    expect(screen.getByText(/"auc_B2": "texto"/)).toBeInTheDocument();
  });

  it('hash do cabeçalho diferente do corpo alerta', async () => {
    server.use(http.get('/api/model/evaluation', () => HttpResponse.json(evaluation, { headers: { 'X-Content-SHA256': 'a'.repeat(64) } })));
    openF1();
    expect(await screen.findByRole('alert')).toHaveTextContent('hash do cabeçalho');
  });

  it('503 (arquivo ausente ou hash divergente) tem estado próprio', async () => {
    server.use(http.get('/api/model/evaluation', () => HttpResponse.json({}, { status: 503 })));
    openF1();
    expect(await screen.findByText('Avaliação indisponível.')).toBeInTheDocument();
  });

  it('resultado vazio e erro genérico', async () => {
    server.use(http.get('/api/model/evaluation', () => HttpResponse.json({ ...evaluation, result: {} })));
    const { unmount } = openF1();
    expect(await screen.findByText('A avaliação veio vazia.')).toBeInTheDocument();
    unmount();
    server.use(http.get('/api/model/evaluation', () => HttpResponse.json({}, { status: 500 })));
    openF1();
    expect(await screen.findByText('Não foi possível carregar a avaliação.', {}, { timeout: 3000 })).toBeInTheDocument();
  });

  it('abas: Alagamento por regressão (padrão), Previsão de chuva, Avaliação F1; sem v2 × v3 nem xgb_v2', () => {
    renderPage(<ModelPage />);
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Alagamento por regressão', 'Previsão de chuva · dado medido', 'Avaliação F1']);
    expect(screen.getByRole('tab', { name: 'Alagamento por regressão' })).toHaveAttribute('aria-selected', 'true');
    expect(document.body.textContent).not.toMatch(/xgb_v2|logreg_v3|v2 × v3|rótulo sintético/);
  });

  it('aba padrão: aviso curto com ⓘ, caminho em 4 blocos, validação 2.1 a 2.4 com IC e a frase do IC largo', () => {
    renderPage(<ModelPage />);
    expect(screen.getByTestId('regressao-banner')).toHaveTextContent('Experimental · nenhum modelo aprende com rótulo de alagamento');
    expect(within(screen.getByTestId('regressao-banner')).getByTestId('info-tip')).toHaveAttribute('aria-label', expect.stringMatching(/^Proposta de 20\/11/));
    expect(within(screen.getByTestId('pipeline')).getAllByRole('listitem').map((l) => l.textContent)).toEqual([
      expect.stringContaining('Chuva medida'), expect.stringContaining('rain_v1'), expect.stringContaining('Balde a 10 min'), expect.stringContaining('Regra fixa')]);
    expect(screen.getByTestId('val-2.3')).toHaveTextContent('0 de 41 ponto-dias (12 dias)');
    expect(screen.getByTestId('val-2.3')).toHaveTextContent('0%–26%');
    expect(screen.getByTestId('val-2.4')).toHaveTextContent('41 de 41');
    expect(screen.getByTestId('small-sample')).toHaveTextContent('o intervalo é largo');
    expect(screen.getByTestId('never-fired')).toBeInTheDocument();
  });

  it('aviso de chuva forte do rain_v1 e balde em 5 anos (Jaboatão sem terreno)', () => {
    renderPage(<ModelPage />);
    const rw = screen.getByTestId('rain-warning');
    expect(rw).toHaveTextContent('20/2820 min3');
    expect(rw).toHaveTextContent('21/2840 min4,2');
    expect(rw).toHaveTextContent('24/28195 min11,4');
    expect(screen.getByText('Nenhum aviso de 1 h antes de começar a chover.')).toBeInTheDocument();
    const b = screen.getByTestId('bucket-5y');
    expect(b).toHaveTextContent('CIn · UFPE1 (2022-05-28)00');
    expect(b).toHaveTextContent('Jaboatão · Centrosem terreno');
  });

  it('conferência do alerta: aba só para ADMIN, com a nota de nenhum evento medido', async () => {
    auth.role = 'USER';
    renderPage(<ModelPage />);
    expect(screen.queryByRole('tab', { name: /Alerta por ponto/ })).toBeNull();
    cleanup();
    auth.role = 'ADMIN';
    server.use(http.get('/api/alerta/conferencia', () => HttpResponse.json({
      days: 30, forteEvents: 0, forteWarned: 0, medianLeadMinutes: null, falsePerEvent: 0, semDadoFraction: 0.6, floodEpisodes: 0,
      rows: [{ day: '2026-11-17', slug: 'CIN_UFPE', forteEvents: 0, forteWarned: 0, leadMinutes: [], alertEpisodes: 0, falseEpisodes: 0,
        semDadoMinutes: 864, evaluatedMinutes: 1440, floodEpisodes: [], shadow: true }],
      note: 'Nenhum evento FORTE medido no período: antecedência e falsos por evento ainda sem medida.' })));
    renderPage(<ModelPage />);
    fireEvent.click(screen.getByRole('tab', { name: /Alerta por ponto/ }));
    expect(await screen.findByText(/Nenhum evento FORTE medido/)).toBeInTheDocument();
    expect(screen.getByText('CIN_UFPE')).toBeInTheDocument();
    expect(screen.getAllByText('60%').length).toBe(2);
    auth.role = 'USER';
  });

  it('visitante não vê a aba do alerta; admin vê o estado vazio da conferência', async () => {
    auth.role = 'USER';
    renderPage(<ModelPage />);
    expect(screen.queryByRole('tab', { name: /Alerta por ponto/ })).toBeNull();
    cleanup();
    auth.role = 'ADMIN';
    server.use(http.get('/api/alerta/conferencia', () => HttpResponse.json({
      days: 30, forteEvents: 0, forteWarned: 0, medianLeadMinutes: null, falsePerEvent: 0, semDadoFraction: 0, floodEpisodes: 0, rows: [] })));
    renderPage(<ModelPage />);
    fireEvent.click(screen.getByRole('tab', { name: /Alerta por ponto/ }));
    expect(await screen.findByText('Nenhum dia conferido ainda.')).toBeInTheDocument();
    expect(screen.getByText('A conferência roda às 03:35 UTC sobre a véspera.')).toBeInTheDocument();
    auth.role = 'USER';
  });
});
