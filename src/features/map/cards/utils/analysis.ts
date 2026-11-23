import { LEGEND_RULE } from '@/features/alagamento/utils/alagamentoText';

/** Abas do painel de análise completa (5.4): Por quê · Balde · Origem. */
export const ANALYSIS_TABS = ['why', 'balde', 'prov'] as const;
export type AnalysisTab = (typeof ANALYSIS_TABS)[number];
export const TAB_LABEL: Record<AnalysisTab, string> = { why: 'Por quê', balde: 'Balde', prov: 'Origem' };

/** Aba da URL (?aba=): valor fora da lista (inclusive a antiga "inputs") cai em "Por quê". */
export const parseTab = (v: string | null | undefined): AnalysisTab => (ANALYSIS_TABS as readonly string[]).includes(v ?? '') ? (v as AnalysisTab) : 'why';

/** Textos dos ⓘ do painel (5.11 item 9). */
export const ANALYSIS_INFO = {
  level: `Lâmina máxima prevista por prazo, nos cenários provável (q50) e pessimista (q95). ${LEGEND_RULE}`,
  shap: 'As três entradas que mais mudaram a chuva prevista pelo rain_v1 nesta previsão (TreeSHAP local), em mm de chuva.',
  cf: 'Quanta chuva a mais na próxima hora, além da prevista (q50), levaria a lâmina a 15 cm. Calculado no próprio balde, por bissecção.',
  balde: 'Conta do balde a cada 10 min: 3 h medidas antes de agora e o prazo servido depois. A água entra com a chuva e sai pela galeria até a capacidade.',
  fatores: 'Maré e limpeza entram no balde como fatores do ponto (ADR 0030). A maré alta segura a saída da galeria; a limpeza diz a chance de a galeria estar entupida. "Muda o nível" quer dizer que o fator entra na conta do alerta; "só informa" quer dizer que aparece aqui, mas não muda o nível.',
  sens: 'Quanto a lâmina muda com a capacidade da galeria (f, sem fonte), o coeficiente de escoamento C e a chuva de projeto (TR, Te) nas faixas registradas.',
  prov: 'Rota, modelos, versão do código, validade e entradas desta previsão.',
  stations: 'A chuva do ponto é o maior valor entre as estações válidas a até 5 km. Toque para abrir o card da estação.',
};
